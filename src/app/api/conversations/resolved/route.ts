import { NextRequest, NextResponse } from "next/server";
import {
  attachLifetimeSpend,
  listResolvedConversations,
} from "@/lib/services/conversations";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("q") ?? undefined;
  const conversations = await listResolvedConversations(search);
  const withSpend = await attachLifetimeSpend(conversations);
  return NextResponse.json({ conversations: withSpend });
}
