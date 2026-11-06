-- Disposable fixture for the Phase 5C owner-claim migration.
-- Not a migration. Do not apply it to Supabase or production.

create schema if not exists auth;

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
  if not exists (select 1 from pg_roles where rolname = 'phase5c_public_probe') then
    create role phase5c_public_probe nologin;
  end if;
end
$$;

grant anon, authenticated, ingest_definer, phase5c_public_probe to current_user;
grant usage on schema public to anon, authenticated, phase5c_public_probe, ingest_definer;
grant usage on schema auth to anon, authenticated, phase5c_public_probe;

create table auth.users (
  id uuid primary key,
  email_confirmed_at timestamptz
);

create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant execute on function auth.uid() to anon, authenticated, phase5c_public_probe;

insert into auth.users (id, email_confirmed_at) values
  ('00000000-0000-4000-8000-0000000000a1', '2026-01-01T00:00:00Z'),
  ('00000000-0000-4000-8000-0000000000b2', '2026-01-01T00:00:00Z'),
  ('00000000-0000-4000-8000-0000000000c3', null),
  ('00000000-0000-4000-8000-0000000000d4', '2026-01-01T00:00:00Z'),
  ('00000000-0000-4000-8000-0000000000d5', '2026-01-01T00:00:00Z'),
  ('00000000-0000-4000-8000-0000000000e5', '2026-01-01T00:00:00Z');

create table public.facilities (
  id uuid primary key,
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
  licensed_capacity integer,
  record_status text,
  normalized_license_number text,
  license_category text,
  source_name text,
  source_hash text,
  public_phone text
);

insert into public.facilities (
  id, canonical_name, facility_type, address_line1, city, county, state_code,
  postal_code, latitude, longitude, license_number, licensed_capacity, record_status,
  normalized_license_number, license_category, source_name, source_hash, public_phone
) values
  ('00000000-0000-4000-8000-000000000101', 'Published Home 00001', 'AFH', '1 Published Street', 'Kent', 'King', 'WA', '98056', 47.5, -122.2, '100001', 6, 'source_matched', '100001', 'afh', 'wa_dshs_afh', repeat('ab', 32), '555-0101'),
  ('00000000-0000-4000-8000-000000000104', 'Published Home 00004', 'AFH', '4 Published Street', 'Kent', 'King', 'WA', '98056', 47.5, -122.2, '100004', 6, 'source_matched', '100004', 'afh', 'wa_dshs_afh', repeat('ab', 32), '555-0104'),
  ('00000000-0000-4000-8000-000000000105', 'Published Home 00005', 'AFH', '5 Published Street', 'Kent', 'King', 'WA', '98056', 47.5, -122.2, '100005', 6, 'source_matched', '100005', 'afh', 'wa_dshs_afh', repeat('ab', 32), '555-0105'),
  ('00000000-0000-4000-8000-000000000106', 'Published Home 00006', 'AFH', '6 Published Street', 'Kent', 'King', 'WA', '98056', 47.5, -122.2, '100006', 6, 'source_matched', '100006', 'afh', 'wa_dshs_afh', repeat('ab', 32), '555-0106'),
  ('00000000-0000-4000-8000-000000000002', 'DEVELOPMENT TEST HOME - NOT REAL', 'AFH', 'Test', 'Kent', 'King', 'WA', '98056', 47.5, -122.2, '100002', 6, 'unverified', '100002', 'afh', 'wa_dshs_afh', repeat('ab', 32), '555-0100'),
  ('00000000-0000-4000-8000-000000000102', 'DEVELOPMENT TEST HOME - NOT REAL', 'AFH', 'Named test', 'Kent', 'King', 'WA', '98056', 47.5, -122.2, '100102', 6, 'source_matched', '100102', 'afh', 'wa_dshs_afh', repeat('ab', 32), '555-0102'),
  ('00000000-0000-4000-8000-000000000103', 'Missing Category Home', 'AFH', '3 Street', 'Kent', 'King', 'WA', '98056', 47.5, -122.2, '100103', 6, 'source_matched', '100103', null, 'wa_dshs_afh', repeat('ab', 32), '555-0103'),
  ('00000000-0000-4000-8000-000000000108', 'Blank License Home', 'AFH', '8 Street', 'Kent', 'King', 'WA', '98056', 47.5, -122.2, '100108', 6, 'source_matched', '   ', 'afh', 'wa_dshs_afh', repeat('ab', 32), '555-0108'),
  ('00000000-0000-4000-8000-000000000109', 'Letter License Home', 'AFH', '9 Street', 'Kent', 'King', 'WA', '98056', 47.5, -122.2, 'ABC109', 6, 'source_matched', 'ABC109', 'afh', 'wa_dshs_afh', repeat('ab', 32), '555-0109');

create table public.owner_claims (
  id uuid primary key,
  facility_id uuid not null references public.facilities (id),
  claimant_user_id uuid not null,
  verification_status text not null,
  evidence_notes text
);

create table public.listing_edits (
  id uuid primary key,
  facility_id uuid not null references public.facilities (id),
  submitted_by_user_id uuid not null,
  field_name text not null,
  proposed_value text,
  review_status text not null
);

create table public.app_admins (
  user_id uuid primary key
);

insert into public.app_admins (user_id) values
  ('00000000-0000-4000-8000-0000000000d4'),
  ('00000000-0000-4000-8000-0000000000d5');

insert into public.owner_claims (
  id, facility_id, claimant_user_id, verification_status, evidence_notes
) values (
  '00000000-0000-4000-8000-0000000000c1',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-0000000000a1',
  'pending',
  'preserved claim evidence'
);

insert into public.listing_edits (
  id, facility_id, submitted_by_user_id, field_name, proposed_value, review_status
) values (
  '00000000-0000-4000-8000-0000000000e1',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-0000000000a1',
  'description',
  'preserved proposal text',
  'pending'
);

create table public.nchf_phase5a_facilities_acl_snapshot (
  id integer primary key,
  privilege_text text not null
);

insert into public.nchf_phase5a_facilities_acl_snapshot (id, privilege_text)
values (1, 'preserved phase 5a grant text');

alter table public.owner_claims enable row level security;
alter table public.listing_edits enable row level security;

create policy owner_claims_select_own
  on public.owner_claims
  for select
  to authenticated
  using (claimant_user_id = auth.uid());

create policy owner_claims_insert_own
  on public.owner_claims
  for insert
  to authenticated
  with check (claimant_user_id = auth.uid());

create policy listing_edits_select_by_status
  on public.listing_edits
  for select
  to authenticated
  using (review_status in ('pending', 'approved', 'rejected'));

create policy listing_edits_insert_own
  on public.listing_edits
  for insert
  to authenticated
  with check (submitted_by_user_id = auth.uid());

create policy listing_edits_ingest_definer_select
  on public.listing_edits
  for select
  to ingest_definer
  using (true);

create function public.admin_approve_owner_claim(p_claim_id uuid)
returns boolean
language plpgsql
as $$
begin
  -- phase5c-prior-approve
  return false;
end;
$$;

create function public.admin_reject_owner_claim(p_claim_id uuid)
returns boolean
language plpgsql
as $$
begin
  -- phase5c-prior-reject
  return false;
end;
$$;

create function public.admin_review_listing_edit(p_edit_id uuid, p_decision text)
returns boolean
language plpgsql
as $$
begin
  -- phase5c-prior-review
  return false;
end;
$$;

create view public.wa_dshs_listed_facilities
with (security_invoker = true) as
select id, canonical_name, address_line1, city, county, license_number,
       state_code, postal_code, licensed_capacity, record_status
from public.facilities
where source_name = 'wa_dshs_afh'
  and license_category = 'afh'
  and facility_type = 'AFH'
  and state_code = 'WA'
  and record_status = 'source_matched'
  and normalized_license_number is not null
  and btrim(normalized_license_number, E' \t\r\n') <> ''
  and license_number ~ '^[0-9]{1,20}$';

create view public.wa_afh_map_facilities
with (security_invoker = true) as
select id, canonical_name, address_line1, city, county, state_code, postal_code,
       license_number, licensed_capacity, latitude, longitude
from public.facilities
where source_name = 'wa_dshs_afh'
  and license_category = 'afh'
  and facility_type = 'AFH'
  and state_code = 'WA'
  and record_status = 'source_matched'
  and normalized_license_number is not null
  and btrim(normalized_license_number, E' \t\r\n') <> ''
  and license_number ~ '^[0-9]{1,20}$'
  and latitude is not null
  and longitude is not null;

grant select, insert, update, delete, truncate
  on table public.owner_claims, public.listing_edits
  to anon, authenticated, public;
grant insert (evidence_notes), update (evidence_notes), select (evidence_notes)
  on table public.owner_claims
  to authenticated, public;
grant insert (proposed_value), update (proposed_value)
  on table public.listing_edits
  to anon;
grant select on table public.nchf_phase5a_facilities_acl_snapshot to anon, authenticated, public;

alter default privileges in schema public
  grant all on tables to anon, authenticated, public;

create table public.phase5c_fixture_sentinel (
  name text primary key,
  value text not null
);

insert into public.phase5c_fixture_sentinel (name, value) values
  ('preserved-claim', 'preserved claim evidence'),
  ('preserved-edit', 'preserved proposal text'),
  ('phase5a', 'preserved phase 5a grant text'),
  ('facility-count', (select count(*)::text from public.facilities)),
  ('listed-view', md5(pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true))),
  ('map-view', md5(pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true)));
