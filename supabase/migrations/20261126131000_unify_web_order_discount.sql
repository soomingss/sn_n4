CREATE OR REPLACE FUNCTION public.save_web_order(p_user_id uuid, p_order_id bigint, p_request_key text, p_delivery_request text, p_items jsonb)
 RETURNS TABLE(order_id bigint, total_amount bigint)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  customer public.profiles%rowtype;
  previous_order public.orders%rowtype;
  saved_id bigint;
  total bigint;
  lines jsonb;
  item_count integer;
begin
  select * into customer from public.profiles where id = p_user_id;
  if not found or (customer.status is distinct from 'approved' and customer.role is distinct from 'admin') then
    raise exception '승인된 거래처만 주문할 수 있습니다.';
  end if;
  if char_length(coalesce(p_delivery_request, '')) > 500 then
    raise exception '배송 요청사항은 500자 이내로 입력해 주세요.';
  end if;

  if p_order_id is null then
    if p_request_key is null or length(p_request_key) not between 8 and 128 then
      raise exception '유효한 주문 요청키가 필요합니다.';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(p_request_key, 0));
    select * into previous_order from public.orders where request_key = p_request_key;
    if found then
      if previous_order.user_id <> p_user_id then
        raise exception '다른 주문에 사용된 요청키입니다.';
      end if;
      return query select previous_order.id, previous_order.total_amount;
      return;
    end if;
  else
    select * into previous_order from public.orders
      where id = p_order_id and user_id = p_user_id for update;
    if not found or previous_order.status is distinct from 'new' then
      raise exception '수정할 수 있는 주문을 찾을 수 없습니다.';
    end if;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception '주문 상품이 없습니다.';
  end if;
  select count(*) into item_count from jsonb_to_recordset(p_items) as i(product_id bigint, quantity integer);
  if item_count <> (select count(distinct i.product_id) from jsonb_to_recordset(p_items) as i(product_id bigint, quantity integer)) then
    raise exception '같은 상품이 중복되어 있습니다.';
  end if;

  select jsonb_agg(to_jsonb(priced)), sum(priced.unit_price * priced.quantity)
    into lines, total
  from (
    select p.id as product_id, p.name as product_name, coalesce(p.weight, '') as weight,
           coalesce(p.origin, '') as origin,
           coalesce(p.tax_type, case when p.origin = '국산' then 'exempt' else 'taxable' end) as tax_type,
           i.quantity,
           case when i.quantity >= 20 then round(price.price::numeric * 0.95)::bigint else price.price end as unit_price
    from jsonb_to_recordset(p_items) as i(product_id bigint, quantity integer)
    join public.products p on p.id = i.product_id and p.is_active and coalesce(p.stock_status, 'normal') <> 'low'
    join lateral (
      select pp.price from public.product_prices pp
      where pp.product_id = p.id and pp.price_grade in ('clinic', case when customer.price_grade in ('clinic', 'oem', 'special') then customer.price_grade else 'clinic' end)
      order by (pp.price_grade = customer.price_grade) desc nulls last limit 1
    ) price on price.price is not null and price.price >= 0
    where i.quantity > 0
  ) priced;
  if coalesce(jsonb_array_length(lines), 0) <> item_count then
    raise exception '수량이나 가격을 확인할 수 없거나 품절된 상품이 포함되어 있습니다.';
  end if;

  if p_order_id is null then
    insert into public.orders(user_id, company_name, status, delivery_request, total_amount, request_key, order_source, is_bulk)
      values(p_user_id, coalesce(customer.company_name, ''), 'new', p_delivery_request, total, p_request_key, 'web', false)
      returning id into saved_id;
  else
    saved_id := p_order_id;
    delete from public.order_items oi where oi.order_id = saved_id;
    update public.orders set total_amount = total, delivery_request = p_delivery_request where id = saved_id;
  end if;

  insert into public.order_items(order_id, product_id, product_name, weight, origin, tax_type, unit_price, quantity, subtotal)
    select saved_id, i.product_id, i.product_name, i.weight, i.origin, i.tax_type, i.unit_price, i.quantity, i.unit_price * i.quantity
    from jsonb_to_recordset(lines) as i(product_id bigint, product_name text, weight text, origin text, tax_type text, unit_price bigint, quantity integer);
  return query select saved_id, total;
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.save_web_order(uuid, bigint, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_web_order(uuid, bigint, text, text, jsonb) TO service_role;
