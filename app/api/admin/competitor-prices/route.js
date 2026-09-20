import {NextResponse} from "next/server";
import * as XLSX from "xlsx";
import {getCurrentSession,supabaseAdminFetch} from "../../../lib/auth";
import {loadAllProductsForAdmin,loadAllPrices} from "../../../lib/products";

async function admin(){return (await getCurrentSession())?.profile?.role==="admin"}
const companies=["참초원","본초마루","메디스트림"];
const clean=v=>v==null?"":String(v).trim();
const norm=v=>clean(v).toLowerCase().replace(/\d+(?:\.\d+)?\s*(?:kg|g)/gi,"").replace(/\*\s*\d+\s*묶음/g,"").replace(/[\s,._-]/g,"");
function normOrigin(v){const s=clean(v);if(/대한민국|국내|국산|한국/.test(s))return "한국";if(s.includes("중국"))return "중국";if(/우즈벡|우즈베키스탄/.test(s))return "우즈베키스탄";for(const x of ["베트남","인도네시아","인도","미얀마","태국","라오스","캄보디아","페루","일본","러시아","이란","터키","파키스탄","네팔"])if(s.includes(x))return x;return s.replace(/\s/g,"").toLowerCase()}
function monthFromName(name){const s=String(name);const m=s.match(/(?:^|[^0-9])(?:20)?(\d{2})[._-]?(0?[1-9]|1[0-2])(?:[^0-9]|$)/);if(!m)return null;return `20${m[1]}-${String(Number(m[2])).padStart(2,"0")}-01`}
function parseSheet(sheet,competitorId){
  const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:null,raw:true}),out=[];
  const seen=new Set();
  for(const row of rows){
    for(let o=0;o<row.length-3;o++){
      const name=clean(row[o]),origin=clean(row[o+1]),weightRaw=row[o+2],price=Number(row[o+3]),p500=Number(row[o+4]);
      if(!name||/품명|품목|약재명|상품명/.test(name)||!Number.isFinite(price)||price<=0)continue;
      const context=row.slice(Math.max(0,o-2),Math.min(row.length,o+6)).map(clean).join(" ");
      if(!origin&&!/[가-힣A-Za-z]/.test(context))continue;
      let weight=Number(weightRaw);
      if(!Number.isFinite(weight)||weight<=0){const kg=name.match(/([0-9]+(?:\.[0-9]+)?)\s*kg/i),g=name.match(/([0-9]+(?:\.[0-9]+)?)\s*g/i);weight=kg?Number(kg[1])*1000:g?Number(g[1]):500}
      const price500=Number.isFinite(p500)&&p500>0?p500:price*500/weight;
      const k=[competitorId,norm(name),normOrigin(origin),weight,price].join("|");
      if(seen.has(k))continue;seen.add(k);
      out.push({competitor_id:competitorId,original_product_name:name,original_origin:origin||null,original_weight_g:weight,original_price:price,price_500g:Math.round(price500*100)/100,normalized_name:norm(name),normalized_origin:normOrigin(origin)});
      break;
    }
  }
  return out;
}
async function rest(path,options){const r=await supabaseAdminFetch(path,options);if(!r.ok)throw new Error(await r.text());return r.status===204?null:r.json().catch(()=>null)}
async function competitors(){return rest("/rest/v1/competitors?select=id,name&is_active=eq.true")}
async function mappings(){return rest("/rest/v1/competitor_product_mappings?select=*")}
function candidates(item,products){
  const a=item.normalized_name,o=item.normalized_origin;
  return products.map(p=>{const b=norm(p.name),po=normOrigin(p.origin);let score=0;if(a===b)score=o&&po===o?100:95;else if(a&&b&&(a.includes(b)||b.includes(a)))score=o&&po===o?85:70;return {...p,confidence:score}}).filter(x=>x.confidence>0).sort((x,y)=>y.confidence-x.confidence).slice(0,10);
}
async function finalizeImport(id){
  const pending=await rest(`/rest/v1/competitor_import_items?import_id=eq.${id}&match_status=in.(review,unmatched)&select=id`);
  if(pending?.length)return {ok:false,pending:pending.length};
  const imp=(await rest(`/rest/v1/competitor_imports?id=eq.${id}&select=*`))?.[0];
  const items=await rest(`/rest/v1/competitor_import_items?import_id=eq.${id}&match_status=in.(auto,manual)&select=*`);
  if(!imp)throw new Error("업로드 작업을 찾지 못했습니다.");
  await rest(`/rest/v1/competitor_prices?import_id=eq.${id}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
  if(items?.length)await rest("/rest/v1/competitor_prices",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(items.map(x=>({import_id:id,competitor_id:x.competitor_id,product_id:x.confirmed_product_id||x.suggested_product_id,mapping_id:x.mapping_id||null,price_month:imp.price_month,original_product_name:x.original_product_name,original_origin:x.original_origin,original_weight_g:x.original_weight_g,original_price:x.original_price,price_500g:x.price_500g})))});
  await rest(`/rest/v1/competitor_imports?id=eq.${id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"completed",completed_at:new Date().toISOString()})});
  return {ok:true};
}
export async function GET(){
  if(!await admin())return NextResponse.json({message:"관리자 권한이 필요합니다."},{status:403});
  try{
    const [cs,imports,markets,products,prices,review]=await Promise.all([
      competitors(),
      rest("/rest/v1/competitor_imports?select=*&order=created_at.desc"),
      rest("/rest/v1/competitor_prices?select=*&order=price_month.desc"),
      loadAllProductsForAdmin(),loadAllPrices(),
      rest("/rest/v1/competitor_import_items?select=*&match_status=in.(review,unmatched,auto,manual)&order=id.asc")
    ]);
    const activeProducts=(products||[]).filter(p=>p.is_active!==false);
    const reviewWithCandidates=(review||[]).map(x=>({...x,candidates:candidates(x,activeProducts)}));
    return NextResponse.json({competitors:cs,imports,markets,products:activeProducts,prices,review:reviewWithCandidates});
  }catch(e){return NextResponse.json({message:"가격 데이터를 불러오지 못했습니다.",detail:e?.message||String(e)},{status:500})}
}
export async function POST(req){
  if(!await admin())return NextResponse.json({message:"관리자 권한이 필요합니다."},{status:403});
  try{
    const form=await req.formData(),files=form.getAll("files"),cs=await competitors(),products=(await loadAllProductsForAdmin()).filter(p=>p.is_active!==false),savedMaps=await mappings(),saved=[];
    const cMap=new Map(cs.map(x=>[x.name,x.id]));
    for(const file of files){
      const month=monthFromName(file.name);if(!month)throw new Error(`${file.name}: 파일명에서 2026년 월 정보를 찾지 못했습니다.`);
      const created=await rest("/rest/v1/competitor_imports",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({price_month:month,original_filename:file.name,status:"analyzing"})});
      const importId=created?.[0]?.id;if(!importId)throw new Error("업로드 작업 생성에 실패했습니다.");
      const wb=XLSX.read(await file.arrayBuffer(),{type:"array"});let items=[];
      for(const company of companies){const sheetName=wb.SheetNames.find(n=>clean(n).includes(company));if(sheetName&&cMap.has(company))items.push(...parseSheet(wb.Sheets[sheetName],cMap.get(company)))}
      if(!items.length)throw new Error(`${file.name}: 경쟁업체 가격 데이터를 찾지 못했습니다.`);
      let auto=0,review=0,unmatched=0,excluded=0;
      items=items.map(item=>{
        const savedMap=savedMaps.find(m=>Number(m.competitor_id)===Number(item.competitor_id)&&m.normalized_name===item.normalized_name&&(m.normalized_origin||"")===(item.normalized_origin||""));
        if(savedMap){if(savedMap.excluded){excluded++;return {...item,import_id:importId,mapping_id:savedMap.id,match_status:"excluded"}}auto++;return {...item,import_id:importId,mapping_id:savedMap.id,suggested_product_id:savedMap.product_id,confirmed_product_id:savedMap.product_id,confidence:100,match_status:"auto"}}
        const cand=candidates(item,products),top=cand[0];
        if(top){auto++;return {...item,import_id:importId,suggested_product_id:top.id,confirmed_product_id:top.id,confidence:top.confidence,match_status:"auto"}}
        unmatched++;return {...item,import_id:importId,match_status:"unmatched"};
      });
      const insertItems=items.map(item=>({import_id:item.import_id,competitor_id:item.competitor_id,original_product_name:item.original_product_name,original_origin:item.original_origin??null,original_weight_g:item.original_weight_g,original_price:item.original_price,price_500g:item.price_500g,normalized_name:item.normalized_name,normalized_origin:item.normalized_origin??"",suggested_product_id:item.suggested_product_id??null,confirmed_product_id:item.confirmed_product_id??null,mapping_id:item.mapping_id??null,confidence:item.confidence??null,match_status:item.match_status}));
      await rest("/rest/v1/competitor_import_items",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(insertItems)});
      await rest(`/rest/v1/competitor_imports?id=eq.${importId}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:review+unmatched?"review":"ready",total_count:items.length,auto_matched_count:auto,review_count:review,unmatched_count:unmatched,excluded_count:excluded})});
      if(!(review+unmatched))await finalizeImport(importId);
      saved.push({id:importId,month:month.slice(0,7),count:items.length,review:review+unmatched});
    }
    return NextResponse.json({ok:true,saved});
  }catch(e){return NextResponse.json({message:"시세표 저장에 실패했습니다.",detail:e?.message||String(e)},{status:500})}
}
export async function DELETE(){
  if(!await admin())return NextResponse.json({message:"관리자 권한이 필요합니다."},{status:403});
  try{
    for(const path of ["/rest/v1/competitor_prices?id=not.is.null","/rest/v1/competitor_import_items?id=not.is.null","/rest/v1/competitor_product_mappings?id=not.is.null","/rest/v1/competitor_imports?id=not.is.null"]){
      await rest(path,{method:"DELETE",headers:{Prefer:"return=minimal"}});
    }
    return NextResponse.json({ok:true});
  }catch(e){return NextResponse.json({message:"기존 경쟁업체 업로드 데이터를 초기화하지 못했습니다.",detail:e?.message||String(e)},{status:500})}
}
export async function PATCH(req){
  if(!await admin())return NextResponse.json({message:"관리자 권한이 필요합니다."},{status:403});
  try{
    const b=await req.json();
    if(b.action==="confirm"){
      const item=(await rest(`/rest/v1/competitor_import_items?id=eq.${Number(b.itemId)}&select=*`))?.[0];if(!item)throw new Error("검토 항목을 찾지 못했습니다.");
      const excluded=Boolean(b.excluded),productId=excluded?null:Number(b.productId);if(!excluded&&!productId)throw new Error("신농허브 상품을 선택해주세요.");
      const existing=await rest(`/rest/v1/competitor_product_mappings?competitor_id=eq.${item.competitor_id}&normalized_name=eq.${encodeURIComponent(item.normalized_name)}&normalized_origin=eq.${encodeURIComponent(item.normalized_origin||"")}&select=id`);
      let mappingId=existing?.[0]?.id;
      const payload={competitor_id:item.competitor_id,competitor_product_name:item.original_product_name,competitor_origin:item.original_origin,normalized_name:item.normalized_name,normalized_origin:item.normalized_origin||"",product_id:productId,excluded,match_type:excluded?"excluded":"manual"};
      if(mappingId)await rest(`/rest/v1/competitor_product_mappings?id=eq.${mappingId}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(payload)});
      else {const ins=await rest("/rest/v1/competitor_product_mappings",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify(payload)});mappingId=ins?.[0]?.id}
      await rest(`/rest/v1/competitor_import_items?id=eq.${item.id}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({mapping_id:mappingId,confirmed_product_id:productId,match_status:excluded?"excluded":"manual",confidence:100})});
      return NextResponse.json({ok:true});
    }
    if(b.action==="finalize"){
      const id=Number(b.importId),result=await finalizeImport(id);
      if(!result.ok)return NextResponse.json({message:`확인이 필요한 품목이 ${result.pending}개 남아 있습니다.`},{status:400});
      return NextResponse.json({ok:true});
    }
    return NextResponse.json({message:"지원하지 않는 요청입니다."},{status:400});
  }catch(e){return NextResponse.json({message:"매핑 저장에 실패했습니다.",detail:e?.message||String(e)},{status:500})}
}