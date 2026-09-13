"use client";

import { useMemo, useState } from "react";

const CHOSUNG = ["전체","ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const INITIALS = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const DEMO = [
  ["인삼","insam","국내산"],["황기","hwanggi","국내산"],["당귀","danggwi","국내산"],["대추","daechu","국내산"],["구기자","gugija","국내산"],["백작약","baekjakyak","국내산"],
  ["감초","gamcho","국내산"],["계피","gyepi","베트남산"],["천궁","cheongung","국내산"],["복령","bokryeong","국내산"],["백출","baekchul","국내산"],["숙지황","sukjihwang","국내산"],
  ["생강","saenggang","국내산"],["산약","sanyak","국내산"],["연자육","yeonjayuk","국내산"],["홍화","honghwa","국내산"],["맥문동","maekmundong","국내산"],["오미자","omija","국내산"]
].map((x,i)=>({id:`demo-${i+1}`,name:x[0],weight:"600g",origin:x[2],supplier:"",image_url:`/products-demo/${x[1]}.jpg`,price:null,demo:true}));

function getInitial(text="") { const ch=text.trim().charAt(0); if(!ch)return""; const code=ch.charCodeAt(0); if(code<0xac00||code>0xd7a3)return ch.toUpperCase(); return INITIALS[Math.floor((code-0xac00)/588)]||""; }
function money(value) { if(value===null||value===undefined||value==="")return "단가 문의"; return `${Number(value).toLocaleString("ko-KR")}원`; }

export default function ProductsClient({ products = [], companyName = "" }) {
  const displayProducts=products.length?products:DEMO;
  const [query,setQuery]=useState(""); const [initial,setInitial]=useState("전체"); const [quantities,setQuantities]=useState({}); const [cart,setCart]=useState({}); const [deliveryRequest,setDeliveryRequest]=useState("당일"); const [message,setMessage]=useState(""); const [mobileCartOpen,setMobileCartOpen]=useState(false);
  const filtered=useMemo(()=>displayProducts.filter(p=>{const q=query.trim().toLowerCase(); return (!q||`${p.name} ${p.weight||""} ${p.origin||""} ${p.supplier||""}`.toLowerCase().includes(q))&&(initial==="전체"||getInitial(p.name)===initial)}),[displayProducts,query,initial]);
  const cartItems=Object.values(cart); const totalQty=cartItems.reduce((s,i)=>s+i.quantity,0); const totalPrice=cartItems.reduce((s,i)=>s+(Number(i.price||0)*i.quantity),0);
  const addToCart=p=>{const qty=Math.max(1,Number(quantities[p.id]||1));setCart(prev=>({...prev,[p.id]:{...p,quantity:(prev[p.id]?.quantity||0)+qty}}));setMessage("")};
  const changeCartQty=(id,delta)=>setCart(prev=>{const item=prev[id];if(!item)return prev;const next=item.quantity+delta;if(next<=0){const c={...prev};delete c[id];return c}return{...prev,[id]:{...item,quantity:next}}});
  const removeCart=id=>setCart(prev=>{const c={...prev};delete c[id];return c});
  const prepareOrder=()=>{if(!cartItems.length)return;setMessage("주문 접수 기능은 주문 데이터 연결 후 활성화됩니다.")};

  return <section className="productSection contentWidth">
    <div className="productIntro"><h1>한약재 제품안내</h1><p>원하시는 품목을 검색하고 거래처에 적용된 단가로 바로 주문할 수 있습니다. <strong>(약재의 단가는 수급현황에 따라 달라질 수 있습니다)</strong></p></div>
    <div className="catalogToolbar"><div className="initialFilter" aria-label="가나다 필터">{CHOSUNG.map(ch=><button key={ch} className={initial===ch?"active":""} onClick={()=>setInitial(ch)}>{ch}</button>)}</div><div className="productSearch"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="제품명으로 검색하세요."/><span>검색</span></div></div>
    <div className="catalogNotice"><span>ⓘ</span><p>한약재 제품을 검색하고 주문할 수 있습니다. <b>(약재의 단가는 수급현황에 따라 달라질 수 있습니다.)</b></p><em>총 {filtered.length}개 제품</em></div>
    <div className="catalogGrid">{filtered.length?filtered.map(product=><article className="catalogCard" key={product.id}>
      <div className="catalogImage">{product.image_url?<img src={product.image_url} alt={product.name}/>:<span>{product.name?.slice(0,1)||"약"}</span>}</div>
      <div className="catalogInfo"><h2>{product.name}</h2><p>{product.origin||"원산지 정보 준비 중"}</p><p>{product.weight||""}{product.supplier?` · ${product.supplier}`:""}</p><div className="catalogPrice"><span>단가</span><b>{money(product.price)}</b></div></div>
      <div className="catalogOrder"><div className="qtyBox"><button onClick={()=>setQuantities(q=>({...q,[product.id]:Math.max(1,Number(q[product.id]||1)-1)}))}>−</button><input type="number" min="1" value={quantities[product.id]||1} onChange={e=>setQuantities(q=>({...q,[product.id]:e.target.value}))}/><button onClick={()=>setQuantities(q=>({...q,[product.id]:Number(q[product.id]||1)+1}))}>＋</button></div><button className="addCart" onClick={()=>addToCart(product)}>주문담기</button></div>
    </article>):<div className="productEmpty">조건에 맞는 제품이 없습니다.</div>}</div>
    <button className="desktopCartFloat" onClick={()=>setMobileCartOpen(true)}>주문 목록 <b>{totalQty}</b></button>
    <div className="mobileCartBar" onClick={()=>setMobileCartOpen(true)}><span>주문 목록</span><b>{totalQty}개 · {money(totalPrice)}</b></div>
    {mobileCartOpen&&<div className="mobileCartOverlay" onClick={()=>setMobileCartOpen(false)}><div className="mobileCartSheet" onClick={e=>e.stopPropagation()}><button className="mobileCartClose" onClick={()=>setMobileCartOpen(false)}>닫기</button><CartPanel items={cartItems} totalPrice={totalPrice} deliveryRequest={deliveryRequest} setDeliveryRequest={setDeliveryRequest} changeCartQty={changeCartQty} removeCart={removeCart} prepareOrder={prepareOrder} message={message} companyName={companyName}/></div></div>}
  </section>;
}

function CartPanel({items,totalPrice,deliveryRequest,setDeliveryRequest,changeCartQty,removeCart,prepareOrder,message,companyName}){return <aside className="orderCart mobile"><div className="orderCartHead"><h2>주문 목록</h2>{companyName&&<span>{companyName}</span>}</div>{items.length?<><div className="orderCartItems">{items.map(item=><div className="orderCartItem" key={item.id}><div><b>{item.name}</b><span>{item.weight||""}</span><em>{money(item.price)}</em></div><div className="cartQty"><button onClick={()=>changeCartQty(item.id,-1)}>−</button><span>{item.quantity}</span><button onClick={()=>changeCartQty(item.id,1)}>+</button></div><button className="cartRemove" onClick={()=>removeCart(item.id)}>삭제</button></div>)}</div><label className="deliveryRequest"><span>배송 요청사항</span><select value={deliveryRequest} onChange={e=>setDeliveryRequest(e.target.value)}><option>당일</option><option>익일 오전</option></select></label><div className="orderTotal"><span>주문 예상금액</span><b>{money(totalPrice)}</b></div>{message&&<p className="orderCartMessage">{message}</p>}<button className="orderSubmit" onClick={prepareOrder}>주문하기</button></>:<div className="cartEmpty">주문할 제품을 담아주세요.</div>}</aside>}
