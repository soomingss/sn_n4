import RefundPolicy from "../order-delivery/returns/RefundPolicy";
import { redirect } from "next/navigation";
import { getCurrentSession, supabaseAdminFetch } from "../lib/auth";
import { getSiteSettings } from "../lib/site-settings";
import { attachGradePrices, loadActiveProducts, loadPricesForGrade } from "../lib/products";
import ProductsClient from "./ProductsClient";
import {getSiteContent} from "../lib/site-content";
import { visibleProductSupplier } from "../lib/product-supplier";

async function loadRecentOrders(userId) {
  try {
    const ordersResponse = await supabaseAdminFetch(
      `/rest/v1/orders?user_id=eq.${encodeURIComponent(userId)}&status=neq.cancelled&select=id,created_at&order=created_at.desc,id.desc&limit=1`
    );
    if (!ordersResponse.ok) return [];
    const orders = await ordersResponse.json();
    const orderIds = orders.map(order => order.id);
    if (!orderIds.length) return [];

    const itemsResponse = await supabaseAdminFetch(
      `/rest/v1/order_items?order_id=in.(${encodeURIComponent(orderIds.join(","))})&select=order_id,product_id,product_name,quantity&order=order_id.desc,id.asc`
    );
    if (!itemsResponse.ok) return [];
    const itemsByOrder = new Map(orders.map(order => [String(order.id), []]));
    for (const item of await itemsResponse.json()) {
      itemsByOrder.get(String(item.order_id))?.push(item);
    }
    return orders.map(order => ({ ...order, items: itemsByOrder.get(String(order.id)) }))
      .filter(order => order.items.length);
  } catch (error) {
    console.error("[products] Recent order lookup failed", error);
    return [];
  }
}

export default async function OrderCatalogPage({cartPage=false}){
  const title = cartPage ? "담은 약재" : "약재주문";
  const settingsPromise = getSiteSettings();
  const [s, settings, deliveryContent] = await Promise.all([
    getCurrentSession(), settingsPromise,
    settingsPromise.then(settings => getSiteContent("order_delivery", settings)),
  ]);
  if(!s)redirect(`/login?next=${encodeURIComponent(cartPage ? "/cart" : "/products")}`);
  if(s.profile?.status!=="approved" && s.profile?.role!=="admin")return <main><section className="companyHero"><div className="companyHeroCopy">{settings.company_name_en ? <p>{settings.company_name_en}</p> : null}<h1>{title}</h1><span>HOME &gt; {title}</span></div></section><section className="approvalNotice contentWidth"><h1>거래처 승인 후 이용 가능합니다.</h1><p>관리자 승인 완료 후 약재주문를 이용하실 수 있습니다.</p></section></main>;

  const recentOrdersPromise = cartPage || s.profile?.role === "admin"
    ? Promise.resolve([])
    : loadRecentOrders(s.user.id);
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

  const recentOrders = await recentOrdersPromise;

  return <main><section className="companyHero"><div className="companyHeroCopy">{settings.company_name_en ? <p>{settings.company_name_en}</p> : null}<h1>{title}</h1><span>HOME &gt; {title}</span></div></section>{loadError?<section className="approvalNotice contentWidth"><h1>상품 조회 오류</h1><p>{loadError}</p></section>:<ProductsClient cartPage={cartPage} refundPolicy={<RefundPolicy content={deliveryContent} settings={settings}/>} deliveryDraftOwner={s.user.id} recentOrders={recentOrders} kakaoChannelUrl={settings.kakao_channel_url || ""} parcelShippingNotice={deliveryContent.parcel_shipping_notice||""} products={products} companyName={s.profile?.company_name || ""} adminPricePreview={s.profile?.role==="admin"} adminPrices={adminPrices} />}</main>
}
