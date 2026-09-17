"use client";

import {useEffect, useRef, useState} from "react";

export default function KakaoMap({address = "", placeName = ""}){
  const mapRef = useRef(null);
  const [status, setStatus] = useState(address ? "loading" : "missing-address");
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

  useEffect(() => {
    if (!address) {
      setStatus("missing-address");
      return;
    }
    if (!appKey) {
      setStatus("missing-key");
      return;
    }

    setStatus("loading");
    const initMap = () => {
      if (!window.kakao?.maps || !mapRef.current) return;
      window.kakao.maps.load(() => {
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result, resultStatus) => {
          if (resultStatus !== window.kakao.maps.services.Status.OK || !result?.[0]) {
            setStatus("error");
            return;
          }

          const coords = new window.kakao.maps.LatLng(Number(result[0].y), Number(result[0].x));
          const map = new window.kakao.maps.Map(mapRef.current, {
            center: coords,
            level: 3,
          });

          const marker = new window.kakao.maps.Marker({map, position: coords});
          if (placeName) {
            const info = new window.kakao.maps.InfoWindow({
              content: `<div style="padding:8px 12px;font-size:13px;white-space:nowrap;font-weight:700;color:#214d40">${placeName}</div>`,
            });
            info.open(map, marker);
          }
          map.setCenter(coords);
          setStatus("ready");
        });
      });
    };

    if (window.kakao?.maps) {
      initMap();
      return;
    }

    const existing = document.querySelector('script[data-kakao-map-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", initMap, {once:true});
      return () => existing.removeEventListener("load", initMap);
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.dataset.kakaoMapSdk = "true";
    script.onload = initMap;
    script.onerror = () => setStatus("error");
    document.head.appendChild(script);
  }, [appKey, address, placeName]);

  const searchUrl = address ? `https://map.kakao.com/link/search/${encodeURIComponent(address)}` : "";
  const routeUrl = address ? `https://map.kakao.com/link/to/${encodeURIComponent(placeName || address)},${encodeURIComponent(address)}` : "";
  const mapLabel = placeName ? `${placeName} 카카오맵 지도` : "카카오맵 지도";

  return <div className="kakaoMapWrap">
    <div ref={mapRef} className="kakaoMapCanvas" aria-label={mapLabel} />
    {status === "loading" && <div className="mapStatus">지도를 불러오는 중입니다.</div>}
    {status === "missing-address" && <div className="mapStatus mapStatusGuide"><b>지도 주소가 등록되지 않았습니다.</b></div>}
    {status === "missing-key" && <div className="mapStatus mapStatusGuide"><b>카카오맵 연동 준비 완료</b><span>Vercel 환경변수에 <code>NEXT_PUBLIC_KAKAO_MAP_APP_KEY</code>를 등록하면 실제 지도가 표시됩니다.</span></div>}
    {status === "error" && <div className="mapStatus mapStatusGuide"><b>지도를 불러오지 못했습니다.</b><span>카카오 JavaScript 키와 등록 도메인을 확인해주세요.</span></div>}
    {address ? <div className="mapActions">
      <a href={searchUrl} target="_blank" rel="noreferrer">카카오맵에서 보기</a>
      <a href={routeUrl} target="_blank" rel="noreferrer">길찾기</a>
    </div> : null}
  </div>
}
