-- Disposable PostgreSQL 17.11 fixture for the Phase 5A visibility proposal.
-- Not a migration. Do not apply it to Supabase or production.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'ingest_definer') then
    create role ingest_definer nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'postgres') then
    create role postgres login nosuperuser nobypassrls noinherit;
  end if;
end
$$;

grant anon to postgres with inherit false, set true;
grant authenticated to postgres with inherit false, set true;
grant usage, create on schema public to postgres;

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  canonical_name text,
  facility_type text,
  address_line1 text,
  city text,
  county text,
  state_code text,
  postal_code text,
  latitude numeric,
  longitude numeric,
  license_number text,
  license_status text,
  licensed_capacity integer,
  record_status text,
  normalized_license_number text,
  license_category text,
  source_name text,
  source_hash text,
  public_phone text
);

insert into public.facilities (
  id, canonical_name, facility_type, state_code, record_status, public_phone
) values (
  '00000000-0000-4000-8000-000000000002',
  'DEVELOPMENT TEST HOME - NOT REAL',
  'AFH',
  'WA',
  'unverified',
  '555-0100'
);

insert into public.facilities (
  canonical_name, facility_type, state_code, postal_code, latitude, longitude,
  record_status, source_name, license_number, normalized_license_number, license_category
) values (
  'VERIFIED OTHER SOURCE',
  'AFH',
  'WA',
  '98001',
  47.3,
  -122.2,
  'verified',
  'other_source',
  '999999',
  '999999',
  'afh'
);

insert into public.facilities (
  canonical_name, facility_type, state_code, postal_code, latitude, longitude,
  license_number, licensed_capacity, record_status, normalized_license_number,
  license_category, source_name, source_hash, city, county, address_line1
)
select
  'Published Home ' || lpad(row_number::text, 5, '0'),
  'AFH',
  'WA',
  '98056',
  47.5,
  -122.2,
  lpad(row_number::text, 6, '0'),
  6,
  'source_matched',
  lpad(row_number::text, 6, '0'),
  'afh',
  'wa_dshs_afh',
  repeat('ab', 32),
  'Kent',
  'King',
  '1 Published Street'
from generate_series(1, 6265) as published(row_number);

create table public.owner_claims (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id),
  claimant_user_id uuid not null,
  verification_status text not null,
  evidence_notes text
);

create table public.listing_edits (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id),
  submitted_by_user_id uuid not null,
  field_name text not null,
  proposed_value text,
  review_status text not null
);

insert into public.owner_claims (facility_id, claimant_user_id, verification_status, evidence_notes)
select id, '00000000-0000-4000-8000-0000000000a1', 'approved', 'private claim note for user a'
from public.facilities
where license_number = '000001';

insert into public.owner_claims (facility_id, claimant_user_id, verification_status, evidence_notes)
select id, '00000000-0000-4000-8000-0000000000b2', 'pending', 'private claim note for user b'
from public.facilities
where license_number = '000002';

insert into public.listing_edits (
  facility_id, submitted_by_user_id, field_name, proposed_value, review_status
)
select id, '00000000-0000-4000-8000-0000000000a1', 'description', 'private edit for user a', 'pending'
from public.facilities
where license_number = '000001';

insert into public.listing_edits (
  facility_id, submitted_by_user_id, field_name, proposed_value, review_status
)
select id, '00000000-0000-4000-8000-0000000000b2', 'services', 'private edit for user b', 'pending'
from public.facilities
where license_number = '000002';

alter table public.facilities enable row level security;
alter table public.owner_claims enable row level security;
alter table public.listing_edits enable row level security;

create policy "Development test facility read"
  on public.facilities
  for select
  to authenticated
  using (
    id = '00000000-0000-4000-8000-000000000002'::uuid
    and canonical_name = 'DEVELOPMENT TEST HOME - NOT REAL'
  );

create policy "Public read verified facilities"
  on public.facilities
  for select
  to anon, authenticated
  using (record_status = 'verified');

create policy facilities_ingest_definer_select
  on public.facilities
  for select
  to ingest_definer
  using (true);

create policy facilities_ingest_definer_insert
  on public.facilities
  for insert
  to ingest_definer
  with check (true);

create policy facilities_ingest_definer_update
  on public.facilities
  for update
  to ingest_definer
  using (true)
  with check (true);

create policy owner_claims_select_own
  on public.owner_claims
  for select
  to authenticated
  using (claimant_user_id = current_setting('request.jwt.claim.sub', true)::uuid);

create policy owner_claims_insert_own
  on public.owner_claims
  for insert
  to authenticated
  with check (claimant_user_id = current_setting('request.jwt.claim.sub', true)::uuid);

create policy listing_edits_select_own
  on public.listing_edits
  for select
  to authenticated
  using (submitted_by_user_id = current_setting('request.jwt.claim.sub', true)::uuid);

create policy listing_edits_insert_own
  on public.listing_edits
  for insert
  to authenticated
  with check (submitted_by_user_id = current_setting('request.jwt.claim.sub', true)::uuid);

create policy listing_edits_ingest_definer_select
  on public.listing_edits
  for select
  to ingest_definer
  using (true);

create view public.wa_dshs_listed_facilities
with (security_invoker = true) as
select id, canonical_name, address_line1, city, county, license_number
from public.facilities;

create view public.wa_afh_map_facilities
with (security_invoker = true) as
select id,
       canonical_name,
       address_line1,
       city,
       county,
       state_code,
       postal_code,
       license_number,
       licensed_capacity,
       latitude,
       longitude
from public.facilities
where state_code = 'WA'
  and latitude is not null
  and longitude is not null
  and postal_code is not null
  and facility_type = 'AFH';

grant select on table public.facilities to anon, authenticated;
grant select on table public.wa_dshs_listed_facilities, public.wa_afh_map_facilities to anon, authenticated;
grant select, insert on table public.owner_claims, public.listing_edits to authenticated;

alter table public.facilities owner to postgres;
alter table public.owner_claims owner to postgres;
alter table public.listing_edits owner to postgres;
alter view public.wa_dshs_listed_facilities owner to postgres;
alter view public.wa_afh_map_facilities owner to postgres;

do $fixture_guard$
declare
  seen bigint;
begin
  execute 'set local role authenticated';
  select count(*) into seen
  from public.facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  if seen <> 1 then
    raise exception 'fixture authenticated base visibility is %', seen;
  end if;
  select count(*) into seen
  from public.wa_dshs_listed_facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  if seen <> 1 then
    raise exception 'fixture authenticated directory visibility is %', seen;
  end if;
  execute 'set local role anon';
  select count(*) into seen
  from public.facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  if seen <> 0 then
    raise exception 'fixture anon can see the test home';
  end if;
  select count(*) into seen
  from public.wa_afh_map_facilities
  where canonical_name = 'VERIFIED OTHER SOURCE';
  if seen <> 1 then
    raise exception 'fixture anon map decoy visibility is %', seen;
  end if;
  execute 'reset role';
end
$fixture_guard$;
