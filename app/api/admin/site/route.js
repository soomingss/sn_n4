import { NextResponse } from "next/server";
import { getCurrentSession, supabaseAdminFetch } from "../../../lib/auth";

async function requireAdmin(){
  const session = await getCurrentSession();
  return session?.profile?.role === "admin" ? session : null;
}

export async function PATCH(request){
  if (!await requireAdmin()) return NextResponse.json({message:"관리자 권한이 필요합니다."},{status:403});

  try {
    const body = await request.json();
    const {type} = body || {};

    if (type === "settings") {
      const allowed = ["company_name","company_name_en","representative_name","business_number","address","phone","fax","email","kakao_channel_url","map_place_name","map_address"];
      const values = Object.fromEntries(allowed.filter((key)=>key in (body.values || {})).map((key)=>[key,String(body.values[key] ?? "")]));
      if (!Object.keys(values).length) return NextResponse.json({message:"저장할 항목이 없습니다."},{status:400});
      const res = await supabaseAdminFetch("/rest/v1/site_settings",{
        method:"PATCH",
        headers:{Prefer:"return=minimal"},
        body:JSON.stringify(values)
      });
      if (!res.ok) throw new Error(await res.text());
    } else if (type === "content") {
      const pageKey = String(body.pageKey || "");
      const contentKey = String(body.contentKey || "");
      if (!pageKey || !contentKey) return NextResponse.json({message:"콘텐츠 정보가 올바르지 않습니다."},{status:400});
      const res = await supabaseAdminFetch(`/rest/v1/site_content?page_key=eq.${encodeURIComponent(pageKey)}&content_key=eq.${encodeURIComponent(contentKey)}`,{
        method:"PATCH",
        headers:{Prefer:"return=minimal"},
        body:JSON.stringify({content_value:String(body.value ?? "")})
      });
      if (!res.ok) throw new Error(await res.text());
    } else if (type === "history") {
      const id = Number(body.id);
      if (!Number.isFinite(id)) return NextResponse.json({message:"연혁 정보가 올바르지 않습니다."},{status:400});
      const res = await supabaseAdminFetch(`/rest/v1/site_history?id=eq.${id}`,{
        method:"PATCH",
        headers:{Prefer:"return=minimal"},
        body:JSON.stringify({year:String(body.year ?? ""),content:String(body.content ?? "")})
      });
      if (!res.ok) throw new Error(await res.text());
    } else {
      return NextResponse.json({message:"지원하지 않는 저장 요청입니다."},{status:400});
    }

    return NextResponse.json({ok:true});
  } catch (error) {
    console.error("[admin-site] save failed", error instanceof Error ? error.message : error);
    return NextResponse.json({message:"홈페이지 정보를 저장하지 못했습니다."},{status:500});
  }
}
