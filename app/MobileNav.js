"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  const closeMenu = () => {
    setOpen(false);
    setCompanyOpen(false);
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
            <span className="mobileMenuRow">품질관리</span>
            <span className="mobileMenuRow">B2B 납품안내</span>
            <a className="mobileMenuRow" href="http://pf.kakao.com/_axdbrX" target="_blank" rel="noopener noreferrer" onClick={closeMenu}>고객센터</a>
            <span className="mobileMenuRow">로그인</span>
            <a className="mobileMenuRow mobilePartnerApply" href="http://pf.kakao.com/_axdbrX" target="_blank" rel="noopener noreferrer" onClick={closeMenu}>거래처 신청</a>
          </div>
        </div>
      )}
    </div>
  );
}
