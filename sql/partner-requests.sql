create table if not exists public.partner_requests (
  id uuid primary key,
  user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('receipt', 'sourcing')),
  status text not null default 'new' check (status in ('new', 'checking', 'resolved')),
  order_id text,
  item_id text,
  subject text not null,
  details text not null,
  photo_type text,
  photo_base64 text,
  check ((photo_type is null) = (photo_base64 is null)),
  check (photo_type in ('image/jpeg','image/png','image/webp')),
  check (length(photo_base64) <= 1000000)
);
create index if not exists partner_requests_user_created_idx
  on public.partner_requests (user_id, created_at desc);
alter table public.partner_requests enable row level security;
revoke all on public.partner_requests from anon, authenticated;
grant select, insert, update on public.partner_requests to service_role;
