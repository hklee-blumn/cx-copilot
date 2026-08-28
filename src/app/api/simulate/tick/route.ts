import { NextResponse } from "next/server";
import {
  autoResolveExpiredSimulatedConversations,
  trySpawnSimulatedConversation,
} from "@/lib/services/simulation";
import { TICK_SPAWN_PROBABILITY } from "@/lib/simulation/config";

export async function POST() {
  await autoResolveExpiredSimulatedConversations();

  if (Math.random() >= TICK_SPAWN_PROBABILITY) {
    return NextResponse.json({ spawned: false, reason: "no_roll" });
  }

  const result = await trySpawnSimulatedConversation();
  return NextResponse.json(result);
}
