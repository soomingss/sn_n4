import {visibleProductSupplier} from "./product-supplier";

const domesticOrigin = /^(국산|국내|한국|대한민국)/;

export function productDisplayName(name, origin) {
  return name && domesticOrigin.test(String(origin || "").trim()) && !name.startsWith("(土)")
    ? `(土) ${name}`
    : name;
}

export function productSpecs(product){
  const origin=String(product.origin||"").trim();
  const imported=origin&&!domesticOrigin.test(origin);
  return [product.weight,imported?"수입산":"",origin,visibleProductSupplier(product.supplier)].filter(Boolean).join(" | ");
}
