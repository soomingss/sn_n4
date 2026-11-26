"use client";

import { useRef } from "react";

export default function RefundPolicyDialog({children}) {
  const dialog = useRef(null);
  const trigger = useRef(null);

  return <>
    <button ref={trigger} type="button" className="orderPolicyLink refundPolicyTrigger"
      aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
      교환·반품 및 환불 안내 보기
    </button>
    <dialog ref={dialog} className="refundPolicyDialog" aria-label="교환·반품 및 환불 안내"
      onClose={() => trigger.current?.focus()}>
      <div className="refundPolicyDialogActions">
        <button type="button" onClick={() => dialog.current?.close()} autoFocus>닫기</button>
      </div>
      {children}
    </dialog>
  </>;
}
