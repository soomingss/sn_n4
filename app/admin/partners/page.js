import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth";
import PartnersClient from "./PartnersClient";

export default async function PartnersPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/admin/partners");
  if (session.profile?.role !== "admin") redirect("/");
  return <main><section className="companyHero adminHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>거래처 승인 관리</h1><span>ADMIN &gt; 거래처 승인 관리</span></div></section><PartnersClient /></main>;
}
