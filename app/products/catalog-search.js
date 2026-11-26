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
  const terms = query.trim().toLowerCase().split(/\s+/);
  if (terms.every(term => searchable.includes(term))) return true;

  const [herb, ...qualifiers] = name.normalize("NFKC")
    .replace(/^\s*\(\s*[土토]\s*\)\s*/, "")
    .toLowerCase().replace(/\s+/g, "").split("/");
  if (!herb || !qualifiers.length || qualifiers.some(part => !part)) return false;

  const compactQuery = terms.join("");
  const qualifier = qualifiers.join("");
  return (herb + qualifier).includes(compactQuery)
    || (qualifier + herb).includes(compactQuery);
}

export function priceForGrams(price, weight, targetGrams) {
  const match = String(weight ?? "").trim().match(/^(\d+(?:\.\d+)?)\s*(kg|g|킬로그램|그램)$/i);
  if (!match || price == null || String(price).trim() === "") return null;
  const grams = Number(match[1]) * (/^(kg|킬로그램)$/i.test(match[2]) ? 1000 : 1);
  const amount = Number(price);
  return grams > 0 && Number.isFinite(grams) && Number.isFinite(amount) && amount >= 0
    ? Math.round(amount / grams * targetGrams)
    : null;
}

function comparisonName(product) {
  return String(product.name || "").normalize("NFKC")
    .replace(/^\s*\(\s*[土토]\s*\)\s*/, "").split(/[(/]/, 1)[0].replace(/\s+/g, "").toLowerCase();
}

export function relatedProductsByName(selected, products) {
  const name = comparisonName(selected);
  if (!name) return [selected];

  const related = products.filter(product => {
    if (String(product.id) === String(selected.id)) return false;
    const candidate = comparisonName(product);
    return candidate && (candidate.includes(name) || name.includes(candidate));
  });
  related.sort((a, b) =>
    Number(comparisonName(b) === name) - Number(comparisonName(a) === name)
  );
  return [selected, ...related];
}
