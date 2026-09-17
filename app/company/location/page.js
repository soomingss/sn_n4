import {CompanyHero,Subnav} from "../page";
import {Icon} from "../../components";
import {getSiteSettings} from "../../lib/site-settings";
import KakaoMap from "./KakaoMap";

export default async function Location(){
  const settings = await getSiteSettings();
  const addressLines = (settings.address || "").split(" 대동아파트 상가동");

  return <main>
    <CompanyHero title="오시는 길" crumb="오시는 길"/>
    <Subnav active="location"/>

    <section className="location contentWidth">
      <p className="eyebrow">LOCATION</p>
      <h1>{settings.company_name}는<br/>언제든 열려있습니다.</h1>
      <p className="locationDesc">좋은 한약재로 더 건강한 내일을 만드는 {settings.company_name}에 찾아오시는 길을 안내드립니다.</p>

      <KakaoMap address={settings.map_address} placeName={settings.map_place_name || settings.company_name}/>

      <div className="contactCards">
        <Info icon="pin" title="주소">{addressLines[0]}{addressLines[1] !== undefined && <><br/>대동아파트 상가동</>}</Info>
        <Info icon="phone" title="전화번호">{settings.phone}</Info>
        <Info icon="fax" title="팩스번호">{settings.fax}</Info>
      </div>

      <h2 className="transportTitle">주차 안내</h2>
      <div className="transportCards parkingCards">
        <Info icon="car" title="자차 이용 시">대동아파트 상가동 내 주차 공간을 이용하실 수 있습니다.</Info>
      </div>
    </section>
  </main>
}

function Info({icon,title,children}){
  return <div className="infoCard"><Icon type={icon}/><div><b>{title}</b><span>{children}</span></div></div>
}
