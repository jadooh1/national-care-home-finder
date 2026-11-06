-- REVIEW-ONLY ROLLBACK for the Phase 5A directory visibility proposal.
-- Do not execute it without a separate authorization and a verified
-- development-database target. It must not be applied to production.
--
-- Drops only facilities_public_read_wa_afh_source_matched, restores
-- "Development test facility read" for authenticated, restores both view
-- definitions, and restores their saved grants. Claim and edit policies
-- are not changed.

begin;

do $rollback$
declare
  policy_roles text;
  existing_columns text;
  view_options text;
  listed_source bigint;
  test_visible bigint;
  test_base bigint;
  map_acl text;
  restored_acl text;
  grant_row record;
begin
  if current_user is distinct from 'postgres'
     or session_user is distinct from 'postgres' then
    raise exception 'directory visibility rollback refused: current_user and session_user must be postgres';
  end if;

  select string_agg(pg_get_userbyid(role_id), ',' order by pg_get_userbyid(role_id))
    into policy_roles
  from pg_policy as policy
  cross join lateral unnest(policy.polroles) as role_id
  where policy.polrelid = 'public.facilities'::regclass
    and policy.polname = 'facilities_public_read_wa_afh_source_matched'
    and policy.polcmd = 'r'
    and policy.polpermissive;
  if policy_roles is distinct from 'anon,authenticated' then
    raise exception 'directory visibility rollback refused: target policy roles are %', coalesce(policy_roles, '<absent>');
  end if;

  select string_agg(attribute.attname, ',' order by attribute.attnum)
    into existing_columns
  from pg_attribute as attribute
  where attribute.attrelid = 'public.wa_dshs_listed_facilities'::regclass
    and attribute.attnum > 0
    and not attribute.attisdropped;
  if existing_columns is distinct from
     'id,canonical_name,address_line1,city,county,license_number,state_code,postal_code,licensed_capacity,record_status' then
    raise exception 'directory visibility rollback refused: listed view columns are %', coalesce(existing_columns, '<missing>');
  end if;

  select coalesce(relation.relacl::text, '<none>')
    into map_acl
  from pg_class as relation
  where relation.oid = 'public.wa_afh_map_facilities'::regclass;
  if pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true) not ilike '%source_name = ''wa_dshs_afh''%'
     or pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true) not ilike '%record_status = ''source_matched''%' then
    raise exception 'directory visibility rollback refused: map view is not the restricted definition';
  end if;

  create temporary table nchf_listed_grants on commit drop as
  select exploded.grantee as grantee_oid,
         exploded.privilege_type,
         exploded.is_grantable
  from pg_class as relation
  cross join lateral aclexplode(relation.relacl) as exploded
  where relation.oid = 'public.wa_dshs_listed_facilities'::regclass
    and exploded.grantee <> relation.relowner;

  if not exists (
    select 1
    from nchf_listed_grants
    where grantee_oid = (select oid from pg_roles where rolname = 'anon')
      and privilege_type = 'SELECT'
  ) or not exists (
    select 1
    from nchf_listed_grants
    where grantee_oid = (select oid from pg_roles where rolname = 'authenticated')
      and privilege_type = 'SELECT'
  ) then
    raise exception 'directory visibility rollback refused: anon or authenticated lacks saved view select';
  end if;

  drop policy facilities_public_read_wa_afh_source_matched on public.facilities;

  create policy "Development test facility read"
    on public.facilities
    for select
    to authenticated
    using (
      id = '00000000-0000-4000-8000-000000000002'::uuid
      and canonical_name = 'DEVELOPMENT TEST HOME - NOT REAL'
    );

  drop view public.wa_dshs_listed_facilities;
  create view public.wa_dshs_listed_facilities
  with (security_invoker = true) as
  select id,
         canonical_name,
         address_line1,
         city,
         county,
         license_number
  from public.facilities;

  for grant_row in
    select grantee_oid, privilege_type, is_grantable
    from nchf_listed_grants
  loop
    execute format(
      'grant %s on table public.wa_dshs_listed_facilities to %s%s',
      grant_row.privilege_type,
      case
        when grant_row.grantee_oid = 0 then 'public'
        else quote_ident(pg_get_userbyid(grant_row.grantee_oid))
      end,
      case when grant_row.is_grantable then ' with grant option' else '' end
    );
  end loop;

  grant select on table public.facilities to anon, authenticated;

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
    and facility_type = 'AFH';

  select coalesce(relation.relacl::text, '<none>')
    into restored_acl
  from pg_class as relation
  where relation.oid = 'public.wa_afh_map_facilities'::regclass;
  if restored_acl is distinct from map_acl
     or position('security_invoker=true' in coalesce(array_to_string((
          select relation.reloptions from pg_class as relation
          where relation.oid = 'public.wa_afh_map_facilities'::regclass
        ), ','), '')) = 0
     or pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true) ilike '%source_name%' then
    raise exception 'directory visibility rollback refused: map view or its grants were not restored';
  end if;

  select string_agg(attribute.attname, ',' order by attribute.attnum)
    into existing_columns
  from pg_attribute as attribute
  where attribute.attrelid = 'public.wa_dshs_listed_facilities'::regclass
    and attribute.attnum > 0
    and not attribute.attisdropped;
  if existing_columns is distinct from 'id,canonical_name,address_line1,city,county,license_number' then
    raise exception 'directory visibility rollback refused: restored columns are %', existing_columns;
  end if;

  select coalesce(array_to_string(relation.reloptions, ','), '')
    into view_options
  from pg_class as relation
  where relation.oid = 'public.wa_dshs_listed_facilities'::regclass;
  if position('security_invoker=true' in view_options) = 0 then
    raise exception 'directory visibility rollback refused: restored view lost security_invoker';
  end if;

  if exists (
    select 1
    from pg_policy
    where polname = 'facilities_public_read_wa_afh_source_matched'
  ) then
    raise exception 'directory visibility rollback refused: the new policy is still present';
  end if;

  execute 'set local role anon';
  select count(*)
    into listed_source
  from public.wa_dshs_listed_facilities as listed
  join public.facilities as facility on facility.id = listed.id
  where facility.record_status = 'source_matched';
  select count(*)
    into test_visible
  from public.wa_dshs_listed_facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  select count(*)
    into test_base
  from public.facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  execute 'reset role';

  if listed_source <> 0 or test_visible <> 0 or test_base <> 0 then
    raise exception
      'directory visibility rollback refused: anon still sees source_matched % or test directory % base %',
      listed_source, test_visible, test_base;
  end if;

  execute 'set local role authenticated';
  select count(*)
    into test_visible
  from public.wa_dshs_listed_facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  select count(*)
    into test_base
  from public.facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  execute 'reset role';
  if test_visible <> 1 or test_base <> 1 then
    raise exception
      'directory visibility rollback refused: authenticated test visibility directory % base %',
      test_visible, test_base;
  end if;

  raise notice 'DIRECTORY_VISIBILITY_ROLLED_BACK';
end
$rollback$;

commit;
