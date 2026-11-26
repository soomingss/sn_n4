"use client";

import { useEffect, useMemo, useState } from "react";
import ProductImage from "../ProductImage";
import RefundPolicyDialog from "./RefundPolicyDialog";
import HerbDetails from "./HerbDetails";
import { bulkUnitPrice, BULK_MINIMUM, BULK_DISCOUNT_PERCENT } from "../lib/bulk-order";
import ProductComparison from "./ProductComparison";
import { matchesProduct, relatedProductsByName, priceForGrams } from "./catalog-search";
import Link from "next/link";
import CartIcon from "../CartIcon";
import {cartQuantity,restoreCart} from "../lib/cart";
import {productDisplayName,productSpecs} from "../lib/product-display";
import {DELIVERY_REQUEST_MAX_LENGTH} from "../lib/delivery-request";

const CHOSUNG = ["전체","ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const PAGE_SIZE = 6;
const INITIALS = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

function getInitial(text="") {
  const ch=text.trim().charAt(0); if(!ch) return "";
  const code=ch.charCodeAt(0); if(code<0xac00||code>0xd7a3) return ch.toUpperCase();
  return INITIALS[Math.floor((code-0xac00)/588)]||"";
}
function money(v){if(v===null||v===undefined||v==="")return"단가 문의";return`${Number(v).toLocaleString("ko-KR")}원`}

export default function ProductsClient({products=[],companyName="",adminManual=false,partners=[],pricesByGrade={},adminPricePreview=false,adminPrices={},parcelShippingNotice="",cartPage=false,recentOrders=[],kakaoChannelUrl="",deliveryDraftOwner="",refundPolicy}){
  const [query,setQuery]=useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [detailProduct,setDetailProduct]=useState(null);
  const [comparisonIds, setComparisonIds] = useState([]);
  const removeComparison = id => setComparisonIds(ids => ids.filter(selected => selected !== id));
  const [previewGrade,setPreviewGrade]=useState("clinic");
  const [initial,setInitial]=useState("전체");
  const [page,setPage]=useState(1);
  const [quantities,setQuantities]=useState({});
  const [cart,setCart]=useState({});
  const [cartLoaded,setCartLoaded]=useState(false);
  const [deliveryRequest,setDeliveryRequest]=useState("");
  const minimumQuantity = 1;
  const cartHref = "/cart";
  const catalogHref = "/products";
  const cartKey = "shinnong-cart";
  const requestKeyName = "shinnong-order-key";
  const deliveryNoteKey = `shinnong-delivery-note:${deliveryDraftOwner}`;
  const [message,setMessage]=useState("");
  const [recentOrderMessage,setRecentOrderMessage]=useState("");
  const [openRecentOrder, setOpenRecentOrder] = useState(null);
  const [mobileCartOpen,setMobileCartOpen]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [editOrderId,setEditOrderId]=useState(null);
  const [manualUserId,setManualUserId]=useState(partners[0]?.id||"");
  const [orderSource,setOrderSource]=useState("kakao");

  const manualPartner=adminManual?partners.find(p=>p.id===manualUserId):null;
  const activeGrade=manualPartner?.price_grade;
  const activeProducts=adminManual?products.map(p=>({...p,price:pricesByGrade?.[String(activeGrade)]?.[String(p.id)]??pricesByGrade?.clinic?.[String(p.id)]??null})):adminPricePreview?products.map(p=>({...p,price:adminPrices?.[previewGrade]?.[String(p.id)]??adminPrices?.clinic?.[String(p.id)]??p.price})):products;
  const matchingProducts = useMemo(() => activeProducts.filter(product =>
    matchesProduct(product, query) && (initial === "전체" || getInitial(product.name) === initial)
  ), [activeProducts, query, initial]);
  const filtered = inStockOnly
    ? matchingProducts.filter(product => product.stock_status !== "low")
    : matchingProducts;
  const stockFilterEmpty = inStockOnly && matchingProducts.length > 0 && !filtered.length;
  useEffect(()=>setPage(1),[query,initial,inStockOnly]);

  useEffect(()=>{
    if(adminManual)return;
    const params=new URLSearchParams(window.location.search);
    try{const savedRequest=sessionStorage.getItem(deliveryNoteKey);if(savedRequest!==null)setDeliveryRequest(savedRequest.slice(0,DELIVERY_REQUEST_MAX_LENGTH))}catch{}
    try {
      const saved = JSON.parse(localStorage.getItem(cartKey) || "{}") || {};
      const legacyKey = `shinnong-bulk-cart:${deliveryDraftOwner}`;
      const legacyCart = JSON.parse(localStorage.getItem(legacyKey) || "{}") || {};
      for (const [id, item] of Object.entries(legacyCart)) {
        if (!saved[id] || Number(item.quantity) > Number(saved[id].quantity)) saved[id] = item;
      }
      const next = restoreCart(saved, activeProducts);
      setCart(next);
      if (persistCart(next)) localStorage.removeItem(legacyKey);
      if (Object.keys(saved).length > Object.keys(next).length) setMessage("현재 주문할 수 없는 품목은 목록에서 제외되었습니다.");
    } catch {} finally { setCartLoaded(true); }
    const syncStorage=event=>{if(event.key!==cartKey&&event.key!==null)return;try{setCart(restoreCart(JSON.parse(localStorage.getItem(cartKey)||"{}"),activeProducts))}catch{}};
    window.addEventListener("storage",syncStorage);
    const reorder=params.get("reorder"),edit=params.get("edit");
    if(reorder||edit)(async()=>{try{const r=await fetch(`/api/orders/reorder?id=${encodeURIComponent(reorder||edit)}`),d=await r.json();if(!r.ok)throw new Error(d.error||"주문을 불러오지 못했습니다.");if(edit&&d.order?.status!=="new")throw new Error("준비가 시작된 주문은 수정할 수 없습니다.");const next={};for(const old of d.items||[]){const cur=activeProducts.find(p=>String(p.id)===String(old.product_id));if(cur&&cur.stock_status!=="low")next[cur.id]={...cur,quantity:old.quantity}}setCart(next);persistCart(next);if(edit){setEditOrderId(edit);setDeliveryRequest(d.order?.delivery_request||"");setMessage("")}else setMessage((d.items||[]).length>Object.keys(next).length?"현재 품절된 품목은 제외되었습니다.":"")}catch(e){setMessage(e.message)}})();
    if(params.get("cart")==="1"&&window.innerWidth<=950)setMobileCartOpen(true);
    return()=>{window.removeEventListener("storage",syncStorage)};
  },[]);

  const productsById = new Map(activeProducts.map(product => [String(product.id), product]));
  const comparisonProducts = comparisonIds.map(id => productsById.get(String(id))).filter(Boolean);
  const showComparison = product => {
    setComparisonIds(relatedProductsByName(product, activeProducts).map(match => match.id));
    requestAnimationFrame(() => {
      document.getElementById("product-comparison-title")?.scrollIntoView({ block: "start" });
    });
  };
  const pageCount=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const currentPage=Math.min(page,pageCount);
  const visible=filtered.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE);
  const cartItems = Object.values(cart).map(item => ({
    ...item, basePrice: item.price,
    price: bulkUnitPrice(item.price, !adminManual && item.quantity >= BULK_MINIMUM)
  }));
  const totalQty=cartItems.reduce((s,i)=>s+i.quantity,0);
  const totalPrice=cartItems.reduce((s,i)=>s+Number(i.price||0)*i.quantity,0);
  const shippingFee = cartItems.length && totalPrice <= 100000 ? 5000 : 0;
  const persistCart=next=>{if(adminManual)return;try{const out={};for(const item of Object.values(next))out[item.id]={name:item.name,weight:item.weight||"",origin:item.origin||"",supplier:item.supplier||"",price:item.price,quantity:item.quantity};localStorage.setItem(cartKey,JSON.stringify(out));window.dispatchEvent(new Event("shinnong-cart-changed"));return true}catch{return false}};
  const updateDeliveryRequest=value=>{setDeliveryRequest(value);if(!adminManual)try{sessionStorage.setItem(deliveryNoteKey,value)}catch{}};
  const addToCart=(p,qty=Math.max(minimumQuantity,cartQuantity(quantities[p.id])))=>{setCart(prev=>{const next={...prev,[p.id]:{...p,quantity:(prev[p.id]?.quantity||0)+qty}};persistCart(next);return next});setMessage("")};
  const addRecentOrder = order => {
    const available = order.items.flatMap(item => {
      const product = productsById.get(String(item.product_id));
      return product && product.stock_status !== "low" && product.price != null && item.quantity > 0
        ? [{ product, quantity: cartQuantity(item.quantity) }] : [];
    });
    if (!available.length) {
      setRecentOrderMessage("현재 다시 담을 수 있는 품목이 없어요.");
      return;
    }

    setCart(previous => {
      const next = { ...previous };
      for (const { product, quantity } of available) {
        next[product.id] = { ...product, quantity: (next[product.id]?.quantity || 0) + quantity };
      }
      persistCart(next);
      return next;
    });
    setMessage("");
    const excluded = order.items.length - available.length;
    setRecentOrderMessage(excluded
      ? `주문 가능한 품목을 담았어요. 현재 주문할 수 없는 ${excluded}개 품목은 제외했어요.`
      : "이 주문의 모든 품목을 장바구니에 담았어요.");
  };
  const changeCartQty=(id,delta)=>setCart(prev=>{const item=prev[id];if(!item)return prev;const n=item.quantity+delta,next={...prev};if(n<=0)delete next[id];else next[id]={...item,quantity:n};persistCart(next);return next});
  const clearCart=()=>{if(window.confirm("담은 약재를 모두 삭제할까요?")){setCart({});persistCart({});setMessage("")}};
  const setCartQty=(id,value)=>setCart(prev=>{if(!prev[id])return prev;const next={...prev,[id]:{...prev[id],quantity:cartQuantity(value)}};persistCart(next);return next});
  const removeCart=id=>setCart(prev=>{const next={...prev};delete next[id];persistCart(next);return next});

  const prepareOrder=async()=>{
    if(!cartItems.length||submitting)return;
    setSubmitting(true); setMessage(editOrderId?"주문을 수정하고 있습니다.":"주문을 접수하고 있습니다.");
    try{
      if(adminManual&&!manualUserId)throw new Error("거래처를 선택해주세요.");
      const endpoint=adminManual?"/api/admin/orders/manual":"/api/orders";
      const payload={items:cartItems.map(i=>({product_id:i.id,quantity:i.quantity})),delivery_request:deliveryRequest};
      if(adminManual){payload.user_id=manualUserId;payload.order_source=orderSource}
      let method="POST";
      if(editOrderId&&!adminManual){method="PATCH";payload.id=Number(editOrderId);payload.action="edit"}
      else if(!adminManual){let key=sessionStorage.getItem(requestKeyName);if(!key){key=crypto.randomUUID();sessionStorage.setItem(requestKeyName,key)}payload.request_key=key}
      const response=await fetch(endpoint,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await response.json();
      if(!response.ok)throw new Error(data?.error||"주문 처리에 실패했습니다.");
      setCart({}); setQuantities({});
      if(!adminManual)try{localStorage.removeItem(cartKey);window.dispatchEvent(new Event("shinnong-cart-changed"));sessionStorage.removeItem(requestKeyName);sessionStorage.removeItem(deliveryNoteKey)}catch{}
      const completedOrderId=editOrderId||data.order_id;
      if(!adminManual&&completedOrderId){window.location.href=`/mypage/orders/${encodeURIComponent(completedOrderId)}`;return}
      setMessage(`주문이 접수되었습니다. 주문번호 #${data.order_id}`); setEditOrderId(null);
    }catch(e){setMessage(e.message||"주문 처리에 실패했습니다.")}
    finally{setSubmitting(false)}
  };

  if(cartPage)return <section className="cartPage contentWidth">
    <div className="cartPageIntro"><div><CartIcon size={32}/><h2>주문할 약재를 확인해 주세요</h2><p>{cartLoaded?`${cartItems.length}개 품목 · ${totalQty}개`:"담은 상품을 불러오고 있습니다."}</p></div><div className="cartPageActions">{cartItems.length>0&&<button type="button" className="cartClearAll" disabled={submitting} onClick={clearCart}>전체 비우기</button>}<Link className="cartContinue" href={catalogHref}>쇼핑 계속하기</Link></div></div>
    {!cartLoaded?<p className="cartLoading" role="status">상품과 가격을 확인하고 있습니다.</p>:<CartPanel refundPolicy={refundPolicy} cartHref={cartHref} catalogHref={catalogHref} fullPage setCartQty={setCartQty} parcelShippingNotice={parcelShippingNotice} items={cartItems} totalPrice={totalPrice} shippingFee={shippingFee} deliveryRequest={deliveryRequest} setDeliveryRequest={updateDeliveryRequest} changeCartQty={changeCartQty} removeCart={removeCart} prepareOrder={prepareOrder} message={message} submitting={submitting} editOrderId={editOrderId} companyName={companyName}/>}
  </section>;

  return (
    <section className="productSection contentWidth">
      <div className={adminManual?"productIntro":"productIntro withCartLink"}>
        {!adminManual&&<Link className="catalogCartLink" href={cartHref} aria-label={`장바구니 보기, ${totalQty}개`}><CartIcon size={28}/>{totalQty>0&&<span>{totalQty>99?"99+":totalQty}</span>}</Link>}
        <h1>{adminManual?"수기 주문 등록":"한약재 주문"}</h1>
        <p>{adminManual?"거래처를 선택한 뒤 일반 주문과 동일하게 상품을 담아 주문을 등록합니다.":<>원하시는 품목을 검색하고 바로 주문할 수 있습니다. <strong>(약재의 단가는 수급현황에 따라 달라질 수 있습니다)</strong></>}</p>
        {!adminManual && <p className="bulkOrderNotice">같은 상품을 {BULK_MINIMUM}개 이상 주문하면, 해당 상품에 {BULK_DISCOUNT_PERCENT}% 할인이 자동 적용됩니다.</p>}
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
          {!editOrderId && recentOrders.length > 0 && <section className="recentOrders" aria-labelledby="recent-orders-title">
            <h2 id="recent-orders-title">최근 주문</h2>
            <ul className="recentOrderCards">{recentOrders.map(order => <li key={order.id}
              onPointerEnter={event => { if (event.pointerType === "mouse") setOpenRecentOrder(order.id); }}
              onPointerLeave={event => { if (event.pointerType === "mouse") setOpenRecentOrder(current => current === order.id ? null : current); }}
              onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpenRecentOrder(current => current === order.id ? null : current); }}
              onKeyDown={event => { if (event.key === "Escape") setOpenRecentOrder(null); }}>
              <time dateTime={order.created_at}>{new Intl.DateTimeFormat("ko-KR", {
                dateStyle: "medium", timeZone: "Asia/Seoul"
              }).format(new Date(order.created_at))}</time>
              <p>{order.items[0].product_name}{order.items.length > 1 && ` 외 ${order.items.length - 1}개 품목`}</p>
              <div className="recentOrderActions">
                <button type="button" aria-expanded={openRecentOrder === order.id}
                  aria-controls={`recent-order-items-${order.id}`}
                  onClick={() => setOpenRecentOrder(current => current === order.id ? null : order.id)}>품목 보기</button>
                <button type="button" disabled={!cartLoaded} onClick={() => addRecentOrder(order)}>전체 다시 담기</button>
              </div>
              <ul className="recentOrderPreview" id={`recent-order-items-${order.id}`} hidden={openRecentOrder !== order.id}>
                {order.items.map((item, index) => <li key={index}>
                  <span>{item.product_name}</span><span>{item.quantity}개</span>
                </li>)}
              </ul>
            </li>)}</ul>
            <p className="recentOrderMessage" role="status">{recentOrderMessage}</p>
          </section>}
          <div className="catalogSearchRow" style={{flexWrap:"wrap",gap:"8px 12px"}}><div className="productSearch v21Search catalogSearch"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="약재명, 별칭, 원산지 검색" aria-label="약재 검색"/><button type="button" className="catalogSearchButton" onClick={()=>setPage(1)}>⌕ 검색</button></div>
            {!adminManual && <label style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13}}>
              <input type="checkbox" checked={inStockOnly} onChange={event => setInStockOnly(event.target.checked)} />
              재고 있는 상품만 보기
            </label>}
          </div>
          <div className="v21Filter"><div className="initialFilter">{CHOSUNG.map(ch=><button key={ch} className={initial===ch?"active":""} onClick={()=>setInitial(ch)}>{ch}</button>)}</div></div>
          <p className="herbDetailHelp">사진을 누르면 약재의 상세 설명을 볼 수 있습니다.</p>
          {!adminManual && <ProductComparison products={comparisonProducts} remove={removeComparison} clear={() => setComparisonIds([])} />}
          <div className="productList">
            {visible.length?visible.map(product=>{
              const price = product.price;
              const quantity = quantities[product.id] ?? minimumQuantity;
              const priceFor600g = priceForGrams(price, product.weight, 600);
              return <article className="productCard" key={product.id}>
                <div className="productCardMedia">
                  <button type="button" className="productThumb productPhotoButton" aria-label={`${productDisplayName(product.name,product.origin)} 약재 설명 보기`} aria-haspopup="dialog" onClick={()=>setDetailProduct(product)}><ProductImage src={product.image_url} name={product.name} origin={product.origin}/><span className="productPhotoOpenHint" aria-hidden="true">＋</span></button>
                </div>
                <div className="productInfo">
                  <div className="productTitleRow">
                    <h2>{productDisplayName(product.name, product.origin)}</h2>
                    <span className="productTitleSpecs">{productSpecs(product)}</span>
                    {product.stock_status === "low" && <em className="soldOut">품절</em>}
                  </div>
                  <div className="productPrice">
                    <b>{money(price)}</b>

                    {!adminManual && <button type="button" className="productCompareButton"
                      aria-label={`${productDisplayName(product.name, product.origin)} 유사 상품 비교`}
                      onClick={() => showComparison(product)}>
                      비교 담기
                    </button>}
                  </div>
                  {priceFor600g != null && <small className="productConvertedPrice">600g 환산가 {money(priceFor600g)}</small>}
                </div>
                <div className={`productOrderControls ${product.stock_status==="low"?"disabled":""}`}>
                  <label><span>수량</span><div className="v21Qty">
                    <button disabled={product.stock_status==="low" || Number(quantity) <= minimumQuantity} onClick={() => setQuantities(q => ({...q,[product.id]:Math.max(minimumQuantity,cartQuantity(quantity)-1)}))}>−</button>
                    <input disabled={product.stock_status==="low"} type="number" inputMode="numeric" min={minimumQuantity} value={quantity}
                      onChange={event => setQuantities(q => ({...q,[product.id]:event.target.value}))}
                      onBlur={() => setQuantities(q => ({...q,[product.id]:cartQuantity(quantity)}))} />
                    <button disabled={product.stock_status==="low"} onClick={() => setQuantities(q => ({...q,[product.id]:Math.max(minimumQuantity,cartQuantity(quantity)+1)}))}>＋</button>
                  </div></label>
                  <div className="productActionButtons"><button className="productCartIconButton" disabled={product.stock_status==="low"} onClick={()=>addToCart(product)} aria-label={product.stock_status==="low"?"품절":"장바구니에 담기"}>{product.stock_status==="low"?<span>품절</span>:<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2c.2.9 1 1.6 2 1.6h7.9c1 0 1.8-.7 2-1.6L20.4 8H6.1"/><circle cx="10" cy="19" r="1.25"/><circle cx="17" cy="19" r="1.25"/></svg>}</button></div>
                </div>
              </article>
            }):<div className="productEmpty">{stockFilterEmpty ? "현재 재고가 있는 검색 결과가 없습니다." : "조건에 맞는 제품이 없습니다."}
              {!adminManual && !adminPricePreview && !stockFilterEmpty && query.trim() && <p>
                <Link href={`/mypage/requests?name=${encodeURIComponent(query.trim())}`}>이 약재 요청하기</Link>
              </p>}
            </div>}
          </div>
          {pageCount>1&&<div className="v21Pagination"><button disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>‹</button>{Array.from({length:Math.min(9,pageCount)},(_,i)=>{const start=Math.min(Math.max(1,currentPage-4),Math.max(1,pageCount-8));const n=start+i;return <button key={n} className={n===currentPage?"active":""} onClick={()=>setPage(n)}>{n}</button>})}<button disabled={currentPage===pageCount} onClick={()=>setPage(p=>Math.min(pageCount,p+1))}>›</button></div>}
        </div>
        <CartPanel refundPolicy={refundPolicy} cartHref={cartHref} catalogHref={catalogHref} setCartQty={setCartQty} reviewBeforeOrder={!adminManual&&!editOrderId} parcelShippingNotice={parcelShippingNotice} items={cartItems} totalPrice={totalPrice} shippingFee={shippingFee} deliveryRequest={deliveryRequest} setDeliveryRequest={updateDeliveryRequest} changeCartQty={changeCartQty} removeCart={removeCart} prepareOrder={prepareOrder} message={message} submitting={submitting} editOrderId={editOrderId} companyName={adminManual?(manualPartner?.company_name||""):companyName}/>
      </div>
      {adminManual?<div className="mobileCartBar" onClick={()=>setMobileCartOpen(true)}><span>주문 목록</span><b>{totalQty}개 · {money(totalPrice + shippingFee)}</b></div>:<Link className="mobileCartBar mobileCartIconBar" href={cartHref} aria-label="장바구니 보기"><CartIcon size={26}/><b>{totalQty}개 · {money(totalPrice + shippingFee)}</b></Link>}
      {mobileCartOpen&&<div className="mobileCartOverlay" onClick={()=>setMobileCartOpen(false)}><div className="mobileCartSheet" onClick={e=>e.stopPropagation()}><button className="mobileCartClose" onClick={()=>setMobileCartOpen(false)}>닫기</button><CartPanel refundPolicy={refundPolicy} cartHref={cartHref} catalogHref={catalogHref} setCartQty={setCartQty} reviewBeforeOrder={!adminManual&&!editOrderId} parcelShippingNotice={parcelShippingNotice} items={cartItems} totalPrice={totalPrice} shippingFee={shippingFee} deliveryRequest={deliveryRequest} setDeliveryRequest={updateDeliveryRequest} changeCartQty={changeCartQty} removeCart={removeCart} prepareOrder={prepareOrder} message={message} submitting={submitting} editOrderId={editOrderId} companyName={adminManual?(manualPartner?.company_name||""):companyName}/></div></div>}
      {detailProduct&&<HerbDetails product={detailProduct} kakaoChannelUrl={kakaoChannelUrl} onClose={()=>setDetailProduct(null)}/>}
    </section>
  );
}

function CartQuantityInput({ item, setCartQty, disabled }) {
  return <input key={item.quantity} type="number" min="1" step="1" inputMode="numeric"
    defaultValue={item.quantity} disabled={disabled} aria-label={`${item.name} 수량`}
    onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }}
    onBlur={event => {
      const quantity = cartQuantity(event.currentTarget.value);
      event.currentTarget.value = String(quantity);
      if (quantity !== item.quantity) setCartQty(item.id, quantity);
    }} />;
}

function CartUnitPrice({ item, showUnit = false }) {
  if (item.price === item.basePrice) {
    return <strong className="cartUnitPrice">{showUnit && "단가 "}{money(item.price)}</strong>;
  }

  return <div className="cartDiscountPrice">
    <s>{money(item.basePrice)}</s>
    <div>
      <strong className="cartUnitPrice">{money(item.price)}</strong>
      <span>{BULK_DISCOUNT_PERCENT}% 할인</span>
    </div>
  </div>;
}

function CartPanel({refundPolicy,items,totalPrice,shippingFee,deliveryRequest,setDeliveryRequest,changeCartQty,removeCart,prepareOrder,message,submitting,editOrderId,companyName,parcelShippingNotice,fullPage=false,setCartQty,reviewBeforeOrder=false,cartHref="/cart",catalogHref="/products"}){
  const stockNotice = "주문 접수 후 재고를 확인하며, 재고가 부족하거나 출고 일정이 달라지면 연락드리겠습니다.";
  const shippingCutoffs = (
      <dl className="cartShippingCutoffs">
        <div>
          <dt>직접 배송 <small>서울 · 경기 · 인천 (일부지역 제외)</small></dt>
          <dd><strong>오전 10:30 전</strong> 당일 배송 · 이후 익일 배송</dd>
        </div>
        <div>
          <dt>택배</dt>
          <dd><strong>오후 3:30 마감</strong> · 당일 배송 제외</dd>

        </div>
      {parcelShippingNotice && <div><dt>배송비</dt><dd>{parcelShippingNotice}</dd></div>}
    </dl>
  );

  return (
    <aside className={fullPage?"orderCart fullCart":"orderCart"}>
      <div className="orderCartHead"><h2>주문 목록</h2>{companyName&&<span>{companyName}</span>}</div>
      {items.length?<>
        {fullPage?<div className="fullCartItems" role="list">{items.map(item=><article className="fullCartItem" key={item.id} role="listitem">
          <div className="fullCartPhoto"><ProductImage src={item.image_url} name={item.name} origin={item.origin}/></div>
          <div className="fullCartProduct"><h3>{productDisplayName(item.name,item.origin)}</h3><p>{productSpecs(item)}</p><CartUnitPrice item={item} showUnit /></div>
          <div className="fullCartQty"><button type="button" disabled={item.quantity<=1||submitting} onClick={()=>changeCartQty(item.id,-1)} aria-label={`${item.name} 수량 줄이기`}>−</button><CartQuantityInput item={item} setCartQty={setCartQty} disabled={submitting} /><button type="button" disabled={submitting} onClick={()=>changeCartQty(item.id,1)} aria-label={`${item.name} 수량 늘리기`}>＋</button></div>
          <div className="fullCartLineTotal"><span>상품금액</span><b>{money(item.price==null?null:Number(item.price)*item.quantity)}</b></div>
          <button type="button" className="fullCartRemove" disabled={submitting} onClick={()=>removeCart(item.id)} aria-label={`${item.name} 삭제`}>삭제</button>
        </article>)}</div>:<div className="orderCartItems">{items.map(item=><div className="orderCartItem" key={item.id}>
          <div>
            <b className="orderCartItemName">
              {productDisplayName(item.name,item.origin)}
              {item.weight && <small>{item.weight}</small>}
            </b>
            <CartUnitPrice item={item} />
          </div>
          <div className="orderCartItemTotals">
            <div className="cartQty">
              <button onClick={()=>changeCartQty(item.id,-1)}>−</button>
              <CartQuantityInput item={item} setCartQty={setCartQty} disabled={submitting} />
              <button onClick={()=>changeCartQty(item.id,1)}>+</button>
            </div>
            <strong aria-label="상품 합계">{money(item.price==null?null:Number(item.price)*item.quantity)}</strong>
          </div>
          <button className="cartRemove" onClick={()=>removeCart(item.id)}>삭제</button>
        </div>)}</div>}
        <div className={fullPage?"fullCartCheckout":"cartCheckout"}>
        {(fullPage || !reviewBeforeOrder) && <label className="deliveryRequest"><span>배송 요청사항 (선택)</span><textarea rows={3} maxLength={DELIVERY_REQUEST_MAX_LENGTH} value={deliveryRequest} disabled={submitting} onChange={e=>setDeliveryRequest(e.target.value)} placeholder="예: 도착 전 연락 부탁드립니다."/><small>500자 이내로 입력해 주세요.</small></label>}
        {fullPage && <div className="orderTotal"><span>총 상품금액</span><b>{money(totalPrice)}</b></div>}
        <div className="orderTotal orderShippingFee"><span>배송비</span><b>{shippingFee ? money(shippingFee) : "무료"}</b></div>
        <div className="orderTotal"><span>{fullPage ? "총 주문금액" : "주문 예상금액"}</span><b>{money(totalPrice + shippingFee)}</b></div>
        {(fullPage || reviewBeforeOrder) && <section className="orderShippingNotice" aria-label="배송 마감 안내">
          {shippingCutoffs}
          {fullPage && <>
            <p className="checkoutStockNotice">{stockNotice}</p>
          </>}
        </section>}
        {parcelShippingNotice && !fullPage && !reviewBeforeOrder && <p className="orderShippingNotice">{parcelShippingNotice}</p>}
        {message&&<p className="orderCartMessage">{message}</p>}
        {fullPage ? <div className="checkoutPolicyLinks">
          <RefundPolicyDialog title="주문·배송 안내" showTitle shortLabel>
              <div className="checkoutGuide">
                {shippingCutoffs}
                <p className="checkoutStockNotice">{stockNotice}</p>
              </div>
            </RefundPolicyDialog>
          <span className="checkoutPolicyDivider" aria-hidden="true">·</span>
          {refundPolicy ? <RefundPolicyDialog shortLabel>{refundPolicy}</RefundPolicyDialog> : <a className="orderPolicyLink" href="/order-delivery/returns#refund-policy" target="_blank" rel="noopener noreferrer" aria-label="교환·반품 및 환불 안내 보기 (새 창)">교환·반품 및 환불 안내</a>}
        </div> : refundPolicy ? <RefundPolicyDialog>{refundPolicy}</RefundPolicyDialog> : <a className="orderPolicyLink" href="/order-delivery/returns#refund-policy" target="_blank" rel="noopener noreferrer" aria-label="교환·반품 및 환불 안내 보기 (새 창)">교환·반품 및 환불 안내 보기 ↗</a>}
        <div className="orderCartActions">{reviewBeforeOrder&&!fullPage?<Link className="orderSubmit orderReviewButton" href={cartHref}>주문 내용 확인</Link>:<button className="orderSubmit" disabled={submitting} onClick={prepareOrder}>{submitting?"처리중...":editOrderId?"주문 수정 저장":fullPage?"주문 접수":"주문하기"}</button>}</div>
        </div>
      </>:fullPage?<div className="fullCartEmpty"><CartIcon size={56}/><h3>아직 담은 약재가 없습니다.</h3><p>{message||"약재주문 화면에서 필요한 상품을 담아 주세요."}</p><Link className="cartContinue" href={catalogHref}>약재 둘러보기</Link></div>:<div className="cartEmpty">주문할 제품을 담아주세요.</div>}
    </aside>
  );
}
