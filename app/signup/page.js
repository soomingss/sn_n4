"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const initialForm = {
  username: "",
  password: "",
  passwordConfirm: "",
  companyName: "",
  contactName: "",
  phone: "",
  email: ""
};

export default function SignupPage() {
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ loading: false, message: "", success: false });
  const router = useRouter();

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (state.loading) return;
    if (form.password !== form.passwordConfirm) {
      setState({ loading: false, message: "비밀번호가 일치하지 않습니다.", success: false });
      return;
    }

    setState({ loading: true, message: "", success: false });
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "회원가입 신청에 실패했습니다.");
      setState({ loading: false, message: "거래처 회원가입 신청이 완료되었습니다. 관리자 승인 후 제품안내를 이용하실 수 있습니다.", success: true });
      setForm(initialForm);
      setTimeout(() => router.push("/login"), 1800);
    } catch (error) {
      setState({ loading: false, message: error.message || "회원가입 신청에 실패했습니다.", success: false });
    }
  };

  return (
    <main>
      <section className="companyHero loginHero">
        <div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>거래처 회원가입</h1><span>HOME &gt; 거래처 회원가입</span></div>
      </section>
      <section className="signupSection contentWidth">
        <div className="signupBox">
          <p className="eyebrow">PARTNER MEMBER</p>
          <h1>거래처 회원가입</h1>
          <p className="loginDesc">회원가입 신청 후 관리자 승인이 완료되면 제품안내를 이용하실 수 있습니다.</p>
          <form onSubmit={submit} className="signupForm">
            <div className="signupGrid">
              <label><span>아이디</span><input value={form.username} onChange={(e)=>setField("username", e.target.value)} autoComplete="username" placeholder="사용할 아이디를 입력해 주세요." required /></label>
              <label><span>이메일</span><input type="email" value={form.email} onChange={(e)=>setField("email", e.target.value)} autoComplete="email" placeholder="이메일을 입력해 주세요." required /></label>
              <label><span>비밀번호</span><input type="password" value={form.password} onChange={(e)=>setField("password", e.target.value)} autoComplete="new-password" placeholder="비밀번호를 입력해 주세요." minLength={8} required /></label>
              <label><span>비밀번호 확인</span><input type="password" value={form.passwordConfirm} onChange={(e)=>setField("passwordConfirm", e.target.value)} autoComplete="new-password" placeholder="비밀번호를 다시 입력해 주세요." minLength={8} required /></label>
              <label><span>업체명</span><input value={form.companyName} onChange={(e)=>setField("companyName", e.target.value)} placeholder="업체명을 입력해 주세요." required /></label>
              <label><span>담당자명</span><input value={form.contactName} onChange={(e)=>setField("contactName", e.target.value)} placeholder="담당자명을 입력해 주세요." required /></label>
              <label className="signupFull"><span>연락처</span><input value={form.phone} onChange={(e)=>setField("phone", e.target.value)} autoComplete="tel" placeholder="연락처를 입력해 주세요." required /></label>
            </div>
            {state.message && <div className={state.success ? "signupSuccess" : "loginError"}>{state.message}</div>}
            <button className="loginSubmit" type="submit" disabled={state.loading || state.success}>{state.loading ? "신청 중..." : "회원가입 신청"}</button>
          </form>
          <div className="loginApply"><span>이미 거래처 회원이신가요?</span><Link href="/login">로그인</Link></div>
        </div>
      </section>
    </main>
  );
}
