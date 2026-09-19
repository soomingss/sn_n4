import Link from "next/link";
import {ValueCard} from "../components";
import {getSiteSettings} from "../lib/site-settings";
import {contentLines, getSiteContent} from "../lib/site-content";

function Lines({value}){
  const lines = contentLines(value);
  return <>{lines.map((line, index)=><span key={index}>{index > 0 && <br/>}{line}</span>)}</>;
}

export default async function Company(){
  const settings = await getSiteSettings();
  const content = await getSiteContent("company", settings);
  const companyName = settings.company_name;

  const coreIcons=["leaf","gap","shield","truck","handshake"];
  const coreNumbers=[...new Set(Object.keys(content).map((key)=>key.match(/^core_value_(\d+)_title$/)?.[1]).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
  const values=coreNumbers.map((no,index)=>({id:no,icon:coreIcons[index%coreIcons.length],title:content[`core_value_${no}_title`],description:content[`core_value_${no}_description`]})).filter((value)=>value.title||value.description);
  const introParagraphs=Object.keys(content).map((key)=>({key,match:key.match(/^intro_paragraph_(\d+)$/)})).filter((item)=>item.match).sort((a,b)=>Number(a.match[1])-Number(b.match[1])).map((item)=>content[item.key]).filter(Boolean);

  return <main>
    <CompanyHero title="회사소개" crumb="회사소개" companyNameEn={settings.company_name_en}/>
    <Subnav active="company"/>

    <section className="intro contentWidth">
      <div className="greenLine"></div>
      <h1><Lines value={content.intro_title}/></h1>
      {introParagraphs.map((paragraph,index)=><p key={index}><Lines value={paragraph}/></p>)}
    </section>

    <section className="coreValues">
      <div className="contentWidth">
        <p className="eyebrow">CORE VALUES</p>
        <h2>{companyName}의 핵심가치</h2>
        <div className="coreGrid">
          {values.map((value)=><ValueCard key={value.id} icon={value.icon} title={value.title}><Lines value={value.description}/></ValueCard>)}
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
