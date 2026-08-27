import { prisma } from "@/lib/db";

export async function getOrdersForCustomer(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    orderBy: { purchasedAt: "desc" },
  });
}
