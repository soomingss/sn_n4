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
  if (priceGrade === null || priceGrade === undefined || String(priceGrade).trim() === "") return [];
  const grade = String(priceGrade).trim();
  const response = await supabaseAdminFetch(
    `/rest/v1/product_prices?select=product_id,price_grade,price&price_grade=eq.${encodeURIComponent(grade)}`
  );
  return readJsonOrThrow(response, "등급가격 조회 실패");
}

export async function loadAllPrices() {
  const response = await supabaseAdminFetch(
    "/rest/v1/product_prices?select=product_id,price_grade,price"
  );
  return readJsonOrThrow(response, "전체 등급가격 조회 실패");
}

export function attachGradePrices(products, prices) {
  const priceMap = new Map((prices || []).map(row => [String(row.product_id), row.price]));
  return (products || []).map(product => ({
    ...product,
    image_url: product.image_url || null,
    price: priceMap.get(String(product.id)) ?? null,
  }));
}
