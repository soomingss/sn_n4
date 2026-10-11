import {NextResponse} from "next/server";
import {getCurrentSession,supabaseAdminFetch} from "../../../../lib/auth";
export async function POST(req){
 const session=await getCurrentSession();
 if(session?.profile?.role!=="admin")return NextResponse.json({message:"관리자 권한이 필요합니다."},{status:403});
 try{
  const body=await req.json(),id=Number(body.id),reply=String(body.reply||"").trim();
  if(!Number.isSafeInteger(id)||id<1||!reply||reply.length>10000)return NextResponse.json({message:"문의번호 또는 답변 내용을 확인해 주세요."},{status:400});
  const replied_at=new Date().toISOString();
  const r=await supabaseAdminFetch("/rest/v1/inquiries?id=eq."+id,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({admin_reply:reply,replied_at,status:"answered"})});
  if(!r.ok)return NextResponse.json({message:"답변 저장에 실패했습니다."},{status:500});
  const rows=await r.json();if(!rows.length)return NextResponse.json({message:"문의사항을 찾을 수 없습니다."},{status:404});
  return NextResponse.json({ok:true,reply:rows[0].admin_reply,replied_at:rows[0].replied_at});
 }catch{return NextResponse.json({message:"답변 저장 중 오류가 발생했습니다."},{status:500})}
}
