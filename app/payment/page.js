import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession, supabaseAdminFetch } from "../lib/auth";

const money = (v) => `${Number(v || 0).toLocaleString("ko-KR")}원`;

export default async function PaymentPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/payment");
  const res = await supabaseAdminFetch(`/rest/v1/customer_balances?user_id=eq.${encodeURIComponent(session.user.id)}&select=outstanding_balance&limit=1`);
  const rows = res.ok ? await res.json() : [];
  const balance = Number(rows?.[0]?.outstanding_balance || 0);
  return <main>
    <section className="companyHero paymentHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>카드결제</h1><span>MY PAGE &gt; 카드결제</span></div></section>
    <section className="paymentSection contentWidth">
      <div className="paymentCard">
        <span className="paymentEyebrow">CARD PAYMENT</span>
        <div className="paymentTitleRow"><h1>카드결제</h1><Link className="paymentBack" href="/mypage">마이페이지로 돌아가기</Link></div>
        <p className="paymentDesc">거래잔액 중 원하시는 금액을 선택하여 결제할 수 있도록 준비 중입니다.</p>
        <div className="paymentBalance"><span>현재 거래잔액</span><b>{money(balance)}</b></div>
        <div className="paymentQuick"><button disabled>100,000원</button><button disabled>300,000원</button><button disabled>500,000원</button><button disabled>직접 입력</button></div>
        <div className="paymentNotice"><b>카드결제 연동 준비 중</b><p>현재는 결제 화면만 제공됩니다. PG 연동 전에는 실제 카드 승인 및 결제가 진행되지 않습니다.</p></div>
      </div>
    </section>
  </main>;
}
