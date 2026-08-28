import { prisma } from "@/lib/db";

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
