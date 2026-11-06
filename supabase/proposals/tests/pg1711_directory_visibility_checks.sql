-- Disposable checks for the Phase 5A visibility fixture. Not a migration.

do $checks$
declare
  directory_columns text;
  owner_columns text;
  detail_columns text;
  listed bigint;
  other_source bigint;
  verified_table bigint;
  test_directory bigint;
  test_base bigint;
  other_map bigint;
  claim_count bigint;
  claim_notes text;
  edit_count bigint;
  phone_visible integer;
  hash_visible integer;
begin
  select string_agg(attribute.attname, ',' order by attribute.attnum)
    into directory_columns
  from pg_attribute as attribute
  where attribute.attrelid = 'public.wa_dshs_listed_facilities'::regclass
    and attribute.attnum > 0
    and not attribute.attisdropped;

  if directory_columns is distinct from
     'id,canonical_name,address_line1,city,county,license_number,state_code,postal_code,licensed_capacity,record_status' then
    raise exception 'directory columns are %', directory_columns;
  end if;

  -- app/washington/page.tsx and app/washington/[license]/page.tsx
  detail_columns := 'id,canonical_name,address_line1,city,county,state_code,postal_code,license_number,licensed_capacity,record_status';
  -- app/owner/dashboard/page.tsx
  owner_columns := 'id,canonical_name,address_line1,city,county,license_number';
  if directory_columns !~ 'id,canonical_name,address_line1,city,county,license_number,state_code,postal_code,licensed_capacity,record_status' then
    raise exception 'directory and detail select list is not contained in the view';
  end if;
  if position('license_number' in directory_columns) = 0
     or position('city' in directory_columns) = 0 then
    raise exception 'owner select list is not contained in the view';
  end if;

  begin
    execute 'set local role anon';
    execute 'select count(*) from public.owner_claims' into claim_count;
    raise exception 'anon read owner_claims';
  exception
    when insufficient_privilege then
      null;
  end;
  execute 'reset role';

  begin
    execute 'set local role anon';
    execute 'select count(*) from public.listing_edits' into edit_count;
    raise exception 'anon read listing_edits';
  exception
    when insufficient_privilege then
      null;
  end;
  execute 'reset role';

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  execute 'set local role authenticated';
  select count(*), string_agg(evidence_notes, '|')
    into claim_count, claim_notes
  from public.owner_claims;
  select count(*) into edit_count from public.listing_edits;
  if claim_count <> 1
     or claim_notes is distinct from 'private claim note for user a'
     or edit_count <> 1 then
    raise exception 'user a protection failed claims % notes % edits %', claim_count, claim_notes, edit_count;
  end if;
  execute 'reset role';

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000b2', true);
  execute 'set local role authenticated';
  select count(*), string_agg(evidence_notes, '|')
    into claim_count, claim_notes
  from public.owner_claims;
  if claim_count <> 1 or claim_notes is distinct from 'private claim note for user b' then
    raise exception 'user b protection failed claims % notes %', claim_count, claim_notes;
  end if;
  execute 'reset role';

  execute 'set local role anon';
  select count(*) into listed from public.wa_dshs_listed_facilities;
  select count(*) into other_source
  from public.wa_dshs_listed_facilities
  where canonical_name = 'VERIFIED OTHER SOURCE';
  select count(*) into other_map
  from public.wa_afh_map_facilities
  where canonical_name = 'VERIFIED OTHER SOURCE';
  select count(*) into verified_table
  from public.facilities
  where canonical_name = 'VERIFIED OTHER SOURCE';
  select count(*) into test_directory
  from public.wa_dshs_listed_facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  select count(*) into test_base
  from public.facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  begin
    perform public_phone from public.facilities limit 1;
    phone_visible := 1;
  exception
    when insufficient_privilege then
      phone_visible := 0;
  end;
  begin
    perform source_hash from public.facilities limit 1;
    hash_visible := 1;
  exception
    when insufficient_privilege then
      hash_visible := 0;
  end;
  execute 'reset role';

  if listed <> 6265 or other_source <> 0 or other_map <> 0
     or verified_table <> 1 or phone_visible <> 0 or hash_visible <> 0
     or test_directory <> 0 or test_base <> 0 then
    raise exception
      'anon visibility failed listed % other % map % verified_table % phone % hash % directory_test % base_test %',
      listed, other_source, other_map, verified_table, phone_visible, hash_visible, test_directory, test_base;
  end if;

  execute 'set local role authenticated';
  select count(*) into test_directory
  from public.wa_dshs_listed_facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  select count(*) into test_base
  from public.facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid;
  select count(*) into other_map
  from public.wa_afh_map_facilities
  where canonical_name = 'VERIFIED OTHER SOURCE';
  begin
    perform public_phone from public.facilities limit 1;
    phone_visible := 1;
  exception
    when insufficient_privilege then
      phone_visible := 0;
  end;
  begin
    perform source_hash from public.facilities limit 1;
    hash_visible := 1;
  exception
    when insufficient_privilege then
      hash_visible := 0;
  end;
  execute 'reset role';
  if phone_visible <> 0 or hash_visible <> 0 then
    raise exception 'authenticated can read a restricted column phone % hash %', phone_visible, hash_visible;
  end if;
  if test_directory <> 0 or test_base <> 0 or other_map <> 0 then
    raise exception
      'authenticated protection failed directory % base % map %',
      test_directory, test_base, other_map;
  end if;
  if has_column_privilege('anon', 'public.facilities', 'public_phone', 'select')
     or has_column_privilege('authenticated', 'public.facilities', 'public_phone', 'select')
     or has_column_privilege('public', 'public.facilities', 'public_phone', 'select')
     or has_column_privilege('anon', 'public.facilities', 'source_hash', 'select')
     or has_column_privilege('authenticated', 'public.facilities', 'source_hash', 'select')
     or has_column_privilege('public', 'public.facilities', 'source_hash', 'select')
     or not has_column_privilege('anon', 'public.facilities', 'canonical_name', 'select')
     or not has_column_privilege('authenticated', 'public.facilities', 'canonical_name', 'select') then
    raise exception 'public column privileges were not limited to the directory columns';
  end if;
  if exists (
    select 1
    from pg_attribute as attribute
    cross join lateral aclexplode(attribute.attacl) as column_grant
    where attribute.attrelid = 'public.facilities'::regclass
      and attribute.attname in ('public_phone', 'source_hash')
      and column_grant.privilege_type = 'SELECT'
      and (
        column_grant.grantee = 0
        or column_grant.grantee in (
          select oid from pg_roles where rolname in ('anon', 'authenticated')
        )
      )
  ) then
    raise exception 'a restricted column grant survived the migration';
  end if;

  if detail_columns is null or owner_columns is null then
    raise exception 'query column lists were not recorded';
  end if;

  raise notice 'DIRECTORY_VISIBILITY_CHECKS_PASS';
end
$checks$;
