import { NextResponse } from "next/server";
import {
  autoResolveExpiredSimulatedConversations,
  trySpawnSimulatedConversation,
  tryAdvanceSimulatedConversation,
  trySendEvidencePhoto,
  hasNoActiveSimulatedConversations,
} from "@/lib/services/simulation";
import {
  TICK_SPAWN_PROBABILITY,
  CUSTOMER_FOLLOWUP_PROBABILITY,
  PHOTO_ATTACH_PROBABILITY,
} from "@/lib/simulation/config";

export async function POST() {
  await autoResolveExpiredSimulatedConversations();

  // A freshly opened, empty board shouldn't sit idle waiting on a dice
  // roll during a live demo — guarantee a spawn when nothing's on screen.
  const boardEmpty = await hasNoActiveSimulatedConversations();

  const spawnResult =
    boardEmpty || Math.random() < TICK_SPAWN_PROBABILITY
      ? await trySpawnSimulatedConversation()
      : { spawned: false as const, reason: "no_roll" as const };

  const followupResult =
    Math.random() < CUSTOMER_FOLLOWUP_PROBABILITY
      ? await tryAdvanceSimulatedConversation()
      : { advanced: false as const, reason: "no_roll" as const };

  const photoResult =
    Math.random() < PHOTO_ATTACH_PROBABILITY
      ? await trySendEvidencePhoto()
      : { sent: false as const, reason: "no_roll" as const };

  return NextResponse.json({ spawnResult, followupResult, photoResult });
}
