import {normalizeDeliveryRequest} from "../../lib/delivery-request";
import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession, supabaseAdminFetch } from "../../lib/auth";

async function saveWebOrder(session, items, delivery, orderId, requestKey) {
  const response = await supabaseAdminFetch("/rest/v1/rpc/save_web_order", {
    method: "POST",
    body: JSON.stringify({
      p_user_id: session.user.id, p_order_id: orderId, p_request_key: requestKey,
      p_delivery_request: delivery, p_items: items
    })
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    if (detail?.code === "P0001") return NextResponse.json({ error: detail.message }, { status: 409 });
    console.error("[web order] Save failed", detail?.code || response.status);
    return NextResponse.json({ error: "주문을 저장하지 못했습니다. 다시 시도해 주세요." }, { status: 500 });
  }
  const [row] = await response.json();
  return NextResponse.json({ ok: true, ...row });
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const res = await supabaseAdminFetch(`/rest/v1/orders?user_id=eq.${encodeURIComponent(session.user.id)}&select=id,created_at,company_name,status,delivery_request,total_amount,delivered_at&order=created_at.desc`);
  if (!res.ok) return NextResponse.json({ error: "주문내역을 불러오지 못했습니다." }, { status: 500 });
  return NextResponse.json({ orders: await res.json() });
}

export async function POST(request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (session.profile?.role !== "admin" && session.profile?.status !== "approved") return NextResponse.json({ error: "승인된 거래처만 주문할 수 있습니다." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  let delivery;try{delivery=normalizeDeliveryRequest(body.delivery_request)}catch(error){return NextResponse.json({error:error.message},{status:400})}
  const raw = Array.isArray(body.items) ? body.items : [];
  const items = raw.map(i=>({product_id:Number(i.product_id),quantity:Number(i.quantity)}));
  if (!items.length || items.some(i=>!Number.isInteger(i.product_id)||i.product_id<=0||!Number.isInteger(i.quantity)||i.quantity<1)) return NextResponse.json({ error:"주문 상품 또는 수량 정보가 올바르지 않습니다." },{status:400});
  const requestKey=String(body.request_key||request.headers.get("x-order-request-key")||crypto.randomUUID());
  return saveWebOrder(session, items, delivery, null, requestKey);
}

export async function PATCH(request){const session=await getCurrentSession();if(!session)return NextResponse.json({error:"로그인이 필요합니다."},{status:401});const body=await request.json().catch(()=>({}));const id=Number(body.id);if(!Number.isInteger(id)||id<=0)return NextResponse.json({error:"잘못된 주문입니다."},{status:400});if(body.action==="cancel"){const r=await supabaseAdminFetch(`/rest/v1/orders?id=eq.${id}&user_id=eq.${encodeURIComponent(session.user.id)}&status=eq.new`,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({status:"cancelled"})});if(!r.ok)return NextResponse.json({error:"주문 취소에 실패했습니다."},{status:500});const rows=await r.json();if(!rows.length)return NextResponse.json({error:"준비가 시작된 주문은 취소할 수 없습니다."},{status:409});return NextResponse.json({ok:true});}if(body.action==="edit"){const items=(Array.isArray(body.items)?body.items:[]).map(i=>({product_id:Number(i.product_id),quantity:Number(i.quantity)}));if(!items.length)return NextResponse.json({error:"주문 상품이 없습니다."},{status:400});let delivery;try{delivery=normalizeDeliveryRequest(body.delivery_request)}catch(error){return NextResponse.json({error:error.message},{status:400})}return saveWebOrder(session,items,delivery,id,null);}return NextResponse.json({error:"잘못된 요청입니다."},{status:400});}
