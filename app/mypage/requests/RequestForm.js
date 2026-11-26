"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { productDisplayName, productSpecs } from "../../lib/product-display";

export default function RequestForm({ order, items = [], initialName = "" }) {
  const router = useRouter();
  const requestId = useRef(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    requestId.current ||= crypto.randomUUID();
    data.set("id", requestId.current);
    data.set("kind", order ? "receipt" : "sourcing");
    if (order) data.set("order_id", order.id);
    if (data.get("photo")?.size > 750000) {
      setMessage("사진은 750KB 이하여야 합니다.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/partner-requests", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      requestId.current = null;
      form.reset();
      setMessage("접수되었습니다. 아래에서 처리 상태를 확인할 수 있어요.");
      router.refresh();
    } catch (error) {
      setMessage(error.message || "접수하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="partnerRequestForm" onSubmit={submit}>
    <h2>{order ? "수령 문제 접수" : "취급 약재 요청"}</h2>
    {order ? <>
      <label>품목<select name="item_id" required defaultValue="">
        <option value="">품목 선택</option>
        {items.map(item => <option key={item.id} value={item.id}>
          {productDisplayName(item.product_name, item.origin)} · {productSpecs(item)}
        </option>)}
      </select></label>
      <label>사유<select name="reason" required defaultValue="">
        <option value="">사유 선택</option><option value="missing">누락</option>
        <option value="damaged">파손</option><option value="wrong">다른 상품 도착</option>
      </select></label>
      <label>사진 (선택, 750KB 이하)<input type="file" name="photo" accept="image/jpeg,image/png,image/webp" /></label>
    </> : <>
      <label>약재명<input name="name" required maxLength={100} defaultValue={initialName} /></label>
      <label>희망 원산지<input name="origin" maxLength={100} /></label>
      <label>희망 중량<input name="weight" maxLength={100} placeholder="예: 500g" /></label>
      <label>희망 수량<input name="quantity" maxLength={100} placeholder="예: 3봉" /></label>
    </>}
    <label>추가 내용 (선택)<textarea name="note" rows={3} maxLength={800} /></label>
    <button className="adminLinkButton" disabled={busy} type="submit">{busy ? "접수 중…" : "접수하기"}</button>
    <p role="status">{message}</p>
  </form>;
}
