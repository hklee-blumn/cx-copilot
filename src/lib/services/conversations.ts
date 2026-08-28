import { prisma } from "@/lib/db";

export async function getOrCreateActiveConversation(customerId: string) {
  const existing = await prisma.conversation.findFirst({
    where: { customerId, status: { not: "resolved" } },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: { customerId, status: "ai_active" },
  });
}

const SEVERITY_RANK: Record<string, number> = {
  red: 0,
  orange: 1,
  yellow: 2,
  green: 3,
};

export async function listBoardConversations() {
  const conversations = await prisma.conversation.findMany({
    where: { status: { not: "resolved" } },
    include: {
      customer: true,
      assignedAgent: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return conversations.sort((a, b) => {
    const rankDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (rankDiff !== 0) return rankDiff;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

export async function getConversationDetail(conversationId: string) {
  return prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: {
      customer: true,
      assignedAgent: true,
      messages: { orderBy: { createdAt: "asc" } },
      refundDecisions: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function takeOverConversation(
  conversationId: string,
  agentId: string
) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { status: "human_active", assignedAgentId: agentId },
  });
}

export async function addAgentReply(conversationId: string, body: string) {
  const message = await prisma.message.create({
    data: { conversationId, sender: "agent", body },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  return message;
}

export async function addCustomerMessage(conversationId: string, body: string) {
  const message = await prisma.message.create({
    data: { conversationId, sender: "customer", body },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  return message;
}

export async function resolveConversation(conversationId: string) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { status: "resolved" },
  });
}
