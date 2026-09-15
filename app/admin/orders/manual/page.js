import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession, supabaseAdminFetch } from "../../../lib/auth";
import { loadActiveProducts, loadAllPrices } from "../../../lib/products";
import ProductsClient from "../../../products/ProductsClient";

export default async function ManualOrderPage(){
  const s=await getCurrentSession();
  if(!s)redirect("/login?next=/admin/orders/manual");
  if(s.profile?.role!=="admin")redirect("/");
  const partnersRes=await supabaseAdminFetch('/rest/v1/profiles?status=eq.approved&role=eq.customer&select=id,company_name,price_grade&order=company_name.asc');
  const partners=partnersRes.ok?await partnersRes.json():[];
  let products=[],prices=[];
  try{[products,prices]=await Promise.all([loadActiveProducts(),loadAllPrices()]);}
  catch(error){console.error("[admin/manual-order] product load failed",error);}
  products=products.map(p=>({...p,image_url:p.image_url||null}));
  const pricesByGrade={};
  for(const row of prices){const g=String(row.price_grade);(pricesByGrade[g]??={})[String(row.product_id)]=row.price;}
  return <main><section className="companyHero adminHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>수기 주문 등록</h1><span>ADMIN &gt; 주문관리 &gt; 수기 주문 등록</span></div></section><div className="manualOrderBack contentWidth"><Link href="/admin/orders">← 주문관리로 돌아가기</Link></div><ProductsClient products={products} adminManual partners={partners} pricesByGrade={pricesByGrade}/></main>;
}
