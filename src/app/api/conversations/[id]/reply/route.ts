import { NextResponse } from "next/server";
import { addAgentReply } from "@/lib/services/conversations";
import { runSimulatedCustomerTurn } from "@/lib/ai/orchestrator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { body } = await request.json();
  if (!body) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const { message, conversation } = await addAgentReply(id, body);

  if (conversation.isSimulated) {
    await runSimulatedCustomerTurn(id);
  }

  return NextResponse.json({ message });
}
