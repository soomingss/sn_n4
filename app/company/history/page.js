import {CompanyHero,Subnav} from "../page";
export default function History(){
  return <main>
    <CompanyHero title="연혁" crumb="연혁"/>
    <Subnav active="history"/>
    <section className="historyWrap">
      <div className="historySide">
        <p className="eyebrow">HISTORY</p>
        <h1>신농허브의 걸어온 길</h1>
        <p>자연과 사람을 생각하는 신농허브의 발자취는 더 건강한 내일을 향한 약속입니다.</p>
      </div>
      <div className="timeline">
        <H y="2008">전국 14개사 공동 네트워크 결성<br/>GAP인증 황기 강원 정선 GAP황기 작목반 계약</H>
        <H y="2009">경북 영주시 약초사랑 작목반과 22종 국산 한약재 계약재배 및 납품 계약<br/>제주 서귀포 잔류농약 안정성 검사 완료 진피 납품 계약 체결<br/>강원도 평창 진부 GAP인증 당귀 계약 체결<br/>충북 제천 우리약초 영농조합 GAP인증 황기 계약 체결<br/>청양 구기자 원예농협 구기자, 맥문동 계약 체결<br/>전남 구례군 산동 농협 산수유 계약 체결<br/>전남 화순군 전남생약 친환경 한약재 계약 체결</H>
        <H y="2011">진안군 BTL 사업단 및 평창군 BTL 사업단과 업무협약 체결</H>
        <H y="2012">신흥제약과 숙지황 및 법제 한약재 공급 협약 체결</H>
        <H y="2013">대한한약협동조합 설립 추진</H>
        <H y="2014">국내 첫 hGMP 제조 한약재 협동조합 인허가완료</H>
        <H y="2015">대한한약협동조합 중소기업청 우수협동조합 50개 기업 선정</H>
        <H y="2019">대한한약협동조합 식품 제조시설 HACCP 인증</H>
      </div>
    </section>
  </main>
}
function H({y,children}){return <div className="historyRow"><b>{y}</b><p>{children}</p></div>}
