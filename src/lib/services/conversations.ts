import { prisma } from "@/lib/db";
import { getVipCustomerIds } from "./customers";

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

export async function listResolvedConversations(search?: string) {
  return prisma.conversation.findMany({
    where: {
      status: "resolved",
      ...(search
        ? { customer: { name: { contains: search, mode: "insensitive" } } }
        : {}),
    },
    include: {
      customer: true,
      assignedAgent: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export async function attachLifetimeSpend<T extends { customerId: string }>(
  conversations: T[]
) {
  const vipIds = await getVipCustomerIds();
  return Promise.all(
    conversations.map(async (c) => {
      const spend = await prisma.order.aggregate({
        where: { customerId: c.customerId },
        _sum: { amountCents: true },
      });
      return {
        ...c,
        lifetimeSpentCents: spend._sum.amountCents ?? 0,
        isVip: vipIds.has(c.customerId),
      };
    })
  );
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
  const conversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  return { message, conversation };
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
