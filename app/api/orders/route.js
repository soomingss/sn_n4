import { NextResponse } from "next/server";
import { getCurrentSession, supabaseAdminFetch } from "../../lib/auth";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const userId = session.user.id;
  const res = await supabaseAdminFetch(`/rest/v1/orders?user_id=eq.${encodeURIComponent(userId)}&select=id,created_at,company_name,status,delivery_request,total_amount&order=created_at.desc`);
  if (!res.ok) return NextResponse.json({ error: "주문내역을 불러오지 못했습니다." }, { status: 500 });
  return NextResponse.json({ orders: await res.json() });
}

export async function POST(request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (session.profile?.role !== "admin" && session.profile?.status !== "approved") {
    return NextResponse.json({ error: "승인된 거래처만 주문할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return NextResponse.json({ error: "주문 상품이 없습니다." }, { status: 400 });

  const normalized = items
    .map((item) => ({ product_id: Number(item.product_id), quantity: Math.max(1, Number(item.quantity) || 1) }))
    .filter((item) => Number.isInteger(item.product_id) && item.product_id > 0);
  if (!normalized.length) return NextResponse.json({ error: "주문 상품 정보가 올바르지 않습니다." }, { status: 400 });

  const productIds = [...new Set(normalized.map((item) => item.product_id))];
  const idFilter = productIds.join(",");
  const productsRes = await supabaseAdminFetch(`/rest/v1/products?id=in.(${idFilter})&is_active=eq.true&select=id,name,weight,origin,supplier`);
  if (!productsRes.ok) return NextResponse.json({ error: "상품 정보를 확인하지 못했습니다." }, { status: 500 });
  const products = await productsRes.json();
  const productMap = new Map(products.map((p) => [Number(p.id), p]));

  const grade = session.profile?.price_grade;
  if (!grade) return NextResponse.json({ error: "거래처 가격등급이 설정되지 않았습니다." }, { status: 400 });
  const pricesRes = await supabaseAdminFetch(`/rest/v1/product_prices?product_id=in.(${idFilter})&price_grade=eq.${encodeURIComponent(grade)}&select=product_id,price`);
  if (!pricesRes.ok) return NextResponse.json({ error: "거래처 단가를 확인하지 못했습니다." }, { status: 500 });
  const prices = await pricesRes.json();
  const priceMap = new Map(prices.map((p) => [Number(p.product_id), Number(p.price)]));

  const orderItems = [];
  let totalAmount = 0;
  for (const item of normalized) {
    const product = productMap.get(item.product_id);
    const unitPrice = priceMap.get(item.product_id);
    if (!product || !Number.isFinite(unitPrice)) {
      return NextResponse.json({ error: `${product?.name || "선택 상품"}의 거래처 단가가 설정되지 않았습니다.` }, { status: 400 });
    }
    const subtotal = unitPrice * item.quantity;
    totalAmount += subtotal;
    orderItems.push({
      product_id: item.product_id,
      product_name: product.name,
      weight: product.weight || "",
      unit_price: unitPrice,
      quantity: item.quantity,
      subtotal,
    });
  }

  const orderRes = await supabaseAdminFetch(`/rest/v1/orders`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: session.user.id,
      company_name: session.profile?.company_name || "",
      status: "new",
      delivery_request: String(body.delivery_request || "당일"),
      total_amount: totalAmount,
    }),
  });
  if (!orderRes.ok) {
    const detail = await orderRes.text();
    return NextResponse.json({ error: "주문을 저장하지 못했습니다.", detail }, { status: 500 });
  }
  const created = (await orderRes.json())?.[0];
  if (!created?.id) return NextResponse.json({ error: "주문번호를 확인하지 못했습니다." }, { status: 500 });

  const itemsRes = await supabaseAdminFetch(`/rest/v1/order_items`, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(orderItems.map((item) => ({ ...item, order_id: created.id }))),
  });
  if (!itemsRes.ok) {
    await supabaseAdminFetch(`/rest/v1/orders?id=eq.${created.id}`, { method: "DELETE" });
    return NextResponse.json({ error: "주문 품목을 저장하지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, order_id: created.id, total_amount: totalAmount });
}
