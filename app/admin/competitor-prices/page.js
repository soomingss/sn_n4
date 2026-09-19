import {redirect} from "next/navigation";
import {getCurrentSession} from "../../lib/auth";
import CompetitorPriceDashboard from "./CompetitorPriceDashboard";
import AdminMobileBack from "../AdminMobileBack";

export default async function Page(){
  const s=await getCurrentSession();
  if(!s)redirect("/login?next=/admin/competitor-prices");
  if(s.profile?.role!=="admin")redirect("/");
  return <main>
    <section className="companyHero adminHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>경쟁업체 가격 대시보드</h1><span>ADMIN &gt; 경쟁업체 가격 대시보드</span></div></section>
    <AdminMobileBack/>
    <CompetitorPriceDashboard/>
  </main>;
}