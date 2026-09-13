import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../lib/auth";

export default async function AdminPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/admin");
  if (session.profile?.role !== "admin") redirect("/");

  return <main>
    <section className="companyHero adminHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>관리자 업무</h1><span>ADMIN</span></div></section>
    <section className="adminSection contentWidth">
      <div className="adminIntro"><h1>관리자 업무</h1><p>신농허브 홈페이지의 거래처, 주문, 문의사항을 관리합니다.</p></div>
      <div className="adminCards">
        <AdminCard no="01" title="거래처 승인관리" desc="신규 거래처 신청 정보를 확인하고 승인 또는 거절 처리합니다." href="/admin/partners" />
        <AdminCard no="02" title="주문관리" desc="접수된 주문과 배송 진행 상태를 확인하고 관리합니다." href="/admin/orders" />
        <AdminCard no="03" title="문의사항관리" desc="홈페이지로 접수된 문의 내용을 확인하고 처리 상태를 관리합니다." href="/admin/inquiries" />
      </div>
    </section>
  </main>;
}
function AdminCard({ no, title, desc, href }) { return <Link className="adminCard" href={href}><span>{no}</span><h2>{title}</h2><p>{desc}</p><b>관리하기 →</b></Link> }
