import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth";
import { loadPartnerRequests } from "../../lib/partner-requests";
import RequestList from "../../mypage/requests/RequestList";

export default async function PartnerRequestsPage() {
  const session = await getCurrentSession();
  if (session?.profile.role !== "admin") redirect("/");
  const rows = await loadPartnerRequests();
  return <main className="contentWidth partnerRequestsPage">
    <h1>거래처 요청 관리</h1>
    <Link href="/admin/inquiries">문의사항관리로 돌아가기</Link>
    <RequestList rows={rows} admin />
  </main>;
}
