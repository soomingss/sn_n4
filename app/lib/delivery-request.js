export const DELIVERY_REQUEST_MAX_LENGTH = 500;

export function normalizeDeliveryRequest(value) {
  if (value == null) return "";
  if (typeof value !== "string") throw new Error("배송 요청사항은 문자로 입력해 주세요.");
  if (value.length > DELIVERY_REQUEST_MAX_LENGTH) throw new Error("배송 요청사항은 500자 이내로 입력해 주세요.");
  return value.trim();
}
