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
  license_number text,
  presence text
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

create table public.wa_dshs_listed_facilities (
  id uuid primary key
);

create view public.wa_afh_published_owner_content as
select content.facility_id,
       content.field_name,
       content.published_value,
       content.published_at
from public.published_owner_listings as content;

grant select on table public.wa_dshs_listed_facilities to anon, authenticated;
grant select on table public.wa_afh_published_owner_content to anon, authenticated;

insert into public.facilities (
  id, canonical_name, source_name, license_category, facility_type, state_code,
  record_status, normalized_license_number, license_number, presence
) values
  ('00000000-0000-4000-8000-000000000101', 'Fixture listed home A', 'wa_dshs_afh', 'afh', 'AF', 'WA', 'source_matched', '100001', '100001', 'present'),
  ('00000000-0000-4000-8000-000000000102', 'Fixture listed home B', 'wa_dshs_afh', 'afh', 'AF', 'WA', 'source_matched', '100002', '100002', 'present'),
  ('00000000-0000-4000-8000-000000000103', 'Fixture absent home', 'wa_dshs_afh', 'afh', 'AF', 'WA', 'source_matched', '100003', '100003', 'absent'),
  ('00000000-0000-4000-8000-000000000104', 'Fixture listed home C', 'wa_dshs_afh', 'afh', 'AF', 'WA', 'source_matched', '100004', '100004', 'present'),
  ('00000000-0000-4000-8000-000000000002', 'Fixture sentinel home', 'wa_dshs_afh', 'afh', 'AF', 'WA', 'source_matched', '100005', '100005', 'present');

insert into public.wa_dshs_listed_facilities (id) values
  ('00000000-0000-4000-8000-000000000101'),
  ('00000000-0000-4000-8000-000000000102'),
  ('00000000-0000-4000-8000-000000000103'),
  ('00000000-0000-4000-8000-000000000104'),
  ('00000000-0000-4000-8000-000000000002');

insert into public.owner_claims (facility_id, claimant_user_id, verification_status) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-0000000000a1', 'approved'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-0000000000b1', 'approved'),
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-0000000000c1', 'pending'),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-0000000000a1', 'approved'),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-0000000000a1', 'approved'),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-0000000000a1', 'approved');

insert into public.published_owner_listings (facility_id, field_name, published_value) values
  ('00000000-0000-4000-8000-000000000101', 'description', 'Approved owner text A'),
  ('00000000-0000-4000-8000-000000000102', 'description', 'Approved owner text B'),
  ('00000000-0000-4000-8000-000000000103', 'description', 'Absent owner text'),
  ('00000000-0000-4000-8000-000000000002', 'description', 'Sentinel owner text');
