import { NextResponse } from "next/server";
import { getConversationDetail } from "@/lib/services/conversations";
import { getOrdersForCustomer } from "@/lib/services/orders";
import { getCustomerSummary, getVipCustomerIds } from "@/lib/services/customers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const conversation = await getConversationDetail(id);
  const [orders, customerSummary, vipIds] = await Promise.all([
    getOrdersForCustomer(conversation.customerId),
    getCustomerSummary(conversation.customerId),
    getVipCustomerIds(),
  ]);

  return NextResponse.json({
    conversation,
    orders,
    lifetimeSpentCents: customerSummary.lifetimeSpentCents,
    isVip: vipIds.has(conversation.customerId),
  });
}
