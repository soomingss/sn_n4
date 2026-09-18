import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "../../lib/auth";
import { getSiteSettings } from "../../lib/site-settings";
import { getSiteContent, getSiteHistory } from "../../lib/site-content";

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
    pages.map(async ([key, label]) => [key, label, await getSiteContent(key, settings)])
  );
  const history = await getSiteHistory();

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
        <p>현재 홈페이지에 연결된 회사 기본정보, 페이지 문구, 연혁을 확인합니다.</p>
      </div>

      <section className="adminSiteBlock">
        <h2>회사 기본정보</h2>
        <div className="adminSiteRows">
          <Row label="회사명" value={settings.company_name}/>
          <Row label="영문 회사명" value={settings.company_name_en}/>
          <Row label="대표자" value={settings.representative_name}/>
          <Row label="사업자등록번호" value={settings.business_number}/>
          <Row label="주소" value={settings.address}/>
          <Row label="전화" value={settings.phone}/>
          <Row label="팩스" value={settings.fax}/>
          <Row label="이메일" value={settings.email}/>
          <Row label="카카오톡 채널" value={settings.kakao_channel_url}/>
          <Row label="지도 장소명" value={settings.map_place_name}/>
          <Row label="지도 주소" value={settings.map_address}/>
        </div>
      </section>

      {contentEntries.map(([key, label, values])=>
        <section className="adminSiteBlock" key={key}>
          <h2>{label}</h2>
          <div className="adminSiteRows">
            {Object.entries(values).map(([contentKey, value])=>
              <Row key={contentKey} label={contentKey} value={value}/>
            )}
          </div>
        </section>
      )}

      <section className="adminSiteBlock">
        <h2>연혁</h2>
        <div className="adminSiteRows">
          {history.map((item)=><Row key={item.id} label={item.year} value={item.content}/>)}
        </div>
      </section>

      <div style={{marginTop:"28px"}}>
        <Link href="/admin">← 관리자 업무로 돌아가기</Link>
      </div>
    </section>
  </main>;
}

function Row({label,value}){
  return <div style={{display:"grid",gridTemplateColumns:"minmax(140px, 220px) 1fr",gap:"20px",padding:"14px 0",borderBottom:"1px solid #e7e7e7"}}>
    <b>{label}</b>
    <span style={{whiteSpace:"pre-line",overflowWrap:"anywhere"}}>{value || "—"}</span>
  </div>;
}
