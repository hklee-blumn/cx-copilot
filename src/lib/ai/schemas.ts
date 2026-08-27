import { z } from "zod";

export const AgentTurnSchema = z.object({
  reply: z.string(),
  intent: z.enum(["question", "refund_request", "complaint", "other"]),
  refundRequest: z
    .object({
      amountCents: z.number().int().positive(),
      description: z.string(),
    })
    .nullable(),
  escalate: z.boolean(),
  escalateReason: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});
export type AgentTurn = z.infer<typeof AgentTurnSchema>;

export const RefundDecisionSchema = z.object({
  decision: z.enum(["approve", "reject", "escalate"]),
  amountCents: z.number().int().positive(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  escalate: z.boolean(),
});
export type RefundAiDecision = z.infer<typeof RefundDecisionSchema>;

export const AGENT_TURN_TOOL_NAME = "submit_agent_turn";
export const REFUND_DECISION_TOOL_NAME = "submit_refund_decision";

export const AGENT_TURN_TOOL = {
  name: AGENT_TURN_TOOL_NAME,
  description:
    "Submit your response to the customer along with your classification of their message.",
  input_schema: {
    type: "object" as const,
    properties: {
      reply: {
        type: "string",
        description: "What to say back to the customer.",
      },
      intent: {
        type: "string",
        enum: ["question", "refund_request", "complaint", "other"],
      },
      refundRequest: {
        type: ["object", "null"],
        properties: {
          amountCents: { type: "integer" },
          description: { type: "string" },
        },
        required: ["amountCents", "description"],
      },
      escalate: {
        type: "boolean",
        description:
          "True if a human agent should take over instead of you.",
      },
      escalateReason: { type: ["string", "null"] },
      confidence: {
        type: "number",
        description: "Your confidence in this reply, from 0 to 1.",
      },
    },
    required: [
      "reply",
      "intent",
      "refundRequest",
      "escalate",
      "escalateReason",
      "confidence",
    ],
  },
};

export const REFUND_DECISION_TOOL = {
  name: REFUND_DECISION_TOOL_NAME,
  description: "Submit your decision on the customer's refund request.",
  input_schema: {
    type: "object" as const,
    properties: {
      decision: { type: "string", enum: ["approve", "reject", "escalate"] },
      amountCents: { type: "integer" },
      reasoning: {
        type: "string",
        description: "Why you made this decision. Always required.",
      },
      confidence: { type: "number" },
      escalate: { type: "boolean" },
    },
    required: ["decision", "amountCents", "reasoning", "confidence", "escalate"],
  },
};
