import ProductImage from "../ProductImage";
import { productDisplayName } from "../lib/product-display";
import { priceForGrams } from "./catalog-search";

const priceText = value => value == null || value === "" ? "단가 문의" : `${Number(value).toLocaleString("ko-KR")}원`;

export default function ProductComparison({ products, remove, clear }) {
  if (!products.length) return null;
  const rows = [
    ["원산지", product => product.origin || "별도 문의"],
    ["포장 중량", product => product.weight || "별도 문의"],
    ["포장 단가", product => priceText(product.price)],
    ["100g당 가격", product => {
      const price = priceForGrams(product.price, product.weight, 100);
      return price == null ? "—" : priceText(price);
    }],
    ["600g 환산가", product => {
      const price = priceForGrams(product.price, product.weight, 600);
      return price == null ? "—" : priceText(price);
    }],
  ];

  return <section className="productComparison" aria-labelledby="product-comparison-title">
    <div className="productComparisonHeader">
      <h2 id="product-comparison-title">약재 비교 ({products.length}/3)</h2>
      <button type="button" onClick={clear}>선택 초기화</button>
    </div>
    <div className="productComparisonScroll" tabIndex={0} aria-label="선택한 약재 비교표">
      <table>
        <thead><tr><th scope="col">항목</th>{products.map(product => {
          const name = productDisplayName(product.name, product.origin);
          return <th scope="col" key={product.id}>
            <div className="productComparisonPhoto"><ProductImage src={product.image_url} name={product.name} origin={product.origin} /></div>
            <div>{name}</div>
            <button type="button" onClick={() => remove(product.id)} aria-label={`${name} 비교에서 제외`}>제외</button>
          </th>;
        })}</tr></thead>
        <tbody>{rows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th>{products.map(product => <td key={product.id}>{value(product)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  </section>;
}
