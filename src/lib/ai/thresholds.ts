import type { AgentTurn, RefundAiDecision } from "./schemas";

export const MIN_CONFIDENCE = 0.6;
export const HUMAN_REVIEW_LIMIT_CENTS = 5000;
export const YELLOW_CONFIDENCE_THRESHOLD = 0.75;

export type FinalRefundDecision = {
  decision: "approved" | "rejected" | "escalated";
  reasoning: string;
  confidence: number;
};

export type Severity = "green" | "yellow" | "orange" | "red";

export type SeverityResult = {
  severity: Severity;
  status: "ai_active" | "escalated";
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

/**
 * Same "AI proposes, code disposes" philosophy as applyRefundThresholds:
 * the model reports raw signals (concernLevel, customerRequestedHuman,
 * confidence, escalate), this function makes the final, auditable call
 * on the conversation's severity color and status. Red always wins over
 * orange — a refund needing approval doesn't matter if the customer is
 * also demanding a human right now.
 */
export function applySeverityRules(params: {
  turn: AgentTurn;
  finalRefundDecision: FinalRefundDecision | null;
  repeatedCustomerMessage: boolean;
}): SeverityResult {
  const { turn, finalRefundDecision, repeatedCustomerMessage } = params;

  const isRed =
    turn.customerRequestedHuman ||
    turn.concernLevel === "human_needed" ||
    turn.escalate;

  if (isRed) {
    return { severity: "red", status: "escalated" };
  }

  if (finalRefundDecision?.decision === "escalated") {
    return { severity: "orange", status: "escalated" };
  }

  const isYellow =
    turn.concernLevel === "watch" ||
    turn.confidence < YELLOW_CONFIDENCE_THRESHOLD ||
    repeatedCustomerMessage;

  if (isYellow) {
    return { severity: "yellow", status: "ai_active" };
  }

  return { severity: "green", status: "ai_active" };
}
