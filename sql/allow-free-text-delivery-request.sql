-- Keep the existing order ownership, status, pricing and transaction checks.
-- Only replace the legacy delivery-selection validation with a text limit.
DO $migration$
DECLARE
  definition text;
  old_validation text := E'if p_delivery_request not in (''당일'',''익일'') then\n    raise exception ''배송요청사항이 올바르지 않습니다.'';\n  end if;';
  new_validation text := E'if char_length(coalesce(p_delivery_request, '''')) > 500 then\n    raise exception ''배송 요청사항은 500자 이내로 입력해 주세요.'';\n  end if;';
BEGIN
  SELECT pg_get_functiondef('public.edit_order_v371(bigint,uuid,text,jsonb)'::regprocedure) INTO definition;
  IF strpos(definition, old_validation) = 0 THEN
    RAISE EXCEPTION 'Expected delivery validation not found; inspect the current function before applying.';
  END IF;
  EXECUTE replace(definition, old_validation, new_validation);
END;
$migration$;
