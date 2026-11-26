import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession, supabaseAdminFetch } from "../lib/auth";
import { getSiteSettings } from "../lib/site-settings";
import { attachGradePrices, loadActiveProducts, loadPricesForGrade } from "../lib/products";
import ProductsClient from "./ProductsClient";
import {getSiteContent} from "../lib/site-content";
import { visibleProductSupplier } from "../lib/product-supplier";

async function loadFrequentProductIds(userId) {
  try {
    const ordersResponse = await supabaseAdminFetch(
      `/rest/v1/orders?user_id=eq.${encodeURIComponent(userId)}&status=neq.cancelled&select=id&order=created_at.desc,id.desc&limit=10`
    );
    if (!ordersResponse.ok) return [];
    const orderIds = (await ordersResponse.json()).map(order => order.id);
    if (!orderIds.length) return [];

    const itemsResponse = await supabaseAdminFetch(
      `/rest/v1/order_items?order_id=in.(${encodeURIComponent(orderIds.join(","))})&select=order_id,product_id&order=order_id.desc,product_id.asc`
    );
    if (!itemsResponse.ok) return [];
    const counts = new Map();
    const seen = new Set();
    for (const item of await itemsResponse.json()) {
      if (item.product_id == null) continue;
      const key = `${item.order_id}:${item.product_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      counts.set(item.product_id, (counts.get(item.product_id) || 0) + 1);
    }
    return [...counts].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  } catch (error) {
    console.error("[products] Recent order lookup failed", error);
    return [];
  }
}

export default async function OrderCatalogPage({cartPage=false,bulkOrder=false}){
  const title = bulkOrder ? (cartPage ? "대량 발주 장바구니" : "대량 발주") : (cartPage ? "담은 약재" : "약재주문");
  const [s, settings, deliveryContent]=await Promise.all([getCurrentSession(), getSiteSettings(), getSiteContent("order_delivery")]);
  if(!s)redirect(`/login?next=${encodeURIComponent((cartPage ? "/cart" : "/products") + (bulkOrder ? "?mode=bulk" : ""))}`);
  if(s.profile?.status!=="approved" && s.profile?.role!=="admin")return <main><section className="companyHero"><div className="companyHeroCopy">{settings.company_name_en ? <p>{settings.company_name_en}</p> : null}<h1>{title}</h1><span>HOME &gt; {title}</span></div></section><section className="approvalNotice contentWidth"><h1>거래처 승인 후 이용 가능합니다.</h1><p>관리자 승인 완료 후 약재주문를 이용하실 수 있습니다.</p></section></main>;

  const frequentProductIdsPromise = cartPage || s.profile?.role === "admin"
    ? Promise.resolve([])
    : loadFrequentProductIds(s.user.id);
  let products=[];
  let adminPrices={};
  let loadError="";
  try {
    const rows=await loadActiveProducts();
    const effectiveGrade=s.profile?.role==="admin"&&!s.profile?.price_grade?"clinic":s.profile?.price_grade;
    const prices=await loadPricesForGrade(effectiveGrade);
    products=attachGradePrices(rows,prices);
    products=products.map(({supplier,...product})=>({...product,supplier:visibleProductSupplier(supplier)}));
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

  const frequentProductIds = await frequentProductIdsPromise;

  return <main><section className="companyHero"><div className="companyHeroCopy">{settings.company_name_en ? <p>{settings.company_name_en}</p> : null}<h1>{title}</h1><span>HOME &gt; {title}</span></div></section>{!cartPage && <nav className="orderModeNav contentWidth" aria-label="약재 주문 유형">
    <Link href="/products" aria-current={bulkOrder ? undefined : "page"}>일반 주문</Link>
    <Link href="/products?mode=bulk" aria-current={bulkOrder ? "page" : undefined}>대량 발주</Link>
    <Link href="/inquiry?type=food">식품공장 견적 요청</Link>
  </nav>}{loadError?<section className="approvalNotice contentWidth"><h1>상품 조회 오류</h1><p>{loadError}</p></section>:<ProductsClient key={bulkOrder ? "bulk" : "standard"} cartPage={cartPage} bulkOrder={bulkOrder} deliveryDraftOwner={s.user.id} frequentProductIds={frequentProductIds} kakaoChannelUrl={settings.kakao_channel_url || ""} parcelShippingNotice={deliveryContent.parcel_shipping_notice||""} products={products} companyName={s.profile?.company_name || ""} adminPricePreview={s.profile?.role==="admin"} adminPrices={adminPrices} />}</main>
}
