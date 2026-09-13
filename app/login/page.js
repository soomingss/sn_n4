"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "", remember: true });
  const [state, setState] = useState({ loading: false, message: "" });
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    if (state.loading) return;
    setState({ loading: true, message: "" });
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "로그인에 실패했습니다.");
      const next = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      window.dispatchEvent(new Event("shinnong-auth-changed"));
      router.push(safeNext);
      router.refresh();
    } catch (error) {
      setState({ loading: false, message: error.message || "로그인에 실패했습니다." });
    }
  };

  return <main>
    <section className="companyHero loginHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>로그인</h1><span>HOME &gt; 로그인</span></div></section>
    <section className="loginSection contentWidth">
      <div className="loginBox">
        <p className="eyebrow">MEMBER LOGIN</p>
        <h1>거래처 로그인</h1>
        <p className="loginDesc">승인된 거래처 회원은 로그인 후 제품안내를 이용하실 수 있습니다.</p>
        <form onSubmit={submit} className="loginForm">
          <label><span>아이디</span><input value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})} autoComplete="username" placeholder="아이디를 입력해 주세요." required /></label>
          <label><span>비밀번호</span><input type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} autoComplete="current-password" placeholder="비밀번호를 입력해 주세요." required /></label>
          <div className="loginUtility"><label className="rememberLabel"><input type="checkbox" checked={form.remember} onChange={(e)=>setForm({...form,remember:e.target.checked})} /> 로그인 상태 유지</label><div><span className="loginHelper">아이디 찾기</span><i>|</i><span className="loginHelper">비밀번호 찾기</span></div></div>
          {state.message && <div className="loginError">{state.message}</div>}
          <button className="loginSubmit" type="submit" disabled={state.loading}>{state.loading ? "로그인 중..." : "로그인"}</button>
        </form>
        <div className="loginApply"><span>아직 거래처 회원이 아니신가요?</span><Link href="/signup">거래처 신청하기</Link></div>
      </div>
    </section>
  </main>;
}
