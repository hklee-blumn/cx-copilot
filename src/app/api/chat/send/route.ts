import { NextRequest, NextResponse } from "next/server";
import {
  addCustomerMessage,
  getOrCreateActiveConversation,
} from "@/lib/services/conversations";
import { runAiTurn } from "@/lib/ai/orchestrator";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { customerId, message } = await request.json();
  if (!customerId || !message) {
    return NextResponse.json(
      { error: "customerId and message are required" },
      { status: 400 }
    );
  }

  const conversation = await getOrCreateActiveConversation(customerId);

  if (conversation.status === "ai_active") {
    await runAiTurn(conversation.id, message);
  } else {
    await addCustomerMessage(conversation.id, message);
  }

  const [updatedConversation, messages] = await Promise.all([
    prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: { assignedAgent: true },
    }),
    prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json({ conversation: updatedConversation, messages });
}
