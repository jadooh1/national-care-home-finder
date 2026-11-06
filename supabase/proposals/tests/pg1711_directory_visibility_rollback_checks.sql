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
