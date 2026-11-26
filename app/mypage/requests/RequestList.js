import RequestStatus from "../../admin/partner-requests/RequestStatus";
import { requestStatuses } from "../../lib/partner-requests";

const date = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" });

export default function RequestList({ rows, admin = false }) {
  return <section className="partnerRequestList">
    <h2>접수 내역</h2>
    {rows === null ? <p>접수 내역을 불러오지 못했습니다.</p> : !rows.length ? <p>접수된 내역이 없습니다.</p> : rows.map(row => (
      <article key={row.id}>
        <strong>{row.subject}</strong>
        <p>{row.kind === "receipt" ? "수령 문제" : "취급 약재 요청"} · {date.format(new Date(row.created_at))} · {requestStatuses[row.status]}</p>
        {admin && <p>{row.profiles?.company_name || "거래처"}{row.order_id ? ` · 주문 #${row.order_id} · 품목 #${row.item_id}` : ""}</p>}
        <p className="partnerRequestDetails">{row.details}</p>
        {row.photo_type && <a href={`/api/partner-requests?photo=${row.id}`} target="_blank" rel="noopener noreferrer">첨부 사진 보기 ↗</a>}
        {admin && <RequestStatus id={row.id} status={row.status} />}
      </article>
    ))}
  </section>;
}
