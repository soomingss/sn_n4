import { redirect } from "next/navigation";
import { getCurrentSession, supabaseAdminFetch } from "../lib/auth";
import ProductsClient from "./ProductsClient";

async function loadProducts(priceGrade) {
  const productsRes = await supabaseAdminFetch('/rest/v1/products?select=id,name,weight,origin,supplier,image_url,is_active&is_active=eq.true&order=name.asc');
  if (!productsRes.ok) return [];
  const products = await productsRes.json();
  if (!products?.length) return [];

  if (!priceGrade) return products.map(p => ({ ...p, price: null }));
  const pricesRes = await supabaseAdminFetch(`/rest/v1/product_prices?select=product_id,price&price_grade=eq.${encodeURIComponent(priceGrade)}`);
  if (!pricesRes.ok) return products.map(p => ({ ...p, price: null }));
  const prices = await pricesRes.json();
  const priceMap = new Map(prices.map(p => [String(p.product_id), p.price]));
  return products.map(p => ({ ...p, price: priceMap.get(String(p.id)) ?? null }));
}

export default async function ProductsPage(){
  const s=await getCurrentSession();
  if(!s)redirect("/login?next=/products");
  if(s.profile?.status!=="approved" && s.profile?.role!=="admin")return <main><section className="companyHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>제품안내</h1><span>HOME &gt; 제품안내</span></div></section><section className="approvalNotice contentWidth"><h1>거래처 승인 후 이용 가능합니다.</h1><p>관리자 승인 완료 후 제품안내를 이용하실 수 있습니다.</p></section></main>;
  const products=await loadProducts(s.profile?.price_grade);
  return <main><section className="companyHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>제품안내</h1><span>HOME &gt; 제품안내</span></div></section><ProductsClient products={products} companyName={s.profile?.company_name || ""} /></main>
}
