import { NextResponse } from "next/server";
import { listBoardConversations } from "@/lib/services/conversations";
import { prisma } from "@/lib/db";

export async function GET() {
  const conversations = await listBoardConversations();

  const withSpend = await Promise.all(
    conversations.map(async (c) => {
      const spend = await prisma.order.aggregate({
        where: { customerId: c.customerId },
        _sum: { amountCents: true },
      });
      return { ...c, lifetimeSpentCents: spend._sum.amountCents ?? 0 };
    })
  );

  return NextResponse.json({ conversations: withSpend });
}
