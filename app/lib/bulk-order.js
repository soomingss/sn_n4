export const BULK_MINIMUM = 30;
export const BULK_DISCOUNT_PERCENT = 5;

export function bulkUnitPrice(price, bulkOrder) {
  return bulkOrder && price != null
    ? Math.round(Number(price) * (100 - BULK_DISCOUNT_PERCENT) / 100)
    : price;
}
