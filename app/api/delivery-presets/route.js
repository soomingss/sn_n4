import { NextResponse } from "next/server";
import { supabaseAdminFetch } from "../../lib/auth";
import { normalizeDeliveryRequest } from "../../lib/delivery-request";
import { getApprovedPartner } from "../../lib/partner-requests";

const error = (message, status) => NextResponse.json({ message }, { status });
const unauthorized = () => error("승인된 거래처만 이용할 수 있습니다.", 403);
const table = "/rest/v1/delivery_request_presets";
const userFilter = session => `user_id=eq.${encodeURIComponent(session.user.id)}`;
const validName = value => typeof value === "string" && value.trim().length > 0 && value.trim().length <= 60;

export async function GET() {
  const session = await getApprovedPartner();
  if (!session) return unauthorized();
  const response = await supabaseAdminFetch(`${table}?${userFilter(session)}&select=location_name,note&order=location_name.asc`);
  if (!response.ok) return error("저장된 요청을 불러오지 못했습니다.", 503);
  return NextResponse.json(await response.json(), { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(request) {
  const session = await getApprovedPartner();
  if (!session) return unauthorized();
  const data = await request.json().catch(() => null);
  if (!validName(data?.locationName)) return error("배송지 이름을 60자 이내로 입력해 주세요.", 400);
  let note;
  try {
    note = normalizeDeliveryRequest(data.note);
  } catch (exception) {
    return error(exception.message, 400);
  }
  if (!note) return error("저장할 배송 요청을 입력해 주세요.", 400);
  const { id } = session.user;
  const location_name = data.locationName.trim();
  const response = await supabaseAdminFetch(`${table}?on_conflict=user_id,location_name`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: id, location_name, note })
  });
  if (!response.ok) return error("배송 요청을 저장하지 못했습니다.", 503);
  return NextResponse.json({ location_name, note });
}

export async function DELETE(request) {
  const session = await getApprovedPartner();
  if (!session) return unauthorized();
  const name = new URL(request.url).searchParams.get("location");
  if (!validName(name)) return error("삭제할 배송지 이름을 선택해 주세요.", 400);
  const params = new URLSearchParams({ user_id: `eq.${session.user.id}`, location_name: `eq.${name.trim()}` });
  const response = await supabaseAdminFetch(`${table}?${params}`, { method: "DELETE" });
  return response.ok ? NextResponse.json({ ok: true }) : error("저장된 요청을 삭제하지 못했습니다.", 503);
}
