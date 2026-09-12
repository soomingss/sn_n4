
export function Icon({type, className=""}) {
  const c = "iconSvg " + className;
  if (type === "leaf") return <svg className={c} viewBox="0 0 64 64"><path d="M50 10C30 12 16 24 14 46c20 2 34-10 36-36Z"/><path d="M15 47c9-13 19-22 32-29M27 35l-4-12M32 30l12 1"/></svg>;
  if (type === "gap") return <svg className={c} viewBox="0 0 64 64"><circle cx="32" cy="32" r="24"/><text x="32" y="38" textAnchor="middle" fontSize="17" fontWeight="700">GAP</text></svg>;
  if (type === "shield") return <svg className={c} viewBox="0 0 64 64"><path d="M32 8l20 8v15c0 13-8 22-20 27C20 53 12 44 12 31V16l20-8Z"/><path d="m23 31 6 6 13-14"/></svg>;
  if (type === "truck") return <svg className={c} viewBox="0 0 64 64"><path d="M8 18h30v25H8zM38 26h9l9 10v7H38z"/><circle cx="19" cy="47" r="5"/><circle cx="47" cy="47" r="5"/></svg>;
  if (type === "handshake") return <svg className={c} viewBox="0 0 64 64"><path d="m10 24 9-9 10 5 6-3 9 8-15 16-6-4-5 3-8-8Z"/><path d="m25 22 7 6 6-5M20 34l7 7M30 36l5 5M40 31l5 5"/></svg>;
  if (type === "pin") return <svg className={c} viewBox="0 0 64 64"><path d="M32 58S14 40 14 26a18 18 0 1 1 36 0c0 14-18 32-18 32Z"/><circle cx="32" cy="26" r="6"/></svg>;
  if (type === "phone") return <svg className={c} viewBox="0 0 64 64"><path d="M18 9l8 13-6 6c5 10 11 16 21 21l6-6 12 8c-2 7-7 10-13 9C24 56 8 40 4 18 3 12 8 7 18 9Z"/></svg>;
  if (type === "fax") return <svg className={c} viewBox="0 0 64 64"><path d="M18 8h28v14H18zM12 24h40a6 6 0 0 1 6 6v18H46v8H18v-8H6V30a6 6 0 0 1 6-6Z"/><path d="M22 40h20v12H22z"/></svg>;
  if (type === "train") return <svg className={c} viewBox="0 0 64 64"><rect x="15" y="8" width="34" height="42" rx="8"/><path d="M21 17h22v13H21zM20 54l-6 6M44 54l6 6"/><circle cx="24" cy="40" r="3"/><circle cx="40" cy="40" r="3"/></svg>;
  if (type === "bus") return <svg className={c} viewBox="0 0 64 64"><rect x="12" y="8" width="40" height="44" rx="8"/><path d="M18 16h28v16H18z"/><circle cx="22" cy="43" r="3"/><circle cx="42" cy="43" r="3"/></svg>;
  if (type === "car") return <svg className={c} viewBox="0 0 64 64"><path d="m13 34 6-15h26l6 15 5 3v13H8V37l5-3Z"/><path d="M19 34h26"/><circle cx="18" cy="47" r="4"/><circle cx="46" cy="47" r="4"/></svg>;
  return null;
}

export function ValueCard({icon,title,children}) {
  return <div className="valueCard"><Icon type={icon}/><div><b>{title}</b><p>{children}</p></div></div>
}
