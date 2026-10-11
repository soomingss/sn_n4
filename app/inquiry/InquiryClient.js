"use client";

import { useState } from "react";

const initialForm = {
  company_name: "",
  contact_name: "",
  phone: "",
  email: "",
  inquiry_type: "제품 문의",
  message: "",
  website: ""
};

export default function InquiryClient({ companyName, companyNameEn }) {
  const [form, setForm] = useState(initialForm);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [state, setState] = useState({ status: "idle", message: "" });

  const update = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (state.status === "loading") return;
    if (!privacyAgreed) { setState({status:"error",message:"개인정보 수집 및 이용에 동의해 주세요."}); return; }
    setState({ status: "loading", message: "" });

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.message || "문의 접수 중 오류가 발생했습니다.");

      setForm(initialForm);
      setPrivacyAgreed(false);
      setState({ status: "success", message: "문의가 정상적으로 접수되었습니다. 확인 후 연락드리겠습니다." });
    } catch (error) {
      setState({ status: "error", message: error.message || "문의 접수 중 오류가 발생했습니다." });
    }
  };

  return (
    <main>
      <section className="companyHero inquiryCompanyHero">
        <div className="companyHeroCopy">
          <p>{companyNameEn}</p>
          <h1>홈페이지 문의하기</h1>
          <span>HOME &gt; 홈페이지 문의하기</span>
        </div>
      </section>

      <section className="inquirySection contentWidth">
        <div className="inquiryIntro">
          <div className="greenLine"></div>
          <h2>{companyName}에 문의해 주세요.</h2>
          <p>정확한 상담을 위해 아래 내용을 작성해 주세요. <span>*</span> 표시는 필수 항목입니다.</p>
        </div>

        <form className="inquiryForm referenceForm" onSubmit={submit}>
          <input className="hpField" tabIndex="-1" autoComplete="off" name="website" value={form.website} onChange={update} aria-hidden="true" />

          <div className="formGrid referenceFields">
            <label>
              <span>업체명 <b>*</b></span>
              <input name="company_name" value={form.company_name} onChange={update} required maxLength={100} placeholder="업체명을 입력해 주세요." />
            </label>
            <label>
              <span>담당자명 <b>*</b></span>
              <input name="contact_name" value={form.contact_name} onChange={update} required maxLength={50} placeholder="담당자명을 입력해 주세요." />
            </label>
            <label>
              <span>연락처 <b>*</b></span>
              <input name="phone" value={form.phone} onChange={update} required maxLength={30} inputMode="tel" placeholder="연락 가능한 번호를 입력해 주세요." />
            </label>
            <label>
              <span>이메일</span>
              <input name="email" value={form.email} onChange={update} maxLength={120} type="email" placeholder="이메일을 입력해 주세요. (선택)" />
            </label>
            <label className="formFull">
              <span>문의 유형 <b>*</b></span>
              <select name="inquiry_type" value={form.inquiry_type} onChange={update} required>
                <option>제품 문의</option>
                <option>가격 문의</option>
                <option>납품 문의</option>
                <option>기타 문의</option>
              </select>
            </label>
            <label className="formFull">
              <span>문의 내용 <b>*</b></span>
              <textarea name="message" value={form.message} onChange={update} required maxLength={3000} rows={8} placeholder="문의 내용을 입력해 주세요." />
            </label>
          </div>

          <div className="referencePrivacy"><strong>개인정보의 수집 및 이용목적</strong><p>문의 접수, 문의 내용 확인 및 답변을 위해 이용합니다.</p><strong>수집하는 개인정보의 항목</strong><p>업체명, 담당자명, 연락처, 이메일(선택), 문의 유형 및 문의 내용</p><strong>보유 및 이용기간</strong><p>문의 처리 및 관련 업무에 필요한 기간 동안 보관하며, 관계 법령에 따른 보존 의무가 있는 경우 해당 기간 동안 보관합니다.</p><label className="referenceConsent"><input type="checkbox" checked={privacyAgreed} onChange={e=>setPrivacyAgreed(e.target.checked)} required /> 개인정보 수집 및 이용에 동의합니다. (필수)</label></div>
          {state.message && <div className={`formNotice ${state.status}`}>{state.message}</div>}
          <button className="inquirySubmit" type="submit" disabled={state.status === "loading"}>
            {state.status === "loading" ? "접수 중..." : "문의하기"}
          </button>
        </form>
      </section>
    </main>
  );
}
