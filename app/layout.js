import "./globals.css";
import "./v3710.css";
import "./v3711.css";
import "./mobile-batch-20260917.css";
import Header from "./Header";
import { getSiteSettings } from "./lib/site-settings";

export async function generateMetadata() {
  const settings = await getSiteSettings();
  return {
    title: settings.site_title || undefined,
    description: settings.site_description || undefined
  };
}

export default async function RootLayout({ children }) {
  const settings = await getSiteSettings();
  return (
    <html lang="ko">
      <body id="top">
        <Header siteSettings={settings} />
        {children}
        <Footer settings={settings} />
        <a className="mobileScrollTop" href="#top" aria-label="페이지 맨 위로">↑</a>
      </body>
    </html>
  );
}

function Footer({ settings }) {
  const hasBusiness = settings.representative_name || settings.business_number;
  const hasContact = settings.phone || settings.fax || settings.email;

  return (
    <footer>
      {settings.logo_footer_path && <div className="footerBrand"><img src={settings.logo_footer_path} alt="" className="footerLogoImg" /></div>}
      <div className="footerInfo">
        {settings.address && <div className="footerAddress">주소 : {settings.address}</div>}
        {hasBusiness && <div className="footerBusiness">{settings.representative_name && <>대표자명 : {settings.representative_name}</>}{settings.representative_name && settings.business_number && <>　|　</>}{settings.business_number && <>사업자번호 : {settings.business_number}</>}</div>}
        {hasContact && <div className="footerContact"><span className="footerPhoneFax">{settings.phone && <>전화번호 : {settings.phone}</>}{settings.phone && settings.fax && <>　|　</>}{settings.fax && <>팩스번호 : {settings.fax}</>}</span>{(settings.phone || settings.fax) && settings.email && <span className="footerEmailDivider">　|　</span>}{settings.email && <span className="footerEmail">이메일 : {settings.email}</span>}</div>}
      </div>
      <div className="policy">개인정보처리방침　|　이용약관</div>
    </footer>
  );
}
