import { NextResponse } from "next/server";
import { getCurrentSession,supabaseAdminFetch } from "../../../lib/auth";
import { loadAllProductsForAdmin,loadAllPrices } from "../../../lib/products";
import * as XLSX from "xlsx";
async function ok(){return (await getCurrentSession())?.profile?.role==="admin"}
export async function GET(){if(!await ok())return NextResponse.json({message:"관리자 권한이 필요합니다."},{status:403});try{return NextResponse.json({products:await loadAllProductsForAdmin(),prices:await loadAllPrices()});}catch(error){return NextResponse.json({message:"상품 데이터를 불러오지 못했습니다.",detail:error?.message||String(error)},{status:500});}}
export async function PATCH(req){if(!await ok())return NextResponse.json({message:"관리자 권한이 필요합니다."},{status:403});const b=await req.json();if(!b.id)return NextResponse.json({message:"잘못된 요청입니다."},{status:400});const patch={};if(typeof b.is_active==="boolean")patch.is_active=b.is_active;if(["normal","low"].includes(b.stock_status))patch.stock_status=b.stock_status;for(const k of ["name","weight","origin","supplier"])if(typeof b[k]==="string")patch[k]=b[k].trim();if(Object.keys(patch).length){const r=await supabaseAdminFetch(`/rest/v1/products?id=eq.${encodeURIComponent(b.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(patch)});if(!r.ok)return NextResponse.json({message:"상품정보 변경에 실패했습니다.",detail:await r.text()},{status:500});}if(b.prices&&typeof b.prices==="object"){for(const g of ["1","2","3","4","5"]){if(b.prices[g]===undefined)continue;const price=Number(b.prices[g]);if(!Number.isFinite(price)||price<0)return NextResponse.json({message:"가격은 0원 이상의 숫자로 입력해주세요."},{status:400});const r=await supabaseAdminFetch('/rest/v1/product_prices?on_conflict=product_id,price_grade',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({product_id:Number(b.id),price_grade:g,price:Math.round(price)})});if(!r.ok)return NextResponse.json({message:`${g}등급 가격 저장 실패`,detail:await r.text()},{status:500});}}return NextResponse.json({ok:true});}

export async function POST(req){
  if(!await ok())return NextResponse.json({message:"관리자 권한이 필요합니다."},{status:403});
  try{
    const form=await req.formData(),file=form.get("file");
    if(!file)return NextResponse.json({message:"마스터 엑셀 파일을 선택해주세요."},{status:400});
    const wb=XLSX.read(await file.arrayBuffer(),{type:"array"}),ws=wb.Sheets[wb.SheetNames[0]];
    const rows=XLSX.utils.sheet_to_json(ws,{defval:""});
    const specialWeights=[
      {name:"등심",weight:"100g"},{name:"어성초",weight:"600g"},{name:"오공",weight:"80g"},{name:"자연동",weight:"300g"},{name:"포황",weight:"600g"},
      {name:"대추",weight:"1kg"},{name:"진피",weight:"1kg"},
      {name:"녹각교",supplier:"신흥",weight:"30g"},{name:"맥아",supplier:"신흥",weight:"1kg"},{name:"모려(가루)",supplier:"신흥",weight:"1kg"},
      {name:"모려(단)",supplier:"신흥",weight:"1kg"},{name:"석고",supplier:"신흥",weight:"1kg"},{name:"숙지황(원형)",supplier:"신흥",weight:"1kg"},
      {name:"신곡(초)",supplier:"신흥",weight:"1kg"},{name:"용골 (분말)",supplier:"신흥",weight:"1kg"},{name:"활석",supplier:"신흥",weight:"1kg"}
    ];
    const productWeight=(name,supplier)=>specialWeights.find(x=>x.name===name&&(!x.supplier||supplier.includes(x.supplier)))?.weight||"500g";
    const products=rows.filter(x=>String(x["품명"]||"").trim()).map(x=>{
      const name=String(x["품명"]).trim(),supplier=String(x["회사명"]||"").trim();
      return {name,supplier,origin:String(x["원산지"]||"").trim(),weight:productWeight(name,supplier),is_active:true,stock_status:"normal"};
    });
    if(products.length!==402)return NextResponse.json({message:`마스터 상품 수가 402개가 아닙니다. 현재 ${products.length}개입니다.`},{status:400});
    const del=async(path)=>{const r=await supabaseAdminFetch(path,{method:"DELETE",headers:{Prefer:"return=minimal"}});if(!r.ok)throw new Error(await r.text())};
    for(const path of ["/rest/v1/competitor_prices?id=not.is.null","/rest/v1/competitor_import_items?id=not.is.null","/rest/v1/competitor_product_mappings?id=not.is.null","/rest/v1/competitor_imports?id=not.is.null","/rest/v1/product_prices?product_id=not.is.null","/rest/v1/products?id=not.is.null"])await del(path);
    const ins=await supabaseAdminFetch("/rest/v1/products",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify(products)});
    if(!ins.ok)throw new Error(await ins.text());
    const created=await ins.json(),prices=[];
    for(const p of created)for(const g of ["1","2","3","4","5"])prices.push({product_id:p.id,price_grade:g,price:10000});
    for(let i=0;i<prices.length;i+=500){const r=await supabaseAdminFetch("/rest/v1/product_prices",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(prices.slice(i,i+500))});if(!r.ok)throw new Error(await r.text())}
    return NextResponse.json({ok:true,count:created.length,priceCount:prices.length});
  }catch(error){return NextResponse.json({message:"마스터 초기화에 실패했습니다.",detail:error?.message||String(error)},{status:500})}
}
