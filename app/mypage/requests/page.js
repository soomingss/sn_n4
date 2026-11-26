import Link from "next/link";
import { redirect } from "next/navigation";
import { getApprovedPartner, loadPartnerRequests } from "../../lib/partner-requests";
import RequestForm from "./RequestForm";
import RequestList from "./RequestList";

export default async function RequestsPage({ searchParams }) {
  const session = await getApprovedPartner();
  if (!session) redirect("/mypage");
  const { name } = await searchParams;
  const rows = await loadPartnerRequests(session.user.id);
  return <main className="contentWidth partnerRequestsPage">
    <h1>약재 요청 및 접수 내역</h1>
    <Link href="/mypage">마이페이지로 돌아가기</Link>
    <RequestForm initialName={typeof name === "string" ? name.slice(0, 100) : ""} />
    <RequestList rows={rows} />
  </main>;
}
