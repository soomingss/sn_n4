import "./globals.css";
import "./v3710.css";
import Header from "./Header";

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

function Footer() {
  return (
    <footer>
      <div className="footerBrand"><img src="/logo.jpg" alt="" className="footerLogoImg" /></div>
      <div className="footerInfo">
        <div>주소 : 인천광역시 부평구 주부토로 193 대동아파트 상가동　|　대표자명 : 정세직　|　사업자번호 : 407-11-96509</div>
        <div>전화번호 : 032 - 501 - 2348　|　팩스번호 : 032 - 525 - 2435　|　이메일 : tpwlrdldi@naver.com</div>
      </div>
      <div className="policy">개인정보처리방침　|　이용약관</div>
    </footer>
  );
}
