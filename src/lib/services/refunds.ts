import { prisma } from "@/lib/db";

export async function listRefundDecisionsForConversation(
  conversationId: string
) {
  return prisma.refundDecision.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}
