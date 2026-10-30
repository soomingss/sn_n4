"use client";

import { useEffect, useMemo, useState } from "react";
import ProductImage from "../ProductImage";
import HerbDetails from "./HerbDetails";
import Link from "next/link";
import CartIcon from "../CartIcon";
import {cartQuantity,restoreCart} from "../lib/cart";
import {productSpecs} from "../lib/product-display";

const CHOSUNG = ["전체","ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const PAGE_SIZE = 6;
const INITIALS = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

function getInitial(text="") {
  const ch=text.trim().charAt(0); if(!ch) return "";
  const code=ch.charCodeAt(0); if(code<0xac00||code>0xd7a3) return ch.toUpperCase();
  return INITIALS[Math.floor((code-0xac00)/588)]||"";
}
function money(v){if(v===null||v===undefined||v==="")return"단가 문의";return`${Number(v).toLocaleString("ko-KR")}원`}

export default function ProductsClient({products=[],companyName="",adminManual=false,partners=[],pricesByGrade={},adminPricePreview=false,adminPrices={},parcelShippingNotice="",cartPage=false}){
  const [query,setQuery]=useState("");
  const [detailProduct,setDetailProduct]=useState(null);
  const [previewGrade,setPreviewGrade]=useState("clinic");
  const [initial,setInitial]=useState("전체");
  const [page,setPage]=useState(1);
  const [quantities,setQuantities]=useState({});
  const [cart,setCart]=useState({});
  const [cartLoaded,setCartLoaded]=useState(false);
  const [deliveryRequest,setDeliveryRequest]=useState("당일");
  const [message,setMessage]=useState("");
  const [mobileCartOpen,setMobileCartOpen]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [afterCutoff,setAfterCutoff]=useState(false);
  const [editOrderId,setEditOrderId]=useState(null);
  const [manualUserId,setManualUserId]=useState(partners[0]?.id||"");
  const [orderSource,setOrderSource]=useState("kakao");

  const manualPartner=adminManual?partners.find(p=>p.id===manualUserId):null;
  const activeGrade=manualPartner?.price_grade;
  const activeProducts=adminManual?products.map(p=>({...p,price:pricesByGrade?.[String(activeGrade)]?.[String(p.id)]??pricesByGrade?.clinic?.[String(p.id)]??null})):adminPricePreview?products.map(p=>({...p,price:adminPrices?.[previewGrade]?.[String(p.id)]??adminPrices?.clinic?.[String(p.id)]??p.price})):products;
  const filtered=useMemo(()=>activeProducts.filter(p=>{const q=query.trim().toLowerCase();return(!q||`${p.name} ${productSpecs(p)}`.toLowerCase().includes(q))&&(initial==="전체"||getInitial(p.name)===initial)}),[activeProducts,query,initial]);
  useEffect(()=>setPage(1),[query,initial]);

  useEffect(()=>{
    if(adminManual)return;
    const params=new URLSearchParams(window.location.search);
    const check=()=>{const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Seoul",hour:"2-digit",hour12:false}).formatToParts(new Date());setAfterCutoff(Number(parts.find(x=>x.type==="hour")?.value||0)>=11)};
    check(); const t=setInterval(check,30000);
    try{const saved=JSON.parse(localStorage.getItem("shinnong-cart")||"{}"),next=restoreCart(saved,activeProducts);setCart(next);persistCart(next);if(Object.keys(saved||{}).length>Object.keys(next).length)setMessage("현재 주문할 수 없는 품목은 목록에서 제외되었습니다.")}catch{}finally{setCartLoaded(true)}
    const syncStorage=event=>{if(event.key!=="shinnong-cart"&&event.key!==null)return;try{setCart(restoreCart(JSON.parse(localStorage.getItem("shinnong-cart")||"{}"),activeProducts))}catch{}};
    window.addEventListener("storage",syncStorage);
    const reorder=params.get("reorder"),edit=params.get("edit");
    if(reorder||edit)(async()=>{try{const r=await fetch(`/api/orders/reorder?id=${encodeURIComponent(reorder||edit)}`),d=await r.json();if(!r.ok)throw new Error(d.error||"주문을 불러오지 못했습니다.");if(edit&&d.order?.status!=="new")throw new Error("준비가 시작된 주문은 수정할 수 없습니다.");const next={};for(const old of d.items||[]){const cur=activeProducts.find(p=>String(p.id)===String(old.product_id));if(cur&&cur.stock_status!=="low")next[cur.id]={...cur,quantity:old.quantity}}setCart(next);persistCart(next);if(edit){setEditOrderId(edit);setDeliveryRequest(d.order?.delivery_request||"익일");setMessage("")}else setMessage((d.items||[]).length>Object.keys(next).length?"현재 품절된 품목은 제외되었습니다.":"")}catch(e){setMessage(e.message)}})();
    if(params.get("cart")==="1"&&window.innerWidth<=950)setMobileCartOpen(true);
    return()=>{clearInterval(t);window.removeEventListener("storage",syncStorage)};
  },[]);

  const pageCount=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const currentPage=Math.min(page,pageCount);
  const visible=filtered.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE);
  const cartItems=Object.values(cart);
  const totalQty=cartItems.reduce((s,i)=>s+i.quantity,0);
  const totalPrice=cartItems.reduce((s,i)=>s+Number(i.price||0)*i.quantity,0);
  const persistCart=next=>{if(adminManual)return;try{const out={};for(const item of Object.values(next))out[item.id]={name:item.name,weight:item.weight||"",origin:item.origin||"",supplier:item.supplier||"",price:item.price,quantity:item.quantity};localStorage.setItem("shinnong-cart",JSON.stringify(out));window.dispatchEvent(new Event("shinnong-cart-changed"))}catch{}};
  const addToCart=p=>{const qty=cartQuantity(quantities[p.id]||1);setCart(prev=>{const next={...prev,[p.id]:{...p,quantity:(prev[p.id]?.quantity||0)+qty}};persistCart(next);return next});setMessage("")};
  const changeCartQty=(id,delta)=>setCart(prev=>{const item=prev[id];if(!item)return prev;const n=item.quantity+delta,next={...prev};if(n<=0)delete next[id];else next[id]={...item,quantity:n};persistCart(next);return next});
  const clearCart=()=>{if(window.confirm("담은 약재를 모두 삭제할까요?")){setCart({});persistCart({});setMessage("")}};
  const setCartQty=(id,value)=>setCart(prev=>{if(!prev[id])return prev;const next={...prev,[id]:{...prev[id],quantity:cartQuantity(value)}};persistCart(next);return next});
  const removeCart=id=>setCart(prev=>{const next={...prev};delete next[id];persistCart(next);return next});

  const prepareOrder=async()=>{
    if(!cartItems.length||submitting)return;
    if(afterCutoff&&deliveryRequest==="당일"){setMessage("오전 11시 이후 주문은 익일 배송만 가능합니다.");return}
    setSubmitting(true); setMessage(editOrderId?"주문을 수정하고 있습니다.":"주문을 접수하고 있습니다.");
    try{
      if(adminManual&&!manualUserId)throw new Error("거래처를 선택해주세요.");
      const endpoint=adminManual?"/api/admin/orders/manual":"/api/orders";
      const payload={items:cartItems.map(i=>({product_id:i.id,quantity:i.quantity})),delivery_request:deliveryRequest};
      if(adminManual){payload.user_id=manualUserId;payload.order_source=orderSource}
      let method="POST";
      if(editOrderId&&!adminManual){method="PATCH";payload.id=Number(editOrderId);payload.action="edit"}
      else if(!adminManual){let key=sessionStorage.getItem("shinnong-order-key");if(!key){key=crypto.randomUUID();sessionStorage.setItem("shinnong-order-key",key)}payload.request_key=key}
      const response=await fetch(endpoint,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await response.json();
      if(!response.ok)throw new Error(data?.error||"주문 처리에 실패했습니다.");
      setCart({}); setQuantities({});
      if(!adminManual)try{localStorage.removeItem("shinnong-cart");window.dispatchEvent(new Event("shinnong-cart-changed"));sessionStorage.removeItem("shinnong-order-key")}catch{}
      const completedOrderId=editOrderId||data.order_id;
      if(!adminManual&&completedOrderId){window.location.href=`/mypage/orders/${encodeURIComponent(completedOrderId)}`;return}
      setMessage(`주문이 접수되었습니다. 주문번호 #${data.order_id}`); setEditOrderId(null);
    }catch(e){setMessage(e.message||"주문 처리에 실패했습니다.")}
    finally{setSubmitting(false)}
  };

  if(cartPage)return <section className="cartPage contentWidth">
    <div className="cartPageIntro"><div><CartIcon size={32}/><h2>주문할 약재를 확인해 주세요</h2><p>{cartLoaded?`${cartItems.length}개 품목 · ${totalQty}개`:"담은 상품을 불러오고 있습니다."}</p></div><div className="cartPageActions">{cartItems.length>0&&<button type="button" className="cartClearAll" disabled={submitting} onClick={clearCart}>전체 비우기</button>}<Link className="cartContinue" href="/products">쇼핑 계속하기</Link></div></div>
    {!cartLoaded?<p className="cartLoading" role="status">상품과 가격을 확인하고 있습니다.</p>:<CartPanel fullPage setCartQty={setCartQty} parcelShippingNotice={parcelShippingNotice} items={cartItems} totalPrice={totalPrice} deliveryRequest={deliveryRequest} setDeliveryRequest={setDeliveryRequest} changeCartQty={changeCartQty} removeCart={removeCart} prepareOrder={prepareOrder} message={message} submitting={submitting} afterCutoff={afterCutoff} editOrderId={editOrderId} companyName={companyName}/>}
  </section>;

  return (
    <section className="productSection contentWidth">
      <div className={adminManual?"productIntro":"productIntro withCartLink"}>
        {!adminManual&&<Link className="catalogCartLink" href="/cart" aria-label={`장바구니 보기, ${totalQty}개`}><CartIcon size={28}/>{totalQty>0&&<span>{totalQty>99?"99+":totalQty}</span>}</Link>}
        <h1>{adminManual?"수기 주문 등록":"한약재 주문"}</h1>
        <p>{adminManual?"거래처를 선택한 뒤 일반 주문과 동일하게 상품을 담아 주문을 등록합니다.":<>원하시는 품목을 검색하고 바로 주문할 수 있습니다. <strong>(약재의 단가는 수급현황에 따라 달라질 수 있습니다)</strong></>}</p>
      </div>
      {adminManual&&(
        <div className="manualOrderSetup">
          <label><span>거래처</span><select value={manualUserId} onChange={e=>{setManualUserId(e.target.value);setCart({});setQuantities({});setMessage("")}}><option value="">거래처 선택</option>{partners.map(p=><option key={p.id} value={p.id}>{p.company_name}{p.price_grade?` (${p.price_grade}등급)`:""}</option>)}</select></label>
          <label><span>주문경로</span><select value={orderSource} onChange={e=>setOrderSource(e.target.value)}><option value="kakao">카카오톡</option><option value="other">기타</option></select></label>
        </div>
      )}
      {adminPricePreview&&!adminManual&&<div className="adminPricePreview"><label htmlFor="adminPricePreviewGrade">가격 구분</label><select id="adminPricePreviewGrade" value={previewGrade} onChange={e=>{setPreviewGrade(e.target.value);setCart({});setQuantities({});setMessage("")}}><option value="clinic">한의원</option><option value="oem">OEM공장</option><option value="special">특별관리대상</option></select></div>}
      <div className="productOrderLayout">
        <div className="productCatalog">
          <div className="catalogSearchRow"><div className="productSearch v21Search catalogSearch"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="약재명, 원산지 검색" aria-label="약재 검색"/><button type="button" className="catalogSearchButton" onClick={()=>setPage(1)}>⌕ 검색</button></div></div>
          <div className="v21Filter"><div className="initialFilter">{CHOSUNG.map(ch=><button key={ch} className={initial===ch?"active":""} onClick={()=>setInitial(ch)}>{ch}</button>)}</div></div>
          <p className="herbDetailHelp">사진을 누르면 약재의 상세 설명을 볼 수 있습니다.</p>
          <div className="productList">
            {visible.length?visible.map(product=>(
              <article className="productCard" key={product.id}>
                <button type="button" className="productThumb productPhotoButton" aria-label={`${product.name} 약재 설명 보기`} aria-haspopup="dialog" onClick={()=>setDetailProduct(product)}><ProductImage src={product.image_url} name={product.name}/><span className="productPhotoOpenHint" aria-hidden="true">＋</span></button>
                <div className="productInfo"><h2>{product.name}</h2><p>{productSpecs(product)}</p><div className="productPrice"><b>{money(product.price)}</b><em className={product.stock_status==="low"?"soldOut":""}>{product.stock_status==="low"?"품절":"재고 있음"}</em></div></div>
                <div className={`productOrderControls ${product.stock_status==="low"?"disabled":""}`}>
                  <label><span>수량</span><div className="v21Qty"><button disabled={product.stock_status==="low"} onClick={()=>setQuantities(q=>({...q,[product.id]:Math.max(1,Number(q[product.id]||1)-1)}))}>−</button><input disabled={product.stock_status==="low"} type="number" min="1" value={quantities[product.id]||1} onChange={e=>setQuantities(q=>({...q,[product.id]:e.target.value}))}/><button disabled={product.stock_status==="low"} onClick={()=>setQuantities(q=>({...q,[product.id]:Number(q[product.id]||1)+1}))}>＋</button></div></label>
                  <div className="productActionButtons"><button className="productCartIconButton" disabled={product.stock_status==="low"} onClick={()=>addToCart(product)} aria-label={product.stock_status==="low"?"품절":"장바구니에 담기"}>{product.stock_status==="low"?<span>품절</span>:<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2c.2.9 1 1.6 2 1.6h7.9c1 0 1.8-.7 2-1.6L20.4 8H6.1"/><circle cx="10" cy="19" r="1.25"/><circle cx="17" cy="19" r="1.25"/></svg>}</button></div>
                </div>
              </article>
            )):<div className="productEmpty">조건에 맞는 제품이 없습니다.</div>}
          </div>
          {pageCount>1&&<div className="v21Pagination"><button disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>‹</button>{Array.from({length:Math.min(9,pageCount)},(_,i)=>{const start=Math.min(Math.max(1,currentPage-4),Math.max(1,pageCount-8));const n=start+i;return <button key={n} className={n===currentPage?"active":""} onClick={()=>setPage(n)}>{n}</button>})}<button disabled={currentPage===pageCount} onClick={()=>setPage(p=>Math.min(pageCount,p+1))}>›</button></div>}
        </div>
        <CartPanel parcelShippingNotice={parcelShippingNotice} items={cartItems} totalPrice={totalPrice} deliveryRequest={deliveryRequest} setDeliveryRequest={setDeliveryRequest} changeCartQty={changeCartQty} removeCart={removeCart} prepareOrder={prepareOrder} message={message} submitting={submitting} afterCutoff={afterCutoff} editOrderId={editOrderId} companyName={adminManual?(manualPartner?.company_name||""):companyName}/>
      </div>
      {adminManual?<div className="mobileCartBar" onClick={()=>setMobileCartOpen(true)}><span>주문 목록</span><b>{totalQty}개 · {money(totalPrice)}</b></div>:<Link className="mobileCartBar mobileCartIconBar" href="/cart" aria-label="장바구니 보기"><CartIcon size={26}/><b>{totalQty}개 · {money(totalPrice)}</b></Link>}
      {mobileCartOpen&&<div className="mobileCartOverlay" onClick={()=>setMobileCartOpen(false)}><div className="mobileCartSheet" onClick={e=>e.stopPropagation()}><button className="mobileCartClose" onClick={()=>setMobileCartOpen(false)}>닫기</button><CartPanel parcelShippingNotice={parcelShippingNotice} items={cartItems} totalPrice={totalPrice} deliveryRequest={deliveryRequest} setDeliveryRequest={setDeliveryRequest} changeCartQty={changeCartQty} removeCart={removeCart} prepareOrder={prepareOrder} message={message} submitting={submitting} afterCutoff={afterCutoff} editOrderId={editOrderId} companyName={adminManual?(manualPartner?.company_name||""):companyName}/></div></div>}
      {detailProduct&&<HerbDetails product={detailProduct} onClose={()=>setDetailProduct(null)}/>}
    </section>
  );
}

function CartPanel({items,totalPrice,deliveryRequest,setDeliveryRequest,changeCartQty,removeCart,prepareOrder,message,submitting,afterCutoff,editOrderId,companyName,parcelShippingNotice,fullPage=false,setCartQty}){
  return (
    <aside className={fullPage?"orderCart fullCart":"orderCart"}>
      <div className="orderCartHead"><h2>주문 목록</h2>{companyName&&<span>{companyName}</span>}</div>
      {items.length?<>
        {fullPage?<div className="fullCartItems" role="list">{items.map(item=><article className="fullCartItem" key={item.id} role="listitem">
          <div className="fullCartPhoto"><ProductImage src={item.image_url} name={item.name}/></div>
          <div className="fullCartProduct"><h3>{item.name}</h3><p>{productSpecs(item)}</p><span>단가 {money(item.price)}</span></div>
          <div className="fullCartQty"><button type="button" disabled={item.quantity<=1||submitting} onClick={()=>changeCartQty(item.id,-1)} aria-label={`${item.name} 수량 줄이기`}>−</button><input type="number" min="1" step="1" disabled={submitting} value={item.quantity} onChange={e=>setCartQty(item.id,e.target.value)} aria-label={`${item.name} 수량`}/><button type="button" disabled={submitting} onClick={()=>changeCartQty(item.id,1)} aria-label={`${item.name} 수량 늘리기`}>＋</button></div>
          <div className="fullCartLineTotal"><span>상품금액</span><b>{money(item.price==null?null:Number(item.price)*item.quantity)}</b></div>
          <button type="button" className="fullCartRemove" disabled={submitting} onClick={()=>removeCart(item.id)} aria-label={`${item.name} 삭제`}>삭제</button>
        </article>)}</div>:<div className="orderCartItems">{items.map(item=><div className="orderCartItem" key={item.id}><div><b>{item.name}</b><span>{item.weight||""}</span><em>{money(item.price)}</em></div><div className="cartQty"><button onClick={()=>changeCartQty(item.id,-1)}>−</button><span>{item.quantity}</span><button onClick={()=>changeCartQty(item.id,1)}>+</button></div><button className="cartRemove" onClick={()=>removeCart(item.id)}>삭제</button></div>)}</div>}
        <div className={fullPage?"fullCartCheckout":"cartCheckout"}>
        <label className="deliveryRequest"><span>배송 요청사항</span><select value={deliveryRequest} onChange={e=>setDeliveryRequest(e.target.value)}><option value="당일">당일 (오전 11시 이전 주문시 가능)</option><option value="익일">익일</option></select></label>
        <div className="orderTotal"><span>{fullPage?"총 상품금액":"주문 예상금액"}</span><b>{money(totalPrice)}</b></div>
        {parcelShippingNotice&&<p className="orderShippingNotice">{parcelShippingNotice}</p>}
        {afterCutoff&&deliveryRequest==="당일"&&<p className="orderCartMessage">오전 11시 이후 주문은 익일 배송만 가능합니다.</p>}
        {message&&<p className="orderCartMessage">{message}</p>}
        <a className="orderPolicyLink" href="/order-delivery/returns#refund-policy" target="_blank" rel="noopener noreferrer" aria-label="교환·반품 및 환불 안내 보기 (새 창)">교환·반품 및 환불 안내 보기 ↗</a>
        <div className="orderCartActions"><button className="orderSubmit" disabled={submitting||(afterCutoff&&deliveryRequest==="당일")} onClick={prepareOrder}>{submitting?"처리중...":editOrderId?"주문 수정 저장":"주문하기"}</button></div>
        </div>
      </>:fullPage?<div className="fullCartEmpty"><CartIcon size={56}/><h3>아직 담은 약재가 없습니다.</h3><p>{message||"약재주문 화면에서 필요한 상품을 담아 주세요."}</p><Link className="cartContinue" href="/products">약재 둘러보기</Link></div>:<div className="cartEmpty">주문할 제품을 담아주세요.</div>}
    </aside>
  );
}
