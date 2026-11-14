-- Disposable production-shaped objects. No listing function is created.
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

create table public.published_owner_listings (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  facility_id uuid not null,
  field_name text not null,
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
      where btrim(comparison.license_number) = btrim(facility.license_number)
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
    and facility.normalized_license_number = btrim(facility.license_number)
    and facility.license_number ~ '^[0-9]{1,20}$'::text
    and facility.presence is distinct from 'absent'::text
    and exists (
      select 1
      from public.wa_dshs_listed_facilities as listed
      where listed.id = facility.id
    )
);

grant select on table public.wa_afh_published_owner_content to anon, authenticated;

alter default privileges in schema public grant all on tables to anon, authenticated;
