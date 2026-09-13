"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const closeMenu = () => {
    setOpen(false);
    setCompanyOpen(false);
    setInquiryOpen(false);
  };

  return (
    <div className="mobileNavWrap">
      <button
        type="button"
        className={`hamburger ${open ? "isOpen" : ""}`}
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="mobileMenu">
          <div className="mobileMenuInner">
            <button
              type="button"
              className="mobileMenuRow mobileCompanyToggle"
              aria-expanded={companyOpen}
              onClick={() => setCompanyOpen((value) => !value)}
            >
              <span>회사소개</span>
              <span className={`mobileChevron ${companyOpen ? "isOpen" : ""}`}>⌄</span>
            </button>

            {companyOpen && (
              <div className="mobileSubmenu">
                <Link href="/company" onClick={closeMenu}>회사소개</Link>
                <Link href="/company/history" onClick={closeMenu}>연혁</Link>
                <Link href="/company/location" onClick={closeMenu}>오시는 길</Link>
              </div>
            )}

            <span className="mobileMenuRow">제품안내</span>
            <Link className="mobileMenuRow" href="/order-delivery" onClick={closeMenu}>주문·배송 안내</Link>

            <button
              type="button"
              className="mobileMenuRow mobileCompanyToggle"
              aria-expanded={inquiryOpen}
              onClick={() => setInquiryOpen((value) => !value)}
            >
              <span>거래처 신청</span>
              <span className={`mobileChevron ${inquiryOpen ? "isOpen" : ""}`}>⌄</span>
            </button>

            {inquiryOpen && (
              <div className="mobileSubmenu">
                <Link href="/inquiry" onClick={closeMenu}>홈페이지 문의하기</Link>
                <a href="http://pf.kakao.com/_axdbrX" target="_blank" rel="noopener noreferrer" onClick={closeMenu}>카카오톡 문의하기</a>
              </div>
            )}

            <a className="mobileMenuRow" href="http://pf.kakao.com/_axdbrX" target="_blank" rel="noopener noreferrer" onClick={closeMenu}>고객센터</a>
            <span className="mobileMenuRow">로그인</span>
          </div>
        </div>
      )}
    </div>
  );
}
