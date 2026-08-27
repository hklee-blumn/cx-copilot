import { NextResponse } from "next/server";
import { addAgentReply } from "@/lib/services/conversations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { body } = await request.json();
  if (!body) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const message = await addAgentReply(id, body);
  return NextResponse.json({ message });
}
