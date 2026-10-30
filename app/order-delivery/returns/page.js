import Link from "next/link";
import {getSiteSettings} from "../../lib/site-settings";
import {contentLines, getSiteContent} from "../../lib/site-content";
import DeliverySubnav from "../DeliverySubnav";

function Lines({value}){
  return <>{contentLines(value).map((line,index)=><span key={index}>{index>0&&<br/>}{line}</span>)}</>;
}

export default async function ReturnsPage(){
  const settings=await getSiteSettings();
  const content=await getSiteContent("order_delivery",settings);
  return <>
    <section className="companyHero orderDeliveryHero"><div className="companyHeroCopy">
      <p>{settings.company_name_en}</p><h1>주문·배송 안내</h1>
      <span><Link href="/">HOME</Link>　›　<Link href="/order-delivery">주문·배송 안내</Link>　›　교환·반품 및 환불 안내</span>
    </div></section>
    <DeliverySubnav active="returns"/>
    <main className="orderDelivery refundPage contentWidth">
      {content.refund_title&&<section id="refund-policy" className="refundPolicy" tabIndex={-1} aria-labelledby="refund-policy-title">
        <h2 id="refund-policy-title" data-site-key="refund_title"><Lines value={content.refund_title}/></h2>
        <dl className="refundPolicyDetails">
          {[["접수 기한","refund_period"],["교환·반품 대상","refund_eligible"],["단순 변심","refund_change_mind"],["배송비 부담","refund_shipping"],["환불 절차","refund_process"]].map(([label,key])=>content[key]&&<div key={key}><dt>{label}</dt><dd data-site-key={key}><Lines value={content[key]}/></dd></div>)}
        </dl>
        <div className="refundPolicyContact">
          <h3>교환·반품 접수</h3>
          <p data-site-key="refund_contact"><Lines value={content.refund_contact}/></p>
          <div className="refundPolicyLinks">
            {settings.phone&&<a href={`tel:${settings.phone.replace(/[^\d+]/g,"")}`}>전화 문의 {settings.phone}</a>}
            {settings.kakao_channel_url&&<a href={settings.kakao_channel_url} target="_blank" rel="noopener noreferrer">카카오톡 문의 ↗</a>}
          </div>
        </div>
      </section>}
    </main>
  </>;
}
