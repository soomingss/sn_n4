import { redirect } from "next/navigation";
import { getCurrentSession } from "../lib/auth";
import { attachGradePrices, loadActiveProducts, loadPricesForGrade } from "../lib/products";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage(){
  const s=await getCurrentSession();
  if(!s)redirect("/login?next=/products");
  if(s.profile?.status!=="approved" && s.profile?.role!=="admin")return <main><section className="companyHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>제품안내</h1><span>HOME &gt; 제품안내</span></div></section><section className="approvalNotice contentWidth"><h1>거래처 승인 후 이용 가능합니다.</h1><p>관리자 승인 완료 후 제품안내를 이용하실 수 있습니다.</p></section></main>;

  let products=[];
  let loadError="";
  try {
    const rows=await loadActiveProducts();
    const prices=await loadPricesForGrade(s.profile?.price_grade);
    products=attachGradePrices(rows,prices);
  } catch (error) {
    console.error("[products] Supabase product load failed", error);
    loadError="실제 상품 데이터를 불러오지 못했습니다. 관리자에게 문의해주세요.";
  }

  return <main><section className="companyHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>제품안내</h1><span>HOME &gt; 제품안내</span></div></section>{loadError?<section className="approvalNotice contentWidth"><h1>상품 조회 오류</h1><p>{loadError}</p></section>:<ProductsClient products={products} companyName={s.profile?.company_name || ""} />}</main>
}
