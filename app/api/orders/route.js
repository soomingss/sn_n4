import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession, supabaseAdminFetch } from "../../lib/auth";

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
  const raw = Array.isArray(body.items) ? body.items : [];
  const items = raw.map(i=>({product_id:Number(i.product_id),quantity:Number(i.quantity)}));
  if (!items.length || items.some(i=>!Number.isInteger(i.product_id)||i.product_id<=0||!Number.isInteger(i.quantity)||i.quantity<1)) return NextResponse.json({ error:"주문 상품 또는 수량 정보가 올바르지 않습니다." },{status:400});
  const grade=session.profile?.price_grade;
  if (!grade) return NextResponse.json({error:"거래처 가격등급이 설정되지 않았습니다."},{status:400});
  const requestKey=String(body.request_key||request.headers.get("x-order-request-key")||crypto.randomUUID());
  const rpc=await supabaseAdminFetch('/rest/v1/rpc/create_order_v31',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({p_user_id:session.user.id,p_company_name:session.profile?.company_name||'',p_price_grade:String(grade),p_delivery_request:String(body.delivery_request||'당일'),p_request_key:requestKey,p_order_source:'web',p_items:items})});
  if(!rpc.ok){const detail=await rpc.text();return NextResponse.json({error:"주문을 저장하지 못했습니다. v31 데이터베이스 SQL이 적용되었는지 확인해주세요.",detail},{status:500});}
  const row=(await rpc.json())?.[0];
  return NextResponse.json({ok:true,order_id:row?.order_id,total_amount:Number(row?.total_amount||0),request_key:requestKey});
}
