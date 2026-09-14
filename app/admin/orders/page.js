import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession, supabaseAdminFetch } from "../../lib/auth";
import OrdersClient from "./OrdersClient";

export default async function OrdersAdmin(){
  const s=await getCurrentSession();if(!s)redirect("/login?next=/admin/orders");if(s.profile?.role!=="admin")redirect("/");
  const res=await supabaseAdminFetch('/rest/v1/orders?select=id,created_at,user_id,company_name,status,delivery_request,total_amount&order=created_at.desc');
  const orders=res.ok?await res.json():[];
  return <main><section className="companyHero adminHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>주문관리</h1><span>ADMIN &gt; 주문관리</span></div></section><section className="adminManage contentWidth"><div className="adminManageIntro"><h1>주문관리</h1><p>접수된 주문과 배송 진행 상태를 확인하고 관리합니다. 배송완료 처리 시 거래장부에 매출이 반영됩니다.</p></div><div className="adminOrderTop"><span>총 주문</span><b>{orders.length}건</b><Link href="/admin">관리자 업무로 돌아가기</Link></div><OrdersClient initialOrders={orders}/></section></main>
}
