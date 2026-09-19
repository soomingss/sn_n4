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
    } else if (type === "content_group") {
      const items = Array.isArray(body.items) ? body.items : [];
      if (!items.length) return NextResponse.json({message:"저장할 항목이 없습니다."},{status:400});
      for (const item of items) {
        const pageKey=String(item.pageKey||"");
        const contentKey=String(item.contentKey||"");
        if(!pageKey||!contentKey) return NextResponse.json({message:"콘텐츠 정보가 올바르지 않습니다."},{status:400});
        const value=String(item.value??"");
        const res=await supabaseAdminFetch(`/rest/v1/site_content?page_key=eq.${encodeURIComponent(pageKey)}&content_key=eq.${encodeURIComponent(contentKey)}`,{
          method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({content_value:value})
        });
        if(!res.ok) throw new Error(await res.text());
        const updated=await res.json().catch(()=>[]);
        if(!updated.length){
          const number=Number(contentKey.match(/^delivery_step_(\d+)_/)?.[1]||0);
          const baseSort=number?100+number*10:999;
          const offset=contentKey.endsWith("_description")?1:contentKey.endsWith("_icon")?2:0;
          const insert=await supabaseAdminFetch("/rest/v1/site_content",{
            method:"POST",headers:{Prefer:"return=minimal"},
            body:JSON.stringify({page_key:pageKey,content_key:contentKey,content_value:value,sort_order:baseSort+offset,is_active:true})
          });
          if(!insert.ok) throw new Error(await insert.text());
        }
      }
    } else if (type === "intro_add") {
      const list=await supabaseAdminFetch("/rest/v1/site_content?select=content_key,sort_order&page_key=eq.company&content_key=like.intro_paragraph_*");
      if(!list.ok) throw new Error(await list.text());
      const rows=await list.json();
      const numbers=rows.map((row)=>Number(String(row.content_key).match(/^intro_paragraph_(\d+)$/)?.[1]||0));
      const number=Math.max(0,...numbers)+1;
      const maxSort=Math.max(0,...rows.map((row)=>Number(row.sort_order)||0));
      const res=await supabaseAdminFetch("/rest/v1/site_content",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({page_key:"company",content_key:`intro_paragraph_${number}`,content_value:"회사소개 내용을 입력해 주세요.",sort_order:maxSort+1,is_active:true})});
      if(!res.ok) throw new Error(await res.text());
    } else if (type === "intro_delete") {
      const contentKey=String(body.contentKey||"");
      if(!/^intro_paragraph_\d+$/.test(contentKey)) return NextResponse.json({message:"회사소개 정보가 올바르지 않습니다."},{status:400});
      const res=await supabaseAdminFetch(`/rest/v1/site_content?page_key=eq.company&content_key=eq.${encodeURIComponent(contentKey)}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
      if(!res.ok) throw new Error(await res.text());
    } else if (type === "core_add") {
      const list = await supabaseAdminFetch("/rest/v1/site_content?select=content_key,sort_order&page_key=eq.company&content_key=like.core_value_*");
      if (!list.ok) throw new Error(await list.text());
      const rows = await list.json();
      const numbers = rows.map((row)=>Number(String(row.content_key).match(/^core_value_(\d+)_/)?.[1]||0));
      const number = Math.max(0,...numbers)+1;
      const maxSort = Math.max(0,...rows.map((row)=>Number(row.sort_order)||0));
      const res = await supabaseAdminFetch("/rest/v1/site_content",{
        method:"POST",headers:{Prefer:"return=minimal"},
        body:JSON.stringify([
          {page_key:"company",content_key:`core_value_${number}_title`,content_value:"새 핵심가치",sort_order:maxSort+10,is_active:true},
          {page_key:"company",content_key:`core_value_${number}_description`,content_value:"핵심가치 설명을 입력해 주세요.",sort_order:maxSort+11,is_active:true}
        ])
      });
      if (!res.ok) throw new Error(await res.text());
    } else if (type === "core_delete") {
      const number=Number(body.number);
      if (!Number.isFinite(number)) return NextResponse.json({message:"핵심가치 정보가 올바르지 않습니다."},{status:400});
      const keys=[`core_value_${number}_title`,`core_value_${number}_description`];
      const res=await supabaseAdminFetch(`/rest/v1/site_content?page_key=eq.company&content_key=in.(${keys.join(",")})`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
      if(!res.ok)throw new Error(await res.text());
    } else if (type === "core_active") {
      const number = Number(body.number);
      if (![1,2,3,4,5].includes(number)) return NextResponse.json({message:"핵심가치 정보가 올바르지 않습니다."},{status:400});
      const active = Boolean(body.active);
      const keys = [`core_value_${number}_title`,`core_value_${number}_description`];
      const res = await supabaseAdminFetch(`/rest/v1/site_content?page_key=eq.company&content_key=in.(${keys.join(",")})`,{
        method:"PATCH",
        headers:{Prefer:"return=minimal"},
        body:JSON.stringify({is_active:active})
      });
      if (!res.ok) throw new Error(await res.text());
    } else if (type === "delivery_step_add") {
      const list=await supabaseAdminFetch("/rest/v1/site_content?select=content_key,sort_order&page_key=eq.order_delivery&content_key=like.delivery_step_*");
      if(!list.ok)throw new Error(await list.text());
      const rows=await list.json();
      const numbers=rows.map((row)=>Number(String(row.content_key).match(/^delivery_step_(\d+)_/)?.[1]||0));
      const number=Math.max(0,...numbers)+1;
      const maxSort=Math.max(0,...rows.map((row)=>Number(row.sort_order)||0),100);
      const initial=[
        ["주문 접수","주문 품목과 수량을 확인합니다","order"],
        ["재고 확인","보유 재고와 주문 내용을 꼼꼼하게 확인합니다","stock"],
        ["상품 준비·검수","출고 전 상품 상태를 다시 한 번 확인합니다.","check"],
        ["배송","지역에 따라 직접 배송 또는 택배로 안전하게 발송합니다","truck"]
      ];
      const insertRows=rows.length?[
        {page_key:"order_delivery",content_key:`delivery_step_${number}_title`,content_value:"새 배송 단계",sort_order:maxSort+10,is_active:true},
        {page_key:"order_delivery",content_key:`delivery_step_${number}_description`,content_value:"배송 단계 설명을 입력해 주세요.",sort_order:maxSort+11,is_active:true},
        {page_key:"order_delivery",content_key:`delivery_step_${number}_icon`,content_value:"order",sort_order:maxSort+12,is_active:true}
      ]:initial.flatMap((step,index)=>[
        {page_key:"order_delivery",content_key:`delivery_step_${index+1}_title`,content_value:step[0],sort_order:110+index*10,is_active:true},
        {page_key:"order_delivery",content_key:`delivery_step_${index+1}_description`,content_value:step[1],sort_order:111+index*10,is_active:true},
        {page_key:"order_delivery",content_key:`delivery_step_${index+1}_icon`,content_value:step[2],sort_order:112+index*10,is_active:true}
      ]);
      const res=await supabaseAdminFetch("/rest/v1/site_content",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(insertRows)});
      if(!res.ok)throw new Error(await res.text());
    } else if (type === "delivery_step_delete") {
      const number=Number(body.number);
      if(!Number.isFinite(number))return NextResponse.json({message:"배송 단계 정보가 올바르지 않습니다."},{status:400});
      const keys=[`delivery_step_${number}_title`,`delivery_step_${number}_description`,`delivery_step_${number}_icon`];
      const res=await supabaseAdminFetch(`/rest/v1/site_content?page_key=eq.order_delivery&content_key=in.(${keys.join(",")})`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
      if(!res.ok)throw new Error(await res.text());
    } else if (type === "parking_add") {
      const rows = [
        {page_key:"location",content_key:"parking_title",content_value:"주차 안내",sort_order:40,is_active:true},
        {page_key:"location",content_key:"parking_label",content_value:"자차 이용 시",sort_order:41,is_active:true},
        {page_key:"location",content_key:"parking_description",content_value:"주차 안내 내용을 입력해 주세요.",sort_order:42,is_active:true}
      ];
      const res = await supabaseAdminFetch("/rest/v1/site_content",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(rows)});
      if(!res.ok)throw new Error(await res.text());
    } else if (type === "parking_delete") {
      const res = await supabaseAdminFetch("/rest/v1/site_content?page_key=eq.location&content_key=in.(parking_title,parking_label,parking_description)",{method:"DELETE",headers:{Prefer:"return=minimal"}});
      if(!res.ok)throw new Error(await res.text());
    } else if (type === "history_add") {
      const list=await supabaseAdminFetch("/rest/v1/site_history?select=sort_order&order=sort_order.desc&limit=1");
      if(!list.ok)throw new Error(await list.text());
      const rows=await list.json();
      const sort=(Number(rows?.[0]?.sort_order)||0)+10;
      const res=await supabaseAdminFetch("/rest/v1/site_history",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({year:"",content:"새 연혁 내용을 입력해 주세요.",sort_order:sort,is_active:true})});
      if(!res.ok)throw new Error(await res.text());
    } else if (type === "history_delete") {
      const id=Number(body.id);
      if(!Number.isFinite(id))return NextResponse.json({message:"연혁 정보가 올바르지 않습니다."},{status:400});
      const res=await supabaseAdminFetch(`/rest/v1/site_history?id=eq.${id}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
      if(!res.ok)throw new Error(await res.text());
    } else if (type === "history_active") {
      const id = Number(body.id);
      if (!Number.isFinite(id)) return NextResponse.json({message:"연혁 정보가 올바르지 않습니다."},{status:400});
      const res = await supabaseAdminFetch(`/rest/v1/site_history?id=eq.${id}`,{
        method:"PATCH",
        headers:{Prefer:"return=minimal"},
        body:JSON.stringify({is_active:Boolean(body.active)})
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
