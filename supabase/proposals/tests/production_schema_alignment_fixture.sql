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
end;
$roles$;

grant usage on schema public to anon, authenticated;
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
  source_name text,
  license_category text,
  facility_type text,
  normalized_license_number text
);

insert into public.facilities (
  id, canonical_name, address_line1, city, county, state_code, postal_code,
  license_number, licensed_capacity, record_status, latitude, longitude,
  source_name, license_category, facility_type, normalized_license_number
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
       null,
       null,
       'unclassified',
       'unclassified',
       'unclassified',
       series.n::text
from pg_catalog.generate_series(1, 8121) as series(n);

create table public.owner_claims (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  facility_id uuid not null references public.facilities (id),
  claimant_user_id uuid not null,
  verification_status text not null,
  evidence_notes text,
  reviewed_at timestamptz
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
