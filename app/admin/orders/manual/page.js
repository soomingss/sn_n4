import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession, supabaseAdminFetch } from "../../../lib/auth";
import ProductsClient from "../../../products/ProductsClient";

export default async function ManualOrderPage(){
  const s=await getCurrentSession();
  if(!s)redirect("/login?next=/admin/orders/manual");
  if(s.profile?.role!=="admin")redirect("/");
  const [partnersRes,productsRes,pricesRes]=await Promise.all([
    supabaseAdminFetch('/rest/v1/profiles?status=eq.approved&role=eq.customer&select=id,company_name,price_grade&order=company_name.asc'),
    supabaseAdminFetch('/rest/v1/products?select=id,name,weight,origin,supplier,image_url,is_active&is_active=eq.true&order=name.asc'),
    supabaseAdminFetch('/rest/v1/product_prices?select=product_id,price_grade,price')
  ]);
  const partners=partnersRes.ok?await partnersRes.json():[];
  const products=productsRes.ok?await productsRes.json():[];
  const prices=pricesRes.ok?await pricesRes.json():[];
  const pricesByGrade={};
  for(const row of prices){const g=String(row.price_grade);(pricesByGrade[g]??={})[String(row.product_id)]=row.price;}
  return <main><section className="companyHero adminHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>수기 주문 등록</h1><span>ADMIN &gt; 주문관리 &gt; 수기 주문 등록</span></div></section><div className="manualOrderBack contentWidth"><Link href="/admin/orders">← 주문관리로 돌아가기</Link></div><ProductsClient products={products} adminManual partners={partners} pricesByGrade={pricesByGrade}/></main>;
}
