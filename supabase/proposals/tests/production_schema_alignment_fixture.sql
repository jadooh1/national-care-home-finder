-- Disposable production-shaped fixture. It is not production data.

create schema if not exists auth;
create table auth.users (
  id uuid primary key,
  email_confirmed_at timestamptz
);
insert into auth.users (id, email_confirmed_at)
values ('00000000-0000-4000-8000-0000000000aa', pg_catalog.clock_timestamp());

create function auth.uid()
returns uuid
language sql
stable
as $$
  select '00000000-0000-4000-8000-0000000000aa'::uuid;
$$;

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
  if not exists (select 1 from pg_roles where rolname = 'postgres') then
    create role postgres nologin;
  end if;
end;
$roles$;

grant usage on schema public to anon, authenticated, service_role, postgres;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

create table public.facilities (
  id uuid primary key,
  canonical_name text not null,
  address_line1 text,
  city text,
  county text,
  state_code text,
  postal_code text,
  license_number text,
  licensed_capacity integer,
  record_status text not null,
  latitude double precision,
  longitude double precision,
  facility_type text
);

insert into public.facilities (
  id, canonical_name, address_line1, city, county, state_code, postal_code,
  license_number, licensed_capacity, record_status, latitude, longitude,
  facility_type
)
select pg_catalog.gen_random_uuid(),
       'Synthetic facility ' || series.n,
       '1 Example St',
       'Example',
       'Example',
       'WA',
       '98000',
       series.n::text,
       6,
       'unclassified',
       47.0,
       -122.0,
       'AF'
from pg_catalog.generate_series(1, 8121) as series(n);

create table public.wa_dshs_license_comparison (
  license_number text
);
insert into public.wa_dshs_license_comparison (license_number)
select series.n::text
from pg_catalog.generate_series(1, 8121) as series(n);

create table public.owner_claims (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  facility_id uuid not null references public.facilities (id),
  claimant_user_id uuid not null,
  verification_status text not null,
  evidence_notes text
);

create table public.listing_edits (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  facility_id uuid not null references public.facilities (id),
  submitted_by_user_id uuid,
  field_name text,
  proposed_value text,
  review_status text
);

create table public.app_admins (
  user_id uuid primary key
);
insert into public.app_admins (user_id)
values ('00000000-0000-4000-8000-0000000000bb');

alter table public.facilities enable row level security;
grant select on table public.facilities to anon, authenticated;
create policy "Public read verified facilities"
  on public.facilities
  for select
  to anon, authenticated
  using (record_status = 'verified');

-- Reproduces the read-only production view structure:
-- directory columns, Washington AF filter, trimmed license match,
-- security_barrier, and the map join with coordinate bounds.
create view public.wa_dshs_listed_facilities
with (security_barrier = true) as
select facilities.id,
       facilities.canonical_name,
       facilities.address_line1,
       facilities.city,
       facilities.county,
       facilities.state_code,
       facilities.postal_code,
       facilities.license_number,
       facilities.licensed_capacity,
       facilities.record_status
from public.facilities as facilities
where facilities.state_code = 'WA'
  and facilities.facility_type = 'AF'
  and exists (
    select 1
    from public.wa_dshs_license_comparison as comparison
    where pg_catalog.btrim(comparison.license_number) = pg_catalog.btrim(facilities.license_number)
  );

create view public.wa_afh_map_facilities as
select listed.id,
       listed.canonical_name,
       listed.address_line1,
       listed.city,
       listed.county,
       listed.state_code,
       listed.postal_code,
       listed.license_number,
       listed.licensed_capacity,
       listed.record_status,
       facilities.latitude,
       facilities.longitude
from public.wa_dshs_listed_facilities as listed
join public.facilities as facilities on facilities.id = listed.id
where facilities.latitude >= 45
  and facilities.latitude <= 50
  and facilities.longitude >= -125
  and facilities.longitude <= -116;

revoke all on table public.wa_dshs_listed_facilities, public.wa_afh_map_facilities from public;
grant select on table public.wa_dshs_listed_facilities, public.wa_afh_map_facilities
  to anon, authenticated, service_role, postgres;
