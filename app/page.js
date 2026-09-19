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
  const companyContent = await getSiteContent("company", settings);
  const coreIcons=["leaf","gap","shield","truck","handshake"];
  const coreNumbers=[...new Set(Object.keys(companyContent).map((key)=>key.match(/^core_value_(\d+)_title$/)?.[1]).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
  const coreValues=coreNumbers.map((no,index)=>({icon:coreIcons[index%coreIcons.length],title:companyContent[`core_value_${no}_title`],description:companyContent[`core_value_${no}_description`]})).filter((value)=>value.title&&value.description);

  return <main>
    <section className="mainHero">
      <div className="mainCopy">
        <p className="eyebrow" data-site-key="hero_eyebrow"><Lines value={content.hero_eyebrow}/></p>
        <h1 data-site-key="hero_title"><HeroTitle value={content.hero_title}/></h1>
        <p className="desc" data-site-key="hero_description"><Lines value={content.hero_description}/></p>
        <div className="buttons"><Link className="primary" href="/products">제품 둘러보기 →</Link><a className="heroButton" href="/inquiry">거래 문의하기</a></div>
      </div>
      <div className="mainImage"></div>
    </section>

    <section className="fiveValues" style={{gridTemplateColumns:`repeat(${coreValues.length || 1}, minmax(0, 1fr))`}}>
      {coreValues.map((value)=><ValueCard key={value.icon} icon={value.icon} title={value.title}><Lines value={value.description}/></ValueCard>)}
    </section>

    <section className="mainBottom">
      <div className="leafPhoto"></div>
      <div className="bottomCopy" data-site-key="bottom_copy"><Lines value={content.bottom_copy}/><small>{settings.company_name_en}</small></div>
    </section>
  </main>
}
