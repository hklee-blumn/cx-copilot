import type { Message, MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { prisma } from "@/lib/db";
import { anthropic, AI_MODEL } from "@/lib/anthropic";
import {
  AGENT_TURN_TOOL,
  AGENT_TURN_TOOL_NAME,
  AgentTurnSchema,
  REFUND_DECISION_TOOL,
  REFUND_DECISION_TOOL_NAME,
  RefundDecisionSchema,
} from "./schemas";
import {
  buildAgentSystemPrompt,
  buildRefundDecisionPrompt,
  summarizeConversation,
} from "./prompts";
import {
  applyRefundThresholds,
  applySeverityRules,
  type FinalRefundDecision,
} from "./thresholds";

function toClaudeMessages(
  messages: { sender: string; body: string }[]
): MessageParam[] {
  const merged: MessageParam[] = [];
  for (const m of messages) {
    const role = m.sender === "customer" ? "user" : "assistant";
    const last = merged[merged.length - 1];
    if (last && last.role === role) {
      last.content = `${last.content}\n${m.body}`;
    } else {
      merged.push({ role, content: m.body });
    }
  }
  return merged;
}

function normalizeForComparison(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function isRepeatedCustomerMessage(
  currentText: string,
  priorMessages: { sender: string; body: string }[]
): boolean {
  const current = normalizeForComparison(currentText);
  if (current.length < 8) return false;
  return priorMessages
    .filter((m) => m.sender === "customer")
    .some((m) => {
      const prior = normalizeForComparison(m.body);
      return prior === current || prior.includes(current) || current.includes(prior);
    });
}

function getToolInput(message: Message, toolName: string): unknown {
  const block = message.content.find(
    (b) => b.type === "tool_use" && b.name === toolName
  );
  if (!block || block.type !== "tool_use") {
    throw new Error(`AI did not call the expected tool: ${toolName}`);
  }
  return block.input;
}

export async function runAiTurn(conversationId: string, customerText: string) {
  await prisma.message.create({
    data: { conversationId, sender: "customer", body: customerText },
  });

  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: { customer: true, messages: { orderBy: { createdAt: "asc" } } },
  });

  const [orders, articles] = await Promise.all([
    prisma.order.findMany({ where: { customerId: conversation.customerId } }),
    prisma.kbArticle.findMany(),
  ]);

  const systemPrompt = buildAgentSystemPrompt(
    conversation.customer,
    orders,
    articles
  );

  const turnResponse = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: toClaudeMessages(conversation.messages),
    tools: [AGENT_TURN_TOOL],
    tool_choice: { type: "tool", name: AGENT_TURN_TOOL_NAME },
  });

  const turn = AgentTurnSchema.parse(
    getToolInput(turnResponse, AGENT_TURN_TOOL_NAME)
  );

  const aiMessage = await prisma.message.create({
    data: { conversationId, sender: "ai", body: turn.reply },
  });

  const repeatedCustomerMessage = isRepeatedCustomerMessage(
    customerText,
    conversation.messages.slice(0, -1)
  );

  let refundDecisionRecord = null;
  let finalRefundDecision: FinalRefundDecision | null = null;
  let refundEscalateReason: string | undefined;

  if (turn.intent === "refund_request" && turn.refundRequest) {
    const { amountCents, description } = turn.refundRequest;

    const decisionResponse = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: buildRefundDecisionPrompt(
            conversation.customer,
            orders,
            amountCents,
            description,
            summarizeConversation(conversation.messages)
          ),
        },
      ],
      tools: [REFUND_DECISION_TOOL],
      tool_choice: { type: "tool", name: REFUND_DECISION_TOOL_NAME },
    });

    const aiDecision = RefundDecisionSchema.parse(
      getToolInput(decisionResponse, REFUND_DECISION_TOOL_NAME)
    );

    const final = applyRefundThresholds(aiDecision);
    finalRefundDecision = final;

    refundDecisionRecord = await prisma.refundDecision.create({
      data: {
        conversationId,
        amountCents,
        decision:
          final.decision === "approved"
            ? "approved"
            : final.decision === "rejected"
              ? "rejected"
              : "escalated",
        reasoning: final.reasoning,
        confidence: final.confidence,
        decidedBy: "ai",
      },
    });

    if (final.decision === "escalated") {
      refundEscalateReason = `Refund request for $${(amountCents / 100).toFixed(
        2
      )}: ${final.reasoning}`;
    }
  }

  const { severity, status } = applySeverityRules({
    turn,
    finalRefundDecision,
    repeatedCustomerMessage,
  });

  let escalateReason: string | undefined;
  if (status === "escalated") {
    if (severity === "red") {
      escalateReason =
        turn.escalateReason ??
        (turn.customerRequestedHuman
          ? "Customer explicitly asked to speak with a human agent."
          : turn.concernLevel === "human_needed"
            ? "AI flagged this conversation as needing a human right now."
            : "Escalated by the AI agent.");
    } else {
      escalateReason = refundEscalateReason;
    }
  }

  const updatedConversation = await prisma.conversation.update({
    where: { id: conversationId },
    data:
      status === "escalated"
        ? { status, severity, escalateReason }
        : { status, severity },
  });

  return { aiMessage, conversation: updatedConversation, refundDecisionRecord };
}
