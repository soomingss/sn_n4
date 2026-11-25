import {visibleProductSupplier} from "./product-supplier";

const domesticOrigin = /^(국산|국내|한국|대한민국)/;

export function productDisplayName(name, origin) {
  if (!name) return name;
  const compactName = name.replace(/\s+\(/g, "(").replace(/^\(土\)\s+/, "(土)");
  return domesticOrigin.test(String(origin || "").trim()) && !compactName.startsWith("(土)")
    ? `(土)${compactName}`
    : compactName;
}

export function productSpecs(product){
  const origin=String(product.origin||"").trim();
  const imported=origin&&!domesticOrigin.test(origin);
  return [product.weight,imported?"수입산":"",origin,visibleProductSupplier(product.supplier)].filter(Boolean).join(" | ");
}
