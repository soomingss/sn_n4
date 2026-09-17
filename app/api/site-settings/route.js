import { NextResponse } from "next/server";
import { supabaseAdminFetch } from "../../lib/auth";

export async function GET() {
  try {
    const response = await supabaseAdminFetch("/rest/v1/site_settings?select=id,company_name,company_name_en,site_title&limit=1");
    const body = await response.text();

    if (!response.ok) {
      console.error("[site-settings] Supabase read failed", {
        status: response.status,
        body: body.slice(0, 500)
      });
      return NextResponse.json({ ok: false, source: "supabase", status: response.status }, { status: 503 });
    }

    let rows = [];
    try { rows = JSON.parse(body || "[]"); } catch {}
    const row = rows?.[0] || null;

    return NextResponse.json({
      ok: Boolean(row),
      rowFound: Boolean(row),
      id: row?.id ?? null,
      companyName: row?.company_name ?? null,
      companyNameEn: row?.company_name_en ?? null,
      siteTitle: row?.site_title ?? null
    }, { status: row ? 200 : 503 });
  } catch (error) {
    console.error("[site-settings] health check error", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, source: "server", reason: "site_settings_unavailable" }, { status: 503 });
  }
}
