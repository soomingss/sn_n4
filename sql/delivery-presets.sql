create table if not exists public.delivery_request_presets (
  user_id uuid not null references public.profiles(id) on delete cascade,
  location_name text not null check (char_length(location_name) between 1 and 60),
  note text not null check (char_length(note) between 1 and 500),
  primary key (user_id, location_name)
);
alter table public.delivery_request_presets enable row level security;
revoke all on public.delivery_request_presets from anon, authenticated;
grant select, insert, update, delete on public.delivery_request_presets to service_role;
