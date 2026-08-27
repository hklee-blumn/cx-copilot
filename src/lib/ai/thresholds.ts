import type { RefundAiDecision } from "./schemas";

export const MIN_CONFIDENCE = 0.6;
export const HUMAN_REVIEW_LIMIT_CENTS = 5000;

export type FinalRefundDecision = {
  decision: "approved" | "rejected" | "escalated";
  reasoning: string;
  confidence: number;
};

/**
 * The AI's raw output is never trusted directly for money decisions.
 * This is the deterministic safety net: amounts over $50 are always
 * escalated no matter what the model said, and low-confidence calls
 * are escalated too.
 */
export function applyRefundThresholds(
  aiDecision: RefundAiDecision
): FinalRefundDecision {
  const { amountCents, decision, reasoning, confidence } = aiDecision;

  if (amountCents > HUMAN_REVIEW_LIMIT_CENTS) {
    return {
      decision: "escalated",
      reasoning: `Refund amount ($${(amountCents / 100).toFixed(
        2
      )}) exceeds the $${(HUMAN_REVIEW_LIMIT_CENTS / 100).toFixed(
        2
      )} auto-decision limit and requires human approval.`,
      confidence,
    };
  }

  if (confidence < MIN_CONFIDENCE || decision === "escalate") {
    return {
      decision: "escalated",
      reasoning:
        reasoning ||
        "AI was not confident enough to decide this refund automatically.",
      confidence,
    };
  }

  if (decision === "approve") {
    return { decision: "approved", reasoning, confidence };
  }

  return { decision: "rejected", reasoning, confidence };
}
