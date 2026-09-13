import { NextResponse } from "next/server";

export const runtime = "nodejs";

const clean = (value, max = 3000) => String(value ?? "").trim().slice(0, max);

export async function POST(request) {
  try {
    const body = await request.json();

    // Honeypot: normal users never fill this hidden field.
    if (clean(body.website, 200)) {
      return NextResponse.json({ ok: true });
    }

    const payload = {
      company_name: clean(body.company_name, 100),
      contact_name: clean(body.contact_name, 50),
      phone: clean(body.phone, 30),
      email: clean(body.email, 120) || null,
      inquiry_type: clean(body.inquiry_type, 50),
      message: clean(body.message, 3000),
      status: "new"
    };

    if (!payload.company_name || !payload.contact_name || !payload.phone || !payload.inquiry_type || !payload.message) {
      return NextResponse.json({ message: "필수 항목을 모두 입력해 주세요." }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase server environment variables.");
      return NextResponse.json({ message: "문의 시스템 연결 설정이 완료되지 않았습니다." }, { status: 503 });
    }

    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/inquiries`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Supabase inquiry insert failed:", response.status, detail);
      return NextResponse.json({ message: "문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Inquiry API error:", error);
    return NextResponse.json({ message: "문의 접수 중 오류가 발생했습니다." }, { status: 500 });
  }
}
