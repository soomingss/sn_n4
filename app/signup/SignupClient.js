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
  email: "",
  businessRegistrationNumber: ""
};

export default function SignupClient({ companyNameEn }) {
  const [form, setForm] = useState(initialForm);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [state, setState] = useState({ loading: false, message: "", success: false });
  const router = useRouter();

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (state.loading) return;
    if (!privacyAgreed) { setState({loading:false,message:"개인정보 수집 및 이용에 동의해 주세요.",success:false}); return; }
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
      setState({ loading: false, message: "거래처 회원가입 신청이 완료되었습니다. 관리자 승인 후 약재주문을 이용하실 수 있습니다.", success: true });
      setForm(initialForm);
      setPrivacyAgreed(false);
      setTimeout(() => router.push("/login"), 1800);
    } catch (error) {
      setState({ loading: false, message: error.message || "회원가입 신청에 실패했습니다.", success: false });
    }
  };

  return (
    <main>
      <section className="companyHero loginHero">
        <div className="companyHeroCopy"><p>{companyNameEn}</p><h1>거래처 회원가입</h1><span>HOME &gt; 거래처 회원가입</span></div>
      </section>
      <section className="signupSection contentWidth">
        <div className="signupBox">
          <p className="eyebrow">PARTNER MEMBER</p>
          <h1>거래처 회원가입</h1>
          <p className="loginDesc">회원가입 신청 후 관리자 승인이 완료되면 약재주문을 이용하실 수 있습니다.</p>
          <form onSubmit={submit} className="signupForm referenceForm">
            <div className="signupGrid referenceFields">
              <label><span>아이디</span><input value={form.username} onChange={(e)=>setField("username", e.target.value)} autoComplete="username" placeholder="사용할 아이디를 입력해 주세요." required /></label>
              <label><span>이메일</span><input type="email" value={form.email} onChange={(e)=>setField("email", e.target.value)} autoComplete="email" placeholder="이메일을 입력해 주세요." required /></label>
              <label><span>비밀번호</span><input type="password" value={form.password} onChange={(e)=>setField("password", e.target.value)} autoComplete="new-password" placeholder="비밀번호를 입력해 주세요." minLength={8} required /></label>
              <label><span>비밀번호 확인</span><input type="password" value={form.passwordConfirm} onChange={(e)=>setField("passwordConfirm", e.target.value)} autoComplete="new-password" placeholder="비밀번호를 다시 입력해 주세요." minLength={8} required /></label>
              <label><span>업체명</span><input value={form.companyName} onChange={(e)=>setField("companyName", e.target.value)} placeholder="업체명을 입력해 주세요." required /></label>
              <label><span>담당자명</span><input value={form.contactName} onChange={(e)=>setField("contactName", e.target.value)} placeholder="담당자명을 입력해 주세요." required /></label>
              <label className="signupFull"><span>사업자등록번호</span><input value={form.businessRegistrationNumber} onChange={(e)=>setField("businessRegistrationNumber", e.target.value)} inputMode="numeric" maxLength={12} placeholder="사업자등록번호 10자리를 입력해 주세요." required /></label>
              <label className="signupFull"><span>연락처</span><input value={form.phone} onChange={(e)=>setField("phone", e.target.value)} autoComplete="tel" placeholder="연락처를 입력해 주세요." required /></label>
            </div>
            <div className="referencePrivacy"><strong>개인정보의 수집 및 이용목적</strong><p>거래처 회원가입 신청 접수, 사업자 및 담당자 확인, 관리자 승인, 거래처 연락과 서비스 제공을 위해 이용합니다.</p><strong>수집하는 개인정보의 항목</strong><p>아이디, 이메일, 업체명, 사업자등록번호, 담당자명, 연락처 (비밀번호는 인증을 위해 별도 처리)</p><strong>보유 및 이용기간</strong><p>회원 탈퇴 또는 수집 목적 달성 시까지 보관하며, 관계 법령에 따른 보존 의무가 있는 경우 해당 기간 동안 보관합니다.</p><label className="referenceConsent"><input type="checkbox" checked={privacyAgreed} onChange={e=>setPrivacyAgreed(e.target.checked)} required /> 개인정보 수집 및 이용에 동의합니다. (필수)</label></div>
            {state.message && <div className={state.success ? "signupSuccess" : "loginError"}>{state.message}</div>}
            <button className="loginSubmit" type="submit" disabled={state.loading || state.success}>{state.loading ? "신청 중..." : "회원가입 신청"}</button>
          </form>
          <div className="loginApply"><span>이미 거래처 회원이신가요?</span><Link href="/login">로그인</Link></div>
        </div>
      </section>
    </main>
  );
}
