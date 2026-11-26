"use client";

import { useEffect, useState } from "react";

const endpoint = "/api/delivery-presets";

export default function DeliveryPresets({ note, onLoad, disabled }) {
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const current = entries.find(entry => entry.location_name === selected);

  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error("저장된 요청을 불러오지 못했습니다.");
        return response.json();
      })
      .then(setEntries)
      .catch(error => { if (!controller.signal.aborted) setMessage(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function save() {
    const locationName = name.trim();
    if (!locationName || !note.trim()) return;
    if (entries.some(entry => entry.location_name === locationName)
      && !window.confirm(`${locationName}에 저장한 요청을 바꿀까요?`)) return;
    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locationName, note })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setEntries(items => [...items.filter(item => item.location_name !== result.location_name), result]
        .sort((a,b) => a.location_name.localeCompare(b.location_name, "ko")));
      setSelected(result.location_name);
      setMessage("배송 요청을 저장했습니다.");
    } catch (error) {
      setMessage(error.message || "배송 요청을 저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!current || !window.confirm(`${selected}에 저장한 요청을 삭제할까요?`)) return;
    setBusy(true);
    try {
      const response = await fetch(`${endpoint}?location=${encodeURIComponent(selected)}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).message);
      setEntries(items => items.filter(item => item.location_name !== selected));
      setSelected("");
      setName("");
      setMessage("저장한 요청을 삭제했습니다.");
    } catch (error) {
      setMessage(error.message || "저장한 요청을 삭제하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return <details className="deliveryPresets">
    <summary>배송지별 요청 저장 · 불러오기</summary>
    <p>배송지 이름으로 요청을 저장할 수 있어요. 불러온 요청은 이번 주문에 맞게 수정할 수 있어요.</p>
    <fieldset disabled={disabled || busy || loading}>
      {entries.length > 0 && <div className="deliveryPresetRow">
        <label>저장한 배송지 <select value={selected} onChange={event => {
          setSelected(event.target.value);
          setName(event.target.value);
        }}>
          <option value="">배송지 선택</option>
          {entries.map(entry => <option key={entry.location_name}>{entry.location_name}</option>)}
        </select></label>
        <button type="button" disabled={!current} onClick={() => {
          onLoad(current.note);
          setMessage("이번 주문에 저장된 요청을 불러왔습니다.");
        }}>불러오기</button>
        <button type="button" disabled={!current} onClick={remove}>삭제</button>
      </div>}
      <div className="deliveryPresetRow">
        <label>배송지 이름 <input value={name} maxLength={60} onChange={event => setName(event.target.value)} placeholder="예: 본원, 탕전실" /></label>
        <button type="button" disabled={!name.trim() || !note.trim()} onClick={save}>현재 요청 저장</button>
      </div>
    </fieldset>
    {loading && <p role="status">불러오는 중…</p>}
    {message && <p role="status">{message}</p>}
  </details>;
}
