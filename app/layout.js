import "./globals.css";
import "./v3710.css";
import "./v3711.css";
import "./mobile-batch-20260917.css";
import Header from "./Header";
import { getSiteSettings } from "./lib/site-settings";

export async function generateMetadata() {
  const settings = await getSiteSettings();
  return {
    title: settings.site_title,
    description: settings.site_description
  };
}

export default async function RootLayout({ children }) {
  const settings = await getSiteSettings();
  return (
    <html lang="ko">
      <body>
        <Header siteSettings={settings} />
        {children}
        <Footer settings={settings} />
      </body>
    </html>
  );
}

function Footer({ settings }) {
  return (
    <footer>
      <div className="footerBrand"><img src={settings.logo_footer_path} alt="" className="footerLogoImg" /></div>
      <div className="footerInfo">
        <div className="footerAddress">주소 : {settings.address}</div>
        <div className="footerBusiness">대표자명 : {settings.representative_name}　|　사업자번호 : {settings.business_number}</div>
        <div className="footerContact"><span className="footerPhoneFax">전화번호 : {settings.phone}　|　팩스번호 : {settings.fax}</span><span className="footerEmailDivider">　|　</span><span className="footerEmail">이메일 : {settings.email}</span></div>
      </div>
      <div className="policy">개인정보처리방침　|　이용약관</div>
    </footer>
  );
}
