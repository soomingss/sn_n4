import {CompanyHero,Subnav} from "../page";
import {contentLines, getSiteContent, getSiteHistory} from "../../lib/site-content";
import {getSiteSettings} from "../../lib/site-settings";

function Lines({value}){
  const lines = contentLines(value);
  return <>{lines.map((line, index)=><span key={index}>{index > 0 && <br/>}{line}</span>)}</>;
}

export default async function History(){
  const settings = await getSiteSettings();
  const content = await getSiteContent("history", settings);
  const history = await getSiteHistory();

  return <main>
    <CompanyHero title="연혁" crumb="연혁" companyNameEn={settings.company_name_en}/>
    <Subnav active="history"/>
    <section className="historyWrap">
      <div className="historySide">
        <p className="eyebrow">HISTORY</p>
        <h1 data-site-key="title"><Lines value={content.title}/></h1>
        <p data-site-key="description"><Lines value={content.description}/></p>
      </div>
      <div className="timeline">
        {history.map((item)=><H key={item.id} id={item.id} y={item.year}><Lines value={item.content}/></H>)}
      </div>
    </section>
  </main>
}
function H({id,y,children}){return <div className="historyRow" data-site-group={`history_item_${id}`}><b>{y}</b><p>{children}</p></div>}
