import { supabaseAdminFetch } from "./auth";

export const defaultSiteSettings = {
  company_name: "",
  company_name_en: "",
  logo_header_path: "",
  logo_footer_path: "",
  representative_name: "",
  business_number: "",
  address: "",
  phone: "",
  fax: "",
  email: "",
  kakao_channel_url: "",
  map_place_name: "",
  map_address: "",
  site_title: "",
  site_description: ""
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
