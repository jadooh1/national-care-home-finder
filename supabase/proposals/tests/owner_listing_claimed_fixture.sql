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

create schema if not exists auth;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table public.facilities (
  id uuid primary key,
  canonical_name text not null,
  source_name text not null,
  license_category text not null,
  facility_type text not null,
  state_code text not null,
  record_status text not null,
  normalized_license_number text,
  license_number text
);

create table public.owner_claims (
  facility_id uuid not null,
  claimant_user_id uuid not null,
  verification_status text not null
);

create table public.app_admins (
  user_id uuid primary key
);

create table public.published_owner_listings (
  facility_id uuid not null,
  field_name text not null,
  published_value text not null,
  published_at timestamptz not null default pg_catalog.now()
);

create table public.published_owner_listing_events (
  id uuid primary key default pg_catalog.gen_random_uuid()
);

create table public.wa_dshs_listed_facilities (
  id uuid primary key
);

create function public.nchf_phase5g_facility_is_listed(p_facility_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.facilities as facility
    where facility.id = p_facility_id
      and facility.id is distinct from '00000000-0000-4000-8000-000000000002'::uuid
      and facility.canonical_name is distinct from 'DEVELOPMENT TEST HOME - NOT REAL'
      and facility.source_name = 'wa_dshs_afh'
      and facility.license_category = 'afh'
      and facility.facility_type = 'AFH'
      and facility.state_code = 'WA'
      and facility.record_status = 'source_matched'
      and facility.normalized_license_number is not null
      and pg_catalog.btrim(facility.normalized_license_number) <> ''
      and facility.license_number ~ '^[0-9]{1,20}$'
  );
$$;

create view public.wa_afh_published_owner_content as
select content.facility_id,
       content.field_name,
       content.published_value,
       content.published_at
from public.published_owner_listings as content
where public.nchf_phase5g_facility_is_listed(content.facility_id);

grant select on table public.wa_dshs_listed_facilities to anon, authenticated;
grant select on table public.wa_afh_published_owner_content to anon, authenticated;

insert into public.facilities (
  id, canonical_name, source_name, license_category, facility_type, state_code,
  record_status, normalized_license_number, license_number
) values
  ('00000000-0000-4000-8000-000000000101', 'Fixture listed home A', 'wa_dshs_afh', 'afh', 'AFH', 'WA', 'source_matched', '100001', '100001'),
  ('00000000-0000-4000-8000-000000000102', 'Fixture listed home B', 'wa_dshs_afh', 'afh', 'AFH', 'WA', 'source_matched', '100002', '100002'),
  ('00000000-0000-4000-8000-000000000104', 'Fixture listed home C', 'wa_dshs_afh', 'afh', 'AFH', 'WA', 'source_matched', '100004', '100004');

insert into public.owner_claims (facility_id, claimant_user_id, verification_status) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-0000000000a1', 'approved'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-0000000000b1', 'approved'),
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-0000000000c1', 'pending'),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-0000000000a1', 'approved');

insert into public.published_owner_listings (facility_id, field_name, published_value) values
  ('00000000-0000-4000-8000-000000000101', 'description', 'Approved owner text A'),
  ('00000000-0000-4000-8000-000000000102', 'description', 'Approved owner text B');
