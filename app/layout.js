import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "신농허브 | SHINNONG HERB",
  description: "좋은 원료가 좋은 내일을 만듭니다."
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="header">
      <Link href="/" className="logoWrap" aria-label="신농허브 홈">
        <img src="/logo.jpg" alt="신농허브 SHINNONG HERB" className="logoImg" />
      </Link>

      <nav className="mainNav">
        <Link href="/company">회사소개</Link>
        <span>제품안내</span>
        <span>품질관리</span>
        <span>B2B 납품안내</span>
        <a href="http://pf.kakao.com/_axdbrX" target="_blank" rel="noopener noreferrer">고객센터</a>
      </nav>

      <div className="headerActions">
        <SearchIcon />
        <span>로그인</span>
        <a className="partnerApply" href="http://pf.kakao.com/_axdbrX" target="_blank" rel="noopener noreferrer">거래처 신청</a>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footerBrand">
        <img src="/logo.jpg" alt="" className="footerLogoImg" />
      </div>
      <div className="footerInfo">
        <div>주소 : 인천광역시 부평구 주부토로 193 대동아파트 상가동　|　대표자명 : 정세직　|　사업자번호 : 407-11-96509</div>
        <div>전화번호 : 032 - 501 - 2348　|　팩스번호 : 032 - 525 - 2435　|　이메일 : tpwlrdldi@naver.com</div>
      </div>
      <div className="policy">개인정보처리방침　|　이용약관</div>
    </footer>
  );
}

function SearchIcon() {
  return <svg className="smallIcon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg>;
}
