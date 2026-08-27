import { NextResponse } from "next/server";
import { getConversationDetail } from "@/lib/services/conversations";
import { getOrdersForCustomer } from "@/lib/services/orders";
import { getCustomerSummary } from "@/lib/services/customers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const conversation = await getConversationDetail(id);
  const [orders, customerSummary] = await Promise.all([
    getOrdersForCustomer(conversation.customerId),
    getCustomerSummary(conversation.customerId),
  ]);

  return NextResponse.json({
    conversation,
    orders,
    lifetimeSpentCents: customerSummary.lifetimeSpentCents,
  });
}
