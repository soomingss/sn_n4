import Link from "next/link";
import {ValueCard} from "../components";
import {getSiteSettings} from "../lib/site-settings";

export default async function Company(){
  const settings = await getSiteSettings();
  const companyName = settings.company_name;

  return <main>
    <CompanyHero title="회사소개" crumb="회사소개" companyNameEn={settings.company_name_en}/>
    <Subnav active="company"/>

    <section className="intro contentWidth">
      <div className="greenLine"></div>
      <h1>좋은 원료가<br/>좋은 내일을 만듭니다.</h1>
      <p>{companyName}는 자연이 주는 소중한 원료를 정직하게 선별하여, 한의학의 건강한 미래를 함께 만들어가는 한약재 전문유통업체입니다.</p>
      <p>좋은 한약재의 시작은 좋은 원료에서 비롯된다는 원칙을 바탕으로, 원료의 품질과 안전성을 꼼꼼하게 살피고 체계적인 관리 과정을 통해 신뢰할 수 있는 한약재를 공급하고 있습니다.</p>
      <p>오랜 경험과 신뢰를 바탕으로 좋은 품질의 한약재를 안정적으로 공급하여 고객과 사회의 건강에 기여하고, 함께 성장하는 {companyName}가 되겠습니다.</p>
    </section>

    <section className="coreValues">
      <div className="contentWidth">
        <p className="eyebrow">CORE VALUES</p>
        <h2>{companyName}의 핵심가치</h2>
        <div className="coreGrid">
          <ValueCard icon="leaf" title="엄선된 원료">좋은 산지의 신선한 원료만을 선별합니다.</ValueCard>
          <ValueCard icon="gap" title="GAP 인증">안전하고 신뢰할 수 있는<br/>한약재 유통을 지향합니다</ValueCard>
          <ValueCard icon="shield" title="철저한 품질관리">입고부터 출고까지 체계적으로 관리합니다.</ValueCard>
          <ValueCard icon="truck" title="안정적인 공급">한의원과 의료기관을 위한<br/>신뢰할 수 있는 공급 시스템</ValueCard>
          <ValueCard icon="handshake" title="함께하는 성장">신뢰를 바탕으로 지속 가능한 파트너십.</ValueCard>
        </div>
      </div>
    </section>
  </main>
}

export function CompanyHero({title,crumb,companyNameEn=""}){
  return <section className="companyHero">
    <div className="companyHeroCopy">
      {companyNameEn ? <p>{companyNameEn}</p> : null}
      <h1>{title}</h1>
      <span>HOME　›　회사소개{crumb !== "회사소개" ? "　›　" + crumb : ""}</span>
    </div>
  </section>
}

export function Subnav({active}){
  return <nav className="subnav">
    <Link className={active==="company"?"active":""} href="/company">회사소개</Link>
    <Link className={active==="history"?"active":""} href="/company/history">연혁</Link>
    <Link className={active==="location"?"active":""} href="/company/location">오시는 길</Link>
  </nav>
}
