import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "../../lib/auth";
export default async function OrdersAdmin(){const s=await getCurrentSession();if(!s)redirect("/login?next=/admin/orders");if(s.profile?.role!=="admin")redirect("/");return <main><section className="companyHero adminHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>주문관리</h1><span>ADMIN &gt; 주문관리</span></div></section><section className="adminPlaceholder contentWidth"><h1>주문관리</h1><p>주문 데이터 구조를 연결한 뒤 이 화면에서 주문 및 배송 상태를 관리할 수 있도록 구성합니다.</p><Link href="/admin">관리자 업무로 돌아가기</Link></section></main>}
