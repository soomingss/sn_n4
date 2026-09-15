import { NextResponse } from "next/server";
import { getCurrentSession, supabaseAdminFetch } from "../../../lib/auth";

export const runtime = "nodejs";

function monthRange(month) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(month || ""));
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]);
  if (monthIndex < 1 || monthIndex > 12) return null;
  const start = `${year}-${String(monthIndex).padStart(2, "0")}-01T00:00:00+09:00`;
  const nextYear = monthIndex === 12 ? year + 1 : year;
  const nextMonth = monthIndex === 12 ? 1 : monthIndex + 1;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+09:00`;
  return { start, end };
}

function esc(value) {
  return String(value ?? "").replace(/[&<>\"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function excelXml(month, summary, details, includeProducts = false) {
  const cell = (v, type = "String", style = "") => `<Cell${style ? ` ss:StyleID="${style}"` : ""}><Data ss:Type="${type}">${esc(v)}</Data></Cell>`;
  const row = (cells) => `<Row>${cells.join("")}</Row>`;
  const summaryRows = summary.map((r) => row([
    cell(r.company_name), cell(r.exempt_amount, "Number"), cell(r.taxable_supply, "Number"), cell(r.vat_amount, "Number"), cell(r.taxable_total, "Number"), cell(r.grand_total, "Number")
  ])).join("");
  const detailRows = details.map((r) => row([
    cell(r.date), cell(r.order_id, "Number"), cell(r.company_name), cell(r.product_name), cell(r.origin), cell(r.tax_type === "exempt" ? "면세" : "과세"), cell(r.quantity, "Number"), cell(r.unit_price, "Number"), cell(r.supply_amount, "Number"), cell(r.vat_amount, "Number"), cell(r.subtotal, "Number")
  ])).join("");
  const summarySheet = `<Worksheet ss:Name="월별 요약"><Table>${row([cell("거래처","String","Header"),cell("면세금액","String","Header"),cell("과세 공급가액","String","Header"),cell("부가세","String","Header"),cell("과세 포함금액","String","Header"),cell("총 거래금액","String","Header")])}${summaryRows}</Table></Worksheet>`;
  const detailSheet = includeProducts ? `<Worksheet ss:Name="상세내역"><Table>${row([cell("거래일","String","Header"),cell("주문번호","String","Header"),cell("거래처명","String","Header"),cell("상품명","String","Header"),cell("원산지","String","Header"),cell("과세구분","String","Header"),cell("수량","String","Header"),cell("단가(VAT포함)","String","Header"),cell("공급가액","String","Header"),cell("부가세","String","Header"),cell("합계","String","Header")])}${detailRows}</Table></Worksheet>` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#EEF4EF" ss:Pattern="Solid"/></Style></Styles>${summarySheet}${detailSheet}</Workbook>`;
}

async function fetchJson(path) {
  const res = await supabaseAdminFetch(path);
  if (!res.ok) return { ok: false, status: res.status, text: await res.text(), data: [] };
  return { ok: true, data: await res.json() };
}

export async function GET(request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (session.profile?.role !== "admin") return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });

  const url = new URL(request.url);
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const defaultMonth = `${nowKst.getUTCFullYear()}-${String(nowKst.getUTCMonth() + 1).padStart(2, "0")}`;
  const month = url.searchParams.get("month") || defaultMonth;
  const userId = url.searchParams.get("user_id") || "";
  const format = url.searchParams.get("format") || "json";
  const includeProducts = url.searchParams.get("include_products") === "1";
  const range = monthRange(month);
  if (!range) return NextResponse.json({ error: "조회 월 형식이 올바르지 않습니다." }, { status: 400 });

  // v29: 세금자료의 월 귀속은 주문일이 아니라 배송완료일(delivered_at)을 기준으로 고정합니다.
  let ordersResult = await fetchJson(`/rest/v1/orders?status=eq.delivered&delivered_at=gte.${encodeURIComponent(range.start)}&delivered_at=lt.${encodeURIComponent(range.end)}&select=id,user_id,company_name,status,total_amount,created_at,delivered_at&order=delivered_at.asc`);
  if (!ordersResult.ok) return NextResponse.json({ error: "배송완료 주문자료를 불러오지 못했습니다." }, { status: 500 });
  let orders = ordersResult.data || [];
  if (userId) orders = orders.filter((o) => o.user_id === userId);

  const profileResult = await fetchJson('/rest/v1/profiles?select=id,company_name&order=company_name.asc');
  const profiles = profileResult.ok ? profileResult.data : [];

  if (!orders.length) {
    const payload = { month, profiles, summary: [], details: [], totals: { exempt_amount: 0, taxable_supply: 0, vat_amount: 0, taxable_total: 0, grand_total: 0 } };
    if (format === "xls") {
      return new Response(excelXml(month, [], [], includeProducts), { headers: { "Content-Type": "application/vnd.ms-excel; charset=utf-8", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`신농허브_${month}_세금계산서용.xls`)}` } });
    }
    return NextResponse.json(payload);
  }

  const orderIds = [...new Set(orders.map((o) => Number(o.id)).filter(Boolean))];
  const ids = orderIds.join(",");
  const orderMap = new Map(orders.map((o) => [Number(o.id), o]));

  // v29 migration 이전 데이터 보완 확인용. 신규 주문은 orders.delivered_at을 기준으로 고정됩니다.
  const ledgerResult = await fetchJson(`/rest/v1/ledger_entries?entry_type=eq.order&order_id=in.(${ids})&select=order_id,occurred_at`);
  const deliveredAtMap = new Map();
  if (ledgerResult.ok) {
    for (const row of ledgerResult.data || []) {
      if (row.order_id) deliveredAtMap.set(Number(row.order_id), row.occurred_at);
    }
  }
  for (const order of orders) {
    deliveredAtMap.set(Number(order.id), order.delivered_at || deliveredAtMap.get(Number(order.id)) || order.created_at);
  }

  let itemsResult = await fetchJson(`/rest/v1/order_items?order_id=in.(${ids})&select=id,order_id,product_id,product_name,weight,origin,unit_price,quantity,subtotal,tax_type&order=order_id.asc,id.asc`);
  let items = itemsResult.data;
  if (!itemsResult.ok) {
    itemsResult = await fetchJson(`/rest/v1/order_items?order_id=in.(${ids})&select=id,order_id,product_id,product_name,weight,unit_price,quantity,subtotal&order=order_id.asc,id.asc`);
    if (!itemsResult.ok) return NextResponse.json({ error: "주문 품목 자료를 불러오지 못했습니다." }, { status: 500 });
    items = itemsResult.data;
  }

  const productIds = [...new Set(items.map((i) => Number(i.product_id)).filter(Boolean))];
  let products = [];
  if (productIds.length) {
    let productResult = await fetchJson(`/rest/v1/products?id=in.(${productIds.join(",")})&select=id,origin,tax_type`);
    if (!productResult.ok) productResult = await fetchJson(`/rest/v1/products?id=in.(${productIds.join(",")})&select=id,origin`);
    if (productResult.ok) products = productResult.data;
  }
  const productMap = new Map(products.map((p) => [Number(p.id), p]));

  const details = [];
  for (const item of items) {
    const order = orderMap.get(Number(item.order_id));
    if (!order) continue;
    if (userId && order.user_id !== userId) continue;
    const product = productMap.get(Number(item.product_id)) || {};
    const origin = item.origin || product.origin || "";
    const taxType = item.tax_type || product.tax_type || (origin === "국산" ? "exempt" : "taxable");
    const subtotal = Number(item.subtotal) || 0;
    const supply = taxType === "exempt" ? subtotal : Math.round(subtotal / 1.1);
    const vat = taxType === "exempt" ? 0 : subtotal - supply;
    const deliveredAt = deliveredAtMap.get(Number(item.order_id));
    const date = deliveredAt ? new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(deliveredAt)) : "";
    details.push({
      date, order_id: Number(item.order_id), user_id: order.user_id, company_name: order.company_name || "", product_name: item.product_name || "", origin,
      tax_type: taxType, quantity: Number(item.quantity) || 0, unit_price: Number(item.unit_price) || 0,
      supply_amount: supply, vat_amount: vat, subtotal
    });
  }

  const summaryMap = new Map();
  for (const row of details) {
    const key = row.user_id || row.company_name;
    const current = summaryMap.get(key) || { user_id: row.user_id, company_name: row.company_name, exempt_amount: 0, taxable_supply: 0, vat_amount: 0, taxable_total: 0, grand_total: 0 };
    if (row.tax_type === "exempt") current.exempt_amount += row.subtotal;
    else { current.taxable_supply += row.supply_amount; current.vat_amount += row.vat_amount; current.taxable_total += row.subtotal; }
    current.grand_total += row.subtotal;
    summaryMap.set(key, current);
  }
  const summary = [...summaryMap.values()].sort((a, b) => a.company_name.localeCompare(b.company_name, "ko"));
  const totals = summary.reduce((a, r) => ({ exempt_amount: a.exempt_amount + r.exempt_amount, taxable_supply: a.taxable_supply + r.taxable_supply, vat_amount: a.vat_amount + r.vat_amount, taxable_total: a.taxable_total + r.taxable_total, grand_total: a.grand_total + r.grand_total }), { exempt_amount: 0, taxable_supply: 0, vat_amount: 0, taxable_total: 0, grand_total: 0 });

  if (format === "xls") {
    return new Response(excelXml(month, summary, details, includeProducts), { headers: { "Content-Type": "application/vnd.ms-excel; charset=utf-8", "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`신농허브_${month}_세금계산서용.xls`)}` } });
  }
  return NextResponse.json({ month, profiles, summary, details, totals });
}
