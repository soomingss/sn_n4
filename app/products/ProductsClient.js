"use client";

import { useMemo, useState } from "react";

const CHOSUNG = ["전체","ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const INITIALS = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

function getInitial(text="") {
  const ch = text.trim().charAt(0);
  if (!ch) return "";
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return ch.toUpperCase();
  return INITIALS[Math.floor((code - 0xac00) / 588)] || "";
}

function money(value) {
  if (value === null || value === undefined || value === "") return "단가 문의";
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

export default function ProductsClient({ products = [], companyName = "" }) {
  const [query, setQuery] = useState("");
  const [initial, setInitial] = useState("전체");
  const [quantities, setQuantities] = useState({});
  const [cart, setCart] = useState({});
  const [deliveryRequest, setDeliveryRequest] = useState("당일");
  const [message, setMessage] = useState("");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const filtered = useMemo(() => products.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || `${p.name} ${p.weight || ""} ${p.origin || ""} ${p.supplier || ""}`.toLowerCase().includes(q);
    const matchesInitial = initial === "전체" || getInitial(p.name) === initial;
    return matchesQuery && matchesInitial;
  }), [products, query, initial]);

  const cartItems = Object.values(cart);
  const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (Number(item.price || 0) * item.quantity), 0);

  const addToCart = (product) => {
    const qty = Math.max(1, Number(quantities[product.id] || 1));
    setCart(prev => ({
      ...prev,
      [product.id]: { ...product, quantity: (prev[product.id]?.quantity || 0) + qty }
    }));
    setMessage("");
  };

  const changeCartQty = (id, delta) => {
    setCart(prev => {
      const item = prev[id];
      if (!item) return prev;
      const next = item.quantity + delta;
      if (next <= 0) {
        const copy = { ...prev }; delete copy[id]; return copy;
      }
      return { ...prev, [id]: { ...item, quantity: next } };
    });
  };

  const removeCart = (id) => setCart(prev => { const copy = { ...prev }; delete copy[id]; return copy; });

  const prepareOrder = () => {
    if (!cartItems.length) return;
    setMessage("주문 접수 기능은 주문 데이터 연결 후 활성화됩니다.");
  };

  return <section className="productSection contentWidth">
    <div className="productIntro">
      <h1>한약재 제품안내</h1>
      <p>원하시는 품목을 검색하고 거래처에 적용된 단가로 바로 주문할 수 있습니다. <strong>(약재의 단가는 수급현황에 따라 달라질 수 있습니다)</strong></p>
    </div>

    <div className="productTools">
      <div className="productSearch"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="품목명을 검색해 주세요." /><span>검색</span></div>
      <button className="cartSummaryButton" onClick={()=>setMobileCartOpen(true)}>주문담기 <b>{totalQty}</b></button>
    </div>

    <div className="initialFilter" aria-label="가나다 필터">
      {CHOSUNG.map(ch => <button key={ch} className={initial===ch?"active":""} onClick={()=>setInitial(ch)}>{ch}</button>)}
    </div>

    <div className="productOrderLayout">
      <div className="productList">
        {filtered.length ? filtered.map(product => <article className="productCard" key={product.id}>
          <div className="productThumb">{product.image_url ? <img src={product.image_url} alt={product.name} /> : <span>{product.name?.slice(0,1) || "약"}</span>}</div>
          <div className="productInfo">
            <h2>{product.name}</h2>
            <p>{[product.weight, product.origin, product.supplier].filter(Boolean).join(" · ") || "제품 정보 준비 중"}</p>
            <div className="productPrice"><span>단가</span><b>{money(product.price)}</b></div>
          </div>
          <div className="productOrderControls">
            <label><span>수량</span><input type="number" min="1" value={quantities[product.id] || 1} onChange={e=>setQuantities(q=>({...q,[product.id]:e.target.value}))} /></label>
            <button onClick={()=>addToCart(product)}>주문담기</button>
          </div>
        </article>) : <div className="productEmpty">조건에 맞는 제품이 없습니다.</div>}
      </div>

      <CartPanel items={cartItems} totalPrice={totalPrice} deliveryRequest={deliveryRequest} setDeliveryRequest={setDeliveryRequest} changeCartQty={changeCartQty} removeCart={removeCart} prepareOrder={prepareOrder} message={message} companyName={companyName} />
    </div>

    <div className="mobileCartBar" onClick={()=>setMobileCartOpen(true)}>
      <span>주문 목록</span><b>{totalQty}개 · {money(totalPrice)}</b>
    </div>

    {mobileCartOpen && <div className="mobileCartOverlay" onClick={()=>setMobileCartOpen(false)}>
      <div className="mobileCartSheet" onClick={e=>e.stopPropagation()}>
        <button className="mobileCartClose" onClick={()=>setMobileCartOpen(false)}>닫기</button>
        <CartPanel items={cartItems} totalPrice={totalPrice} deliveryRequest={deliveryRequest} setDeliveryRequest={setDeliveryRequest} changeCartQty={changeCartQty} removeCart={removeCart} prepareOrder={prepareOrder} message={message} companyName={companyName} mobile />
      </div>
    </div>}
  </section>;
}

function CartPanel({ items, totalPrice, deliveryRequest, setDeliveryRequest, changeCartQty, removeCart, prepareOrder, message, companyName, mobile=false }) {
  return <aside className={`orderCart ${mobile?"mobile":""}`}>
    <div className="orderCartHead"><h2>주문 목록</h2>{companyName && <span>{companyName}</span>}</div>
    {items.length ? <>
      <div className="orderCartItems">{items.map(item => <div className="orderCartItem" key={item.id}>
        <div><b>{item.name}</b><span>{item.weight || ""}</span><em>{money(item.price)}</em></div>
        <div className="cartQty"><button onClick={()=>changeCartQty(item.id,-1)}>−</button><span>{item.quantity}</span><button onClick={()=>changeCartQty(item.id,1)}>+</button></div>
        <button className="cartRemove" onClick={()=>removeCart(item.id)}>삭제</button>
      </div>)}</div>
      <label className="deliveryRequest"><span>배송 요청사항</span><select value={deliveryRequest} onChange={e=>setDeliveryRequest(e.target.value)}><option>당일</option><option>익일 오전</option></select></label>
      <div className="orderTotal"><span>주문 예상금액</span><b>{money(totalPrice)}</b></div>
      <p className="orderPriceNote">실제 주문금액은 최종 주문 내용 기준입니다.</p>
      {message && <p className="orderCartMessage">{message}</p>}
      <button className="orderSubmit" onClick={prepareOrder}>주문하기</button>
    </> : <div className="cartEmpty">주문할 제품을 담아주세요.</div>}
  </aside>;
}
