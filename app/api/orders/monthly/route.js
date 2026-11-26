import * as XLSX from "xlsx";
import { supabaseAdminFetch } from "../../../lib/auth";
import { getApprovedPartner } from "../../../lib/partner-requests";

const statuses = { new: "주문접수", preparing: "준비중", shipping: "배송중", delivered: "배송완료" };
const date = new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeZone: "Asia/Seoul" });

export async function GET(request) {
  const session = await getApprovedPartner();
  if (!session) return new Response("승인된 거래처만 이용할 수 있습니다.", { status: 403 });
  const month = new URL(request.url).searchParams.get("month") || "";
  if (!/^20\d\d-(0[1-9]|1[0-2])$/.test(month)) return new Response("조회할 월을 선택해 주세요.", { status: 400 });
  const [year, number] = month.split("-").map(Number);
  const from = new Date(Date.UTC(year, number - 1, 1, -9)).toISOString();
  const to = new Date(Date.UTC(year, number, 1, -9)).toISOString();
  const user = encodeURIComponent(session.user.id);
  const rows = [["주문일", "주문번호", "상태", "약재명", "원산지", "중량", "수량", "단가", "금액"]];
  const pageSize = 250;
  for (let offset = 0; ; offset += pageSize) {
    const response = await supabaseAdminFetch(
      `/rest/v1/order_items?select=product_name,origin,weight,quantity,unit_price,subtotal,orders!inner(id,order_number,created_at,status)&orders.user_id=eq.${user}&orders.status=neq.cancelled&orders.created_at=gte.${from}&orders.created_at=lt.${to}&order=id.asc&limit=${pageSize}&offset=${offset}`
    );
    if (!response.ok) return new Response("거래내역을 불러오지 못했습니다.", { status: 503 });
    const items = await response.json();
    for (const item of items) {
      const order = item.orders;
      rows.push([date.format(new Date(order.created_at)), order.order_number || String(order.id), statuses[order.status] || order.status,
        item.product_name, item.origin, item.weight, item.quantity, item.unit_price, item.subtotal]);
    }
    if (items.length < pageSize) break;
  }
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "월별 주문 품목");
  return new Response(XLSX.write(book, { type: "buffer", bookType: "xlsx" }), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="shinnong-orders-${month}.xlsx"`,
      "Cache-Control": "private, no-store"
    }
  });
}
