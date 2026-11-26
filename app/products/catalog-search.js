import { productDisplayName, productSpecs } from "../lib/product-display";

const aliases = {
  갈근: ["칡뿌리", "칡"],
  구기자: ["구기"],
  산약: ["마", "참마"],
  진피: ["귤껍질"],
  포공영: ["민들레"],
  흑지마: ["검은깨", "흑임자", "검정깨"],
};

export function matchesProduct(product, query) {
  const name = product.name || "";
  const baseName = name.replace(/^\(土\)\s*/, "").split(/[/(]/, 1)[0].trim();
  const searchable = [
    productDisplayName(name, product.origin), productSpecs(product), name,
    ...(aliases[baseName] || []),
  ].join(" ").toLowerCase();
  return query.trim().toLowerCase().split(/\s+/).every(term => searchable.includes(term));
}

export function pricePer100Grams(price, weight) {
  const match = String(weight ?? "").trim().match(/^(\d+(?:\.\d+)?)\s*(kg|g|킬로그램|그램)$/i);
  if (!match || price == null || String(price).trim() === "") return null;
  const grams = Number(match[1]) * (/^(kg|킬로그램)$/i.test(match[2]) ? 1000 : 1);
  const amount = Number(price);
  return grams > 0 && Number.isFinite(grams) && Number.isFinite(amount) && amount >= 0
    ? Math.round(amount / grams * 100)
    : null;
}
