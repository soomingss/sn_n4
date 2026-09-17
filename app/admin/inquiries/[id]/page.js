import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession, supabaseAdminFetch } from "../../../lib/auth";
import AdminMobileBack from "../../AdminMobileBack";

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
    <AdminMobileBack/>
    <section className="inquiryDetailManage contentWidth">
      <div className="inquiryDetailHead"><div><h1>{q.inquiry_type||"기타 문의"}</h1><p>접수된 문의사항의 상세 내용을 확인합니다.</p></div><Link href="/admin/inquiries">목록으로 돌아가기</Link></div>
      <div className="inquiryDetailBox">
        <div className="inquiryDetailMeta"><div><span>처리상태</span><b className={`inquiryStatus inquiryStatus-${q.status||"new"}`}>{statusLabel(q.status)}</b></div><div><span>문의일시</span><strong>{formatDateTime(q.created_at)}</strong></div><div><span>업체명</span><strong>{q.company_name||"-"}</strong></div><div><span>담당자명</span><strong>{q.contact_name||"-"}</strong></div><div><span>연락처</span><strong>{q.phone||"-"}</strong></div><div><span>이메일</span><strong>{q.email||"-"}</strong></div></div>
        <div className="inquiryDetailMessage"><span>문의내용</span><p>{q.message||"-"}</p></div>
      </div>
    </section>
  </main>;
}
