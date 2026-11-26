import OrderCatalogPage from "../products/OrderCatalogPage";

export default async function Page({ searchParams }) {
  const { mode } = await searchParams;
  return <OrderCatalogPage cartPage bulkOrder={mode === "bulk"} />;
}
