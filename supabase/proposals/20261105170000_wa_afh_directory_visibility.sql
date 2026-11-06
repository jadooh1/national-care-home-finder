-- REVIEW-ONLY PROPOSAL. This file is not a migration.
-- Do not move it into supabase/migrations.
-- Do not execute it without a separate authorization and a verified
-- development-database target. It must not be applied to production.
--
-- Phase 5A directory visibility for the published Washington AFH rows.
-- One transaction. A failed gate rolls every change back.
--
-- The listed view currently exposes only:
--   id, canonical_name, address_line1, city, county, license_number
-- PostgreSQL allows CREATE OR REPLACE VIEW to append columns. It does
-- not allow those existing columns to be reordered. The four columns
-- required by the directory and detail pages are appended.
--
-- The new facilities policy is permissive and is limited to anon and
-- authenticated. The only existing policy this script changes is
-- "Development test facility read": that authenticated policy is dropped
-- so the unverified test home is not publicly readable. "Public read
-- verified facilities" and every claim or edit policy stay unchanged.
-- The map view keeps its columns, grants, and security_invoker setting,
-- and gains the published-source filter.

begin;

do $visibility$
declare
  existing_columns text;
  view_options text;
  qualifying bigint;
  source_rows bigint;
  test_rows bigint;
  test_matches bigint;
  policy_roles text;
  listed_count bigint;
  map_count bigint;
  test_visible bigint;
  test_base bigint;
  test_policy_expr text;
  hash_visible bigint;
  relation_name text;
  relation_acl text;
  before_acl text;
begin
  if current_user is distinct from 'postgres'
     or session_user is distinct from 'postgres' then
    raise exception 'directory visibility gate refused: current_user and session_user must be postgres';
  end if;
  if current_setting('is_superuser') = 'on' then
    raise exception 'directory visibility gate refused: postgres must not be a superuser';
  end if;

  if to_regrole('anon') is null or to_regrole('authenticated') is null then
    raise exception 'directory visibility gate refused: anon and authenticated must already exist';
  end if;
  if not has_table_privilege('anon', 'public.facilities', 'select')
     or not has_table_privilege('authenticated', 'public.facilities', 'select') then
    raise exception 'directory visibility gate refused: anon and authenticated must already have table select on public.facilities';
  end if;

  select string_agg(attribute.attname, ',' order by attribute.attnum)
    into existing_columns
  from pg_attribute as attribute
  where attribute.attrelid = 'public.wa_dshs_listed_facilities'::regclass
    and attribute.attnum > 0
    and not attribute.attisdropped;
  if existing_columns is distinct from 'id,canonical_name,address_line1,city,county,license_number' then
    raise exception 'directory visibility gate refused: listed view columns are %', coalesce(existing_columns, '<missing>');
  end if;

  select coalesce(array_to_string(relation.reloptions, ','), '')
    into view_options
  from pg_class as relation
  where relation.oid = 'public.wa_dshs_listed_facilities'::regclass;
  if position('security_invoker=true' in view_options) = 0 then
    raise exception 'directory visibility gate refused: listed view must already be security_invoker';
  end if;
  if pg_get_viewdef('public.wa_dshs_listed_facilities'::regclass, true) ilike '%where%' then
    raise exception 'directory visibility gate refused: listed view already has a filter';
  end if;

  if exists (
    select 1
    from pg_policy
    where polrelid = 'public.facilities'::regclass
      and polname = 'facilities_public_read_wa_afh_source_matched'
  ) then
    raise exception 'directory visibility gate refused: the new policy already exists';
  end if;

  foreach relation_name in array array[
    'source_name', 'license_category', 'facility_type', 'state_code',
    'record_status', 'normalized_license_number', 'license_number',
    'canonical_name', 'address_line1', 'city', 'county', 'postal_code',
    'licensed_capacity', 'latitude', 'longitude', 'id'
  ]
  loop
    if not exists (
      select 1
      from pg_attribute
      where attrelid = 'public.facilities'::regclass
        and attname = relation_name
        and attnum > 0
        and not attisdropped
    ) then
      raise exception 'directory visibility gate refused: public.facilities.% is missing', relation_name;
    end if;
  end loop;

  select count(*)
    into source_rows
  from public.facilities
  where source_name = 'wa_dshs_afh'
    and record_status = 'source_matched';

  select count(*)
    into qualifying
  from public.facilities
  where source_name = 'wa_dshs_afh'
    and license_category = 'afh'
    and facility_type = 'AFH'
    and state_code = 'WA'
    and record_status = 'source_matched'
    and normalized_license_number is not null
    and btrim(normalized_license_number, E' \t\r\n') <> ''
    and license_number ~ '^[0-9]{1,20}$';

  if source_rows is distinct from 6265 or qualifying is distinct from 6265 then
    raise exception
      'directory visibility gate refused: source_matched rows %, qualifying rows %, expected 6265',
      source_rows, qualifying;
  end if;

  select count(*)
    into test_rows
  from public.facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid
    and canonical_name = 'DEVELOPMENT TEST HOME - NOT REAL'
    and record_status = 'unverified';
  if test_rows is distinct from 1 then
    raise exception 'directory visibility gate refused: the unverified test facility was not found unchanged';
  end if;

  select count(*)
    into test_matches
  from public.facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid
    and source_name = 'wa_dshs_afh'
    and license_category = 'afh'
    and facility_type = 'AFH'
    and state_code = 'WA'
    and record_status = 'source_matched'
    and normalized_license_number is not null
    and btrim(normalized_license_number, E' \t\r\n') <> ''
    and license_number ~ '^[0-9]{1,20}$';
  if test_matches <> 0 then
    raise exception 'directory visibility gate refused: the test facility matches the public predicate';
  end if;

  select string_agg(pg_get_userbyid(role_id), ',' order by pg_get_userbyid(role_id)),
         lower(regexp_replace(pg_get_expr(policy.polqual, policy.polrelid), '\s+', '', 'g'))
    into policy_roles, test_policy_expr
  from pg_policy as policy
  cross join lateral unnest(policy.polroles) as role_id
  where policy.polrelid = 'public.facilities'::regclass
    and policy.polname = 'Development test facility read'
    and policy.polpermissive
    and policy.polcmd = 'r'
  group by pg_get_expr(policy.polqual, policy.polrelid);
  if policy_roles is distinct from 'authenticated'
     or test_policy_expr is distinct from
        '((id=''00000000-0000-4000-8000-000000000002''::uuid)and(canonical_name=''developmenttesthome-notreal''::text))' then
    raise exception
      'directory visibility gate refused: test facility policy is % using %',
      coalesce(policy_roles, '<absent>'), coalesce(test_policy_expr, '<absent>');
  end if;

  select string_agg(attribute.attname, ',' order by attribute.attnum)
    into existing_columns
  from pg_attribute as attribute
  where attribute.attrelid = 'public.wa_afh_map_facilities'::regclass
    and attribute.attnum > 0
    and not attribute.attisdropped;
  if existing_columns is distinct from
     'id,canonical_name,address_line1,city,county,state_code,postal_code,license_number,licensed_capacity,latitude,longitude' then
    raise exception 'directory visibility gate refused: map view columns are %', coalesce(existing_columns, '<missing>');
  end if;
  select coalesce(array_to_string(relation.reloptions, ','), '')
    into view_options
  from pg_class as relation
  where relation.oid = 'public.wa_afh_map_facilities'::regclass;
  if position('security_invoker=true' in view_options) = 0
     or pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true) ilike '%source_name%'
     or pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true) not ilike '%facility_type%' then
    raise exception 'directory visibility gate refused: map view is not the original unfiltered definition';
  end if;

  create temporary table nchf_visibility_policy_before on commit drop as
  select policy.polrelid,
         policy.polname,
         policy.polcmd,
         policy.polpermissive,
         policy.polroles,
         pg_get_expr(policy.polqual, policy.polrelid) as qual,
         pg_get_expr(policy.polwithcheck, policy.polrelid) as chk
  from pg_policy as policy
  where policy.polrelid in (
    'public.facilities'::regclass,
    'public.owner_claims'::regclass,
    'public.listing_edits'::regclass
  );

  create temporary table nchf_visibility_acl_before on commit drop as
  select relation.oid as relid, relation.relacl
  from pg_class as relation
  where relation.oid in (
    'public.owner_claims'::regclass,
    'public.listing_edits'::regclass,
    'public.wa_dshs_listed_facilities'::regclass,
    'public.wa_afh_map_facilities'::regclass
  );

  revoke select on table public.facilities from anon, authenticated;
  grant select (
    id,
    canonical_name,
    address_line1,
    city,
    county,
    state_code,
    postal_code,
    license_number,
    licensed_capacity,
    record_status,
    latitude,
    longitude,
    source_name,
    license_category,
    facility_type,
    normalized_license_number
  ) on table public.facilities to anon, authenticated;

  drop policy "Development test facility read" on public.facilities;

  create policy facilities_public_read_wa_afh_source_matched
    on public.facilities
    for select
    to anon, authenticated
    using (
      source_name = 'wa_dshs_afh'
      and license_category = 'afh'
      and facility_type = 'AFH'
      and state_code = 'WA'
      and record_status = 'source_matched'
      and normalized_license_number is not null
      and btrim(normalized_license_number, E' \t\r\n') <> ''
      and license_number ~ '^[0-9]{1,20}$'
    );

  create or replace view public.wa_dshs_listed_facilities
  with (security_invoker = true) as
  select id,
         canonical_name,
         address_line1,
         city,
         county,
         license_number,
         state_code,
         postal_code,
         licensed_capacity,
         record_status
  from public.facilities
  where source_name = 'wa_dshs_afh'
    and license_category = 'afh'
    and facility_type = 'AFH'
    and state_code = 'WA'
    and record_status = 'source_matched'
    and normalized_license_number is not null
    and btrim(normalized_license_number, E' \t\r\n') <> ''
    and license_number ~ '^[0-9]{1,20}$';

  create or replace view public.wa_afh_map_facilities
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
    and facility_type = 'AFH'
    and source_name = 'wa_dshs_afh'
    and record_status = 'source_matched';

  select string_agg(attribute.attname, ',' order by attribute.attnum)
    into existing_columns
  from pg_attribute as attribute
  where attribute.attrelid = 'public.wa_dshs_listed_facilities'::regclass
    and attribute.attnum > 0
    and not attribute.attisdropped;
  if existing_columns is distinct from
     'id,canonical_name,address_line1,city,county,license_number,state_code,postal_code,licensed_capacity,record_status' then
    raise exception 'directory visibility gate refused: replaced view columns are %', existing_columns;
  end if;

  select coalesce(array_to_string(relation.reloptions, ','), '')
    into view_options
  from pg_class as relation
  where relation.oid = 'public.wa_dshs_listed_facilities'::regclass;
  if position('security_invoker=true' in view_options) = 0 then
    raise exception 'directory visibility gate refused: replaced view lost security_invoker';
  end if;
  select coalesce(array_to_string(relation.reloptions, ','), '')
    into view_options
  from pg_class as relation
  where relation.oid = 'public.wa_afh_map_facilities'::regclass;
  if position('security_invoker=true' in view_options) = 0
     or pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true) not ilike '%source_name = ''wa_dshs_afh''%'
     or pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true) not ilike '%record_status = ''source_matched''%' then
    raise exception 'directory visibility gate refused: map view was not restricted to the published source';
  end if;

  foreach relation_name in array array[
    'id', 'canonical_name', 'address_line1', 'city', 'county', 'state_code',
    'postal_code', 'license_number', 'licensed_capacity', 'record_status'
  ]
  loop
    if not exists (
      select 1
      from pg_attribute
      where attrelid = 'public.wa_dshs_listed_facilities'::regclass
        and attname = relation_name
        and attnum > 0
        and not attisdropped
    ) then
      raise exception 'directory visibility gate refused: directory column % is missing', relation_name;
    end if;
  end loop;

  if exists (
    select 1
    from nchf_visibility_policy_before as before_policy
    full join pg_policy as after_policy
      on after_policy.polrelid = before_policy.polrelid
     and after_policy.polname = before_policy.polname
    where coalesce(after_policy.polname, before_policy.polname)
            is distinct from 'facilities_public_read_wa_afh_source_matched'
      and not (
        before_policy.polname = 'Development test facility read'
        and before_policy.polrelid = 'public.facilities'::regclass
        and after_policy.oid is null
      )
      and (
        after_policy.oid is null
        or before_policy.polname is null
        or after_policy.polcmd is distinct from before_policy.polcmd
        or after_policy.polpermissive is distinct from before_policy.polpermissive
        or after_policy.polroles is distinct from before_policy.polroles
        or pg_get_expr(after_policy.polqual, after_policy.polrelid)
             is distinct from before_policy.qual
        or pg_get_expr(after_policy.polwithcheck, after_policy.polrelid)
             is distinct from before_policy.chk
      )
  ) then
    raise exception 'directory visibility gate refused: an existing facilities, claim, or edit policy changed';
  end if;

  select string_agg(pg_get_userbyid(role_id), ',' order by pg_get_userbyid(role_id))
    into policy_roles
  from pg_policy as policy
  cross join lateral unnest(policy.polroles) as role_id
  where policy.polrelid = 'public.facilities'::regclass
    and policy.polname = 'facilities_public_read_wa_afh_source_matched';
  if policy_roles is distinct from 'anon,authenticated' then
    raise exception 'directory visibility gate refused: new policy roles are %', coalesce(policy_roles, '<none>');
  end if;
  if exists (
    select 1
    from pg_policy
    where polrelid = 'public.facilities'::regclass
      and polname = 'Development test facility read'
  ) then
    raise exception 'directory visibility gate refused: test facility policy is still present';
  end if;

  for relation_name, relation_acl in
    select relation.relname, relation.relacl::text
    from pg_class as relation
    where relation.oid in (
      'public.owner_claims'::regclass,
      'public.listing_edits'::regclass,
      'public.wa_dshs_listed_facilities'::regclass,
      'public.wa_afh_map_facilities'::regclass
    )
  loop
    select before_relation.relacl::text
      into before_acl
    from nchf_visibility_acl_before as before_relation
    join pg_class as relation
      on relation.oid = before_relation.relid
    where relation.relname = relation_name;
    if relation_acl is distinct from before_acl then
      raise exception 'directory visibility gate refused: privileges changed on %', relation_name;
    end if;
  end loop;

  execute 'set local role anon';
  select count(*) into listed_count from public.wa_dshs_listed_facilities;
  select count(*) into map_count from public.wa_afh_map_facilities;
  select count(*) into test_visible
  from public.wa_dshs_listed_facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  select count(*) into test_base
  from public.facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  if listed_count is distinct from 6265
     or map_count is distinct from 6265
     or test_visible <> 0
     or test_base <> 0 then
    raise exception
      'directory visibility gate refused: anon listed %, map %, directory test %, base test %',
      listed_count, map_count, test_visible, test_base;
  end if;
  begin
    perform source_hash from public.facilities limit 1;
    hash_visible := 1;
  exception
    when insufficient_privilege then
      hash_visible := 0;
    when undefined_column then
      hash_visible := 0;
  end;
  if hash_visible <> 0 then
    raise exception 'directory visibility gate refused: anon can read source_hash';
  end if;
  execute 'set local role authenticated';
  select count(*) into listed_count from public.wa_dshs_listed_facilities;
  select count(*) into map_count from public.wa_afh_map_facilities;
  select count(*) into test_visible
  from public.wa_dshs_listed_facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  select count(*) into test_base
  from public.facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  if listed_count is distinct from 6265
     or map_count is distinct from 6265
     or test_visible <> 0
     or test_base <> 0 then
    raise exception
      'directory visibility gate refused: authenticated listed %, map %, directory test %, base test %',
      listed_count, map_count, test_visible, test_base;
  end if;
  execute 'reset role';

  raise notice 'DIRECTORY_VISIBILITY_READY listed=% map=%', listed_count, map_count;
end
$visibility$;

commit;
