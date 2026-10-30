import referenceImages from "./product-photo-map.json";

// Explicit mappings share photographs across grades while preserving cut and
// powdered forms. An administrator's saved image (including "") takes priority.

export function withProductImage(product) {
  const originKey = ["우슬", "의이인"].includes(product.name) && /국내산|국산|한국|대한민국/.test(product.origin || "")
    ? product.name + "|국내산"
    : product.name;
  return {
    ...product,
    image_url: product.image_url ?? referenceImages[originKey] ?? referenceImages[product.name] ?? null,
  };
}

export function validProductImageUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return false;
  if (value === "") return true;
  if (/^\/products(?:-reference|-demo)?\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp)$/i.test(value) && !value.includes("..")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
