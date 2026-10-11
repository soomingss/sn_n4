import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession, supabaseAdminFetch } from "../../../lib/auth";

const statusLabel=(status)=>({new:"문의접수",checking:"확인 중",answered:"답변완료"}[status]||"문의접수");
const formatDateTime=(value)=>{if(!value)return "-";return new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(value));};

export default async function InquiryDetail({params}){
  const s=await getCurrentSession();
  if(!s)redirect("/login?next=/admin/inquiries");
  if(s.profile?.role!=="admin")redirect("/");
  const {id}=await params;
  const res=await supabaseAdminFetch(`/rest/v1/inquiries?id=eq.${encodeURIComponent(id)}&select=id,created_at,company_name,contact_name,phone,email,inquiry_type,message,status&limit=1`);
  const rows=res.ok?await res.json():[];
  const q=rows?.[0];
  if(!q)notFound();
  return <main>
    <section className="companyHero adminHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>문의사항관리</h1><span>ADMIN &gt; 문의사항관리</span></div></section>
    <div className="adminMobileBackRow contentWidth inquiryDetailMobileBack"><Link href="/admin/inquiries">문의목록으로 돌아가기 →</Link></div>
    <section className="inquiryDetailManage contentWidth">
      <article className="inquiryPostDetail">
        <header className="inquiryPostHeader">
          <h1>{q.inquiry_type||"기타 문의"}</h1>
          <div className="inquiryPostByline"><span>작성자: {q.contact_name||"-"}</span><span>업체명: {q.company_name||"-"}</span><span>작성일: {formatDateTime(q.created_at)}</span><b className={`inquiryStatus inquiryStatus-${q.status||"new"}`}>{statusLabel(q.status)}</b></div>
        </header>
        <div className="inquiryPostContent">{q.message||"-"}</div>
        <div className="inquiryPostContact"><span>연락처: {q.phone||"-"}</span><span>이메일: {q.email||"-"}</span></div>
        <footer className="inquiryPostFooter"><Link href="/admin/inquiries">← 목록</Link></footer>
      </article>
    </section>
  </main>;
}
