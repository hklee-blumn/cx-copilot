import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { runAiTurn, runSimulatedCustomerTurn } from "@/lib/ai/orchestrator";
import {
  SIMULATION_CAP,
  SIMULATED_AUTO_RESOLVE_MINUTES,
  MIN_FOLLOWUP_GAP_SECONDS,
} from "@/lib/simulation/config";
import {
  FAKE_CUSTOMER_NAMES,
  FAKE_ORDER_TEMPLATES,
  SIMULATION_SCENARIOS,
  pickRandom,
} from "@/lib/simulation/scenarios";
import { DEMO_COMPANIES } from "@/lib/companies";

function randomAmountCents([min, max]: [number, number]): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fakeEmail(name: string): string {
  const [first, ...rest] = name.toLowerCase().split(/\s+/);
  const last = rest.at(-1)?.replace(/[^a-z]/g, "") ?? "";
  const unique = Math.floor(Math.random() * 1000);
  return `${first[0]}${last}${unique}@cxdemo.io`;
}

function fakePhone(): string {
  const line = Math.floor(1000 + Math.random() * 9000);
  return `555-9${line}`;
}

export async function hasNoActiveSimulatedConversations() {
  const count = await prisma.conversation.count({
    where: { isSimulated: true, status: { not: "resolved" } },
  });
  return count === 0;
}

export async function autoResolveExpiredSimulatedConversations() {
  const cutoff = new Date(Date.now() - SIMULATED_AUTO_RESOLVE_MINUTES * 60 * 1000);
  await prisma.conversation.updateMany({
    where: {
      isSimulated: true,
      status: "ai_active",
      severity: { in: ["green", "yellow"] },
      updatedAt: { lt: cutoff },
    },
    data: { status: "resolved" },
  });
}

export async function trySpawnSimulatedConversation() {
  let created;
  try {
    created = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Serializes concurrent spawn attempts (e.g. multiple open
        // dashboard tabs ticking at once) so the count-then-create below
        // can't race — Postgres's default isolation alone does not
        // prevent that.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(729014)`;

        const count = await tx.conversation.count({
          where: { isSimulated: true, status: { not: "resolved" } },
        });
        if (count >= SIMULATION_CAP) return null;

        const name = pickRandom(FAKE_CUSTOMER_NAMES);
        const company = pickRandom(DEMO_COMPANIES).name;
        const customer = await tx.customer.create({
          data: {
            name,
            email: fakeEmail(name),
            phone: fakePhone(),
            company,
            isSimulated: true,
          },
        });

        const orderCount = Math.random() < 0.5 ? 1 : 2;
        for (let i = 0; i < orderCount; i++) {
          const template = pickRandom(FAKE_ORDER_TEMPLATES);
          await tx.order.create({
            data: {
              customerId: customer.id,
              description: template.description,
              amountCents: randomAmountCents(template.amountCentsRange),
              status: "completed",
            },
          });
        }

        const conversation = await tx.conversation.create({
          data: { customerId: customer.id, isSimulated: true },
        });

        return conversation;
      },
      { timeout: 10000 }
    );
  } catch {
    // Under heavy concurrent tick load, a spawn attempt can time out
    // waiting on the advisory lock above. That's fine — just skip this
    // tick rather than let it crash the route; the next tick tries again.
    return { spawned: false as const, reason: "contended" as const };
  }

  if (!created) return { spawned: false as const, reason: "at_cap" as const };

  const scenario = pickRandom(SIMULATION_SCENARIOS);
  await runAiTurn(created.id, scenario.openingMessage);

  return { spawned: true as const, conversationId: created.id };
}

export async function tryAdvanceSimulatedConversation() {
  const cutoff = new Date(Date.now() - MIN_FOLLOWUP_GAP_SECONDS * 1000);
  const eligible = await prisma.conversation.findMany({
    where: { isSimulated: true, status: "ai_active", updatedAt: { lt: cutoff } },
    select: { id: true },
  });

  if (eligible.length === 0) return { advanced: false as const, reason: "none_eligible" as const };

  const chosen = pickRandom<{ id: string }>(eligible);
  await runSimulatedCustomerTurn(chosen.id);

  return { advanced: true as const, conversationId: chosen.id };
}
