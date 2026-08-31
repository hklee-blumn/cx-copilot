import { prisma } from "@/lib/db";

export async function listRefundDecisionsForConversation(
  conversationId: string
) {
  return prisma.refundDecision.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * One-click approval for a refund that's currently sitting escalated
 * (pending human review) — creates the audit record, takes the
 * conversation over for this agent if it isn't already, and sends the
 * confirmation message so the agent doesn't have to type anything.
 */
export async function approveRefundDirectly(
  conversationId: string,
  agentId: string,
  agentName: string
) {
  const pending = await prisma.refundDecision.findFirst({
    where: { conversationId, decision: "escalated" },
    orderBy: { createdAt: "desc" },
  });
  if (!pending) return null;

  await prisma.refundDecision.create({
    data: {
      conversationId,
      orderId: pending.orderId,
      amountCents: pending.amountCents,
      decision: "approved",
      reasoning: `Approved directly by agent ${agentName}.`,
      confidence: 1,
      decidedBy: agentName,
    },
  });

  if (pending.orderId) {
    await prisma.order.update({
      where: { id: pending.orderId },
      data: { status: "refunded" },
    });
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      sender: "agent",
      body: `Your refund of $${(pending.amountCents / 100).toFixed(
        2
      )} has been approved and will be processed in 1-3 business days.`,
    },
  });

  const conversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: "human_active", assignedAgentId: agentId, updatedAt: new Date() },
  });

  return { message, conversation, amountCents: pending.amountCents };
}
