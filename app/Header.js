"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import MobileNav from "./MobileNav";

export default function Header() {
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      const data = await response.json();
      setSession(data?.session || null);
    } catch {
      setSession(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [pathname, refreshSession]);

  useEffect(() => {
    const handleAuthChanged = () => refreshSession();
    window.addEventListener("shinnong-auth-changed", handleAuthChanged);
    return () => window.removeEventListener("shinnong-auth-changed", handleAuthChanged);
  }, [refreshSession]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    setAccountOpen(false);
    window.dispatchEvent(new Event("shinnong-auth-changed"));
    router.push("/");
    router.refresh();
  };

  const isAdmin = session?.profile?.role === "admin";
  const username = session?.profile?.username || "회원";

  return (
    <header className="header">
      <Link href="/" className="logoWrap" aria-label="신농허브 홈">
        <img src="/logo-hq.png" alt="신농허브 SHINNONG HERB" className="logoImg" />
      </Link>

      <nav className="mainNav">
        <Link href="/company">회사소개</Link>
        <Link href="/products">제품안내</Link>
        <Link href="/order-delivery">주문·배송 안내</Link>
        <a href="http://pf.kakao.com/_axdbrX" target="_blank" rel="noopener noreferrer">고객센터</a>
        {isAdmin && <Link className="adminNavLink" href="/admin">관리자업무</Link>}
      </nav>

      <div className="headerActions">
        {loaded && session ? (
          <div className="accountDropdown">
            <button
              type="button"
              className="accountDropdownToggle"
              aria-haspopup="true"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((value) => !value)}
            >
              <span className="signedUser" title={`${username}님`}>{username}님</span>
              <span className={`accountChevron ${accountOpen ? "isOpen" : ""}`}>⌄</span>
            </button>
            {accountOpen && (
              <div className="accountDropdownMenu">
                <div className="accountIdentity">
                  <b>{username}님</b>
                  <span>{session?.profile?.company_name || "신농허브 거래처"}</span>
                </div>
                <div className="accountStatusRow">
                  <span>계정 상태</span>
                  <b>{isAdmin ? "관리자 계정" : session?.profile?.status === "approved" ? "승인 완료" : session?.profile?.status === "rejected" ? "승인 거절" : "승인 대기"}</b>
                </div>
                <div className="accountMenuLinks">
                  <Link href="/mypage" onClick={() => setAccountOpen(false)}>마이페이지</Link>
                  <Link href="/payment" onClick={() => setAccountOpen(false)}>카드결제</Link>
                </div>
                <button type="button" className="accountLogout" onClick={logout}>로그아웃</button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login">로그인</Link>
        )}
        <div className="partnerDropdown">
          <button type="button" className="partnerApply partnerDropdownToggle" aria-haspopup="true">거래처 신청</button>
          <div className="partnerDropdownMenu">
            <Link href="/inquiry">홈페이지 문의하기</Link>
            <a href="http://pf.kakao.com/_axdbrX" target="_blank" rel="noopener noreferrer">카카오톡 문의하기</a>
          </div>
        </div>
      </div>

      <MobileNav session={session} loaded={loaded} onLogout={logout} />
    </header>
  );
}
