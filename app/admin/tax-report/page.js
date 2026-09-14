import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth";
import TaxReportClient from "./TaxReportClient";

export default async function TaxReportPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/admin/tax-report");
  if (session.profile?.role !== "admin") redirect("/");
  return <main>
    <section className="companyHero adminHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>세금계산서용</h1><span>ADMIN &gt; 세금계산서용</span></div></section>
    <section className="adminManage contentWidth">
      <div className="adminManageIntro"><h1>월별 세금자료</h1><p>배송완료된 주문을 기준으로 거래처별 면세·과세 금액을 확인하고 세금계산서용 엑셀 자료를 다운로드합니다.</p></div>
      <TaxReportClient />
    </section>
  </main>;
}
