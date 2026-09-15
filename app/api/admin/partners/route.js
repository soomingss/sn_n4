import { NextResponse } from "next/server";
import { getCurrentSession, supabaseAdminFetch } from "../../../lib/auth";

async function adminOnly() {
  const session = await getCurrentSession();
  return session?.profile?.role === "admin" ? session : null;
}

export async function GET() {
  if (!await adminOnly()) return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  const res = await supabaseAdminFetch("/rest/v1/profiles?role=eq.customer&select=id,created_at,username,company_name,contact_name,phone,email,status,price_grade&order=created_at.desc");
  if (!res.ok) { const detail=await res.text(); return NextResponse.json({ message: `거래처 목록을 불러오지 못했습니다. (${res.status}: ${detail})` }, { status: 500 }); }
  return NextResponse.json({ profiles: await res.json() });
}

export async function PATCH(request) {
  if (!await adminOnly()) return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  const body = await request.json().catch(()=>({}));
  const id = String(body.id || "").trim();
  const status = body.status == null ? "" : String(body.status).trim();
  const grade = body.price_grade == null || body.price_grade === "" ? null : String(body.price_grade).trim();
  if (!id) return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  if (grade !== null && !["1","2","3","4","5"].includes(grade)) return NextResponse.json({ message: "가격등급은 1~5등급 중에서 선택해주세요." }, { status: 400 });
  if (status && !["approved","rejected","pending"].includes(status)) return NextResponse.json({ message: "잘못된 승인 상태입니다." }, { status: 400 });
  if (status === "approved" && !grade) return NextResponse.json({ message: "가격등급을 먼저 선택해주세요." }, { status: 400 });
  if (!status && !grade) return NextResponse.json({ message: "변경할 가격등급을 선택해주세요." }, { status: 400 });
  const payload = {};
  if (status) payload.status = status;
  if (grade) payload.price_grade = grade;
  const res = await supabaseAdminFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&role=eq.customer`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) });
  if (!res.ok) { const detail=await res.text(); return NextResponse.json({ message: `거래처 변경에 실패했습니다. (${res.status}: ${detail})` }, { status: 500 }); }
  return NextResponse.json({ ok: true, profile:(await res.json())?.[0]||null });
}
