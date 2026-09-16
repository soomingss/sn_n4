import Link from "next/link";
import {ValueCard} from "./components";

export default function Home(){
  return <main>
    <section className="mainHero">
      <div className="mainCopy">
        <p className="eyebrow">NATURAL HERITAGE<br/>FOR A HEALTHY TOMORROW</p>
        <h1>좋은 원료가<br/><span className="heroSecondLine">좋은 내일을 만듭니다.</span></h1>
        <p className="desc">신농허브는 자연이 주는 소중한 원료를<br/>정직하게 선별하여, 한의학의 건강한 미래를 함께 만들어갑니다.</p>
        <div className="buttons"><Link className="primary" href="/products">제품 둘러보기 →</Link><a className="heroButton" href="/inquiry">거래 문의하기</a></div>
      </div>
      <div className="mainImage"></div>
    </section>

    <section className="fiveValues">
      <ValueCard icon="leaf" title="엄선된 원료">좋은 산지의 신선한 원료만을 선별합니다.</ValueCard>
      <ValueCard icon="gap" title="GAP 인증">안전하고 신뢰할 수 있는 한약재 유통</ValueCard>
      <ValueCard icon="shield" title="철저한 품질관리">입고부터 출고까지 체계적으로 관리합니다.</ValueCard>
      <ValueCard icon="truck" title="안정적인 공급">한의원과 의료기관을 위한 신뢰할 수 있는 공급 시스템.</ValueCard>
      <ValueCard icon="handshake" title="함께하는 성장">신뢰를 바탕으로 지속 가능한 파트너십.</ValueCard>
    </section>

    <section className="mainBottom">
      <div className="leafPhoto"></div>
      <div className="bottomCopy">자연이 전하는 건강한 가치,<br/>신농허브가 이어갑니다.<small>SHINNONG HERB</small></div>
    </section>
  </main>
}
