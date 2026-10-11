"use client";
import {useState} from "react";
export default function InquiryAnswer({inquiryId,initialReply="",repliedAt=null}){
 const [reply,setReply]=useState(initialReply),[saved,setSaved]=useState(initialReply),[date,setDate]=useState(repliedAt),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const submit=async()=>{if(!reply.trim()||busy)return;setBusy(true);setError("");try{const r=await fetch("/api/admin/inquiries/reply",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:inquiryId,reply:reply.trim()})});const d=await r.json();if(!r.ok)throw new Error(d.message||"답변 저장 실패");setSaved(d.reply);setReply(d.reply);setDate(d.replied_at)}catch(e){setError(e.message)}finally{setBusy(false)}};
 return <section className="inquiryAnswerSection"><h2>관리자 답변</h2>{saved&&<div className="inquirySavedAnswer"><div><b>답변</b><strong>신농허브</strong>{date&&<span>{new Date(date).toLocaleDateString("ko-KR")}</span>}</div><p>{saved}</p></div>}<label htmlFor="inquiryReply">답변 {saved?"수정":"등록"}</label><textarea id="inquiryReply" value={reply} onChange={e=>setReply(e.target.value)} placeholder="문의에 대한 답변을 입력해 주세요." rows={5}/>{error&&<p role="alert">{error}</p>}<div className="inquiryAnswerActions"><button type="button" onClick={submit} disabled={busy||!reply.trim()}>{busy?"저장 중...":saved?"답변 수정":"답변 등록"}</button></div></section>
}
