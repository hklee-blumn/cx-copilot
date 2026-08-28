import { z } from "zod";
import type { Customer, Message, Order, RefundDecision } from "@prisma/client";
import { anthropic, AI_MODEL } from "@/lib/anthropic";
import { summarizeConversation } from "./prompts";

export const SuggestedRepliesSchema = z.object({
  accept: z.string(),
  clarify: z.string(),
  decline: z.string(),
});
export type SuggestedReplies = z.infer<typeof SuggestedRepliesSchema>;

const SUGGESTED_REPLIES_TOOL_NAME = "submit_suggested_replies";

const SUGGESTED_REPLIES_TOOL = {
  name: SUGGESTED_REPLIES_TOOL_NAME,
  description: "Submit three draft replies a human agent could send as-is.",
  input_schema: {
    type: "object" as const,
    properties: {
      accept: {
        type: "string",
        description:
          "An agreeable, accommodating reply — go along with the customer's request and resolve it in their favor.",
      },
      clarify: {
        type: "string",
        description:
          "A reply that asks the customer for more information or clarification before proceeding further.",
      },
      decline: {
        type: "string",
        description:
          "A polite but firm reply that declines the customer's specific request while offering a reasonable alternative.",
      },
    },
    required: ["accept", "clarify", "decline"],
  },
};

function buildSuggestedRepliesPrompt(
  customer: Customer,
  orders: Order[],
  messages: Message[],
  pendingRefund: RefundDecision | null
) {
  const orderLines =
    orders
      .map(
        (o) =>
          `- ${o.description}: $${(o.amountCents / 100).toFixed(2)} (${o.status})`
      )
      .join("\n") || "No past orders on file.";

  const refundLine = pendingRefund
    ? `\nA refund of $${(pendingRefund.amountCents / 100).toFixed(2)} is currently pending your approval. The AI's own assessment: "${pendingRefund.reasoning}"\n`
    : "";

  return `You are drafting reply options for a human customer support agent who is about to respond to ${customer.name} directly. You are not the agent — you're helping them respond faster.

Customer's order history:
${orderLines}
${refundLine}
Conversation so far:
${summarizeConversation(messages)}

Draft three genuinely different, ready-to-send replies the agent could pick from with one click:
1. "accept": Agreeable and accommodating — go along with what the customer wants, resolve it in their favor, apologize for the trouble if warranted.
2. "clarify": Ask the customer for the specific information or clarification needed before this can move forward.
3. "decline": Polite but firm — decline the customer's specific request, briefly explain why, and offer a reasonable alternative.

Each reply should be 1-3 sentences, in the agent's own voice, specific to this actual conversation (reference their real order/issue — don't be generic), and ready to send exactly as written.

You must respond by calling the ${SUGGESTED_REPLIES_TOOL_NAME} tool.`;
}

function getToolInput(message: import("@anthropic-ai/sdk/resources/messages").Message) {
  const block = message.content.find(
    (b) => b.type === "tool_use" && b.name === SUGGESTED_REPLIES_TOOL_NAME
  );
  if (!block || block.type !== "tool_use") {
    throw new Error("AI did not call the expected tool: " + SUGGESTED_REPLIES_TOOL_NAME);
  }
  return block.input;
}

export async function generateSuggestedReplies(
  customer: Customer,
  orders: Order[],
  messages: Message[],
  pendingRefund: RefundDecision | null
): Promise<SuggestedReplies> {
  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 768,
    messages: [
      {
        role: "user",
        content: buildSuggestedRepliesPrompt(customer, orders, messages, pendingRefund),
      },
    ],
    tools: [SUGGESTED_REPLIES_TOOL],
    tool_choice: { type: "tool", name: SUGGESTED_REPLIES_TOOL_NAME },
  });

  return SuggestedRepliesSchema.parse(getToolInput(response));
}
