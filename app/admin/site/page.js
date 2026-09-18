import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth";
import { getSiteSettings } from "../../lib/site-settings";
import { getAdminSiteContent, getAdminSiteHistory } from "../../lib/site-content";
import SiteEditor from "./SiteEditor";

const pages = [
  ["home", "메인"],
  ["company", "회사소개"],
  ["history", "연혁 소개"],
  ["location", "오시는 길"],
  ["order_delivery", "주문·배송 안내"],
];

export default async function AdminSitePage(){
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/admin/site");
  if (session.profile?.role !== "admin") redirect("/");

  const settings = await getSiteSettings();
  const contentEntries = await Promise.all(
    pages.map(async ([key, label]) => ({key, label, rows:await getAdminSiteContent(key)}))
  );
  const history = await getAdminSiteHistory();

  return <main>
    <section className="companyHero adminHero">
      <div className="companyHeroCopy">
        {settings.company_name_en ? <p>{settings.company_name_en}</p> : null}
        <h1>홈페이지 관리</h1>
        <span>ADMIN　›　홈페이지 관리</span>
      </div>
    </section>
    <section className="adminSection contentWidth">
      <div className="adminIntro">
        <h1>홈페이지 관리</h1>
        <p>회사 기본정보, 페이지 문구, 연혁을 수정하고 저장할 수 있습니다.</p>
      </div>
      <SiteEditor settings={settings} pages={contentEntries} history={history}/>
    </section>
  </main>;
}
