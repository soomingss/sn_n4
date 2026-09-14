"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const won = (value) => `${Number(value || 0).toLocaleString("ko-KR")}원`;

export default function TaxReportClient() {
  const today = new Date();
  const initialMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(initialMonth);
  const [userId, setUserId] = useState("");
  const [data, setData] = useState({ profiles: [], summary: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (nextMonth = month, nextUserId = userId) => {
    setLoading(true); setError("");
    try {
      const qs = new URLSearchParams({ month: nextMonth });
      if (nextUserId) qs.set("user_id", nextUserId);
      const res = await fetch(`/api/admin/tax-report?${qs.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "세금자료를 불러오지 못했습니다.");
      setData(json);
    } catch (e) { setError(e.message || "세금자료를 불러오지 못했습니다."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(initialMonth, ""); }, []);

  const downloadHref = useMemo(() => {
    const qs = new URLSearchParams({ month, format: "xls" });
    if (userId) qs.set("user_id", userId);
    return `/api/admin/tax-report?${qs.toString()}`;
  }, [month, userId]);

  return <>
    <div className="taxReportControls">
      <label><span>조회 월</span><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
      <label><span>거래처</span><select value={userId} onChange={(e) => setUserId(e.target.value)}><option value="">전체 거래처</option>{(data.profiles || []).map((p) => <option key={p.id} value={p.id}>{p.company_name}</option>)}</select></label>
      <button type="button" onClick={() => load()} disabled={loading}>{loading ? "조회 중" : "조회"}</button>
      <a className="taxDownloadButton" href={downloadHref}>엑셀 다운로드</a>
    </div>

    {error && <div className="adminMessage">{error}</div>}

    <div className="taxReportSummary">
      <div><span>면세금액</span><b>{won(data.totals?.exempt_amount)}</b></div>
      <div><span>과세 공급가액</span><b>{won(data.totals?.taxable_supply)}</b></div>
      <div><span>부가세</span><b>{won(data.totals?.vat_amount)}</b></div>
      <div><span>과세 포함금액</span><b>{won(data.totals?.taxable_total)}</b></div>
      <div><span>총 거래금액</span><b>{won(data.totals?.grand_total)}</b></div>
    </div>

    {(data.summary || []).length ? <div className="adminTableWrap"><table className="taxReportTable"><thead><tr><th>거래처</th><th className="num">면세금액</th><th className="num">과세 공급가액</th><th className="num">부가세</th><th className="num">과세 포함금액</th><th className="num">총 거래금액</th></tr></thead><tbody>{data.summary.map((r) => <tr key={r.user_id || r.company_name}><td>{r.company_name}</td><td className="num">{won(r.exempt_amount)}</td><td className="num">{won(r.taxable_supply)}</td><td className="num">{won(r.vat_amount)}</td><td className="num">{won(r.taxable_total)}</td><td className="num"><b>{won(r.grand_total)}</b></td></tr>)}</tbody></table></div> : <div className="taxReportEmpty">{loading ? "거래자료를 불러오는 중입니다." : "선택한 기간에 배송완료된 거래가 없습니다."}</div>}

    <p className="taxReportNote">배송완료 처리된 거래를 기준으로 집계합니다. 국산은 면세, 수입산은 과세로 구분하며 수입산 판매가격은 부가세 10% 포함금액으로 계산합니다. 엑셀 파일은 ‘월별 요약’과 ‘상세내역’ 두 시트로 구성됩니다.</p>
    <Link className="taxReportBack" href="/admin">관리자 업무로 돌아가기</Link>
  </>;
}
