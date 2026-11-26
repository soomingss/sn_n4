import { getCurrentSession, supabaseAdminFetch } from "./auth";

export async function getApprovedPartner() {
  const session = await getCurrentSession();
  return session?.profile?.status === "approved" || session?.profile?.role === "admin"
    ? session
    : null;
}

export const requestStatuses = { new: "접수", checking: "확인 중", resolved: "처리 완료" };
export const requestFields = "id,created_at,kind,status,order_id,item_id,subject,details,photo_type";

export async function loadPartnerRequests(userId, orderId) {
  const userFilter = userId ? `&user_id=eq.${encodeURIComponent(userId)}` : "";
  const orderFilter = orderId ? `&order_id=eq.${encodeURIComponent(orderId)}` : "";
  const fields = userId ? requestFields : `${requestFields},profiles(company_name)`;
  const response = await supabaseAdminFetch(
    `/rest/v1/partner_requests?select=${fields}${userFilter}${orderFilter}&order=created_at.desc&limit=100`
  );
  return response.ok ? response.json() : null;
}
