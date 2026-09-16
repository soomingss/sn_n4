import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession, supabaseAdminFetch } from "../../lib/auth";
import OrdersClient from "./OrdersClient";
import AdminMobileBack from "../AdminMobileBack";

export default async function OrdersAdmin(){
  const s=await getCurrentSession();if(!s)redirect("/login?next=/admin/orders");if(s.profile?.role!=="admin")redirect("/");
  const res=await supabaseAdminFetch('/rest/v1/orders?select=id,order_number,created_at,user_id,company_name,status,delivery_request,total_amount,order_source&order=created_at.desc');
  const orders=res.ok?await res.json():[];
  let items=[];
  if(orders.length){
    const ids=orders.map(o=>o.id).join(',');
    const itemRes=await supabaseAdminFetch(`/rest/v1/order_items?order_id=in.(${ids})&select=id,order_id,product_id,product_name,origin,weight,unit_price,quantity,subtotal,packed_checked&order=id.asc`);
    if(itemRes.ok) items=await itemRes.json();
  }
  let supplierByProduct={};
  const productIds=[...new Set(items.map(i=>i.product_id).filter(Boolean))];
  if(productIds.length){
    const productRes=await supabaseAdminFetch(`/rest/v1/products?id=in.(${productIds.join(',')})&select=id,supplier`);
    if(productRes.ok){ for(const p of await productRes.json()) supplierByProduct[p.id]=p.supplier||""; }
  }
  const itemsByOrder={}; for(const item of items){(itemsByOrder[item.order_id]??=[]).push({...item,supplier:supplierByProduct[item.product_id]||""})}
  return <main><section className="companyHero adminHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>주문관리</h1><span>ADMIN &gt; 주문관리</span></div></section><AdminMobileBack/><section className="adminManage contentWidth"><div className="adminManageIntro"><div className="mobileOrderAdminTitleRow"><h1>주문관리</h1><Link className="mobileManualOrderButton" href="/admin/orders/manual">+ 수기 주문 등록</Link></div><p>접수된 주문과 배송 진행 상태를 확인하고 관리합니다. 배송완료 처리 시 거래장부에 매출이 반영됩니다.</p></div><div className="adminOrderTop"><span>주문관리</span><b>일·상태별 조회</b><div className="adminOrderTopLinks"><Link className="manualOrderButton" href="/admin/orders/manual">+ 수기 주문 등록</Link><Link className="adminBackLink" href="/admin">관리자 업무로 돌아가기</Link></div></div><OrdersClient initialOrders={orders} itemsByOrder={itemsByOrder}/></section></main>
}
