import { supabaseAdminFetch } from "./auth";

function replacePlaceholders(value, settings = {}) {
  if (typeof value !== "string") return "";
  return value.replaceAll("{company_name}", settings.company_name || "");
}

export async function getSiteContent(pageKey, settings = {}) {
  if (!pageKey) return {};

  try {
    const query = `/rest/v1/site_content?select=content_key,content_value,sort_order&page_key=eq.${encodeURIComponent(pageKey)}&is_active=eq.true&order=sort_order.asc`;
    const response = await supabaseAdminFetch(query);

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[site-content] Supabase read failed", {
        pageKey,
        status: response.status,
        detail: detail.slice(0, 500),
      });
      return {};
    }

    const rows = await response.json();
    return (rows || []).reduce((content, row) => {
      content[row.content_key] = replacePlaceholders(row.content_value, settings);
      return content;
    }, {});
  } catch (error) {
    console.error(
      "[site-content] Unexpected read error",
      error instanceof Error ? error.message : error
    );
    return {};
  }
}

export async function getAdminSiteContent(pageKey) {
  if (!pageKey) return [];
  try {
    const response = await supabaseAdminFetch(
      `/rest/v1/site_content?select=content_key,content_value,sort_order,is_active&page_key=eq.${encodeURIComponent(pageKey)}&order=sort_order.asc`
    );
    if (!response.ok) return [];
    return (await response.json()) || [];
  } catch (error) {
    console.error("[site-content] Admin read error", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function getSiteHistory() {
  try {
    const response = await supabaseAdminFetch(
      "/rest/v1/site_history?select=id,year,content,sort_order&is_active=eq.true&order=sort_order.asc"
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[site-history] Supabase read failed", {
        status: response.status,
        detail: detail.slice(0, 500),
      });
      return [];
    }

    return (await response.json()) || [];
  } catch (error) {
    console.error(
      "[site-history] Unexpected read error",
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

// Intentional line breaks entered by an administrator are preserved.
// Without an entered newline, the browser remains free to wrap naturally.
export function contentLines(value = "") {
  return String(value).split("\n");
}
