import { NextResponse } from "next/server";
import { FOOD_QUOTE_FIELDS, FOOD_QUOTE_LIMIT, FOOD_QUOTE_NOTE_LIMIT, FOOD_QUOTE_TYPE } from "../../lib/food-quote";

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

    if (payload.inquiry_type === FOOD_QUOTE_TYPE) {
      if (!Array.isArray(body.ingredients) || !body.ingredients.length || body.ingredients.length > FOOD_QUOTE_LIMIT) {
        return NextResponse.json({ message: "견적 원료는 1개 이상 20개 이하로 입력해 주세요." }, { status: 400 });
      }
      const rows = [];
      for (const ingredient of body.ingredients) {
        const fields = FOOD_QUOTE_FIELDS.map(({ key, max }) => typeof ingredient?.[key] === "string" ? ingredient[key].trim() : "");
        if (fields.some((field, index) => !field || field.length > FOOD_QUOTE_FIELDS[index].max || /[\r\n]/.test(field))) {
          return NextResponse.json({ message: "각 원료의 원료명, 원산지, 물량을 입력해 주세요." }, { status: 400 });
        }
        rows.push(`${rows.length + 1}. ${fields.map((value, index) => `${FOOD_QUOTE_FIELDS[index].label} ${value}`).join(" · ")}`);
      }
      const note = clean(body.message, FOOD_QUOTE_NOTE_LIMIT);
      payload.message = [...rows, note && `추가 요청사항: ${note}`].filter(Boolean).join("\n");
    }

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
