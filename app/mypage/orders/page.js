import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession, supabaseAdminFetch } from "../../lib/auth";

const statusLabel={new:"주문접수",preparing:"준비중",shipping:"배송중",delivered:"배송완료",cancelled:"취소"};
const money=v=>`${Number(v||0).toLocaleString("ko-KR")}원`;
const date=v=>v?new Intl.DateTimeFormat("ko-KR",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(v)):"-";
export default async function OrdersPage(){
 const session=await getCurrentSession(); if(!session)redirect("/login?next=/mypage/orders");
 const uid=encodeURIComponent(session.user.id); const res=await supabaseAdminFetch(`/rest/v1/orders?user_id=eq.${uid}&select=id,created_at,status,delivery_request,total_amount&order=created_at.desc`); const orders=res.ok?await res.json():[];
 return <main><section className="companyHero mypageHero"><div className="companyHeroCopy"><p>SHINNONG HERB</p><h1>전체 주문내역</h1><span>HOME &gt; 마이페이지 &gt; 주문내역</span></div></section><section className="mypageSection contentWidth"><div className="mypageAllOrdersHead"><div><span>ORDER HISTORY</span><h1>전체 주문내역</h1></div><Link href="/mypage">마이페이지로 돌아가기</Link></div><section className="mypagePanel"><div className="mypageOrderList">{orders.length?orders.map(o=><article key={o.id}><div className="mypageOrderMain"><b>주문 #{o.id}</b><span>{date(o.created_at)}</span></div><div className="mypageOrderMeta"><span className={`orderStatus ${o.status}`}>{statusLabel[o.status]||o.status}</span><span>{o.delivery_request||"-"}</span><strong>{money(o.total_amount)}</strong><Link className="reorderButton" href={`/mypage/orders/${o.id}`}>주문상세</Link><Link className="reorderButton" href={`/products?reorder=${o.id}`}>이 주문 다시 담기</Link></div></article>):<div className="mypageEmpty">주문내역이 없습니다.</div>}</div></section></section></main>;
}
