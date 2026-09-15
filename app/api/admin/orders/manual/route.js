import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentSession, supabaseAdminFetch } from "../../../../lib/auth";

const SOURCES=new Set(["kakao","other"]);
export async function POST(request){
  const session=await getCurrentSession();
  if(!session||session.profile?.role!=="admin") return NextResponse.json({error:"관리자 권한이 필요합니다."},{status:403});
  const body=await request.json().catch(()=>({}));
  const userId=String(body.user_id||""); const source=String(body.order_source||"");
  if(!userId||!SOURCES.has(source)) return NextResponse.json({error:"거래처 또는 주문경로가 올바르지 않습니다."},{status:400});
  const raw=Array.isArray(body.items)?body.items:[];
  const items=raw.map(i=>({product_id:Number(i.product_id),quantity:Number(i.quantity)}));
  if(!items.length||items.some(i=>!Number.isInteger(i.product_id)||i.product_id<=0||!Number.isInteger(i.quantity)||i.quantity<1)) return NextResponse.json({error:"주문 상품 또는 수량 정보가 올바르지 않습니다."},{status:400});
  const profileRes=await supabaseAdminFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&status=eq.approved&role=eq.customer&select=id,company_name,price_grade&limit=1`);
  if(!profileRes.ok) return NextResponse.json({error:"거래처 정보를 확인하지 못했습니다."},{status:500});
  const profile=(await profileRes.json())?.[0];
  if(!profile) return NextResponse.json({error:"승인된 거래처를 찾을 수 없습니다."},{status:400});
  if(!profile.price_grade) return NextResponse.json({error:"거래처 가격등급이 설정되지 않았습니다."},{status:400});
  const requestKey=crypto.randomUUID();
  const rpc=await supabaseAdminFetch('/rest/v1/rpc/create_order_v31',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({p_user_id:profile.id,p_company_name:profile.company_name||'',p_price_grade:String(profile.price_grade),p_delivery_request:String(body.delivery_request||'당일'),p_request_key:requestKey,p_order_source:source,p_items:items})});
  if(!rpc.ok){const detail=await rpc.text();return NextResponse.json({error:"수기 주문을 저장하지 못했습니다. v31 데이터베이스 SQL이 적용되었는지 확인해주세요.",detail},{status:500});}
  const row=(await rpc.json())?.[0];
  return NextResponse.json({ok:true,order_id:row?.order_id,total_amount:Number(row?.total_amount||0),request_key:requestKey});
}
