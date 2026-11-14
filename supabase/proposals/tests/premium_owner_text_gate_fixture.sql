-- Disposable objects that stand in for the verified production publication view.
do $roles$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end;
$roles$;

create table public.published_owner_listings (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  facility_id uuid not null,
  field_name text not null,
  published_value text not null,
  published_at timestamptz not null default pg_catalog.clock_timestamp()
);

create function public.nchf_phase5g_facility_is_listed(p_facility_id uuid)
returns boolean
language sql
stable
as $$
  select true;
$$;

create view public.wa_afh_published_owner_content as
select facility_id, field_name, published_value, published_at
from public.published_owner_listings;

grant select on table public.wa_afh_published_owner_content to anon, authenticated;

alter default privileges in schema public grant all on tables to anon, authenticated;
