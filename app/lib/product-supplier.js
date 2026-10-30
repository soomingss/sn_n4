// Only Shinhung is named in product information across the website.
export function visibleProductSupplier(supplier) {
  const name = String(supplier || "").trim();
  return name.includes("신흥") ? name : "";
}
