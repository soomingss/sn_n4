import { NextResponse } from "next/server";
import { getCurrentSession, supabaseAdminFetch } from "../../../lib/auth";
const ALLOWED=new Set(["new","preparing","shipping","delivered","cancelled"]);
export async function PATCH(request){
 const session=await getCurrentSession(); if(!session||session.profile?.role!=="admin") return NextResponse.json({error:"관리자 권한이 필요합니다."},{status:403});
 const body=await request.json().catch(()=>({}));
 if(body.action==="packing"){
  const itemId=Number(body.itemId); const checked=Boolean(body.checked);
  if(!Number.isInteger(itemId)) return NextResponse.json({error:"잘못된 주문 품목입니다."},{status:400});
  const itemRes=await supabaseAdminFetch(`/rest/v1/order_items?id=eq.${itemId}`,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({packed_checked:checked})});
  if(!itemRes.ok){const detail=await itemRes.text();return NextResponse.json({error:`상품 확인 상태를 저장하지 못했습니다. (${itemRes.status}: ${detail})`},{status:500});}
  return NextResponse.json({ok:true,item:(await itemRes.json())?.[0]||null});
 }
 const id=Number(body.id),status=String(body.status||"");
 if(!Number.isInteger(id)||!ALLOWED.has(status)) return NextResponse.json({error:"잘못된 요청입니다."},{status:400});
 const currentRes=await supabaseAdminFetch(`/rest/v1/orders?id=eq.${id}&select=id,status&limit=1`); if(!currentRes.ok) return NextResponse.json({error:"현재 주문 상태를 확인하지 못했습니다."},{status:500});
 const current=(await currentRes.json())?.[0]; if(!current) return NextResponse.json({error:"주문을 찾을 수 없습니다."},{status:404});
 if(current.status==='delivered'&&status!=='delivered') return NextResponse.json({error:"배송완료 주문은 직접 취소하거나 이전 상태로 변경할 수 없습니다. 정정/반품 절차가 필요합니다."},{status:409});
 const payload=status==='delivered'?{status,delivered_at:new Date().toISOString()}:{status};
 const res=await supabaseAdminFetch(`/rest/v1/orders?id=eq.${id}`,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify(payload)});
 if(!res.ok){const detail=await res.text();return NextResponse.json({error:"주문 상태를 변경하지 못했습니다.",detail},{status:500});}
 return NextResponse.json({ok:true,order:(await res.json())?.[0]||null});
}
