"use client";

import { useEffect, useMemo, useState } from "react";

const CHOSUNG = ["전체","ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const PAGE_SIZE = 6;
const INITIALS = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const DEMO = [
  ["인삼","insam","국내산"],["황기","hwanggi","국내산"],["당귀","danggwi","국내산"],["대추","daechu","국내산"],["구기자","gugija","국내산"],["백작약","baekjakyak","국내산"],
  ["감초","gamcho","국내산"],["계피","gyepi","베트남산"],["천궁","cheongung","국내산"],["복령","bokryeong","국내산"],["백출","baekchul","국내산"],["숙지황","sukjihwang","국내산"],
  ["생강","saenggang","국내산"],["산약","sanyak","국내산"],["연자육","yeonjayuk","국내산"],["홍화","honghwa","국내산"],["맥문동","maekmundong","국내산"],["오미자","omija","국내산"]
].map((x,i)=>({id:`demo-${i+1}`,name:x[0],weight:"600g",origin:x[2],supplier:"",image_url:`/products-demo/${x[1]}.jpg`,price:null,demo:true}));

function getInitial(text="") { const ch=text.trim().charAt(0); if(!ch)return""; const code=ch.charCodeAt(0); if(code<0xac00||code>0xd7a3)return ch.toUpperCase(); return INITIALS[Math.floor((code-0xac00)/588)]||""; }
function money(value) { if(value===null||value===undefined||value==="")return "단가 문의"; return `${Number(value).toLocaleString("ko-KR")}원`; }

export default function ProductsClient({ products = [], companyName = "", adminManual = false, partners = [], pricesByGrade = {} }) {
  const displayProducts=products.length?products:DEMO;
  const [query,setQuery]=useState(""); const [initial,setInitial]=useState("전체"); const [page,setPage]=useState(1); const [quantities,setQuantities]=useState({}); const [cart,setCart]=useState({}); const [deliveryRequest,setDeliveryRequest]=useState("당일"); const [message,setMessage]=useState(""); const [mobileCartOpen,setMobileCartOpen]=useState(false); const [manualUserId,setManualUserId]=useState(partners[0]?.id||""); const [orderSource,setOrderSource]=useState("kakao");
  const manualPartner=adminManual?partners.find(p=>p.id===manualUserId):null; const activeGrade=manualPartner?.price_grade; const activeProducts=adminManual?products.map(p=>({...p,price:pricesByGrade?.[String(activeGrade)]?.[String(p.id)]??null})):displayProducts;
  const filtered=useMemo(()=>activeProducts.filter(p=>{const q=query.trim().toLowerCase(); return (!q||`${p.name} ${p.weight||""} ${p.origin||""} ${p.supplier||""}`.toLowerCase().includes(q))&&(initial==="전체"||getInitial(p.name)===initial)}),[activeProducts,query,initial]);
  useEffect(()=>setPage(1),[query,initial]);
  const pageCount=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)); const currentPage=Math.min(page,pageCount); const visible=filtered.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE);
  const cartItems=Object.values(cart); const totalQty=cartItems.reduce((s,i)=>s+i.quantity,0); const totalPrice=cartItems.reduce((s,i)=>s+(Number(i.price||0)*i.quantity),0);
  const addToCart=p=>{const qty=Math.max(1,Number(quantities[p.id]||1));setCart(prev=>({...prev,[p.id]:{...p,quantity:(prev[p.id]?.quantity||0)+qty}}));setMessage("")};
  const changeCartQty=(id,delta)=>setCart(prev=>{const item=prev[id];if(!item)return prev;const next=item.quantity+delta;if(next<=0){const c={...prev};delete c[id];return c}return{...prev,[id]:{...item,quantity:next}}});
  const removeCart=id=>setCart(prev=>{const c={...prev};delete c[id];return c});
  const prepareOrder=async()=>{
    if(!cartItems.length)return;
    setMessage("주문을 접수하고 있습니다.");
    try{
      if(adminManual&&!manualUserId) throw new Error("거래처를 선택해주세요.");
      const endpoint=adminManual?"/api/admin/orders/manual":"/api/orders";
      const payload={items:cartItems.map(i=>({product_id:i.id,quantity:i.quantity})),delivery_request:deliveryRequest};
      if(adminManual){payload.user_id=manualUserId;payload.order_source=orderSource;}
      const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await response.json();
      if(!response.ok)throw new Error(data?.error||"주문 접수에 실패했습니다.");
      setCart({});setQuantities({});
      setMessage(`주문이 접수되었습니다. 주문번호 #${data.order_id}`);
    }catch(error){setMessage(error.message||"주문 접수에 실패했습니다.")}
  };

  return <section className="productSection contentWidth">
    <div className="productIntro"><h1>{adminManual?"수기 주문 등록":"한약재 제품안내"}</h1><p>{adminManual?"거래처를 선택한 뒤 일반 주문과 동일하게 상품을 담아 주문을 등록합니다.":<>원하시는 품목을 검색하고 바로 주문할 수 있습니다. <strong>(약재의 단가는 수급현황에 따라 달라질 수 있습니다)</strong></>}</p></div>
    {adminManual&&<div className="manualOrderSetup"><label><span>거래처</span><select value={manualUserId} onChange={e=>{setManualUserId(e.target.value);setCart({});setQuantities({});setMessage("")}}><option value="">거래처 선택</option>{partners.map(p=><option key={p.id} value={p.id}>{p.company_name}{p.price_grade?` (${p.price_grade}등급)`:""}</option>)}</select></label><label><span>주문경로</span><select value={orderSource} onChange={e=>setOrderSource(e.target.value)}><option value="kakao">카카오톡</option><option value="other">기타</option></select></label></div>}
    <div className="productOrderLayout">
      <div className="productCatalog">
        <div className="productSearch v21Search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="제품명, 효능, 원산지 등으로 검색해보세요."/><span>검색</span></div>
        <div className="v21Filter"><div className="initialFilter">{CHOSUNG.map(ch=><button key={ch} className={initial===ch?"active":""} onClick={()=>setInitial(ch)}>{ch}</button>)}</div><b>총 {filtered.length}개 제품</b></div>
        <div className="productList">{visible.length?visible.map(product=><article className="productCard" key={product.id}>
          <div className="productThumb">{product.image_url?<img src={product.image_url} alt={product.name}/>:<span>{product.name?.slice(0,1)||"약"}</span>}</div>
          <div className="productInfo"><h2>{product.name}</h2><p>{product.weight||""}{product.origin?`  |  ${product.origin}`:""}{product.supplier?`  |  ${product.supplier}`:""}</p><div className="productPrice"><b>{money(product.price)}</b><em>재고 있음</em></div></div>
          <div className="productOrderControls"><label><span>수량</span><div className="v21Qty"><button onClick={()=>setQuantities(q=>({...q,[product.id]:Math.max(1,Number(q[product.id]||1)-1)}))}>−</button><input type="number" min="1" value={quantities[product.id]||1} onChange={e=>setQuantities(q=>({...q,[product.id]:e.target.value}))}/><button onClick={()=>setQuantities(q=>({...q,[product.id]:Number(q[product.id]||1)+1}))}>＋</button></div></label><button onClick={()=>addToCart(product)}>주문담기</button></div>
        </article>):<div className="productEmpty">조건에 맞는 제품이 없습니다.</div>}</div>
        {pageCount>1&&<div className="v21Pagination"><button disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>‹</button>{Array.from({length:pageCount},(_,i)=>i+1).map(n=><button key={n} className={n===currentPage?"active":""} onClick={()=>setPage(n)}>{n}</button>)}<button disabled={currentPage===pageCount} onClick={()=>setPage(p=>Math.min(pageCount,p+1))}>›</button></div>}
      </div>
      <CartPanel items={cartItems} totalPrice={totalPrice} deliveryRequest={deliveryRequest} setDeliveryRequest={setDeliveryRequest} changeCartQty={changeCartQty} removeCart={removeCart} prepareOrder={prepareOrder} message={message} companyName={adminManual?(manualPartner?.company_name||""):companyName}/>
    </div>
    <div className="mobileCartBar" onClick={()=>setMobileCartOpen(true)}><span>주문 목록</span><b>{totalQty}개 · {money(totalPrice)}</b></div>
    {mobileCartOpen&&<div className="mobileCartOverlay" onClick={()=>setMobileCartOpen(false)}><div className="mobileCartSheet" onClick={e=>e.stopPropagation()}><button className="mobileCartClose" onClick={()=>setMobileCartOpen(false)}>닫기</button><CartPanel items={cartItems} totalPrice={totalPrice} deliveryRequest={deliveryRequest} setDeliveryRequest={setDeliveryRequest} changeCartQty={changeCartQty} removeCart={removeCart} prepareOrder={prepareOrder} message={message} companyName={adminManual?(manualPartner?.company_name||""):companyName}/></div></div>}
  </section>;
}

function CartPanel({items,totalPrice,deliveryRequest,setDeliveryRequest,changeCartQty,removeCart,prepareOrder,message,companyName}){return <aside className="orderCart"><div className="orderCartHead"><h2>주문 목록</h2>{companyName&&<span>{companyName}</span>}</div>{items.length?<><div className="orderCartItems">{items.map(item=><div className="orderCartItem" key={item.id}><div><b>{item.name}</b><span>{item.weight||""}</span><em>{money(item.price)}</em></div><div className="cartQty"><button onClick={()=>changeCartQty(item.id,-1)}>−</button><span>{item.quantity}</span><button onClick={()=>changeCartQty(item.id,1)}>+</button></div><button className="cartRemove" onClick={()=>removeCart(item.id)}>삭제</button></div>)}</div><label className="deliveryRequest"><span>배송 요청사항</span><select value={deliveryRequest} onChange={e=>setDeliveryRequest(e.target.value)}><option value="당일">당일 (오전 11시 이전 주문시 가능)</option><option value="익일">익일</option></select></label><div className="orderTotal"><span>주문 예상금액</span><b>{money(totalPrice)}</b></div>{message&&<p className="orderCartMessage">{message}</p>}<button className="orderSubmit" onClick={prepareOrder}>주문하기</button></>:<div className="cartEmpty">주문할 제품을 담아주세요.</div>}</aside>}
