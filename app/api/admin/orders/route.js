import { NextResponse } from "next/server";
import { getCurrentSession, supabaseAdminFetch } from "../../../lib/auth";

const ALLOWED = new Set(["new", "preparing", "shipping", "delivered", "cancelled"]);

export async function PATCH(request) {
  const session = await getCurrentSession();
  if (!session || session.profile?.role !== "admin") return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  const status = String(body.status || "");
  if (!Number.isInteger(id) || !ALLOWED.has(status)) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  const res = await supabaseAdminFetch(`/rest/v1/orders?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) return NextResponse.json({ error: "주문 상태를 변경하지 못했습니다." }, { status: 500 });
  return NextResponse.json({ ok: true, order: (await res.json())?.[0] || null });
}
