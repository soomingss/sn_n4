import { NextResponse } from "next/server";
import { getCurrentSession,supabaseAdminFetch } from "../../../lib/auth";
import { loadAllProductsForAdmin } from "../../../lib/products";
async function ok(){return (await getCurrentSession())?.profile?.role==="admin"}
export async function GET(){
  if(!await ok())return NextResponse.json({message:"관리자 권한이 필요합니다."},{status:403});
  try{return NextResponse.json({products:await loadAllProductsForAdmin()});}
  catch(error){console.error("[admin/products] GET failed",error);return NextResponse.json({message:"상품 데이터를 불러오지 못했습니다.",detail:error?.message||String(error)},{status:500});}
}
export async function PATCH(req){
  if(!await ok())return NextResponse.json({message:"관리자 권한이 필요합니다."},{status:403});
  const b=await req.json();if(!b.id)return NextResponse.json({message:"잘못된 요청입니다."},{status:400});
  const patch={};if(typeof b.is_active==="boolean")patch.is_active=b.is_active;if(["normal","low"].includes(b.stock_status))patch.stock_status=b.stock_status;
  const r=await supabaseAdminFetch(`/rest/v1/products?id=eq.${encodeURIComponent(b.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(patch)});
  if(r.ok)return NextResponse.json({ok:true});
  const detail=await r.text();console.error("[admin/products] PATCH failed",r.status,detail);
  return NextResponse.json({message:"변경에 실패했습니다.",detail},{status:500});
}
