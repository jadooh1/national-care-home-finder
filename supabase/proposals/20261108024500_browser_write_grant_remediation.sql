-- Proposal only. Do not apply this file.
-- It revokes the confirmed browser write grants and does not change rows,
-- policies, functions, or the production schema-alignment guard.
-- Required session settings, which this file does not set:
--   nchf.browser_write_remediation_authorization = authorize-browser-write-remediation
--   nchf.browser_write_remediation_target = yiehgstweswxjakbcdzc

do $remediation$
declare
  facility_count bigint;
  claim_count bigint;
  edit_count bigint;
  admin_count bigint;
  verified_count bigint;
  source_matched_count bigint;
  exact_grants boolean;
  grants_absent boolean;
  audit_exists boolean;
  directory_acl text;
  map_acl text;
begin
  perform pg_catalog.set_config('search_path', '', true);

  if pg_catalog.current_setting('nchf.browser_write_remediation_authorization', true)
     is distinct from 'authorize-browser-write-remediation' then
    raise exception 'browser write remediation authorization is missing';
  end if;
  if pg_catalog.current_setting('nchf.browser_write_remediation_target', true)
     is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'browser write remediation target is not the reviewed production project';
  end if;

  if to_regclass('public.facilities') is null
     or to_regclass('public.owner_claims') is null
     or to_regclass('public.listing_edits') is null
     or to_regclass('public.app_admins') is null then
    raise exception 'required production relations are missing';
  end if;
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'anon')
     or not exists (select 1 from pg_catalog.pg_roles where rolname = 'authenticated') then
    raise exception 'anon and authenticated roles are required';
  end if;

  lock table public.facilities, public.owner_claims, public.listing_edits, public.app_admins
    in share row exclusive mode;

  select count(*) into facility_count from public.facilities;
  select count(*) into claim_count from public.owner_claims;
  select count(*) into edit_count from public.listing_edits;
  select count(*) into admin_count from public.app_admins;
  select count(*) filter (where record_status = 'verified') into verified_count from public.facilities;
  select count(*) filter (where record_status = 'source_matched') into source_matched_count from public.facilities;
  if facility_count <> 8121 then
    raise exception 'facility count is not the reviewed production baseline';
  end if;
  if claim_count <> 0 or edit_count <> 0 or admin_count <> 1
     or verified_count <> 0 or source_matched_count <> 0 then
    raise exception 'production claim, edit, admin, or status counts are not the reviewed baseline';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_class
    where oid = 'public.facilities'::regclass
      and relrowsecurity
      and not relforcerowsecurity
  ) then
    raise exception 'facilities row level security is not in the reviewed state';
  end if;
  if not pg_catalog.has_table_privilege('anon', 'public.facilities', 'SELECT')
     or not pg_catalog.has_table_privilege('authenticated', 'public.facilities', 'SELECT') then
    raise exception 'public select grant is missing; this proposal does not grant it';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_class as relation
    cross join lateral pg_catalog.aclexplode(relation.relacl) as acl
    where relation.oid = any (array[
      'public.facilities'::regclass,
      'public.owner_claims'::regclass,
      'public.listing_edits'::regclass
    ])
    and acl.grantee = 0
    and acl.privilege_type in (
      'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
    )
  ) then
    raise exception 'unreviewed browser write grant';
  end if;

  if exists (
    select 1
    from pg_catalog.pg_attribute as attribute
    cross join lateral pg_catalog.aclexplode(attribute.attacl) as acl
    where attribute.attrelid = any (array[
      'public.facilities'::regclass,
      'public.owner_claims'::regclass,
      'public.listing_edits'::regclass
    ])
    and attribute.attnum > 0
    and not attribute.attisdropped
    and acl.privilege_type in ('INSERT', 'UPDATE', 'REFERENCES')
    and (
      acl.grantee = 0
      or acl.grantee in (
        select roles.oid
        from pg_catalog.pg_roles as roles
        where roles.rolname in ('anon', 'authenticated')
      )
    )
  ) then
    raise exception 'unreviewed browser write grant';
  end if;

  with expected(relname, rolname, privilege_type) as (
    values
      ('facilities', 'anon', 'INSERT'),
      ('facilities', 'anon', 'UPDATE'),
      ('facilities', 'anon', 'DELETE'),
      ('facilities', 'authenticated', 'INSERT'),
      ('facilities', 'authenticated', 'UPDATE'),
      ('facilities', 'authenticated', 'DELETE'),
      ('owner_claims', 'anon', 'INSERT'),
      ('owner_claims', 'authenticated', 'INSERT'),
      ('listing_edits', 'authenticated', 'INSERT')
  ),
  actual as (
    select relation.relname::text as relname,
           roles.rolname::text as rolname,
           acl.privilege_type::text as privilege_type
    from pg_catalog.pg_class as relation
    cross join lateral pg_catalog.aclexplode(relation.relacl) as acl
    join pg_catalog.pg_roles as roles on roles.oid = acl.grantee
    where relation.oid = any (array[
      'public.facilities'::regclass,
      'public.owner_claims'::regclass,
      'public.listing_edits'::regclass
    ])
    and roles.rolname in ('anon', 'authenticated')
    and acl.privilege_type in (
      'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'
    )
  )
  select
    not exists (select * from expected except select * from actual)
      and not exists (select * from actual except select * from expected),
    not exists (select 1 from actual)
  into exact_grants, grants_absent;

  audit_exists := to_regclass('public.nchf_browser_write_remediation_audit') is not null;
  if to_regclass('public.wa_dshs_listed_facilities') is not null then
    select relation.relacl::text into directory_acl
    from pg_catalog.pg_class as relation
    where relation.oid = 'public.wa_dshs_listed_facilities'::regclass;
  end if;
  if to_regclass('public.wa_afh_map_facilities') is not null then
    select relation.relacl::text into map_acl
    from pg_catalog.pg_class as relation
    where relation.oid = 'public.wa_afh_map_facilities'::regclass;
  end if;

  if exact_grants and not audit_exists then
    revoke insert, update, delete on table public.facilities from anon, authenticated;
    revoke insert on table public.owner_claims from anon, authenticated;
    revoke insert on table public.listing_edits from authenticated;

    create table public.nchf_browser_write_remediation_audit (
      remediation_name text primary key,
      facility_count integer not null,
      claim_count integer not null,
      edit_count integer not null,
      admin_count integer not null,
      created_at timestamptz not null default pg_catalog.clock_timestamp()
    );
    alter table public.nchf_browser_write_remediation_audit enable row level security;
    revoke all on table public.nchf_browser_write_remediation_audit from public, anon, authenticated;
    insert into public.nchf_browser_write_remediation_audit (
      remediation_name, facility_count, claim_count, edit_count, admin_count
    ) values (
      '20261108024500', facility_count, claim_count, edit_count, admin_count
    );
  elsif grants_absent and audit_exists then
    null;
  elsif grants_absent and not audit_exists then
    raise exception 'browser write grants are already absent without this proposal';
  elsif audit_exists then
    raise exception 'partial browser write remediation is present';
  else
    raise exception 'unreviewed browser write grant';
  end if;

  if pg_catalog.has_table_privilege('anon', 'public.facilities', 'INSERT')
     or pg_catalog.has_table_privilege('anon', 'public.facilities', 'UPDATE')
     or pg_catalog.has_table_privilege('anon', 'public.facilities', 'DELETE')
     or pg_catalog.has_table_privilege('authenticated', 'public.facilities', 'INSERT')
     or pg_catalog.has_table_privilege('authenticated', 'public.facilities', 'UPDATE')
     or pg_catalog.has_table_privilege('authenticated', 'public.facilities', 'DELETE')
     or pg_catalog.has_table_privilege('anon', 'public.owner_claims', 'INSERT')
     or pg_catalog.has_table_privilege('authenticated', 'public.owner_claims', 'INSERT')
     or pg_catalog.has_table_privilege('anon', 'public.listing_edits', 'INSERT')
     or pg_catalog.has_table_privilege('authenticated', 'public.listing_edits', 'INSERT')
     or not pg_catalog.has_table_privilege('anon', 'public.facilities', 'SELECT')
     or not pg_catalog.has_table_privilege('authenticated', 'public.facilities', 'SELECT') then
    raise exception 'browser write grants remain or select was removed';
  end if;

  if (select count(*) from public.facilities) <> 8121
     or (select count(*) from public.owner_claims) <> 0
     or (select count(*) from public.listing_edits) <> 0
     or (select count(*) from public.app_admins) <> 1
     or (select count(*) filter (where record_status = 'verified') from public.facilities) <> 0
     or (select count(*) filter (where record_status = 'source_matched') from public.facilities) <> 0 then
    raise exception 'production rows changed during browser write remediation';
  end if;

  if to_regclass('public.wa_dshs_listed_facilities') is not null
     and (
       select relation.relacl::text
       from pg_catalog.pg_class as relation
       where relation.oid = 'public.wa_dshs_listed_facilities'::regclass
     ) is distinct from directory_acl then
    raise exception 'directory view grants changed';
  end if;
  if to_regclass('public.wa_afh_map_facilities') is not null
     and (
       select relation.relacl::text
       from pg_catalog.pg_class as relation
       where relation.oid = 'public.wa_afh_map_facilities'::regclass
     ) is distinct from map_acl then
    raise exception 'map view grants changed';
  end if;
end;
$remediation$;
