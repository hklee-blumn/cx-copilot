import { NextResponse } from "next/server";
import {
  autoResolveExpiredSimulatedConversations,
  trySpawnSimulatedConversation,
  tryAdvanceSimulatedConversation,
} from "@/lib/services/simulation";
import {
  TICK_SPAWN_PROBABILITY,
  CUSTOMER_FOLLOWUP_PROBABILITY,
} from "@/lib/simulation/config";

export async function POST() {
  await autoResolveExpiredSimulatedConversations();

  const spawnResult =
    Math.random() < TICK_SPAWN_PROBABILITY
      ? await trySpawnSimulatedConversation()
      : { spawned: false as const, reason: "no_roll" as const };

  const followupResult =
    Math.random() < CUSTOMER_FOLLOWUP_PROBABILITY
      ? await tryAdvanceSimulatedConversation()
      : { advanced: false as const, reason: "no_roll" as const };

  return NextResponse.json({ spawnResult, followupResult });
}
