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
  const content = await getSiteContent("home", settings);\n  const companyContent = await getSiteContent("company", settings);\n  const coreValues = [\n    {icon:"leaf",title:companyContent.core_value_1_title,description:companyContent.core_value_1_description},\n    {icon:"gap",title:companyContent.core_value_2_title,description:companyContent.core_value_2_description},\n    {icon:"shield",title:companyContent.core_value_3_title,description:companyContent.core_value_3_description},\n    {icon:"truck",title:companyContent.core_value_4_title,description:companyContent.core_value_4_description},\n    {icon:"handshake",title:companyContent.core_value_5_title,description:companyContent.core_value_5_description},\n  ].filter((value)=>value.title && value.description);

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

    <section className="fiveValues" style={{gridTemplateColumns:`repeat(${coreValues.length || 1}, minmax(0, 1fr))`}}>
      {coreValues.map((value)=><ValueCard key={value.icon} icon={value.icon} title={value.title}><Lines value={value.description}/></ValueCard>)}
    </section>

    <section className="mainBottom">
      <div className="leafPhoto"></div>
      <div className="bottomCopy"><Lines value={content.bottom_copy}/><small>{settings.company_name_en}</small></div>
    </section>
  </main>
}
