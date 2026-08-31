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
import {
  SIMULATED_CUSTOMER_TOOL,
  SIMULATED_CUSTOMER_TOOL_NAME,
  SimulatedCustomerTurnSchema,
  buildSimulatedCustomerSystemPrompt,
  toCustomerPerspectiveMessages,
} from "./customerSimulator";
import { addCustomerMessage, resolveConversation } from "@/lib/services/conversations";
import { MAX_SIMULATED_MESSAGES } from "@/lib/simulation/config";
import { analyzePhoto } from "./photoAnalysis";

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

/**
 * Plays the customer's side of a simulated conversation, so demo traffic
 * reads as a real back-and-forth instead of one message and silence.
 * Only ever called for isSimulated conversations (see the tick route and
 * the agent-reply route) — a real customer needs no AI to speak for them.
 */
export async function runSimulatedCustomerTurn(conversationId: string) {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: { customer: true, messages: { orderBy: { createdAt: "asc" } } },
  });

  if (conversation.status === "resolved") return;

  if (conversation.messages.length >= MAX_SIMULATED_MESSAGES) {
    await resolveConversation(conversationId);
    return;
  }

  const orders = await prisma.order.findMany({
    where: { customerId: conversation.customerId },
  });

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 512,
    system: buildSimulatedCustomerSystemPrompt(conversation.customer, orders),
    messages: toCustomerPerspectiveMessages(conversation.messages),
    tools: [SIMULATED_CUSTOMER_TOOL],
    tool_choice: { type: "tool", name: SIMULATED_CUSTOMER_TOOL_NAME },
  });

  const turn = SimulatedCustomerTurnSchema.parse(
    getToolInput(response, SIMULATED_CUSTOMER_TOOL_NAME)
  );

  if (turn.conversationOver || !turn.message) {
    await resolveConversation(conversationId);
    return;
  }

  if (conversation.status === "ai_active") {
    await runAiTurn(conversationId, turn.message);
  } else {
    await addCustomerMessage(conversationId, turn.message);
  }
}

/**
 * Handles a customer sending a photo as refund evidence. Runs AI vision
 * analysis on the image and, if it looks fake (stock photo, AI-generated,
 * etc.), forces the conversation red/escalated so a human reviews it —
 * same "red wins outright" precedence as applySeverityRules. Deliberately
 * never approves/rejects a refund itself; the money decision stays inside
 * applyRefundThresholds via the normal text-based refund flow. The fraud
 * reasoning is surfaced to the agent via the message record, not stated to
 * the customer — the AI's reply to them stays neutral.
 */
export async function runPhotoTurn(
  conversationId: string,
  imageUrl: string,
  caption: string
) {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  const customerMessage = await prisma.message.create({
    data: { conversationId, sender: "customer", body: caption, imageUrl },
  });

  const analysis = await analyzePhoto(imageUrl, caption, {
    customerClaim: summarizeConversation(conversation.messages),
  });

  await prisma.message.update({
    where: { id: customerMessage.id },
    data: {
      photoLooksFake: analysis.looksFake,
      photoFakeReason: analysis.fakeReasons.join("; ") || null,
      photoSupportsRefund: analysis.supportsRefund,
      photoAnalysisReasoning: analysis.refundReasoning,
    },
  });

  const replyBody = analysis.looksFake
    ? "Thanks for sending that over — I'm looping in a specialist to take a closer look before we move forward."
    : analysis.supportsRefund
      ? "Thanks for the photo, that helps confirm what you're describing. I'll factor that in."
      : "Thanks for sending that over — I'll take a look and follow up if I need anything else.";

  const aiMessage = await prisma.message.create({
    data: { conversationId, sender: "ai", body: replyBody },
  });

  let updatedConversation = conversation;
  if (analysis.looksFake) {
    const escalateReason = `Photo evidence flagged as potentially fake: ${
      analysis.fakeReasons.join("; ") || "AI assessed the image as inauthentic."
    }`;
    updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { severity: "red", status: "escalated", escalateReason },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  return { customerMessage, aiMessage, conversation: updatedConversation, analysis };
}
