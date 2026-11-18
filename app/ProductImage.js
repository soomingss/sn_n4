"use client";

import { useEffect, useState } from "react";

export default function ProductImage({ src, name, origin }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const visible = Boolean(src) && !failed;
  const reference = src?.startsWith("/products-reference/");
  const localPhoto = reference || src?.startsWith("/products/");
  const imageSrc = localPhoto ? `${src}${src.includes("?") ? "&" : "?"}photo=${src.split("?")[0] === "/products-reference/uniform-20261029/herb-001.webp" ? "gaja-20261117-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-003-v2.webp" ? "galgeun-20261117-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-004.webp" ? "galhwa-20261118-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-005.webp" ? "gamguk-20261118-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/gamin-geomin.webp" ? "geomin-20261118-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-007.webp" ? "licorice-20261118-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/gamcho-yangwai1-20261118.webp" ? "yangwai1-20261118-v3" : src.split("?")[0] === "/products-reference/uniform-20261029/gamcho-roasted-v2.webp" ? "roasted-20261118-v2" : src.split("?")[0].startsWith("/products-reference/uniform-20261029/gamcho-roasted-") ? "roasted-20261118-v2" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-008.webp" ? "ganghwal-20261118-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-009-v2.webp" ? "jamganghwal-20261118-v3" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-010.webp" ? "ganghwang-20261118-v2" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-011.webp" ? "gaeja-20261118-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-012.webp" ? "ginger-20261118-v3" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-013-v2.webp" ? "ginger-roasted-20261118-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/ginger-domestic-20261118.webp" ? "ginger-domestic-20261118-v2" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-014-v3.webp" ? "chestnut-20261118-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-015-v2.webp" ? "pharbitis-20261118-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-016.webp" ? "cassia-20261118-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-017-v2.webp" ? "gizzard-20261118-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-018-v2.webp" ? "gizzard-roasted-20261118-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-019-v3.webp" ? "twig-20261118-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-020.webp" ? "vine-20261118-v1" : src.split("?")[0] === "/products-reference/uniform-20261029/herb-021.webp" ? "galangal-20261118-v1" : "linen-20261116-v2"}` : src;
  const domesticGalgeun = /^갈근(?:\s*\((?:사각|강원문막)\))?$/.test(name || "")
    && /국내산|국산|한국|대한민국/.test(origin || "")
    && src?.split("?")[0] === "/products-reference/uniform-20261029/herb-003-v2.webp";
  return <div className="productPhoto">
    {visible ? <img src={imageSrc} style={domesticGalgeun ? { filter: "saturate(0.78) brightness(0.76) contrast(1.95)" } : undefined} alt={`${name} ${reference ? "AI 참고 이미지" : "상품 사진"}`} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <span className="productPhotoPlaceholder">{name?.slice(0, 1) || "약"}</span>}
    {visible && <img className="productBrandLogo" src="/logo-hq.png" alt="" aria-hidden="true" decoding="async" />}
  </div>;
}
