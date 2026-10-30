import {visibleProductSupplier} from "./product-supplier";

export function productSpecs(product){
  const origin=String(product.origin||"").trim();
  const imported=origin&&!/^(국산|국내|한국|대한민국)/.test(origin);
  return [product.weight,imported?"수입산":"",origin,visibleProductSupplier(product.supplier)].filter(Boolean).join(" | ");
}
