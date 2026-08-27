import type { Customer, KbArticle, Message, Order } from "@prisma/client";

export function buildAgentSystemPrompt(
  customer: Customer,
  orders: Order[],
  articles: KbArticle[]
) {
  const orderLines = orders
    .map(
      (o) =>
        `- ${o.description}: $${(o.amountCents / 100).toFixed(2)} (${
          o.status
        }, purchased ${o.purchasedAt.toISOString().slice(0, 10)}, id: ${o.id})`
    )
    .join("\n") || "No past orders on file.";

  const articleLines = articles
    .map((a) => `### ${a.title} (slug: ${a.slug})\n${a.body}`)
    .join("\n\n") || "No help articles available.";

  return `You are a friendly, efficient first-line customer support agent for an online store.

Customer: ${customer.name} (${customer.email})

Order history:
${orderLines}

Help center articles you can reference or point the customer to:
${articleLines}

Your job:
- Answer questions directly, referencing help articles by title when relevant.
- If the customer is asking for a refund, set intent to "refund_request" and fill in refundRequest with your best-guess amount (in cents) and description based on the conversation and their order history. Do not state a refund decision yourself in the reply yet — a separate step decides it.
- Escalate to a human (escalate: true) if: the customer is upset or explicitly asks for a human, the request is ambiguous or outside what you can help with, or you are not confident in how to proceed. Otherwise escalate: false.
- Keep replies short, warm, and specific.

You must respond by calling the submit_agent_turn tool.`;
}

export function buildRefundDecisionPrompt(
  customer: Customer,
  orders: Order[],
  amountCents: number,
  description: string,
  conversationSummary: string
) {
  const orderLines = orders
    .map(
      (o) =>
        `- ${o.description}: $${(o.amountCents / 100).toFixed(2)} (${
          o.status
        }, id: ${o.id})`
    )
    .join("\n") || "No past orders on file.";

  return `You are deciding a refund request for ${customer.name}.

Requested refund amount: $${(amountCents / 100).toFixed(2)}
Reason given: ${description}

Customer's order history:
${orderLines}

Recent conversation:
${conversationSummary}

Rules you must follow:
- If the request seems reasonable and matches a real order, decision should be "approve".
- If it seems unreasonable, unsupported by the order history, or possibly abusive, decision should be "reject".
- If you are unsure, set decision to "escalate" and escalate: true.
- Always give clear, specific reasoning for your decision — this is shown to a human for audit.
- Set confidence honestly based on how clear-cut this case is.

You must respond by calling the submit_refund_decision tool.`;
}

export function summarizeConversation(messages: Message[]): string {
  return messages
    .map((m) => `${m.sender}: ${m.body}`)
    .join("\n");
}
