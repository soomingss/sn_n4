"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import MobileNav from "./MobileNav";
import CartIcon from "./CartIcon";
import {cartQuantity} from "./lib/cart";

export default function Header({ siteSettings = {} }) {
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartPreview, setCartPreview] = useState([]);
  const router = useRouter();
  const pathname = usePathname();
  const companyName = siteSettings.company_name || "";
  const companyNameEn = siteSettings.company_name_en || "";
  const logoHeaderPath = siteSettings.logo_header_path || "";
  const kakaoChannelUrl = siteSettings.kakao_channel_url || "";

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

  useEffect(() => { refreshSession(); }, [pathname, refreshSession]);
  useEffect(() => { const handleAuthChanged = () => refreshSession(); window.addEventListener("shinnong-auth-changed", handleAuthChanged); return () => window.removeEventListener("shinnong-auth-changed", handleAuthChanged); }, [refreshSession]);

  const refreshCartPreview = useCallback(() => {
    try { const saved = JSON.parse(localStorage.getItem("shinnong-cart") || "{}"); setCartPreview(Object.entries(saved).map(([id, item]) => ({ id, ...item, quantity: cartQuantity(item?.quantity) }))); } catch { setCartPreview([]); }
  }, []);

  useEffect(() => { refreshCartPreview(); const handleCartChanged = () => refreshCartPreview(); window.addEventListener("shinnong-cart-changed", handleCartChanged); window.addEventListener("storage", handleCartChanged); return () => { window.removeEventListener("shinnong-cart-changed", handleCartChanged); window.removeEventListener("storage", handleCartChanged); }; }, [pathname, refreshCartPreview]);

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); setSession(null); setAccountOpen(false); window.dispatchEvent(new Event("shinnong-auth-changed")); router.push("/"); router.refresh(); };
  const isAdmin = session?.profile?.role === "admin";
  const username = session?.profile?.username || "회원";
  const cartQty = cartPreview.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <header className="header">
      <Link href="/" className="logoWrap" aria-label={companyName ? `${companyName} 홈` : "홈"}>{logoHeaderPath && <img src={logoHeaderPath} alt={[companyName, companyNameEn].filter(Boolean).join(" ")} className="logoImg" />}</Link>
      <nav className="mainNav">
        <div className="companyDropdown"><Link href="/company" className="companyDropdownToggle">회사소개</Link><div className="companyDropdownMenu"><Link href="/company">회사소개</Link><Link href="/company/history">연혁</Link><Link href="/company/location">오시는 길</Link></div></div><Link href="/products">약재주문</Link><div className="companyDropdown deliveryDropdown"><Link href="/order-delivery" className="companyDropdownToggle">주문·배송 안내</Link><div className="companyDropdownMenu"><Link href="/order-delivery">주문·배송 안내</Link><Link href="/order-delivery/returns">교환·반품 및 환불 안내</Link></div></div><div className="companyDropdown"><Link href="/inquiry" className="companyDropdownToggle">고객센터</Link><div className="companyDropdownMenu"><Link href="/inquiry">홈페이지 문의하기</Link>{kakaoChannelUrl && <a href={kakaoChannelUrl} target="_blank" rel="noopener noreferrer">카카오톡 문의하기</a>}</div></div>{isAdmin && <Link className="adminNavLink" href="/admin">관리자업무</Link>}
      </nav>
      <div className="headerActions">
        {loaded && session ? (
          <div className="accountDropdown">
            <button type="button" className="accountDropdownToggle" aria-haspopup="true" aria-expanded={accountOpen} onClick={() => setAccountOpen((value) => !value)}><span className="signedUser" title={`${username}님`}>{username}님</span><span className={`accountChevron ${accountOpen ? "isOpen" : ""}`}>⌄</span></button>
            {accountOpen && (
              <div className="accountDropdownMenu">
                <div className="accountIdentity"><div className="accountIdentityTop"><b>{username}님</b><Link className="accountProfileEdit" href="/mypage/profile" onClick={() => setAccountOpen(false)}>회원정보 수정</Link></div>{(session?.profile?.company_name || companyName) && <span>{session?.profile?.company_name || `${companyName} 거래처`}</span>}</div>
                <div className="accountStatusRow"><span>계정 상태</span><b>{isAdmin ? "관리자 계정" : session?.profile?.status === "approved" ? "승인 완료" : session?.profile?.status === "rejected" ? "승인 거절" : "승인 대기"}</b></div>
                <div className="accountMenuLinks"><Link href="/mypage" onClick={() => setAccountOpen(false)}>마이페이지</Link><Link href="/payment" onClick={() => setAccountOpen(false)}>카드결제</Link></div>
                <button type="button" className="accountLogout" onClick={logout}>로그아웃</button>
              </div>
            )}
          </div>
        ) : <Link href="/login">로그인</Link>}
        {loaded && session && !isAdmin && session?.profile?.status === "approved" && (
          <Link href="/cart" className="headerCartLink headerCartPageLink" aria-label={`장바구니 보기, ${cartQty}개`} title="장바구니"><CartIcon className="headerCartIcon"/>{cartQty>0&&<span className="headerCartBadge">{cartQty>99?"99+":cartQty}</span>}</Link>
        )}
        <Link className="partnerApply" href="/signup">거래처 신청</Link>
      </div>
      <MobileNav session={session} loaded={loaded} onLogout={logout} siteSettings={siteSettings} />
    </header>
  );
}
