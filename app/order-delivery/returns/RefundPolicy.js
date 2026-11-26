import {contentLines} from "../../lib/site-content";

function Lines({value}){
  return <>{contentLines(value).map((line,index)=><span key={index}>{index>0&&<br/>}{line}</span>)}</>;
}

export default function RefundPolicy({content, settings, anchor = false}) {
  return content.refund_title&&<section id={anchor ? "refund-policy" : undefined} className="refundPolicy" tabIndex={-1} aria-labelledby={anchor ? "refund-policy-title" : undefined}>
        <h2 id={anchor ? "refund-policy-title" : undefined} data-site-key="refund_title"><Lines value={content.refund_title}/></h2>
        <dl className="refundPolicyDetails">
          {[["접수 기한","refund_period"],["교환·반품 대상","refund_eligible"],["단순 변심","refund_change_mind"],["배송비 부담","refund_shipping"],["환불 절차","refund_process"]].map(([label,key])=>content[key]&&<div key={key}><dt>{label}</dt><dd data-site-key={key}><Lines value={content[key]}/></dd></div>)}
        </dl>
        <div className="refundPolicyContact">
          <h3>교환·반품 접수</h3>
          <p data-site-key="refund_contact"><Lines value={content.refund_contact}/></p>
          <div className="refundPolicyLinks">
            {settings.phone&&<a href={`tel:${settings.phone.replace(/[^\d+]/g,"")}`}>전화 문의 {settings.phone}</a>}
            {settings.kakao_channel_url&&<a href={settings.kakao_channel_url} target="_blank" rel="noopener noreferrer">카카오톡 문의 ↗</a>}
          </div>
        </div>
      </section>;
}
