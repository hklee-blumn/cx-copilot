import { NextRequest, NextResponse } from "next/server";
import { getOrCreateActiveConversation } from "@/lib/services/conversations";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId is required" }, { status: 400 });
  }

  const created = await getOrCreateActiveConversation(customerId);
  const [conversation, messages] = await Promise.all([
    prisma.conversation.findUniqueOrThrow({
      where: { id: created.id },
      include: { assignedAgent: true },
    }),
    prisma.message.findMany({
      where: { conversationId: created.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json({ conversation, messages });
}
