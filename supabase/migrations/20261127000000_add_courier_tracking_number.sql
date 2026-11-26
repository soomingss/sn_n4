ALTER TABLE public.orders
  ADD COLUMN courier_tracking_number text
  CHECK (courier_tracking_number ~ '^[0-9]{10,12}$');
