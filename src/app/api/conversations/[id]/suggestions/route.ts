import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSuggestedReplies } from "@/lib/ai/suggestedReplies";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" } },
      refundDecisions: { orderBy: { createdAt: "desc" } },
    },
  });

  const orders = await prisma.order.findMany({
    where: { customerId: conversation.customerId },
  });

  const pendingRefund =
    conversation.refundDecisions.find((r) => r.decision === "escalated") ?? null;

  const suggestions = await generateSuggestedReplies(
    conversation.customer,
    orders,
    conversation.messages,
    pendingRefund
  );

  return NextResponse.json({ suggestions });
}
