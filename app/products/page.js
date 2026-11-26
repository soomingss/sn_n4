import OrderCatalogPage from "./OrderCatalogPage";

export default async function Page({ searchParams }) {
  const { mode } = await searchParams;
  return <OrderCatalogPage bulkOrder={mode === "bulk"} />;
}
