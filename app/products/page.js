import { redirect } from "next/navigation";
import { getCurrentSession } from "../lib/auth";
import { getSiteSettings } from "../lib/site-settings";
import { attachGradePrices, loadActiveProducts, loadPricesForGrade } from "../lib/products";
import ProductsClient from "./ProductsClient";

export default async function ProductsPage(){
  const [s, settings]=await Promise.all([getCurrentSession(), getSiteSettings()]);
  if(!s)redirect("/login?next=/products");
  if(s.profile?.status!=="approved" && s.profile?.role!=="admin")return <main><section className="companyHero"><div className="companyHeroCopy">{settings.company_name_en ? <p>{settings.company_name_en}</p> : null}<h1>약재주문</h1><span>HOME &gt; 약재주문</span></div></section><section className="approvalNotice contentWidth"><h1>거래처 승인 후 이용 가능합니다.</h1><p>관리자 승인 완료 후 약재주문를 이용하실 수 있습니다.</p></section></main>;

  let products=[];
  let adminPrices={};
  let loadError="";
  try {
    const rows=await loadActiveProducts();
    const effectiveGrade=s.profile?.role==="admin"&&!s.profile?.price_grade?"clinic":s.profile?.price_grade;
    const prices=await loadPricesForGrade(effectiveGrade);
    products=attachGradePrices(rows,prices);
    if(s.profile?.role!=="admin")products=products.map(({supplier,...product})=>String(supplier||"").includes("신흥")?{...product,supplier}:product);
    if(s.profile?.role==="admin"){
      const [oem,special]=await Promise.all([loadPricesForGrade("oem"),loadPricesForGrade("special")]);
      adminPrices={clinic:Object.fromEntries(products.map(p=>[String(p.id),p.price])),oem:Object.fromEntries(oem.map(p=>[String(p.product_id),p.price])),special:Object.fromEntries(special.map(p=>[String(p.product_id),p.price]))};
      const clinic=await loadPricesForGrade("clinic");
      adminPrices.clinic=Object.fromEntries(clinic.map(p=>[String(p.product_id),p.price]));
    }
  } catch (error) {
    console.error("[products] Supabase product load failed", error);
    loadError="실제 상품 데이터를 불러오지 못했습니다. 관리자에게 문의해주세요.";
  }

  return <main><section className="companyHero"><div className="companyHeroCopy">{settings.company_name_en ? <p>{settings.company_name_en}</p> : null}<h1>약재주문</h1><span>HOME &gt; 약재주문</span></div></section>{loadError?<section className="approvalNotice contentWidth"><h1>상품 조회 오류</h1><p>{loadError}</p></section>:<ProductsClient products={products} companyName={s.profile?.company_name || ""} adminPricePreview={s.profile?.role==="admin"} adminPrices={adminPrices} />}</main>
}
