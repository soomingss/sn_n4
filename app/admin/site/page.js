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
    pages.map(async ([key, label]) => {
      const rows=(await getAdminSiteContent(key)).map((row)=>({...row,content_value:typeof row.content_value==="string"?row.content_value.replaceAll("{company_name}",settings.company_name||"신농허브"):row.content_value}));
      if(key==="order_delivery"){
        if(!rows.some((row)=>row.content_key==="direct_delivery_title")) rows.push({content_key:"direct_delivery_title",content_value:"직접 배송",is_active:true});
        if(!rows.some((row)=>row.content_key==="parcel_title")) rows.push({content_key:"parcel_title",content_value:"택배 배송",is_active:true});
      }
      if(key==="order_delivery"&&!rows.some((row)=>/^delivery_step_\d+_title$/.test(row.content_key))){
        rows.push(
          {content_key:"delivery_step_1_title",content_value:"주문 접수",is_active:true},
          {content_key:"delivery_step_1_description",content_value:"주문 품목과 수량을 확인합니다",is_active:true},
          {content_key:"delivery_step_1_icon",content_value:"order",is_active:true},
          {content_key:"delivery_step_2_title",content_value:"재고 확인",is_active:true},
          {content_key:"delivery_step_2_description",content_value:"보유 재고와 주문 내용을 꼼꼼하게 확인합니다",is_active:true},
          {content_key:"delivery_step_2_icon",content_value:"stock",is_active:true},
          {content_key:"delivery_step_3_title",content_value:"상품 준비·검수",is_active:true},
          {content_key:"delivery_step_3_description",content_value:"출고 전 상품 상태를 다시 한 번 확인합니다.",is_active:true},
          {content_key:"delivery_step_3_icon",content_value:"check",is_active:true},
          {content_key:"delivery_step_4_title",content_value:"배송",is_active:true},
          {content_key:"delivery_step_4_description",content_value:"지역에 따라 직접 배송 또는 택배로 안전하게 발송합니다",is_active:true},
          {content_key:"delivery_step_4_icon",content_value:"truck",is_active:true}
        );
      }
      return {key,label,rows};
    })
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
