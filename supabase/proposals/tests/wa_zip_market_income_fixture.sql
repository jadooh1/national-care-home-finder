do $roles$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end
$roles$;

create table public.fixture_wa_facilities (
  postal_code text,
  licensed_capacity integer,
  state_code text not null default 'WA',
  record_status text not null default 'source_matched',
  presence text not null default 'active',
  protected_phone text
);

alter table public.fixture_wa_facilities enable row level security;

create policy fixture_wa_public_read
  on public.fixture_wa_facilities
  for select
  to anon, authenticated
  using (
    state_code = 'WA'
    and record_status = 'source_matched'
    and presence is distinct from 'absent'
  );

grant select (
  postal_code,
  licensed_capacity,
  state_code,
  record_status,
  presence
) on table public.fixture_wa_facilities to anon, authenticated;

create view public.wa_dshs_listed_facilities
with (security_invoker = true) as
select postal_code, licensed_capacity
from public.fixture_wa_facilities
where state_code = 'WA'
  and record_status = 'source_matched'
  and presence is distinct from 'absent';

grant select on table public.wa_dshs_listed_facilities to anon, authenticated;
