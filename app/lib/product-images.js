// Exact product names only: processed/powdered variants must not inherit a
// different form's photograph. Empty string intentionally hides an image.
const referenceImages = {
  "감초": "/products-reference/gamcho.webp",
  "구기자": "/products-reference/gugija.webp",
  "황기/직절": "/products-reference/hwanggi-jikjeol.webp",
};

export function withProductImage(product) {
  return {
    ...product,
    image_url: product.image_url ?? referenceImages[product.name] ?? null,
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
