ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_fee integer NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0);

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
  fee integer;
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

  fee := case when total <= 100000 then 5000 else 0 end;
  total := total + fee;

  if p_order_id is null then
    insert into public.orders(user_id, company_name, status, delivery_request, total_amount, request_key, order_source, is_bulk, shipping_fee)
      values(p_user_id, coalesce(customer.company_name, ''), 'new', p_delivery_request, total, p_request_key, 'web', false, fee)
      returning id into saved_id;
  else
    saved_id := p_order_id;
    delete from public.order_items oi where oi.order_id = saved_id;
    update public.orders set total_amount = total, shipping_fee = fee, delivery_request = p_delivery_request where id = saved_id;
  end if;

  insert into public.order_items(order_id, product_id, product_name, weight, origin, tax_type, unit_price, quantity, subtotal)
    select saved_id, i.product_id, i.product_name, i.weight, i.origin, i.tax_type, i.unit_price, i.quantity, i.unit_price * i.quantity
    from jsonb_to_recordset(lines) as i(product_id bigint, product_name text, weight text, origin text, tax_type text, unit_price bigint, quantity integer);
  return query select saved_id, total;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_order_v31(p_user_id uuid, p_company_name text, p_price_grade text, p_delivery_request text, p_request_key text, p_order_source text, p_items jsonb)
 RETURNS TABLE(order_id bigint, total_amount bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_order_id bigint;
  v_total bigint := 0;
  v_fee integer;
  v_item jsonb;
  v_product record;
  v_price bigint;
  v_qty integer;
  v_existing record;
begin
  if p_request_key is null or length(trim(p_request_key)) < 8 then
    raise exception '유효한 주문 요청키가 필요합니다.';
  end if;
  if p_order_source not in ('web','kakao','other') then
    raise exception '올바르지 않은 주문경로입니다.';
  end if;
  select o.id, o.total_amount into v_existing from public.orders o where o.request_key=p_request_key limit 1;
  if found then return query select v_existing.id, v_existing.total_amount; return; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then raise exception '주문 상품이 없습니다.'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    begin
      v_qty := (v_item->>'quantity')::integer;
    exception when others then
      raise exception '수량은 1 이상의 정수여야 합니다.';
    end;
    if v_qty < 1 then raise exception '수량은 1 이상의 정수여야 합니다.'; end if;
    select p.id,p.name,p.weight,p.origin,p.tax_type into v_product
      from public.products p where p.id=(v_item->>'product_id')::bigint and p.is_active=true;
    if not found then raise exception '판매 가능한 상품을 찾을 수 없습니다.'; end if;
    select pp.price into v_price from public.product_prices pp
      where pp.product_id=v_product.id and pp.price_grade=p_price_grade;
    if not found then raise exception '% 상품의 거래처 단가가 없습니다.', v_product.name; end if;
    v_total := v_total + v_price * v_qty;
  end loop;

  v_fee := case when v_total <= 100000 then 5000 else 0 end;
  v_total := v_total + v_fee;

  insert into public.orders(user_id,company_name,status,delivery_request,total_amount,request_key,order_source,shipping_fee)
  values(p_user_id,p_company_name,'new',p_delivery_request,v_total,p_request_key,p_order_source,v_fee)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::integer;
    select p.id,p.name,p.weight,p.origin,p.tax_type into v_product
      from public.products p where p.id=(v_item->>'product_id')::bigint and p.is_active=true;
    select pp.price into v_price from public.product_prices pp
      where pp.product_id=v_product.id and pp.price_grade=p_price_grade;
    insert into public.order_items(order_id,product_id,product_name,weight,origin,tax_type,unit_price,quantity,subtotal)
    values(v_order_id,v_product.id,v_product.name,coalesce(v_product.weight,''),coalesce(v_product.origin,''),
      coalesce(v_product.tax_type,case when v_product.origin='국산' then 'exempt' else 'taxable' end),
      v_price,v_qty,v_price*v_qty);
  end loop;
  return query select v_order_id,v_total;
end;
$function$;

UPDATE public.site_content SET content_value = '상품금액 10만 원 이하 배송비 5,000원 · 10만 원 초과 무료배송' WHERE page_key = 'order_delivery' AND content_key = 'parcel_shipping_notice' AND is_active;
