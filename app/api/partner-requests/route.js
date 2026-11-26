import { NextResponse } from "next/server";
import { supabaseAdminFetch } from "../../lib/auth";
import { getApprovedPartner, requestStatuses } from "../../lib/partner-requests";

const limit = 750000;
const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const reasons = { missing: "누락", damaged: "파손", wrong: "다른 상품 도착" };
const clean = (value, max) => typeof value === "string" ? value.trim().slice(0, max) : "";
const reply = (message, status) => NextResponse.json({ message }, { status });

export async function POST(request) {
  const session = await getApprovedPartner();
  if (!session) return reply("승인된 거래처만 이용할 수 있습니다.", 403);
  if (Number(request.headers.get("content-length")) > limit + 65536) return reply("사진은 750KB 이하여야 합니다.", 413);
  const form = await request.formData().catch(() => null);
  const id = form?.get("id");
  if (typeof id !== "string" || !uuid.test(id)) return reply("요청을 다시 제출해 주세요.", 400);
  const kind = form.get("kind");
  const note = clean(form.get("note"), 800);
  const row = { id, user_id: session.user.id, kind };
  if (kind === "sourcing") {
    row.subject = clean(form.get("name"), 100);
    if (!row.subject) return reply("약재명을 입력해 주세요.", 400);
    row.details = [
      `희망 원산지: ${clean(form.get("origin"), 100) || "-"}`,
      `희망 중량: ${clean(form.get("weight"), 100) || "-"}`,
      `희망 수량: ${clean(form.get("quantity"), 100) || "-"}`,
      note
    ].filter(Boolean).join("\n");
  } else if (kind === "receipt") {
    const orderId = clean(form.get("order_id"), 24);
    const itemId = clean(form.get("item_id"), 24);
    const reasonKey = form.get("reason");
    const reason = Object.hasOwn(reasons, reasonKey) ? reasons[reasonKey] : null;
    if (!/^\d+$/.test(orderId) || !/^\d+$/.test(itemId) || !reason) return reply("품목과 접수 사유를 선택해 주세요.", 400);
    const order = await supabaseAdminFetch(
      `/rest/v1/orders?id=eq.${orderId}&user_id=eq.${encodeURIComponent(session.user.id)}&status=in.(shipping,delivered)&select=id&limit=1`
    );
    if (!order.ok || !(await order.json()).length) return reply("접수할 주문을 찾을 수 없습니다.", 404);
    const response = await supabaseAdminFetch(
      `/rest/v1/order_items?id=eq.${itemId}&order_id=eq.${orderId}&select=product_name,origin,weight&limit=1`
    );
    const item = response.ok ? (await response.json())[0] : null;
    if (!item) return reply("주문에 포함된 품목을 선택해 주세요.", 400);
    row.order_id = orderId;
    row.item_id = itemId;
    row.subject = [item.product_name, item.origin, item.weight].filter(Boolean).join(" · ");
    row.details = [reason, note].filter(Boolean).join("\n");

    const photo = form.get("photo");
    if (photo instanceof File && photo.size) {
      if (photo.size > limit) return reply("사진은 750KB 이하여야 합니다.", 413);
      const bytes = Buffer.from(await photo.arrayBuffer());
      const mime = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ? "image/jpeg"
        : bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "image/png"
        : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "image/webp"
        : null;
      if (!mime) return reply("JPEG, PNG, WebP 사진을 선택해 주세요.", 400);
      row.photo_type = mime;
      row.photo_base64 = bytes.toString("base64");
    }
  } else {
    return reply("접수 유형을 확인해 주세요.", 400);
  }

  const saved = await supabaseAdminFetch("/rest/v1/partner_requests", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(row)
  });
  if (saved.status === 409) {
    const previous = await supabaseAdminFetch(
      `/rest/v1/partner_requests?id=eq.${id}&user_id=eq.${encodeURIComponent(session.user.id)}&select=id`
    );
    if (previous.ok && (await previous.json()).length) return NextResponse.json({ ok: true });
  }
  return saved.ok ? NextResponse.json({ ok: true }) : reply("접수하지 못했습니다. 다시 시도해 주세요.", 503);
}

export async function GET(request) {
  const session = await getApprovedPartner();
  if (!session) return reply("접근할 수 없습니다.", 403);
  const id = new URL(request.url).searchParams.get("photo");
  if (!uuid.test(id || "")) return reply("사진을 찾을 수 없습니다.", 404);
  const owner = session.profile.role === "admin" ? "" : `&user_id=eq.${encodeURIComponent(session.user.id)}`;
  const response = await supabaseAdminFetch(
    `/rest/v1/partner_requests?id=eq.${id}${owner}&select=photo_type,photo_base64&limit=1`
  );
  const photo = response.ok ? (await response.json())[0] : null;
  if (!photo?.photo_base64) return reply("사진을 찾을 수 없습니다.", 404);
  return new Response(Buffer.from(photo.photo_base64, "base64"), {
    headers: { "Content-Type": photo.photo_type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" }
  });
}

export async function PATCH(request) {
  const session = await getApprovedPartner();
  if (session?.profile.role !== "admin") return reply("관리자만 처리할 수 있습니다.", 403);
  const body = await request.json().catch(() => null);
  if (!uuid.test(body?.id || "") || !Object.hasOwn(requestStatuses, body?.status)) return reply("처리 상태를 선택해 주세요.", 400);
  const response = await supabaseAdminFetch(`/rest/v1/partner_requests?id=eq.${body.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status: body.status })
  });
  if (!response.ok) return reply("상태를 저장하지 못했습니다.", 503);
  if (!(await response.json()).length) return reply("접수 내역을 찾을 수 없습니다.", 404);
  return NextResponse.json({ ok: true });
}
