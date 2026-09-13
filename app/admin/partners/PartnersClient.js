"use client";
import { useEffect, useMemo, useState } from "react";

const labels = { pending: "승인 대기", approved: "승인 완료", rejected: "승인 거절" };
export default function PartnersClient() {
  const [items, setItems] = useState([]); const [tab, setTab] = useState("pending"); const [search, setSearch] = useState(""); const [message, setMessage] = useState("");
  const load = async () => { const r=await fetch("/api/admin/partners",{cache:"no-store"}); const d=await r.json(); if(r.ok)setItems(d.profiles||[]); else setMessage(d.message||"목록을 불러오지 못했습니다."); };
  useEffect(()=>{load();},[]);
  const filtered=useMemo(()=>items.filter(x=>x.status===tab && (!search || `${x.company_name} ${x.username} ${x.contact_name}`.toLowerCase().includes(search.toLowerCase()))),[items,tab,search]);
  const change=async(id,status)=>{ setMessage(""); const r=await fetch("/api/admin/partners",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status})}); const d=await r.json().catch(()=>({})); if(!r.ok){setMessage(d.message||"처리 중 오류가 발생했습니다.");return;} await load(); };
  const count=(s)=>items.filter(x=>x.status===s).length;
  return <section className="adminManage contentWidth">
    <div className="adminManageIntro"><h1>거래처 승인 관리</h1><p>신규 거래처 신청 정보를 확인하고 승인 여부를 관리합니다.</p></div>
    <div className="adminSummary"><div><span>승인 대기</span><b>{count("pending")}</b></div><div><span>승인 완료</span><b>{count("approved")}</b></div><div><span>승인 거절</span><b>{count("rejected")}</b></div></div>
    <div className="adminToolbar"><div className="adminTabs">{["pending","approved","rejected"].map(s=><button key={s} className={tab===s?"active":""} onClick={()=>setTab(s)}>{labels[s]}</button>)}</div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="업체명 또는 아이디 검색" /></div>
    {message && <div className="adminMessage">{message}</div>}
    <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>신청일</th><th>업체명</th><th>담당자</th><th>아이디</th><th>연락처</th><th>이메일</th><th>상태</th><th>관리</th></tr></thead><tbody>{filtered.length?filtered.map(x=><tr key={x.id}><td>{x.created_at?new Date(x.created_at).toLocaleDateString("ko-KR"):"-"}</td><td>{x.company_name}</td><td>{x.contact_name}</td><td>{x.username}</td><td>{x.phone}</td><td>{x.email}</td><td><span className={`statusPill ${x.status}`}>{labels[x.status]||x.status}</span></td><td><div className="adminActions"><button onClick={()=>change(x.id,"approved")}>승인</button><button className="outline" onClick={()=>change(x.id,"rejected")}>거절</button></div></td></tr>):<tr><td colSpan="8" className="emptyRow">해당 거래처가 없습니다.</td></tr>}</tbody></table></div>
    <div className="adminMobileCards">{filtered.length?filtered.map(x=><article key={x.id}><div><b>{x.company_name}</b><span className={`statusPill ${x.status}`}>{labels[x.status]||x.status}</span></div><p>담당자 {x.contact_name}</p><p>아이디 {x.username}</p><p>{x.phone}</p><p>{x.email}</p><div className="adminActions"><button onClick={()=>change(x.id,"approved")}>승인</button><button className="outline" onClick={()=>change(x.id,"rejected")}>거절</button></div></article>):<p className="emptyMobile">해당 거래처가 없습니다.</p>}</div>
  </section>;
}
