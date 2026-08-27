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
import { applyRefundThresholds } from "./thresholds";

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

  let escalated = turn.escalate;
  let escalateReason = turn.escalateReason ?? undefined;
  let refundDecisionRecord = null;

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
      escalated = true;
      escalateReason = `Refund request for $${(amountCents / 100).toFixed(
        2
      )}: ${final.reasoning}`;
    }
  }

  const updatedConversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: escalated
      ? { status: "escalated", escalateReason }
      : { status: "ai_active" },
  });

  return { aiMessage, conversation: updatedConversation, refundDecisionRecord };
}
