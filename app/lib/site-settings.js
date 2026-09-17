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
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[site-settings] Supabase read failed", { status: response.status, detail: detail.slice(0, 500) });
      return defaultSiteSettings;
    }

    const rows = await response.json();
    if (!rows?.[0]) {
      console.error("[site-settings] No settings row found");
      return defaultSiteSettings;
    }

    return { ...defaultSiteSettings, ...rows[0] };
  } catch (error) {
    console.error("[site-settings] Unexpected read error", error instanceof Error ? error.message : error);
    return defaultSiteSettings;
  }
}
