import Link from "next/link";

export default function DeliverySubnav({active="delivery"}){
  return <nav className="subnav deliverySubnav" aria-label="주문·배송 안내 하위 메뉴">
    <Link href="/order-delivery" className={active==="delivery"?"active":""} aria-current={active==="delivery"?"page":undefined}>주문·배송 안내</Link>
    <Link href="/order-delivery/returns" className={active==="returns"?"active":""} aria-current={active==="returns"?"page":undefined}>교환·반품 및 환불 안내</Link>
  </nav>;
}
