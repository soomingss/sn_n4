import { NextResponse } from "next/server";
import { getCurrentSession, supabaseAdminFetch } from "../../../lib/auth";

async function adminOnly() {
  const session = await getCurrentSession();
  return session?.profile?.role === "admin" ? session : null;
}

export async function GET() {
  if (!await adminOnly()) return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  const res = await supabaseAdminFetch("/rest/v1/profiles?role=eq.customer&select=id,created_at,username,company_name,contact_name,phone,email,status&order=created_at.desc");
  if (!res.ok) return NextResponse.json({ message: "거래처 목록을 불러오지 못했습니다." }, { status: 500 });
  return NextResponse.json({ profiles: await res.json() });
}

export async function PATCH(request) {
  if (!await adminOnly()) return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  const body = await request.json();
  const id = String(body.id || "").trim();
  const status = String(body.status || "").trim();
  if (!id || !["approved", "rejected"].includes(status)) return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  const res = await supabaseAdminFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&role=eq.customer`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ status }) });
  if (!res.ok) return NextResponse.json({ message: "상태 변경에 실패했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
