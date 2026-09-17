import { supabaseAdminFetch } from "./auth";

export const defaultSiteSettings = {
  company_name: "신농허브",
  company_name_en: "SHINNONG HERB",
  logo_header_path: "/logo-hq.png",
  logo_footer_path: "/logo.jpg",
  representative_name: "정세직",
  business_number: "407-11-96509",
  address: "인천광역시 부평구 주부토로 193 대동아파트 상가동",
  phone: "032 - 501 - 2348",
  fax: "032 - 525 - 2435",
  email: "shinnong_herb@naver.com",
  kakao_channel_url: "http://pf.kakao.com/_axdbrX",
  map_place_name: "신농허브",
  map_address: "인천광역시 부평구 주부토로 193",
  site_title: "신농허브 | SHINNONG HERB",
  site_description: "좋은 원료가 좋은 내일을 만듭니다."
};

export async function getSiteSettings() {
  try {
    const response = await supabaseAdminFetch("/rest/v1/site_settings?select=*&limit=1");
    if (!response.ok) return defaultSiteSettings;
    const rows = await response.json();
    return { ...defaultSiteSettings, ...(rows?.[0] || {}) };
  } catch {
    return defaultSiteSettings;
  }
}
