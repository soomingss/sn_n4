"use client";
import { useState } from "react";

const labels = { new:"주문접수", preparing:"준비중", shipping:"배송중", delivered:"배송완료", cancelled:"취소" };
const money = (v) => `${Number(v || 0).toLocaleString("ko-KR")}원`;
const date = (v) => v ? new Date(v).toLocaleString("ko-KR", { timeZone:"Asia/Seoul" }) : "-";

export default function OrdersClient({ initialOrders }) {
  const [orders,setOrders]=useState(initialOrders||[]); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(null);
  const updateStatus=async(id,status)=>{setBusy(id);setMessage("");try{const r=await fetch("/api/admin/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})});const d=await r.json();if(!r.ok)throw new Error(d.error||"상태 변경 실패");setOrders(list=>list.map(o=>o.id===id?{...o,status}:o));setMessage(`주문 #${id} 상태를 ${labels[status]}로 변경했습니다.`)}catch(e){setMessage(e.message)}finally{setBusy(null)}};
  return <>
    {message&&<div className="adminOrderMessage">{message}</div>}
    <div className="adminTableWrap"><table className="adminTable adminOrdersTable"><thead><tr><th>주문번호</th><th>주문일시</th><th>거래처</th><th>배송요청</th><th>금액</th><th>상태</th></tr></thead><tbody>{orders.length?orders.map(o=><tr key={o.id}><td>#{o.id}</td><td>{date(o.created_at)}</td><td>{o.company_name}</td><td>{o.delivery_request||"-"}</td><td>{money(o.total_amount)}</td><td><select value={o.status} disabled={busy===o.id} onChange={e=>updateStatus(o.id,e.target.value)}><option value="new">주문접수</option><option value="preparing">준비중</option><option value="shipping">배송중</option><option value="delivered">배송완료</option><option value="cancelled">취소</option></select></td></tr>):<tr><td colSpan="6" className="emptyRow">접수된 주문이 없습니다.</td></tr>}</tbody></table></div>
    <div className="adminMobileCards">{orders.length?orders.map(o=><article key={o.id}><div><b>주문 #{o.id}</b><span className={`statusPill ${o.status}`}>{labels[o.status]||o.status}</span></div><p>{o.company_name} · {date(o.created_at)}</p><p>{o.delivery_request||"-"} · {money(o.total_amount)}</p><select value={o.status} disabled={busy===o.id} onChange={e=>updateStatus(o.id,e.target.value)}><option value="new">주문접수</option><option value="preparing">준비중</option><option value="shipping">배송중</option><option value="delivered">배송완료</option><option value="cancelled">취소</option></select></article>):<div className="emptyMobile">접수된 주문이 없습니다.</div>}</div>
  </>;
}
