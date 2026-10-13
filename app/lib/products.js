import { supabaseAdminFetch } from "./auth";

async function readJsonOrThrow(response, label) {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${label} (${response.status}): ${detail}`);
  }
  return response.json();
}

// Single source of truth for every product-ordering screen.
// image_url is optional in older product schemas, so it is intentionally not
// required for the core product query. The UI already has a text fallback.
export async function loadActiveProducts() {
  const response = await supabaseAdminFetch(
    "/rest/v1/products?select=id,name,weight,origin,supplier,is_active,stock_status&is_active=eq.true&order=name.asc"
  );
  return readJsonOrThrow(response, "상품 조회 실패");
}

export async function loadAllProductsForAdmin() {
  const response = await supabaseAdminFetch(
    "/rest/v1/products?select=id,name,weight,origin,supplier,is_active,stock_status&order=name.asc"
  );
  return readJsonOrThrow(response, "관리자 상품 조회 실패");
}

export async function loadPricesForGrade(priceGrade) {
  const grade = ["clinic","oem","special"].includes(String(priceGrade)) ? String(priceGrade) : "clinic";
  const response = await supabaseAdminFetch(
    `/rest/v1/product_prices?select=product_id,price_grade,price&price_grade=in.(clinic,${grade})`
  );
  const rows = await readJsonOrThrow(response, "구분별 가격 조회 실패");
  const map = new Map();
  for (const row of rows.filter(x => x.price_grade === "clinic")) map.set(String(row.product_id), row);
  for (const row of rows.filter(x => x.price_grade === grade)) map.set(String(row.product_id), row);
  return [...map.values()];
}

export async function loadAllPrices() {
  const all = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const response = await supabaseAdminFetch(
      `/rest/v1/product_prices?select=product_id,price_grade,price&order=product_id.asc,price_grade.asc&limit=${pageSize}&offset=${offset}`
    );
    const rows = await readJsonOrThrow(response, "전체 등급가격 조회 실패");
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}

export function attachGradePrices(products, prices) {
  const priceMap = new Map((prices || []).map(row => [String(row.product_id), row.price]));
  return (products || []).map(product => ({
    ...product,
    image_url: product.image_url || null,
    price: priceMap.get(String(product.id)) ?? null,
  }));
}
