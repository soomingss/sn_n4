import Link from "next/link";
import {ValueCard} from "./components";
import {getSiteSettings} from "./lib/site-settings";
import {contentLines, getSiteContent} from "./lib/site-content";

function Lines({value}){
  const lines = contentLines(value);
  return <>{lines.map((line, index)=><span key={index}>{index > 0 && <br/>}{line}</span>)}</>;
}

function HeroTitle({value}){
  const lines = contentLines(value);
  if (lines.length < 2) return <>{value}</>;
  return <>{lines[0]}<br/><span className="heroSecondLine">{lines.slice(1).join(" ")}</span></>;
}

export default async function Home(){
  const settings = await getSiteSettings();
  const content = await getSiteContent("home", settings);

  return <main>
    <section className="mainHero">
      <div className="mainCopy">
        <p className="eyebrow"><Lines value={content.hero_eyebrow}/></p>
        <h1><HeroTitle value={content.hero_title}/></h1>
        <p className="desc"><Lines value={content.hero_description}/></p>
        <div className="buttons"><Link className="primary" href="/products">제품 둘러보기 →</Link><a className="heroButton" href="/inquiry">거래 문의하기</a></div>
      </div>
      <div className="mainImage"></div>
    </section>

    <section className="fiveValues">
      <ValueCard icon="leaf" title="엄선된 원료">좋은 산지의 신선한 원료만을 선별합니다.</ValueCard>
      <ValueCard icon="gap" title="GAP 인증">안전하고 신뢰할 수 있는 한약재 유통</ValueCard>
      <ValueCard icon="shield" title="철저한 품질관리">입고부터 출고까지 체계적으로 관리합니다.</ValueCard>
      <ValueCard icon="truck" title="안정적인 공급">한의원과 의료기관을 위한 신뢰할 수 있는 공급시스템</ValueCard>
      <ValueCard icon="handshake" title="함께하는 성장">신뢰를 바탕으로 지속 가능한 파트너십.</ValueCard>
    </section>

    <section className="mainBottom">
      <div className="leafPhoto"></div>
      <div className="bottomCopy"><Lines value={content.bottom_copy}/><small>{settings.company_name_en}</small></div>
    </section>
  </main>
}
