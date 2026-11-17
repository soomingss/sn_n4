"use client";

import { useEffect, useState } from "react";

export default function ProductImage({ src, name }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const visible = Boolean(src) && !failed;
  const reference = src?.startsWith("/products-reference/");
  const localPhoto = reference || src?.startsWith("/products/");
  const imageSrc = localPhoto ? `${src}${src.includes("?") ? "&" : "?"}photo=${src.split("?")[0] === "/products-reference/uniform-20261029/herb-001.webp" ? "gaja-20261117-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-003-v2.webp" ? "galgeun-20261117-v1" : "linen-20261116-v2"}` : src;
  return <div className="productPhoto">
    {visible ? <img src={imageSrc} alt={`${name} ${reference ? "AI 참고 이미지" : "상품 사진"}`} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <span className="productPhotoPlaceholder">{name?.slice(0, 1) || "약"}</span>}
    {visible && <img className="productBrandLogo" src="/logo-hq.png" alt="" aria-hidden="true" decoding="async" />}
  </div>;
}
