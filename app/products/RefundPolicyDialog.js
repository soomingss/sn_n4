"use client";

import { useRef } from "react";

export default function RefundPolicyDialog({children, title = "교환·반품 및 환불 안내", showTitle = false}) {
  const dialog = useRef(null);
  const trigger = useRef(null);

  return <>
    <button ref={trigger} type="button" className="orderPolicyLink refundPolicyTrigger"
      aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
      {title} 보기
    </button>
    <dialog ref={dialog} className="refundPolicyDialog" aria-label={title}
      onClose={() => trigger.current?.focus()}>
      <div className="refundPolicyDialogActions">
        <button type="button" onClick={() => dialog.current?.close()} autoFocus>닫기</button>
      </div>
      {showTitle && <h2 className="checkoutGuideTitle">{title}</h2>}
      {children}
    </dialog>
  </>;
}
