import {CompanyHero,Subnav} from "../page";
import {Icon} from "../../components";
import {getSiteSettings} from "../../lib/site-settings";
import {contentLines, getSiteContent} from "../../lib/site-content";
import KakaoMap from "./KakaoMap";

function Lines({value}){
  const lines = contentLines(value);
  return <>{lines.map((line, index)=><span key={index}>{index > 0 && <br/>}{line}</span>)}</>;
}

export default async function Location(){
  const settings = await getSiteSettings();
  const content = await getSiteContent("location", settings);

  return <main>
    <CompanyHero title="오시는 길" crumb="오시는 길" companyNameEn={settings.company_name_en}/>
    <Subnav active="location"/>

    <section className="location contentWidth">
      <p className="eyebrow">LOCATION</p>
      <h1 data-site-key="title"><Lines value={content.title}/></h1>
      <p className="locationDesc" data-site-key="description"><Lines value={content.description}/></p>

      <KakaoMap address={settings.map_address} placeName={settings.map_place_name || settings.company_name}/>

      <div className="contactCards">
        <Info icon="pin" title="주소">{settings.address}</Info>
        <Info icon="phone" title="전화번호">{settings.phone}</Info>
        <Info icon="fax" title="팩스번호">{settings.fax}</Info>
      </div>

      {content.parking_title && content.parking_label && content.parking_description ? <>
        <h2 className="transportTitle" data-site-key="parking_title">{content.parking_title}</h2>
        <div className="transportCards parkingCards">
          <div data-site-group="parking"><Info icon="car" title={content.parking_label}><Lines value={content.parking_description}/></Info></div>
        </div>
      </> : null}
    </section>
  </main>
}

function Info({icon,title,children}){
  return <div className="infoCard"><Icon type={icon}/><div><b>{title}</b><span>{children}</span></div></div>
}
