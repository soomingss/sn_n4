import Link from "next/link";

const steps = [
  { no: "01", title: "주문 접수", desc: <>주문 품목과 수량을<br/>확인합니다.</>, icon: <OrderIcon/> },
  { no: "02", title: "재고 확인", desc: <>보유 재고와 주문 내용을<br/>꼼꼼하게 확인합니다.</>, icon: <StockIcon/> },
  { no: "03", title: "상품 준비·검수", desc: <>출고 전 상품 상태를<br/>다시 한번 확인합니다.</>, icon: <CheckIcon/> },
  { no: "04", title: "배송", desc: <>지역에 따라 직접 배송 또는<br/>택배로 안전하게 발송합니다.</>, icon: <TruckIcon/> },
];

export default function OrderDeliveryPage(){
  return <>
    <section className="companyHero orderDeliveryHero">
      <div className="companyHeroCopy">
        <p>SHINNONG HERB</p>
        <h1>주문·배송 안내</h1>
        <span><Link href="/">HOME</Link>　›　주문·배송 안내</span>
      </div>
    </section>

    <main className="orderDelivery contentWidth">
      <section className="orderIntro">
        <div className="greenLine" />
        <h1>주문부터 배송까지 꼼꼼하게 확인합니다.</h1>
        <p>신농허브는 주문 접수부터 상품 준비와 검수, 배송까지 각 단계를 확인하여 안전하게 전달합니다.</p>
      </section>

      <section className="orderSteps">
        {steps.map((step, i)=><div className="orderStep" key={step.no}>
          <div className="stepTop"><b>{step.no}</b>{step.icon}</div>
          <h2>{step.title}</h2><p>{step.desc}</p>
          {i < steps.length-1 && <span className="stepArrow" aria-hidden="true">→</span>}
        </div>)}
      </section>

      <section className="deliveryInfo">
        <h2>배송 안내</h2>
        <p>지역에 따라 신농허브가 직접 전달하거나 택배를 통해 발송합니다.</p>
        <div className="deliveryGrid">
          <article><h3>직접 배송</h3><b>서울 · 경기 · 인천</b><p>서울, 경기, 인천 지역은 신농허브가 직접 배송합니다.</p></article>
          <article><h3>택배 배송</h3><b>그 외 지역</b><p>직접 배송 지역 외에는 택배를 통해 안전하게 발송합니다.</p></article>
        </div>
      </section>

      <section className="orderNotice">
        <h2>주문 전 확인해 주세요</h2>
        <p>• 당일 오전 11시 이전 주문 완료 건은 당일 배송, 이후 주문 건은 익일 배송을 원칙으로 합니다.</p>
        <p>• 당일 재고가 모두 소진되었거나 보유하지 않은 품목을 주문하신 경우, 별도로 연락드린 후 주문 및 배송 일정을 조정합니다.</p>
      </section>
    </main>
  </>;
}
function OrderIcon(){return <svg className="orderIcon" viewBox="0 0 48 48"><rect x="13" y="9" width="22" height="30" rx="3"/><path d="M18 18h12M18 24h12M18 30h8"/></svg>}
function StockIcon(){return <svg className="orderIcon" viewBox="0 0 48 48"><path d="M10 17l14-8 14 8v21H10zM10 17l14 8 14-8M24 25v13"/></svg>}
function CheckIcon(){return <svg className="orderIcon" viewBox="0 0 48 48"><circle cx="24" cy="24" r="16"/><path d="M16 24l6 6 11-13"/></svg>}
function TruckIcon(){return <svg className="orderIcon" viewBox="0 0 48 48"><path d="M6 14h24v20H6zM30 21h7l5 7v6H30z"/><circle cx="15" cy="36" r="3"/><circle cx="36" cy="36" r="3"/></svg>}
