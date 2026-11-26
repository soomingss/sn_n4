import { NextResponse } from "next/server";
import { supabaseAdminFetch } from "../../../lib/auth";
import { getApprovedPartner } from "../../../lib/partner-requests";

export async function GET(request) {
  const session = await getApprovedPartner();
  if (!session) return NextResponse.json({}, { status: 403 });
  const productId = new URL(request.url).searchParams.get("product");
  if (!/^\d{1,19}$/.test(productId || "")) return NextResponse.json({}, { status: 400 });
  const user = encodeURIComponent(session.user.id);
  const response = await supabaseAdminFetch(
    `/rest/v1/orders?select=created_at,order_items!inner(origin,weight)&user_id=eq.${user}&status=eq.delivered&order_items.product_id=eq.${productId}&order=created_at.desc,id.desc&limit=1`
  );
  if (!response.ok) return NextResponse.json({}, { status: 503 });
  const [order] = await response.json();
  const item = order?.order_items?.[0];
  return NextResponse.json(item ? { purchase: { ...item, date: order.created_at } } : { purchase: null }, {
    headers: { "Cache-Control": "private, no-store" }
  });
}
