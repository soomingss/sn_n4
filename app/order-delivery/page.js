import Link from "next/link";
import {getSiteSettings} from "../lib/site-settings";
import {contentLines, getSiteContent} from "../lib/site-content";

const defaultSteps = [
  { no: "01", title: "주문 접수", desc: "주문 품목과 수량을 확인합니다", icon: "order" },
  { no: "02", title: "재고 확인", desc: "보유 재고와 주문 내용을 꼼꼼하게 확인합니다", icon: "stock" },
  { no: "03", title: "상품 준비·검수", desc: "출고 전 상품 상태를 다시 한 번 확인합니다.", icon: "check" },
  { no: "04", title: "배송", desc: "지역에 따라 직접 배송 또는 택배로 안전하게 발송합니다", icon: "truck" },
];

function Lines({value}){
  const lines = contentLines(value);
  return <>{lines.map((line, index)=><span key={index}>{index > 0 && <br/>}{line}</span>)}</>;
}

export default async function OrderDeliveryPage(){
  const settings = await getSiteSettings();
  const content = await getSiteContent("order_delivery", settings);
  const stepNumbers=[...new Set(Object.keys(content).map((key)=>key.match(/^delivery_step_(\d+)_title$/)?.[1]).filter(Boolean))].sort((a,b)=>Number(a)-Number(b));
  const steps=stepNumbers.length?stepNumbers.map((no,index)=>({no:String(index+1).padStart(2,"0"),title:content[`delivery_step_${no}_title`],desc:content[`delivery_step_${no}_description`],icon:content[`delivery_step_${no}_icon`]||"order"})).filter((step)=>step.title||step.desc):defaultSteps;

  return <>
    <section className="companyHero orderDeliveryHero">
      <div className="companyHeroCopy">
        <p>{settings.company_name_en}</p>
        <h1>주문·배송 안내</h1>
        <span><Link href="/">HOME</Link>　›　주문·배송 안내</span>
      </div>
    </section>

    <main className="orderDelivery contentWidth">
      <section className="orderIntro">
        <div className="greenLine" />
        <h1><Lines value={content.intro_title}/></h1>
        <p><Lines value={content.intro_description}/></p>
      </section>

      <section className="orderSteps">
        {steps.map((step, i)=><div className="orderStep" key={step.no}>
          <div className="stepTop"><b>{step.no}</b><StepIcon type={step.icon}/></div>
          <h2>{step.title}</h2><p>{step.desc}</p>
          {i < steps.length-1 && <span className="stepArrow" aria-hidden="true">→</span>}
        </div>)}
      </section>

      <section className="deliveryInfo">
        <h2>배송 안내</h2>
        <p><Lines value={content.delivery_description}/></p>
        <div className="deliveryGrid">
          <article><h3>직접 배송</h3><b><Lines value={content.direct_delivery_region}/></b><p><Lines value={content.direct_delivery_description}/></p></article>
          <article><h3>택배 배송</h3><b><Lines value={content.parcel_region}/></b><p><Lines value={content.parcel_description}/></p></article>
        </div>
      </section>

      <section className="orderNotice">
        <h2>주문 전 확인해 주세요</h2>
        <p>• <Lines value={content.notice_1}/></p>
        <p>• <Lines value={content.notice_2}/></p>
      </section>
    </main>
  </>;
}
function StepIcon({type}){if(type==="stock")return <StockIcon/>;if(type==="check")return <CheckIcon/>;if(type==="truck")return <TruckIcon/>;return <OrderIcon/>}\nfunction OrderIcon(){return <svg className="orderIcon" viewBox="0 0 48 48"><rect x="13" y="9" width="22" height="30" rx="3"/><path d="M18 18h12M18 24h12M18 30h8"/></svg>}
function StockIcon(){return <svg className="orderIcon" viewBox="0 0 48 48"><path d="M10 17l14-8 14 8v21H10zM10 17l14 8 14-8M24 25v13"/></svg>}
function CheckIcon(){return <svg className="orderIcon" viewBox="0 0 48 48"><circle cx="24" cy="24" r="16"/><path d="M16 24l6 6 11-13"/></svg>}
function TruckIcon(){return <svg className="orderIcon" viewBox="0 0 48 48"><path d="M6 14h24v20H6zM30 21h7l5 7v6H30z"/><circle cx="15" cy="36" r="3"/><circle cx="36" cy="36" r="3"/></svg>}
