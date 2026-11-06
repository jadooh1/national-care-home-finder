-- Disposable post-rollback checks. Not a migration.

do $rollback_checks$
declare
  columns text;
  policy_count bigint;
  listed bigint;
  verified_visible bigint;
  test_visible bigint;
  test_base bigint;
  map_decoy bigint;
  test_roles text;
  claim_count bigint;
  claim_notes text;
  acl_signature text;
begin
  select string_agg(attribute.attname, ',' order by attribute.attnum)
    into columns
  from pg_attribute as attribute
  where attribute.attrelid = 'public.wa_dshs_listed_facilities'::regclass
    and attribute.attnum > 0
    and not attribute.attisdropped;
  if columns is distinct from 'id,canonical_name,address_line1,city,county,license_number' then
    raise exception 'rollback columns are %', columns;
  end if;

  select count(*) into policy_count
  from pg_policy
  where polname = 'facilities_public_read_wa_afh_source_matched';
  if policy_count <> 0 then
    raise exception 'rollback left the new policy';
  end if;
  select string_agg(pg_get_userbyid(role_id), ',' order by pg_get_userbyid(role_id))
    into test_roles
  from pg_policy as policy
  cross join lateral unnest(policy.polroles) as role_id
  where policy.polname = 'Development test facility read'
    and policy.polrelid = 'public.facilities'::regclass;
  if test_roles is distinct from 'authenticated' then
    raise exception 'rollback test policy roles are %', coalesce(test_roles, '<absent>');
  end if;
  if pg_get_viewdef('public.wa_afh_map_facilities'::regclass, true) ilike '%source_name%' then
    raise exception 'rollback left the map source filter in place';
  end if;

  execute 'set local role anon';
  select count(*) into listed from public.wa_dshs_listed_facilities;
  select count(*) into verified_visible
  from public.wa_dshs_listed_facilities
  where canonical_name = 'VERIFIED OTHER SOURCE';
  select count(*) into test_visible
  from public.wa_dshs_listed_facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  select count(*) into test_base
  from public.facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  select count(*) into map_decoy
  from public.wa_afh_map_facilities
  where canonical_name = 'VERIFIED OTHER SOURCE';
  execute 'reset role';
  if listed <> 1 or verified_visible <> 1 or test_visible <> 0 or test_base <> 0 or map_decoy <> 1 then
    raise exception 'rollback anon visibility listed % verified % test % base % map %',
      listed, verified_visible, test_visible, test_base, map_decoy;
  end if;

  execute 'set local role authenticated';
  select count(*) into test_visible
  from public.wa_dshs_listed_facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  select count(*) into test_base
  from public.facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  execute 'reset role';
  if test_visible <> 1 or test_base <> 1 then
    raise exception 'rollback authenticated test visibility directory % base %', test_visible, test_base;
  end if;
  if to_regclass('public.nchf_phase5a_facilities_acl_snapshot') is not null then
    raise exception 'rollback left the privilege snapshot';
  end if;
  if (
    select count(*)
    from pg_policy as policy
    where policy.polrelid = 'public.app_admins'::regclass
      and policy.polname = 'app_admins_select_self'
      and policy.polcmd = 'r'
  ) is distinct from 1
  or (
    select count(*)
    from pg_policy as policy
    where policy.polrelid = 'public.ingest'::regclass
      and policy.polname = 'ingest_definer_select'
      and policy.polcmd = 'r'
      and pg_get_expr(policy.polqual, policy.polrelid) = 'true'
  ) is distinct from 1 then
    raise exception 'rollback changed an unrelated app_admins or ingest policy';
  end if;
  if not has_table_privilege('anon', 'public.facilities', 'select')
     or not has_table_privilege('authenticated', 'public.facilities', 'select')
     or not has_column_privilege('anon', 'public.facilities', 'public_phone', 'select')
     or not has_column_privilege('authenticated', 'public.facilities', 'public_phone', 'select')
     or not has_column_privilege('anon', 'public.facilities', 'source_hash', 'select')
     or not has_column_privilege('authenticated', 'public.facilities', 'source_hash', 'select') then
    raise exception 'rollback did not restore original facilities select';
  end if;
  if (
    select count(*)
    from pg_attribute as attribute
    cross join lateral aclexplode(attribute.attacl) as column_grant
    where attribute.attrelid = 'public.facilities'::regclass
      and attribute.attname = 'public_phone'
      and column_grant.privilege_type = 'SELECT'
      and (
        column_grant.grantee = 0
        or column_grant.grantee in (
          select oid from pg_roles where rolname in ('anon', 'authenticated')
        )
      )
  ) <> 3 then
    raise exception 'rollback did not restore the public_phone column grants';
  end if;
  select string_agg(item, ',' order by item)
    into acl_signature
  from (
    select 'table|' || case when table_grant.grantee = 0 then 'public' else pg_get_userbyid(table_grant.grantee) end
           || '|SELECT|' || table_grant.is_grantable::text as item
    from pg_class as facilities
    cross join lateral aclexplode(facilities.relacl) as table_grant
    where facilities.oid = 'public.facilities'::regclass
      and table_grant.privilege_type = 'SELECT'
      and (
        table_grant.grantee = 0
        or table_grant.grantee in (
          select oid from pg_roles where rolname in ('anon', 'authenticated')
        )
      )
    union all
    select 'column|' || attribute.attname || '|'
           || case when column_grant.grantee = 0 then 'public' else pg_get_userbyid(column_grant.grantee) end
           || '|SELECT|' || column_grant.is_grantable::text
    from pg_attribute as attribute
    cross join lateral aclexplode(attribute.attacl) as column_grant
    where attribute.attrelid = 'public.facilities'::regclass
      and attribute.attnum > 0
      and not attribute.attisdropped
      and column_grant.privilege_type = 'SELECT'
      and (
        column_grant.grantee = 0
        or column_grant.grantee in (
          select oid from pg_roles where rolname in ('anon', 'authenticated')
        )
      )
  ) as saved_grants;
  if acl_signature is distinct from
     'column|public_phone|anon|SELECT|false,column|public_phone|authenticated|SELECT|true,column|public_phone|public|SELECT|false,table|anon|SELECT|false,table|authenticated|SELECT|true' then
    raise exception 'rollback ACL signature is %', coalesce(acl_signature, '<none>');
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  execute 'set local role authenticated';
  select count(*), string_agg(evidence_notes, '|')
    into claim_count, claim_notes
  from public.owner_claims;
  execute 'reset role';
  if claim_count <> 1 or claim_notes is distinct from 'private claim note for user a' then
    raise exception 'rollback changed claim visibility % %', claim_count, claim_notes;
  end if;

  raise notice 'DIRECTORY_VISIBILITY_ROLLBACK_CHECKS_PASS';
end
$rollback_checks$;
