import { NextResponse } from "next/server";
import { takeOverConversation } from "@/lib/services/conversations";
import { getOrCreateAgentForCurrentUser } from "@/lib/services/agents";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const agent = await getOrCreateAgentForCurrentUser();
  if (!agent) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const conversation = await takeOverConversation(id, agent.id);
  return NextResponse.json({ conversation });
}
