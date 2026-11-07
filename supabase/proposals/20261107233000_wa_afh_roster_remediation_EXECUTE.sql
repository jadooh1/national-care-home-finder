-- Development-only Washington AFH roster remediation.
-- This file does not set its own authorization. A session must already
-- have both settings below, and every precheck must pass, before any write.
-- If a precheck fails, the transaction aborts and nothing is committed.
--
--   set nchf.roster_remediation_authorization = 'authorize-development-roster-remediation';
--   set nchf.roster_remediation_target = 'ajjsyloyihcqdomywhik';
--
-- Run only as postgres.ajjsyloyihcqdomywhik against the development project.
-- Never run this against yiehgstweswxjakbcdzc.

begin;

do $guard$
begin
  if current_setting('nchf.roster_remediation_authorization', true)
     is distinct from 'authorize-development-roster-remediation' then
    raise exception 'roster remediation execution was not authorized in this session';
  end if;
  if current_setting('nchf.roster_remediation_target', true)
     is distinct from 'ajjsyloyihcqdomywhik' then
    raise exception 'roster remediation target is not the development project';
  end if;
end
$guard$;

do $precheck$
declare
  listed_count bigint;
  mapped_count bigint;
  missing_required text;
  jurisdiction uuid;
  jurisdiction_count integer;
  lock_count integer;
  approved_edit_count integer;
  market_blocker text;
  helper_def text;
  view_def text;
begin
  if to_regclass('public.facilities') is null
     or to_regclass('public.wa_dshs_listed_facilities') is null
     or to_regclass('public.wa_afh_map_facilities') is null
     or to_regprocedure('public.nchf_phase5g_facility_is_listed(uuid)') is null then
    raise exception 'required directory objects are missing';
  end if;

  select count(*) into listed_count from public.wa_dshs_listed_facilities;
  select count(*) into mapped_count from public.wa_afh_map_facilities;
  if listed_count <> 6265 or mapped_count <> 6265 then
    raise exception 'live public counts are listed % and mapped %, expected 6265 and 6265',
      listed_count, mapped_count;
  end if;

  if not exists (
    select 1 from public.facilities
    where id = '00000000-0000-4000-8000-000000000002'::uuid
      and canonical_name = 'DEVELOPMENT TEST HOME - NOT REAL'
  ) then
    raise exception 'reserved development test home is missing';
  end if;

  if exists (
    select 1 from public.wa_dshs_listed_facilities
    where license_number in (
      '759434','759435','759436','759437','759438','759439','759440','759441',
      '759442','759443','759444','759445','759446','759447','759448','759449','759450'
    )
  ) then
    raise exception 'one or more proposed additions are already listed';
  end if;

  if (
    select count(*) from public.facilities
    where source_name = 'wa_dshs_afh'
      and license_number in ('752686','755649','757132','758334')
      and record_status = 'source_matched'
  ) <> 4 then
    raise exception 'the four archived licenses are not all present as source-matched rows';
  end if;

  if exists (
    select 1 from public.facilities
    where source_name = 'wa_dshs_afh'
      and (
        (license_number = '759147' and licensed_capacity is not null)
        or (license_number = '759176' and licensed_capacity is not null)
        or (license_number = '757641' and licensed_capacity is distinct from 6)
        or (license_number = '754130' and canonical_name is distinct from '#1 Samantha & Yoanna''s Care Home LLC')
      )
  ) then
    raise exception 'a field correction no longer matches the reviewed source value';
  end if;

  if to_regclass('ingest.field_locks') is null then
    raise exception 'ingest.field_locks is missing, so rollback readiness is incomplete';
  end if;

  select count(*) into lock_count
  from ingest.field_locks as lock
  join public.facilities as facility on facility.id = lock.facility_id
  where facility.source_name = 'wa_dshs_afh'
    and (
      (facility.license_number in ('759147','759176','757641') and lock.column_name = 'licensed_capacity')
      or (facility.license_number = '754130' and lock.column_name = 'canonical_name')
    );
  if lock_count <> 0 then
    raise exception 'a field lock protects one of the four corrections';
  end if;

  select count(*) into approved_edit_count
  from public.listing_edits as edit
  join public.facilities as facility on facility.id = edit.facility_id
  where edit.review_status = 'approved'
    and facility.source_name = 'wa_dshs_afh'
    and (
      (facility.license_number in ('759147','759176','757641') and edit.field_name = 'licensed_capacity')
      or (facility.license_number = '754130' and edit.field_name = 'canonical_name')
    );
  if approved_edit_count <> 0 then
    raise exception 'an approved owner edit protects one of the four corrections';
  end if;

  if (
    select count(*)
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where c.relkind = 'v'
      and n.nspname = 'public'
      and c.relname in ('wa_zip_market_income', 'wa_county_market_summary', 'wa_city_market_summary')
  ) <> 3 then
    raise exception 'one or more market views are missing';
  end if;

  select string_agg(format('%I.%I', n.nspname, c.relname), ', ' order by c.relname)
    into market_blocker
  from pg_class as c
  join pg_namespace as n on n.oid = c.relnamespace
  where c.relkind = 'v'
    and n.nspname = 'public'
    and c.relname in ('wa_zip_market_income', 'wa_county_market_summary', 'wa_city_market_summary')
    and pg_get_viewdef(c.oid) ~* 'public\.facilities|from\s+facilities'
    and pg_get_viewdef(c.oid) !~* 'wa_dshs_listed_facilities|wa_afh_map_facilities'
    and pg_get_viewdef(c.oid) !~* 'presence';
  if market_blocker is not null then
    raise exception 'market view still counts facilities without an absence filter: %', market_blocker;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.facilities'::regclass
      and conname = 'facilities_presence_check'
      and pg_get_constraintdef(oid) ~* 'absent'
      and pg_get_constraintdef(oid) ~* 'active'
  ) then
    raise exception 'facilities_presence_check does not allow the reviewed presence values';
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'facilities'
      and indexdef ~* 'unique'
      and indexdef ~* 'source_name'
      and indexdef ~* 'normalized_license_number'
  ) then
    raise exception 'the source-license uniqueness guard is missing';
  end if;

  select count(distinct jurisdiction_id), min(jurisdiction_id::text)::uuid
    into jurisdiction_count, jurisdiction
  from public.facilities
  where source_name = 'wa_dshs_afh'
    and jurisdiction_id is not null;
  if jurisdiction_count <> 1 then
    raise exception 'Washington rows do not share exactly one jurisdiction';
  end if;

  select string_agg(attname, ', ' order by attnum) into missing_required
  from pg_attribute
  where attrelid = 'public.facilities'::regclass
    and attnum > 0
    and not attisdropped
    and attnotnull
    and not atthasdef
    and attname not in (
      'canonical_name', 'address_line1', 'city', 'county', 'state_code', 'postal_code',
      'license_number', 'licensed_capacity', 'latitude', 'longitude', 'facility_type',
      'jurisdiction_id', 'record_status', 'normalized_license_number', 'license_category',
      'source_name', 'presence'
    );
  if missing_required is not null then
    raise exception 'a required facility column has no source value: %', missing_required;
  end if;

  select pg_get_functiondef('public.nchf_phase5g_facility_is_listed(uuid)'::regprocedure)
    into helper_def;
  if helper_def !~* 'security definer'
     or helper_def !~* 'search_path = '''' '
     or helper_def !~* 'source_matched'
     or helper_def !~* '00000000-0000-4000-8000-000000000002' then
    raise exception 'the publication helper signature or safeguards changed';
  end if;

  select pg_get_viewdef('public.wa_afh_published_owner_content'::regclass) into view_def;
  if view_def !~* 'nchf_phase5g_facility_is_listed' then
    raise exception 'published owner content no longer uses the listing safeguard';
  end if;

  perform set_config('nchf.roster_jurisdiction_id', jurisdiction::text, true);
end
$precheck$;

-- Writes follow only when every precheck above returned normally.
-- The statements below are part of this same transaction. A later
-- verification failure aborts the transaction before commit.

update public.facilities
set presence = 'absent'
where source_name = 'wa_dshs_afh'
  and license_number in ('752686', '755649', '757132', '758334')
  and record_status = 'source_matched';

update public.facilities
set licensed_capacity = 6
where source_name = 'wa_dshs_afh'
  and license_number = '759147'
  and licensed_capacity is null;

update public.facilities
set licensed_capacity = 2
where source_name = 'wa_dshs_afh'
  and license_number = '759176'
  and licensed_capacity is null;

update public.facilities
set licensed_capacity = 8
where source_name = 'wa_dshs_afh'
  and license_number = '757641'
  and licensed_capacity = 6;

update public.facilities
set canonical_name = 'Harmony Senior Home LLC'
where source_name = 'wa_dshs_afh'
  and license_number = '754130'
  and canonical_name = '#1 Samantha & Yoanna''s Care Home LLC';

insert into public.facilities (
  canonical_name, address_line1, city, county, state_code, postal_code,
  license_number, licensed_capacity, latitude, longitude, facility_type,
  jurisdiction_id, record_status, normalized_license_number, license_category,
  source_name, presence
)
select
  addition.canonical_name,
  addition.address_line1,
  addition.city,
  addition.county,
  'WA',
  addition.postal_code,
  addition.license_number,
  addition.licensed_capacity,
  addition.latitude,
  addition.longitude,
  'AFH',
  current_setting('nchf.roster_jurisdiction_id')::uuid,
  'source_matched',
  addition.license_number,
  'afh',
  'wa_dshs_afh',
  'active'
from (
  values
    ('Kalispell Kathy Golf Adult Family Home', '11516 N Kathy Dr', 'Spokane', 'Spokane', '99218', '759434', 5, 47.761458, -117.445549),
    ('ADALENA 2 ADULT FAMILY HOME LLC', '6601 177th Street Ct E', 'Puyallup', 'Pierce', '98375', '759435', 6, 47.095314, -122.341103),
    ('LYNNDALE ADULT FAMILY HOME LLC', '19024 75th Ave W', 'Lynnwood', 'Snohomish', '98036', '759436', 6, 47.826185, -122.335297),
    ('Arise AFH 2', '7817 48th Loop SE', 'Lacey', 'Thurston', '98503', '759437', 6, 47.004401, -122.773485),
    ('Genesis Adult Family Home', '31813 10th Pl SW', 'Federal Way', 'King', '98023', '759438', 6, 47.316747, -122.348995),
    ('GOLDENRISE HOUSE LLC', '7116 N Hamilton St', 'Spokane', 'Spokane', '99208', '759439', 6, 47.722817, -117.398316),
    ('Grace Serenity LLC', '615 S Pineview Dr', 'Medical Lake', 'Spokane', '99022', '759440', 6, 47.567983, -117.667972),
    ('ABUNDANT LIFE SENIOR CARE LLC', '18307 150th Ave SE', 'Renton', 'King', '98058', '759441', 6, 47.43857, -122.14117),
    ('Our Nest Adult Family Home LLC', '8713 NE Mountview St', 'Vancouver', 'Clark', '98664', '759442', 5, 45.629536, -122.582972),
    ('Unique Companions AFH LLC', '710 Roe St', 'Steilacoom', 'Pierce', '98388', '759443', 5, 47.169515, -122.585469),
    ('Magnolia Woods AFH', '2216 48th Ave SW', 'Olympia', 'Thurston', '98512', '759444', 6, 47.004071, -122.9288),
    ('Consonus Care Homes', '6559 Gleneagle Ave SW', 'Port Orchard', 'Kitsap', '98367', '759445', 5, 47.490167, -122.697915),
    ('Joyful Harmony Adult Family Home', '1619 NE 129th Ave', 'Vancouver', 'Clark', '98684', '759446', 6, 45.63441, -122.539854),
    ('NAOMI SAMUEL ADULT FAMILY HOME LLC', '20512 Poplar Way', 'Lynnwood', 'Snohomish', '98036', '759447', 4, 47.812461, -122.279612),
    ('Serenity Prime Living LLC', '10317 117th Street Ct SW', 'Lakewood', 'Pierce', '98498', '759448', 6, 47.151242, -122.574821),
    ('Evas Adult Family Home LLC', '16505 NE 98th St', 'Vancouver', 'Clark', '98682', '759449', 6, 45.693026, -122.502965),
    ('Benevolent Adult Family Home 5', '12432 44TH DR SE', 'Everett', 'Snohomish', '98208', '759450', 6, 47.884246, -122.173071)
) as addition (
  canonical_name, address_line1, city, county, postal_code, license_number,
  licensed_capacity, latitude, longitude
);

create or replace view public.wa_dshs_listed_facilities
with (security_invoker = true) as
select
  id, canonical_name, address_line1, city, county, license_number,
  state_code, postal_code, licensed_capacity, record_status
from public.facilities
where source_name = 'wa_dshs_afh'
  and license_category = 'afh'
  and facility_type = 'AFH'
  and state_code = 'WA'
  and record_status = 'source_matched'
  and normalized_license_number is not null
  and btrim(normalized_license_number, E' \t\r\n') <> ''
  and license_number ~ '^[0-9]{1,20}$'
  and presence is distinct from 'absent';

create or replace view public.wa_afh_map_facilities
with (security_invoker = true) as
select
  id, canonical_name, address_line1, city, county, state_code, postal_code,
  license_number, licensed_capacity, latitude, longitude
from public.facilities
where state_code = 'WA'
  and latitude is not null
  and longitude is not null
  and postal_code is not null
  and facility_type = 'AFH'
  and source_name = 'wa_dshs_afh'
  and record_status = 'source_matched'
  and presence is distinct from 'absent';

create or replace function public.nchf_phase5g_facility_is_listed(p_facility_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
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
      and facility.presence is distinct from 'absent'
      and facility.normalized_license_number is not null
      and pg_catalog.btrim(facility.normalized_license_number, E' \t\r\n') <> ''
      and facility.license_number ~ '^[0-9]{1,20}$'
  );
$fn$;

do $verify$
declare
  listed_count bigint;
  mapped_count bigint;
  additions bigint;
  hidden bigint;
  retained bigint;
begin
  select count(*) into listed_count from public.wa_dshs_listed_facilities;
  select count(*) into mapped_count from public.wa_afh_map_facilities;
  if listed_count <> 6278 or mapped_count <> 6278 then
    raise exception 'post-check counts are listed % and mapped %, expected 6278 and 6278',
      listed_count, mapped_count;
  end if;

  select count(*) into additions
  from public.wa_dshs_listed_facilities
  where license_number in (
    '759434','759435','759436','759437','759438','759439','759440','759441',
    '759442','759443','759444','759445','759446','759447','759448','759449','759450'
  );
  if additions <> 17 then
    raise exception 'post-check found % additions, expected 17', additions;
  end if;

  select count(*) into hidden
  from public.wa_dshs_listed_facilities
  where license_number in ('752686','755649','757132','758334');
  select count(*) into retained
  from public.facilities
  where source_name = 'wa_dshs_afh'
    and license_number in ('752686','755649','757132','758334')
    and presence = 'absent'
    and record_status = 'source_matched';
  if hidden <> 0 or retained <> 4 then
    raise exception 'archived licenses were not both hidden and retained';
  end if;

  if not exists (
    select 1 from public.facilities
    where source_name = 'wa_dshs_afh'
      and license_number = '754130'
      and canonical_name = 'Harmony Senior Home LLC'
  ) or not exists (
    select 1 from public.facilities
    where source_name = 'wa_dshs_afh' and license_number = '759147' and licensed_capacity = 6
  ) or not exists (
    select 1 from public.facilities
    where source_name = 'wa_dshs_afh' and license_number = '759176' and licensed_capacity = 2
  ) or not exists (
    select 1 from public.facilities
    where source_name = 'wa_dshs_afh' and license_number = '757641' and licensed_capacity = 8
  ) then
    raise exception 'one of the four field corrections is missing after the write';
  end if;
end
$verify$;

commit;
