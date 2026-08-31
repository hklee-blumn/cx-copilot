import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.refundDecision.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.order.deleteMany();
  await prisma.kbArticle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.agent.deleteMany();

  const [amara, ben, carla, deshawn, elena] = await Promise.all([
    prisma.customer.create({
      data: { name: "Amara Okafor", email: "amara@example.com", phone: "555-0101", company: "Northwind Retail" },
    }),
    prisma.customer.create({
      data: { name: "Ben Whitfield", email: "ben@example.com", phone: "555-0102", company: "Acme Logistics" },
    }),
    prisma.customer.create({
      data: { name: "Carla Reyes", email: "carla@example.com", phone: "555-0103", company: "Globex Electronics" },
    }),
    prisma.customer.create({
      data: { name: "Deshawn Carter", email: "deshawn@example.com", phone: "555-0104", company: "Initech Software" },
    }),
    prisma.customer.create({
      data: { name: "Elena Petrova", email: "elena@example.com", phone: "555-0105", company: "Umbrella Health" },
    }),
  ]);

  await prisma.order.createMany({
    data: [
      { customerId: amara.id, description: "Wireless Earbuds", amountCents: 1499, status: "completed" },
      { customerId: amara.id, description: "Phone Case", amountCents: 999, status: "completed" },
      { customerId: ben.id, description: "Standing Desk", amountCents: 34900, status: "completed" },
      { customerId: ben.id, description: "Desk Mat", amountCents: 2200, status: "completed" },
      { customerId: carla.id, description: "Running Shoes", amountCents: 8900, status: "completed" },
      { customerId: deshawn.id, description: "4K Monitor", amountCents: 27900, status: "completed" },
      { customerId: deshawn.id, description: "HDMI Cable", amountCents: 1200, status: "completed" },
      { customerId: elena.id, description: "Espresso Machine", amountCents: 18900, status: "completed" },
    ],
  });

  await prisma.kbArticle.createMany({
    data: [
      {
        title: "Shipping Delays",
        slug: "shipping-delays",
        tags: "shipping,delivery",
        body: "Most orders arrive within 3-5 business days. If your order is more than 7 days late, contact us and we'll expedite a replacement or refund.",
      },
      {
        title: "Refund Policy",
        slug: "refund-policy",
        tags: "refunds,billing",
        body: "Refunds under $50 are typically processed automatically within minutes. Larger refunds are reviewed by a support specialist within 1 business day. Items must be reported within 30 days of purchase.",
      },
      {
        title: "Account & Password Help",
        slug: "account-password-help",
        tags: "account",
        body: "To reset your password, use the 'Forgot password' link on the login page. If you no longer have access to your email, contact support to verify your identity.",
      },
      {
        title: "Product Care Instructions",
        slug: "product-care",
        tags: "product",
        body: "Electronics should be kept dry and out of direct sunlight. Most items include a 1-year manufacturer warranty against defects.",
      },
      {
        title: "How to Track Your Order",
        slug: "how-to-track-your-order",
        tags: "shipping,tracking",
        body: "You can track your order from the 'My Orders' page. A tracking link is also emailed once your order ships.",
      },
      {
        title: "Damaged or Defective Items",
        slug: "damaged-or-defective-items",
        tags: "refunds,product",
        body: "If an item arrives damaged or defective, we'll offer a full refund or free replacement. Please describe the issue so we can process it quickly.",
      },
    ],
  });

  const agentAda = await prisma.agent.create({
    data: { name: "Ada Lin", email: "ada@support.example.com" },
  });
  await prisma.agent.create({
    data: { name: "Marcus Reid", email: "marcus@support.example.com" },
  });

  const resolvedConvo = await prisma.conversation.create({
    data: { customerId: amara.id, status: "resolved" },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: resolvedConvo.id, sender: "customer", body: "Hi, my earbuds stopped charging after a week." },
      {
        conversationId: resolvedConvo.id,
        sender: "ai",
        body: "Sorry to hear that! Since it's within 30 days and sounds defective, I can go ahead and refund the $14.99 for your Wireless Earbuds. You'll see it back on your card in 3-5 days.",
      },
      { conversationId: resolvedConvo.id, sender: "customer", body: "Thank you so much!" },
    ],
  });
  await prisma.refundDecision.create({
    data: {
      conversationId: resolvedConvo.id,
      amountCents: 1499,
      decision: "approved",
      reasoning:
        "Item reported defective within 30 days, amount is small and matches an existing order. Auto-approved per policy.",
      confidence: 0.93,
      decidedBy: "ai",
    },
  });

  const escalatedConvo = await prisma.conversation.create({
    data: {
      customerId: ben.id,
      status: "escalated",
      severity: "orange",
      escalateReason: "Refund request for $349.00: exceeds the $50.00 auto-decision limit and requires human approval.",
    },
  });
  await prisma.message.createMany({
    data: [
      { conversationId: escalatedConvo.id, sender: "customer", body: "My standing desk arrived with a cracked panel. I want a full refund." },
      {
        conversationId: escalatedConvo.id,
        sender: "ai",
        body: "I'm really sorry about that! A refund of this size needs a quick look from a specialist to make sure we take care of you properly — someone will be with you shortly.",
      },
    ],
  });
  await prisma.refundDecision.create({
    data: {
      conversationId: escalatedConvo.id,
      amountCents: 34900,
      decision: "escalated",
      reasoning:
        "Refund amount ($349.00) exceeds the $50.00 auto-decision limit and requires human approval.",
      confidence: 0.8,
      decidedBy: "ai",
    },
  });

  console.log("Seed complete:", {
    customers: [amara.name, ben.name, carla.name, deshawn.name, elena.name],
    agents: [agentAda.name, "Marcus Reid"],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
