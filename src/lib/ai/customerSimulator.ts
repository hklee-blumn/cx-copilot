import { z } from "zod";
import type { Customer, Message, Order } from "@prisma/client";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

export const SimulatedCustomerTurnSchema = z.object({
  message: z.string().nullable(),
  conversationOver: z.boolean(),
});
export type SimulatedCustomerTurn = z.infer<typeof SimulatedCustomerTurnSchema>;

export const SIMULATED_CUSTOMER_TOOL_NAME = "submit_customer_message";

export const SIMULATED_CUSTOMER_TOOL = {
  name: SIMULATED_CUSTOMER_TOOL_NAME,
  description:
    "Submit the customer's next message in this conversation, or signal that the customer has nothing more to say.",
  input_schema: {
    type: "object" as const,
    properties: {
      message: {
        type: ["string", "null"],
        description:
          "The customer's next message, in their own voice. Null if conversationOver is true.",
      },
      conversationOver: {
        type: "boolean",
        description:
          "True if the customer is satisfied, has nothing more to add, or the conversation has naturally run its course.",
      },
    },
    required: ["message", "conversationOver"],
  },
};

export function buildSimulatedCustomerSystemPrompt(
  customer: Customer,
  orders: Order[]
) {
  const orderLines =
    orders
      .map(
        (o) =>
          `- ${o.description}: $${(o.amountCents / 100).toFixed(2)} (${o.status})`
      )
      .join("\n") || "No past orders on file.";

  return `You are roleplaying as ${customer.name}, a customer of an online store, in an ongoing support chat. You are NOT the support agent — you are the customer.

Your order history (for consistency if you reference it):
${orderLines}

Below is the conversation so far, from your point of view: your own earlier messages are yours, and the other side's messages are the store's AI or human support agent replying to you.

Write your next message as this customer, reacting naturally to what was just said. Keep it brief and human, like a real chat message — not formal, not a paragraph. If your issue has been resolved, answered, or you're satisfied and have nothing more to say, set conversationOver to true and leave message null instead of writing something like "ok thanks" every time.

You must respond by calling the ${SIMULATED_CUSTOMER_TOOL_NAME} tool.`;
}

export function toCustomerPerspectiveMessages(
  messages: Pick<Message, "sender" | "body">[]
): MessageParam[] {
  const merged: MessageParam[] = [];
  for (const m of messages) {
    const role = m.sender === "customer" ? "assistant" : "user";
    const last = merged[merged.length - 1];
    if (last && last.role === role) {
      last.content = `${last.content}\n${m.body}`;
    } else {
      merged.push({ role, content: m.body });
    }
  }
  return merged;
}
