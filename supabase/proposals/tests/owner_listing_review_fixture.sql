-- Disposable production-shaped objects. Facility type AF matches the live listing rule.
-- This does not connect to Supabase.

do $roles$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'service_role') then
    create role service_role nologin;
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
  canonical_name text,
  address_line1 text,
  city text,
  county text,
  state_code text,
  postal_code text,
  license_number text,
  licensed_capacity integer,
  record_status text,
  source_name text,
  license_category text,
  facility_type text,
  normalized_license_number text,
  presence text
);

create table public.wa_dshs_license_comparison (
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
  id uuid primary key default pg_catalog.gen_random_uuid(),
  facility_id uuid not null,
  field_name text not null,
  source_edit_id uuid,
  published_by_user_id uuid,
  published_value text not null,
  published_at timestamptz not null default pg_catalog.clock_timestamp()
);

create view public.wa_dshs_listed_facilities as
select listed.id,
       listed.canonical_name,
       listed.address_line1,
       listed.city,
       listed.county,
       listed.state_code,
       listed.postal_code,
       listed.license_number,
       listed.licensed_capacity,
       listed.record_status
from (
  select facility.id,
         facility.canonical_name,
         facility.address_line1,
         facility.city,
         facility.county,
         facility.state_code,
         facility.postal_code,
         facility.license_number,
         facility.licensed_capacity,
         facility.record_status
  from public.facilities as facility
  where facility.state_code = 'WA'::text
    and facility.facility_type = 'AF'::text
    and exists (
      select 1
      from public.wa_dshs_license_comparison as comparison
      where pg_catalog.btrim(comparison.license_number) = pg_catalog.btrim(facility.license_number)
    )
) as listed
join public.facilities as facility on facility.id = listed.id
where facility.presence is distinct from 'absent'::text;

create view public.wa_afh_published_owner_content as
select content.facility_id,
       content.field_name,
       content.published_value,
       content.published_at
from public.published_owner_listings as content
where exists (
  select 1
  from public.facilities as facility
  where facility.id = content.facility_id
    and facility.id is distinct from '00000000-0000-4000-8000-000000000002'::uuid
    and facility.canonical_name is distinct from 'DEVELOPMENT TEST HOME - NOT REAL'::text
    and facility.source_name = 'wa_dshs_afh'::text
    and facility.license_category = 'afh'::text
    and facility.facility_type = 'AF'::text
    and facility.state_code = 'WA'::text
    and facility.record_status = 'source_matched'::text
    and facility.normalized_license_number = pg_catalog.btrim(facility.license_number)
    and facility.license_number ~ '^[0-9]{1,20}$'::text
    and facility.presence is distinct from 'absent'::text
    and exists (
      select 1
      from public.wa_dshs_listed_facilities as listed
      where listed.id = facility.id
    )
);

create function public.admin_list_published_owner_listings()
returns table (
  facility_id uuid,
  field_name text,
  published_value text,
  published_at timestamptz
)
language plpgsql
stable
security definer
set search_path = auth, public
as $fn$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.app_admins as admin_row
    where admin_row.user_id = auth.uid()
  ) then
    return;
  end if;
  return query
  select content.facility_id,
         content.field_name,
         content.published_value,
         content.published_at
  from public.published_owner_listings as content
  order by content.published_at desc, content.id desc;
end;
$fn$;

revoke all on function public.admin_list_published_owner_listings() from public, anon, authenticated, service_role;
grant execute on function public.admin_list_published_owner_listings() to authenticated;

grant select on table public.wa_dshs_listed_facilities to anon, authenticated;
grant select on table public.wa_afh_published_owner_content to anon, authenticated, service_role;
grant select on table public.published_owner_listings to service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;

insert into public.facilities (
  id, canonical_name, state_code, license_number, record_status, source_name,
  license_category, facility_type, normalized_license_number, presence
) values
  ('00000000-0000-4000-8000-000000000101', 'Fixture listed home A', 'WA', '100001', 'source_matched', 'wa_dshs_afh', 'afh', 'AF', '100001', 'present'),
  ('00000000-0000-4000-8000-000000000102', 'Fixture listed home B', 'WA', '100002', 'source_matched', 'wa_dshs_afh', 'afh', 'AF', '100002', 'present'),
  ('00000000-0000-4000-8000-000000000103', 'Fixture absent home', 'WA', '100003', 'source_matched', 'wa_dshs_afh', 'afh', 'AF', '100003', 'absent'),
  ('00000000-0000-4000-8000-000000000104', 'Fixture listed home C', 'WA', '100004', 'source_matched', 'wa_dshs_afh', 'afh', 'AF', '100004', 'present'),
  ('00000000-0000-4000-8000-000000000002', 'Fixture sentinel home', 'WA', '100005', 'source_matched', 'wa_dshs_afh', 'afh', 'AF', '100005', 'present'),
  ('00000000-0000-4000-8000-000000000105', 'Fixture other care type', 'WA', '100006', 'source_matched', 'wa_dshs_afh', 'afh', 'AFH', '100006', 'present'),
  ('00000000-0000-4000-8000-000000000106', 'Fixture license mismatch', 'WA', '100007', 'source_matched', 'wa_dshs_afh', 'afh', 'AF', '100007-extra', 'present'),
  ('00000000-0000-4000-8000-000000000107', 'Fixture unlisted home', 'WA', '100008', 'source_matched', 'wa_dshs_afh', 'afh', 'AF', '100008', 'present');

insert into public.wa_dshs_license_comparison (license_number) values
  ('100001'), ('100002'), ('100003'), ('100004'), ('100005'), ('100006'), ('100007');

insert into public.owner_claims (facility_id, claimant_user_id, verification_status) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-0000000000a1', 'approved'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-0000000000b1', 'approved'),
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-0000000000c1', 'pending'),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-0000000000a1', 'approved'),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-0000000000a1', 'approved'),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000a1', 'approved'),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-0000000000a1', 'approved'),
  ('00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-0000000000a1', 'approved'),
  ('00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-0000000000a1', 'approved');

insert into public.app_admins (user_id) values
  ('00000000-0000-4000-8000-0000000000d1');

insert into public.published_owner_listings (facility_id, field_name, published_value) values
  ('00000000-0000-4000-8000-000000000101', 'description', 'Approved owner text A'),
  ('00000000-0000-4000-8000-000000000102', 'description', 'Approved owner text B'),
  ('00000000-0000-4000-8000-000000000103', 'description', 'Absent owner text'),
  ('00000000-0000-4000-8000-000000000002', 'description', 'Sentinel owner text'),
  ('00000000-0000-4000-8000-000000000105', 'description', 'Other care type text'),
  ('00000000-0000-4000-8000-000000000106', 'description', 'Mismatched license text'),
  ('00000000-0000-4000-8000-000000000107', 'description', 'Unlisted home text');
