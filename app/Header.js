"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import MobileNav from "./MobileNav";

export default function Header({ siteSettings = {} }) {
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartPreview, setCartPreview] = useState([]);
  const cartDropdownRef = useRef(null);
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
    try { const saved = JSON.parse(localStorage.getItem("shinnong-cart") || "{}"); setCartPreview(Object.entries(saved).map(([id, item]) => ({ id, ...item, quantity: Math.max(1, Number(item?.quantity || 1)) }))); } catch { setCartPreview([]); }
  }, []);

  useEffect(() => { refreshCartPreview(); const handleCartChanged = () => refreshCartPreview(); window.addEventListener("shinnong-cart-changed", handleCartChanged); window.addEventListener("storage", handleCartChanged); return () => { window.removeEventListener("shinnong-cart-changed", handleCartChanged); window.removeEventListener("storage", handleCartChanged); }; }, [pathname, refreshCartPreview]);
  useEffect(() => { if (!cartOpen) return; const handleOutsideClick = (event) => { if (cartDropdownRef.current && !cartDropdownRef.current.contains(event.target)) setCartOpen(false); }; document.addEventListener("pointerdown", handleOutsideClick); return () => document.removeEventListener("pointerdown", handleOutsideClick); }, [cartOpen]);

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); setSession(null); setAccountOpen(false); window.dispatchEvent(new Event("shinnong-auth-changed")); router.push("/"); router.refresh(); };
  const isAdmin = session?.profile?.role === "admin";
  const username = session?.profile?.username || "회원";
  const removeCartItem = (id) => { try { const saved = JSON.parse(localStorage.getItem("shinnong-cart") || "{}"); delete saved[id]; localStorage.setItem("shinnong-cart", JSON.stringify(saved)); refreshCartPreview(); window.dispatchEvent(new Event("shinnong-cart-changed")); } catch {} };
  const clearCart = () => { if (!window.confirm("장바구니의 모든 상품을 삭제할까요?")) return; try { localStorage.removeItem("shinnong-cart"); refreshCartPreview(); window.dispatchEvent(new Event("shinnong-cart-changed")); } catch {} };
  const cartQty = cartPreview.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <header className="header">
      <Link href="/" className="logoWrap" aria-label={companyName ? `${companyName} 홈` : "홈"}>{logoHeaderPath && <img src={logoHeaderPath} alt={[companyName, companyNameEn].filter(Boolean).join(" ")} className="logoImg" />}</Link>
      <nav className="mainNav">
        <Link href="/company">회사소개</Link><Link href="/products">약재 주문</Link><Link href="/order-delivery">주문·배송 안내</Link>{kakaoChannelUrl && <a href={kakaoChannelUrl} target="_blank" rel="noopener noreferrer">고객센터</a>}{isAdmin && <Link className="adminNavLink" href="/admin">관리자업무</Link>}
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
          <div className="headerCartDropdown" ref={cartDropdownRef}>
            <button type="button" className="headerCartLink" aria-label="장바구니" title="장바구니" aria-expanded={cartOpen} onClick={() => { refreshCartPreview(); setCartOpen((value) => !value); setAccountOpen(false); }}><svg className="headerCartIcon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 4H5L7.2 14.2C7.4 15.1 8.2 15.8 9.2 15.8H17.1C18.1 15.8 18.9 15.1 19.1 14.2L20.4 8H6.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="19" r="1.25" fill="currentColor" /><circle cx="17" cy="19" r="1.25" fill="currentColor" /></svg>{cartQty > 0 && <span className="headerCartBadge">{cartQty > 99 ? "99+" : cartQty}</span>}</button>
            {cartOpen && <div className="headerCartMenu"><div className="headerCartMenuHead"><b>장바구니</b><span>{cartQty}개</span></div>{cartPreview.length ? <div className="headerCartPreviewItems">{cartPreview.slice(0, 5).map((item) => <div className="headerCartPreviewItem" key={item.id}><div><b>{item.name || "상품명 확인 필요"}</b><span>{item.weight || ""}{item.origin ? ` · ${item.origin}` : ""}</span></div><em style={{ marginRight: "24px" }}>{item.quantity}개</em><button type="button" className="headerCartRemove" style={{ background: "transparent", border: 0, padding: 0, color: "#68766f", width: "24px", height: "24px" }} aria-label={`${item.name || "상품"} 삭제`} title="삭제" onClick={() => removeCartItem(item.id)}>×</button></div>)}{cartPreview.length > 5 && <p className="headerCartMore">외 {cartPreview.length - 5}개 품목</p>}</div> : <div className="headerCartEmpty">담긴 상품이 없습니다.</div>}<div className="headerCartMenuActions"><Link className="headerCartView" href="/products?cart=1" onClick={() => setCartOpen(false)}>장바구니 보기</Link>{cartPreview.length > 0 && <button type="button" className="headerCartClear" onClick={clearCart}>장바구니 전체 비우기</button>}</div></div>}
          </div>
        )}
        <div className="partnerDropdown"><button type="button" className="partnerApply partnerDropdownToggle" aria-haspopup="true">거래처 신청</button><div className="partnerDropdownMenu"><Link href="/inquiry">홈페이지 문의하기</Link>{kakaoChannelUrl && <a href={kakaoChannelUrl} target="_blank" rel="noopener noreferrer">카카오톡 문의하기</a>}</div></div>
      </div>
      <MobileNav session={session} loaded={loaded} onLogout={logout} siteSettings={siteSettings} />
    </header>
  );
}
