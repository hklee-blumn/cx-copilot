import { NextResponse } from "next/server";
import { attachLifetimeSpend, listBoardConversations } from "@/lib/services/conversations";

export async function GET() {
  const conversations = await listBoardConversations();
  const withSpend = await attachLifetimeSpend(conversations);
  return NextResponse.json({ conversations: withSpend });
}
