import { prisma } from "@/lib/db";

/**
 * Top-10%-of-spenders, computed per company (not globally) — a customer
 * is VIP relative to their own company's other customers. Uses Postgres's
 * NTILE window function to bucket each company's customers into deciles
 * by total order spend; decile 1 is the top 10%.
 */
export async function getVipCustomerIds(): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM (
      SELECT c.id,
             NTILE(10) OVER (
               PARTITION BY c.company
               ORDER BY COALESCE(SUM(o."amountCents"), 0) DESC
             ) as decile
      FROM "Customer" c
      LEFT JOIN "Order" o ON o."customerId" = c.id
      GROUP BY c.id, c.company
    ) ranked
    WHERE decile = 1
  `;
  return new Set(rows.map((r) => r.id));
}

export async function getCustomerSummary(customerId: string) {
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
  });
  const spend = await prisma.order.aggregate({
    where: { customerId },
    _sum: { amountCents: true },
  });

  return {
    ...customer,
    lifetimeSpentCents: spend._sum.amountCents ?? 0,
  };
}
