import Link from "next/link";
import {getSiteSettings} from "../../lib/site-settings";
import {getSiteContent} from "../../lib/site-content";
import DeliverySubnav from "../DeliverySubnav";

import RefundPolicy from "./RefundPolicy";

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
      <RefundPolicy anchor content={content} settings={settings}/>
    </main>
  </>;
}
