"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfileEditPage({ profile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    company_name: profile?.company_name || "",
    contact_name: profile?.contact_name || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    const r = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMessage(d.error || "수정에 실패했습니다.");
      setSaving(false);
      return;
    }
    router.push("/mypage");
    router.refresh();
  };

  return <form className="profilePageForm" onSubmit={save}>
    {[['상호명','company_name'],['담당자명','contact_name'],['연락처','phone'],['이메일','email']].map(([label,key]) => <label key={key}><span>{label}</span><input value={form[key]} onChange={e => setForm(v => ({...v,[key]:e.target.value}))} /></label>)}
    <div className="profileReadonly"><span>아이디</span><b>{profile?.username || "-"}</b></div>
    <p className="profilePageNote">아이디 · 승인상태는 관리자만 변경할 수 있습니다.</p>
    {message && <p className="profilePageMessage">{message}</p>}
    <div className="profilePageActions"><button type="button" className="profileCancel" onClick={() => router.back()} disabled={saving}>취소</button><button type="submit" className="profileSave" disabled={saving}>{saving ? "수정중..." : "수정완료"}</button></div>
  </form>;
}
