import {NextResponse} from "next/server";
import * as XLSX from "xlsx";
import {getCurrentSession,supabaseAdminFetch} from "../../../lib/auth";
import {loadAllProductsForAdmin,loadAllPrices} from "../../../lib/products";

async function admin(){return (await getCurrentSession())?.profile?.role==="admin"}
const companies=["참초원","본초마루","메디스트림"];
function monthFromName(name){const m=String(name).match(/26(0[1-9]|1[0-2])/);return m?`2026-${m[1]}`:null}
function clean(v){return v==null?"":String(v).trim()}
function rowsFromSheet(sheet,month,company){
  const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:null});
  const out=[];
  for(const row of rows.slice(1))for(const o of [0,6]){
    const name=clean(row[o]),origin=clean(row[o+1]),weight=row[o+2],price=Number(row[o+3]),price500=Number(row[o+4]);
    if(!name||!Number.isFinite(price)||!Number.isFinite(price500))continue;
    out.push({month,company,name,origin,weight,price,price500:Math.round(price500)});
  }
  return out;
}
async function readMarkets(){
  const r=await supabaseAdminFetch("/rest/v1/site_content?select=content_key,content_value&page_key=eq.competitor_prices&content_key=like.market_%25");
  if(!r.ok)return [];
  const rows=await r.json(); const all=[];
  for(const row of rows||[])try{all.push(...JSON.parse(row.content_value||"[]"))}catch{}
  return all;
}
export async function GET(){
  if(!await admin())return NextResponse.json({message:"관리자 권한이 필요합니다."},{status:403});
  try{return NextResponse.json({markets:await readMarkets(),products:await loadAllProductsForAdmin(),prices:await loadAllPrices()})}
  catch(e){return NextResponse.json({message:"가격 데이터를 불러오지 못했습니다.",detail:e?.message||String(e)},{status:500})}
}
export async function POST(req){
  if(!await admin())return NextResponse.json({message:"관리자 권한이 필요합니다."},{status:403});
  try{
    const form=await req.formData(),files=form.getAll("files"); const saved=[];
    for(const file of files){
      const month=monthFromName(file.name); if(!month)continue;
      const wb=XLSX.read(await file.arrayBuffer(),{type:"array"}); let data=[];
      for(const company of companies)if(wb.Sheets[company])data.push(...rowsFromSheet(wb.Sheets[company],month,company));
      const key="market_"+month.replace("-","_");
      if(!data.length)throw new Error(`${file.name}: 경쟁업체 시트에서 가격 데이터를 찾지 못했습니다.`);
      const payload={content_value:JSON.stringify(data),sort_order:Number(month.replace("-","")),is_active:true};
      const update=await supabaseAdminFetch(`/rest/v1/site_content?page_key=eq.competitor_prices&content_key=eq.${encodeURIComponent(key)}`,{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify(payload)});
      if(!update.ok)throw new Error(await update.text());
      const updated=await update.json().catch(()=>[]);
      if(!updated.length){
        const insert=await supabaseAdminFetch("/rest/v1/site_content",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({page_key:"competitor_prices",content_key:key,...payload})});
        if(!insert.ok)throw new Error(await insert.text());
      }
      saved.push({month,count:data.length});
    }
    return NextResponse.json({ok:true,saved});
  }catch(e){return NextResponse.json({message:"시세표 저장에 실패했습니다.",detail:e?.message||String(e)},{status:500})}
}