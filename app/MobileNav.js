"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav({ session, loaded, onLogout, siteSettings }) {
  const [open, setOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const closeMenu = () => { setOpen(false); setCompanyOpen(false); setInquiryOpen(false); };
  const logout = async () => { closeMenu(); await onLogout?.(); };
  const isAdmin = session?.profile?.role === "admin";
  const username = session?.profile?.username || "회원";
  const companyName = siteSettings?.company_name || "";
  const kakaoChannelUrl = siteSettings?.kakao_channel_url || "";

  return <div className="mobileNavWrap">
    <button type="button" className={`hamburger ${open ? "isOpen" : ""}`} aria-label={open ? "메뉴 닫기" : "메뉴 열기"} aria-expanded={open} onClick={() => setOpen(v => !v)}><span /><span /><span /></button>
    {open && <div className="mobileMenu"><div className="mobileMenuInner">
      <button type="button" className="mobileMenuRow mobileCompanyToggle" aria-expanded={companyOpen} onClick={() => setCompanyOpen(v => !v)}><span>회사소개</span><span className={`mobileChevron ${companyOpen ? "isOpen" : ""}`}>⌄</span></button>
      {companyOpen && <div className="mobileSubmenu"><Link href="/company" onClick={closeMenu}>회사소개</Link><Link href="/company/history" onClick={closeMenu}>연혁</Link><Link href="/company/location" onClick={closeMenu}>오시는 길</Link></div>}
      <Link className="mobileMenuRow" href="/products" onClick={closeMenu}>약재주문</Link>
      <Link className="mobileMenuRow" href="/order-delivery" onClick={closeMenu}>주문·배송 안내</Link>
      {isAdmin && <Link className="mobileMenuRow adminMobileLink" href="/admin" onClick={closeMenu}>관리자업무</Link>}
      <button type="button" className="mobileMenuRow mobileCompanyToggle" aria-expanded={inquiryOpen} onClick={() => setInquiryOpen(v => !v)}><span>거래처 신청</span><span className={`mobileChevron ${inquiryOpen ? "isOpen" : ""}`}>⌄</span></button>
      {inquiryOpen && <div className="mobileSubmenu"><Link href="/inquiry" onClick={closeMenu}>홈페이지 문의하기</Link>{kakaoChannelUrl && <a href={kakaoChannelUrl} target="_blank" rel="noopener noreferrer" onClick={closeMenu}>카카오톡 문의하기</a>}</div>}
      {kakaoChannelUrl && <a className="mobileMenuRow" href={kakaoChannelUrl} target="_blank" rel="noopener noreferrer" onClick={closeMenu}>고객센터</a>}
      {loaded && session ? <div className="mobileAccountArea">
        <div className="mobileAccountIdentity"><div className="mobileAccountNameRow"><b>{username}님</b>{!isAdmin && <Link className="mobileProfileMini" href="/mypage/profile" onClick={closeMenu}>회원정보 수정</Link>}</div><span>{session?.profile?.company_name || (companyName ? `${companyName} 거래처` : "거래처")} · {isAdmin ? "관리자 계정" : session?.profile?.status === "approved" ? "승인 완료" : session?.profile?.status === "rejected" ? "승인 거절" : "승인 대기"}</span></div>
        <div className="mobileAccountLinks"><Link href="/mypage" onClick={closeMenu}>마이페이지</Link>{!isAdmin && session?.profile?.status === "approved" && <Link href="/products?cart=1" onClick={closeMenu}>장바구니</Link>}<Link href="/payment" onClick={closeMenu}>카드결제</Link></div>
        <div className="mobileLogoutRow"><button type="button" onClick={logout}>로그아웃</button></div>
      </div> : <Link className="mobileMenuRow" href="/login" onClick={closeMenu}>로그인</Link>}
    </div></div>}
  </div>;
}
