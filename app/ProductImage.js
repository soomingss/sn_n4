"use client";

import { useEffect, useState } from "react";

export default function ProductImage({ src, name }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const visible = Boolean(src) && !failed;
  const reference = src?.startsWith("/products-reference/");
  return <div className="productPhoto">
    {visible ? <img src={src} alt={`${name} ${reference ? "AI 참고 이미지" : "상품 사진"}`} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <span className="productPhotoPlaceholder">{name?.slice(0, 1) || "약"}</span>}
    {visible && reference && <small className="productPhotoCaption">AI 참고 이미지</small>}
  </div>;
}
