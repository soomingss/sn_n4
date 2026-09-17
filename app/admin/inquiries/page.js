import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession, supabaseAdminFetch } from "../../lib/auth";
import AdminMobileBack from "../AdminMobileBack";

const statusLabel=(status)=>({new:"문의접수",checking:"확인 중",answered:"답변완료"}[status]||"문의접수");
const formatDate=(value)=>{if(!value)return "-";return new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));};

export default async function InquiriesAdmin(){
  const s=await getCurrentSession();
  if(!s)redirect("/login?next=/admin/inquiries");
  if(s.profile?.role!=="admin")redirect("/");
  const res=await supabaseAdminFetch('/rest/v1/inquiries?select=id,created_at,company_name,contact_name,inquiry_type,status&order=created_at.desc');
  const inquiries=res.ok?await res.json():[];
  return <main>
    <section className="companyHero adminHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>문의사항관리</h1><span>ADMIN &gt; 문의사항관리</span></div></section>
    <AdminMobileBack/>
    <section className="inquiryAdminManage contentWidth">
      <div className="inquiryAdminHead"><div><h1>문의사항관리</h1><p>홈페이지를 통해 접수된 문의사항을 확인합니다.</p></div><Link className="desktopAdminBackLink" href="/admin">관리자 업무로 돌아가기</Link></div>
      <div className="inquiryBoard inquiryBoardDesktop">
        <div className="inquiryBoardRow inquiryBoardHeader"><span>상태</span><span>문의제목</span><span>문의날짜</span><span>업체명</span><span>담당자명</span></div>
        {inquiries.length?inquiries.map(q=><Link className="inquiryBoardRow" href={`/admin/inquiries/${q.id}`} key={q.id}><span><b className={`inquiryStatus inquiryStatus-${q.status||"new"}`}>{statusLabel(q.status)}</b></span><strong>{q.inquiry_type||"기타 문의"}</strong><span>{formatDate(q.created_at)}</span><span>{q.company_name||"-"}</span><span>{q.contact_name||"-"}</span></Link>):<div className="inquiryEmpty">접수된 문의사항이 없습니다.</div>}
      </div>
      <div className="inquiryBoardMobile">
        {inquiries.length?inquiries.map(q=><Link className="inquiryMobileCard" href={`/admin/inquiries/${q.id}`} key={q.id}><div><b className={`inquiryStatus inquiryStatus-${q.status||"new"}`}>{statusLabel(q.status)}</b><span>{formatDate(q.created_at)}</span></div><strong>{q.inquiry_type||"기타 문의"}</strong><p>{q.company_name||"-"} · {q.contact_name||"-"}</p></Link>):<div className="inquiryEmpty">접수된 문의사항이 없습니다.</div>}
      </div>
    </section>
  </main>;
}
