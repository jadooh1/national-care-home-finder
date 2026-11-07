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
  helper_acl text;
  helper_owner text;
  owner_counts text;
  archived_presence text;
  listed_columns text;
  mapped_columns text;
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

  -- The application queries wa_zip_market_income, wa_county_market_summary,
  -- and wa_city_market_summary, but those relations are not part of the
  -- development schema. Missing relations are not created and are not a
  -- failure. Any live market relation that reads facilities directly must
  -- already exclude absent rows. A market relation that reads only the
  -- family views is safe once those views gain the absence filter below.
  select string_agg(format('%I.%I:%s', n.nspname, c.relname, c.relkind), ', ' order by n.nspname, c.relname)
    into market_blocker
  from pg_class as c
  join pg_namespace as n on n.oid = c.relnamespace
  where n.nspname not in ('pg_catalog', 'information_schema')
    and (
      (
        c.relname in ('wa_zip_market_income', 'wa_county_market_summary', 'wa_city_market_summary')
        and c.relkind in ('r', 'p')
      )
      or (
        c.relkind in ('v', 'm')
        and (
          c.relname in ('wa_zip_market_income', 'wa_county_market_summary', 'wa_city_market_summary')
          or c.relname like '%market%'
        )
        and exists (
        select 1
        from pg_depend as dependency
        join pg_rewrite as rewrite on rewrite.oid = dependency.objid
        where rewrite.ev_class = c.oid
          and dependency.refclassid = 'pg_class'::regclass
          and dependency.refobjid = 'public.facilities'::regclass
          and strpos(lower(pg_get_viewdef(c.oid)), 'absent') = 0
      )
    )
  );
  if market_blocker is not null then
    raise exception 'market relation reads facilities without excluding absent rows: %', market_blocker;
  end if;

  select string_agg(format('%I.%I', n.nspname, proc.proname), ', ' order by n.nspname, proc.proname)
    into market_blocker
  from pg_proc as proc
  join pg_namespace as n on n.oid = proc.pronamespace
  where n.nspname not in ('pg_catalog', 'information_schema')
    and (
      proc.proname in ('wa_zip_market_income', 'wa_county_market_summary', 'wa_city_market_summary')
      or proc.proname like '%market%'
    )
    and strpos(lower(proc.prosrc), 'facilities') > 0
    and strpos(lower(proc.prosrc), 'absent') = 0;
  if market_blocker is not null then
    raise exception 'market function reads facilities without excluding absent rows: %', market_blocker;
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

  select proc.proacl::text, proc.proowner::text
    into helper_acl, helper_owner
  from pg_proc as proc
  where proc.oid = 'public.nchf_phase5g_facility_is_listed(uuid)'::regprocedure
    and proc.prosecdef
    and proc.prokind = 'f'
    and proc.provolatile = 's'
    and proc.pronargs = 1
    and proc.proargtypes[0] = 'uuid'::regtype
    and proc.prorettype = 'boolean'::regtype
    and proc.prolang = (select language.oid from pg_language as language where language.lanname = 'sql')
    and proc.proacl is not null
    and not exists (
      select 1
      from aclexplode(proc.proacl) as acl
      where acl.grantee = 0
        and acl.privilege_type = 'EXECUTE'
    )
    and exists (
      select 1
      from unnest(proc.proconfig) as setting
      where split_part(setting, '=', 1) = 'search_path'
        and btrim(split_part(setting, '=', 2), '"') = ''
    )
    and strpos(proc.prosrc, 'source_matched') > 0
    and strpos(proc.prosrc, '00000000-0000-4000-8000-000000000002') > 0
    and strpos(proc.prosrc, 'DEVELOPMENT TEST HOME - NOT REAL') > 0;
  if helper_acl is null or helper_owner is null then
    raise exception 'the publication helper signature, definer, empty search_path, or execute grants changed';
  end if;

  if not exists (
    select 1
    from pg_depend as dependency
    join pg_rewrite as rewrite on rewrite.oid = dependency.objid
    where rewrite.ev_class = 'public.wa_afh_published_owner_content'::regclass
      and dependency.refobjid = 'public.nchf_phase5g_facility_is_listed(uuid)'::regprocedure
  ) then
    raise exception 'published owner content no longer uses the listing safeguard';
  end if;

  select string_agg(attribute.attname, ',' order by attribute.attnum)
    into listed_columns
  from pg_attribute as attribute
  where attribute.attrelid = 'public.wa_dshs_listed_facilities'::regclass
    and attribute.attnum > 0
    and not attribute.attisdropped;
  select string_agg(attribute.attname, ',' order by attribute.attnum)
    into mapped_columns
  from pg_attribute as attribute
  where attribute.attrelid = 'public.wa_afh_map_facilities'::regclass
    and attribute.attnum > 0
    and not attribute.attisdropped;
  if listed_columns is distinct from 'id,canonical_name,address_line1,city,county,license_number,state_code,postal_code,licensed_capacity,record_status'
     or mapped_columns is distinct from 'id,canonical_name,address_line1,city,county,state_code,postal_code,license_number,licensed_capacity,latitude,longitude' then
    raise exception 'a family view column list differs from the reviewed definition';
  end if;
  if not exists (
    select 1 from pg_class
    where oid = 'public.wa_dshs_listed_facilities'::regclass
      and 'security_invoker=true' = any (reloptions)
  ) or not exists (
    select 1 from pg_class
    where oid = 'public.wa_afh_map_facilities'::regclass
      and 'security_invoker=true' = any (reloptions)
  ) then
    raise exception 'a family view is not security invoker';
  end if;

  if to_regclass('public.owner_claims') is null
     or to_regclass('public.listing_edits') is null
     or to_regclass('public.published_owner_listings') is null
     or to_regclass('public.published_owner_listing_events') is null
     or to_regclass('public.app_admins') is null then
    raise exception 'an owner or administrator table is missing';
  end if;
  select (select count(*) from public.owner_claims)::text
      || ',' || (select count(*) from public.listing_edits)::text
      || ',' || (select count(*) from public.published_owner_listings)::text
      || ',' || (select count(*) from public.published_owner_listing_events)::text
      || ',' || (select count(*) from public.app_admins)::text
    into owner_counts;
  select string_agg(facility.license_number || '=' || coalesce(facility.presence, 'null'), ',' order by facility.license_number)
    into archived_presence
  from public.facilities as facility
  where facility.source_name = 'wa_dshs_afh'
    and facility.license_number in ('752686', '755649', '757132', '758334');
  if owner_counts is null or archived_presence is null then
    raise exception 'owner counts or archived presence could not be saved for rollback';
  end if;

  perform set_config('nchf.roster_jurisdiction_id', jurisdiction::text, true);
  perform set_config('nchf.roster_helper_acl', helper_acl, true);
  perform set_config('nchf.roster_helper_owner', helper_owner, true);
  perform set_config('nchf.roster_owner_counts', owner_counts, true);
  perform set_config('nchf.roster_previous_presence', archived_presence, true);
end
$precheck$;

-- Writes follow only when every precheck above returned normally.
-- The statements below are part of this same transaction. A later
-- verification failure aborts the transaction before commit.

do $apply$
declare
  changed bigint;
begin
  update public.facilities
  set presence = 'absent'
  where source_name = 'wa_dshs_afh'
    and license_number in ('752686', '755649', '757132', '758334')
    and record_status = 'source_matched';
  get diagnostics changed = row_count;
  if changed <> 4 then
    raise exception 'archived presence update changed % rows, expected 4', changed;
  end if;

  update public.facilities
  set licensed_capacity = 6
  where source_name = 'wa_dshs_afh'
    and license_number = '759147'
    and licensed_capacity is null;
  get diagnostics changed = row_count;
  if changed <> 1 then
    raise exception 'capacity update for 759147 changed % rows, expected 1', changed;
  end if;

  update public.facilities
  set licensed_capacity = 2
  where source_name = 'wa_dshs_afh'
    and license_number = '759176'
    and licensed_capacity is null;
  get diagnostics changed = row_count;
  if changed <> 1 then
    raise exception 'capacity update for 759176 changed % rows, expected 1', changed;
  end if;

  update public.facilities
  set licensed_capacity = 8
  where source_name = 'wa_dshs_afh'
    and license_number = '757641'
    and licensed_capacity = 6;
  get diagnostics changed = row_count;
  if changed <> 1 then
    raise exception 'capacity update for 757641 changed % rows, expected 1', changed;
  end if;

  update public.facilities
  set canonical_name = 'Harmony Senior Home LLC'
  where source_name = 'wa_dshs_afh'
    and license_number = '754130'
    and canonical_name = '#1 Samantha & Yoanna''s Care Home LLC';
  get diagnostics changed = row_count;
  if changed <> 1 then
    raise exception 'name update for 754130 changed % rows, expected 1', changed;
  end if;

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
  get diagnostics changed = row_count;
  if changed <> 17 then
    raise exception 'addition insert changed % rows, expected 17', changed;
  end if;
end
$apply$;

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
  mapped_additions bigint;
  mapped_hidden bigint;
  market_blocker text;
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
  select count(*) into mapped_hidden
  from public.wa_afh_map_facilities
  where license_number in ('752686','755649','757132','758334');
  select count(*) into mapped_additions
  from public.wa_afh_map_facilities
  where license_number in (
    '759434','759435','759436','759437','759438','759439','759440','759441',
    '759442','759443','759444','759445','759446','759447','759448','759449','759450'
  );
  if hidden <> 0 or mapped_hidden <> 0 or retained <> 4 or mapped_additions <> 17 then
    raise exception 'archived licenses were not both hidden and retained, or a mapped addition is missing';
  end if;

  select string_agg(format('%I.%I:%s', n.nspname, c.relname, c.relkind), ', ' order by n.nspname, c.relname)
    into market_blocker
  from pg_class as c
  join pg_namespace as n on n.oid = c.relnamespace
  where n.nspname not in ('pg_catalog', 'information_schema')
    and (
      (
        c.relname in ('wa_zip_market_income', 'wa_county_market_summary', 'wa_city_market_summary')
        and c.relkind in ('r', 'p')
      )
      or (
        c.relkind in ('v', 'm')
        and (
          c.relname in ('wa_zip_market_income', 'wa_county_market_summary', 'wa_city_market_summary')
          or c.relname like '%market%'
        )
        and exists (
        select 1
        from pg_depend as dependency
        join pg_rewrite as rewrite on rewrite.oid = dependency.objid
        where rewrite.ev_class = c.oid
          and dependency.refclassid = 'pg_class'::regclass
          and dependency.refobjid = 'public.facilities'::regclass
          and strpos(lower(pg_get_viewdef(c.oid)), 'absent') = 0
      )
    )
  );
  if market_blocker is not null then
    raise exception 'market relation reads facilities without excluding absent rows: %', market_blocker;
  end if;

  if not exists (
    select 1
    from pg_proc as proc
    where proc.oid = 'public.nchf_phase5g_facility_is_listed(uuid)'::regprocedure
      and proc.prosecdef
      and proc.prokind = 'f'
      and proc.provolatile = 's'
      and proc.pronargs = 1
      and proc.proargtypes[0] = 'uuid'::regtype
      and proc.prorettype = 'boolean'::regtype
      and proc.proacl::text = current_setting('nchf.roster_helper_acl')
      and proc.proowner::text = current_setting('nchf.roster_helper_owner')
      and exists (
        select 1
        from unnest(proc.proconfig) as setting
        where split_part(setting, '=', 1) = 'search_path'
          and btrim(split_part(setting, '=', 2), '"') = ''
      )
      and strpos(proc.prosrc, 'presence is distinct from ''absent''') > 0
      and strpos(proc.prosrc, '00000000-0000-4000-8000-000000000002') > 0
      and not exists (
        select 1
        from aclexplode(proc.proacl) as acl
        where acl.grantee = 0
          and acl.privilege_type = 'EXECUTE'
      )
  ) then
    raise exception 'the publication helper lost its signature, definer, empty search_path, or execute grants';
  end if;

  if (select count(*) from public.owner_claims)::text
      || ',' || (select count(*) from public.listing_edits)::text
      || ',' || (select count(*) from public.published_owner_listings)::text
      || ',' || (select count(*) from public.published_owner_listing_events)::text
      || ',' || (select count(*) from public.app_admins)::text
     is distinct from current_setting('nchf.roster_owner_counts') then
    raise exception 'owner or administrator row counts changed';
  end if;
  raise notice 'archived presence before this change: %', current_setting('nchf.roster_previous_presence');

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
