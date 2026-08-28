import { NextResponse } from "next/server";
import { resolveConversation } from "@/lib/services/conversations";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const conversation = await resolveConversation(id);
  return NextResponse.json({ conversation });
}
