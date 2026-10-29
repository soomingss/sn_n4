"use client";

import { useEffect, useRef } from "react";
import ProductImage from "../ProductImage";
import herbInformation from "../lib/herb-information.json";

export default function HerbDetails({ product, onClose }) {
  const dialog = useRef(null);
  const information = herbInformation.products[product.name];
  const entry = information ? herbInformation.herbs[information.key] : null;

  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  return (
    <dialog ref={dialog} className="herbDetailDialog" aria-labelledby="herb-detail-title"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="herbDetailContent">
        <header className="herbDetailHeader">
          <div><span>약재 상세정보</span><h2 id="herb-detail-title">{product.name}</h2></div>
          <button type="button" onClick={onClose} aria-label="약재 설명 닫기" autoFocus>×</button>
        </header>
        <div className="herbDetailOverview">
          <div className="herbDetailPhoto"><ProductImage src={product.image_url} name={product.name} /></div>
          <dl className="herbDetailFacts">
            <div><dt>원산지</dt><dd>{product.origin || "별도 문의"}</dd></div>
            <div><dt>규격</dt><dd>{product.weight || "별도 문의"}</dd></div>
            {product.supplier && <div><dt>수입원</dt><dd>{product.supplier}</dd></div>}
            {entry?.latin && <div><dt>생약명</dt><dd lang="la">{entry.latin}</dd></div>}
            {information?.form && <div><dt>상품 형태</dt><dd>{information.form}</dd></div>}
          </dl>
        </div>
        <section className="herbDetailSection" aria-labelledby="herb-effects-title">
          <h3 id="herb-effects-title">{entry?.kind === "evidence" ? "효능과 연구 근거" : "전통적으로 알려진 효능"}</h3>
          {entry?.effects?.length ? <>
            {information?.variant && entry?.kind !== "evidence" && <p className="herbDetailVariant">아래는 {entry.name} 원물에 관한 자료입니다. 절단·분말·가공 여부에 따른 효능 차이를 동일하게 단정하지 않습니다.</p>}
            <dl className="herbDetailEffects">{entry.effects.map(effect => <div key={effect.term}><dt>{effect.term}</dt><dd>{effect.description}</dd></div>)}</dl>
          </> : <p className="herbDetailEmpty">이 품목은 기원과 효능을 확인한 자료를 준비하고 있습니다.</p>}
          <p className="herbDetailContext">{entry?.kind === "evidence" ? "연구에서 평가한 원료·추출물·제제와 현재 상품의 차이를 함께 확인해 주세요." : "전통 본초 문헌의 효능을 설명한 정보이며, 현대 임상시험으로 확인된 치료 효과와는 구분됩니다."}</p>
        </section>
        {entry?.caution && <section className="herbDetailSection herbDetailCaution"><h3>확인할 점</h3><p>{entry.caution}</p></section>}
        {entry?.sources?.length > 0 && <footer className="herbDetailSources"><h3>자료 출처</h3><ul>{entry.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} · {entry.name}<span aria-hidden="true"> ↗</span></a></li>)}</ul><p>자료 확인일 {herbInformation.verifiedAt}</p></footer>}
      </div>
    </dialog>
  );
}
