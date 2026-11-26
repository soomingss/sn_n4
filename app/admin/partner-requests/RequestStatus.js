"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RequestStatus({ id, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function update(event) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("status");
    setBusy(true);
    setMessage("");
    try {
      const result = await fetch("/api/partner-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: value })
      });
      if (!result.ok) throw new Error((await result.json()).message);
      setMessage("저장되었습니다.");
      router.refresh();
    } catch (error) {
      setMessage(error.message || "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={update}>
    <select aria-label="처리 상태" name="status" defaultValue={status} disabled={busy}>
      <option value="new">접수</option><option value="checking">확인 중</option><option value="resolved">처리 완료</option>
    </select>{" "}<button type="submit" disabled={busy}>저장</button>
    <p role="status">{message}</p>
  </form>;
}
