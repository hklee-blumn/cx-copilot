import { NextResponse } from "next/server";
import { approveRefundDirectly } from "@/lib/services/refunds";
import { getOrCreateAgentForCurrentUser } from "@/lib/services/agents";
import { runSimulatedCustomerTurn } from "@/lib/ai/orchestrator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const agent = await getOrCreateAgentForCurrentUser();
  if (!agent) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const result = await approveRefundDirectly(id, agent.id, agent.name);
  if (!result) {
    return NextResponse.json(
      { error: "No pending refund found on this conversation" },
      { status: 400 }
    );
  }

  if (result.conversation.isSimulated) {
    await runSimulatedCustomerTurn(id);
  }

  return NextResponse.json(result);
}
