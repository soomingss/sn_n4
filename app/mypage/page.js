import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession, supabaseAdminFetch } from "../lib/auth";
import ProfileEdit from "./ProfileEdit";

const statusLabel = { new: "주문접수", preparing: "준비중", shipping: "배송중", delivered: "배송완료", cancelled: "취소" };
const money = (v) => `${Number(v || 0).toLocaleString("ko-KR")}원`;
const date = (v) => v ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(v)) : "-";

async function getRows(path) {
  const res = await supabaseAdminFetch(path);
  return res.ok ? res.json() : [];
}

export default async function MyPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/mypage");
  const uid = encodeURIComponent(session.user.id);
  const [orders, payments, docs] = await Promise.all([
    getRows(`/rest/v1/orders?user_id=eq.${uid}&select=id,created_at,status,delivery_request,total_amount&order=created_at.desc&limit=6`),
    getRows(`/rest/v1/payments?user_id=eq.${uid}&select=id,amount,payment_method,payment_status,paid_at,memo&order=paid_at.desc&limit=5`),
    getRows(`/rest/v1/tax_documents?user_id=eq.${uid}&select=id,document_type,total_amount,issue_status,issued_at,created_at&order=created_at.desc&limit=5`),
  ]);

  return <main>
    <section className="companyHero mypageHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>마이페이지</h1><span>HOME &gt; 마이페이지</span></div></section>
    <section className="mypageSection contentWidth">
      <div className="mypageWelcome">
        <div><span>MY PAGE</span><h1>{session.profile?.company_name || "거래처"}</h1><p>{session.profile?.contact_name || session.profile?.username || "회원"}님, 주문과 거래내역을 확인하실 수 있습니다.</p></div>
        <div><ProfileEdit profile={session.profile}/><Link className="mypagePayButton" href="/payment">카드결제</Link></div>
      </div>

      <div className="mypageGrid">
        <section className="mypagePanel mypageOrders">
          <div className="mypagePanelHead"><div><span>ORDER</span><h2>최근 주문내역</h2></div><Link href="/products">제품 주문하기 →</Link></div>
          {orders.length ? <div className="mypageOrderList">{orders.map(o => <article key={o.id}>
            <div className="mypageOrderMain"><b>주문 #{o.id}</b><span>{date(o.created_at)}</span></div>
            <div className="mypageOrderMeta"><span className={`orderStatus ${o.status}`}>{statusLabel[o.status] || o.status}</span><span>{o.delivery_request || "-"}</span><strong>{money(o.total_amount)}</strong><Link className="reorderButton" href={`/mypage/orders/${o.id}`}>주문상세</Link><Link className="reorderButton" href={`/products?reorder=${o.id}`}>이 주문 다시 담기</Link></div>
          </article>)}</div> : <div className="mypageEmpty">최근 주문내역이 없습니다.</div>}
        </section>

        <section className="mypagePanel">
          <div className="mypagePanelHead"><div><span>PAYMENT</span><h2>최근 결제내역</h2></div><Link href="/payment">카드결제 →</Link></div>
          {payments.length ? <div className="mypageSimpleList">{payments.map(p => <div key={p.id}><span>{date(p.paid_at)}</span><b>{money(p.amount)}</b><em>{p.payment_status === "completed" ? "결제완료" : p.payment_status}</em></div>)}</div> : <div className="mypageEmpty">최근 결제내역이 없습니다.</div>}
        </section>

        <section className="mypagePanel mypageDocs">
          <div className="mypagePanelHead"><div><span>DOCUMENT</span><h2>거래명세 · 세금계산서/계산서</h2></div></div>
          {docs.length ? <div className="mypageSimpleList">{docs.map(d => <div key={d.id}><span>{date(d.issued_at || d.created_at)}</span><b>{d.document_type === "tax_invoice" ? "세금계산서" : "계산서"}</b><em>{d.issue_status === "issued" ? "발행완료" : d.issue_status === "ready" ? "발행대기" : d.issue_status === "cancelled" ? "취소" : "미발행"}</em></div>)}</div> : <div className="mypageEmpty">등록된 증빙자료가 없습니다.</div>}
        </section>
      </div>
      <div className="mypageGuide"><div><b>이용 안내</b><p>배송 및 주문 관련 문의는 고객센터를 이용해주세요.</p></div></div>
    </section>
  </main>;
}
