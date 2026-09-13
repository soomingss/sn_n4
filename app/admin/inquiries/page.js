import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "../../lib/auth";
export default async function InquiriesAdmin(){const s=await getCurrentSession();if(!s)redirect("/login?next=/admin/inquiries");if(s.profile?.role!=="admin")redirect("/");return <main><section className="companyHero adminHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>문의사항관리</h1><span>ADMIN &gt; 문의사항관리</span></div></section><section className="adminPlaceholder contentWidth"><h1>문의사항관리</h1><p>기존 홈페이지 문의 데이터와 연결해 문의 내용과 처리 상태를 관리할 화면입니다.</p><Link href="/admin">관리자 업무로 돌아가기</Link></section></main>}
