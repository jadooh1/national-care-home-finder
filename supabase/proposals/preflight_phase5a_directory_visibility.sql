-- Read-only Phase 5A development preflight. Not a migration.
-- The first statement is BEGIN READ ONLY. The last statement is ROLLBACK.
-- Run it only against the development project as postgres.ajjsyloyihcqdomywhik.
-- Confirm that login in the psql banner. current_user does not contain the project ref.
--
-- Gates match the current migration. The policy comparison covers only
-- public.facilities, public.owner_claims, and public.listing_edits.
-- Policies on any other table are reported and do not fail this preflight.
-- Verified rows may already appear in the unfiltered directory and map.
-- source_matched rows must not be visible yet. The 6265-row predicate,
-- test-home visibility, inherited SELECT, and absent privilege snapshot
-- are hard gates. This session must not carry rollback authorization.
--
-- Development execution, from the repository root. The command does not
-- set a password. PGSSLROOTCERT must already name the development root
-- certificate, and this command does not change it. Confirm the psql
-- banner shows postgres.ajjsyloyihcqdomywhik at the development pooler.
--
-- if (-not $env:PGSSLROOTCERT -or -not (Test-Path -LiteralPath $env:PGSSLROOTCERT)) { throw "PGSSLROOTCERT must already name the development root certificate" }
-- $env:PGSSLMODE = "verify-full"
-- & "$env:TEMP\pg1711\pgsql\bin\psql.exe" -h aws-1-us-west-2.pooler.supabase.com -p 5432 -U postgres.ajjsyloyihcqdomywhik -d postgres -v ON_ERROR_STOP=1 -f "supabase\proposals\preflight_phase5a_directory_visibility.sql"

BEGIN READ ONLY;

select 'RESULT|identity|session|' ||
       case
         when current_user = 'postgres'
          and session_user = 'postgres'
          and current_database() = 'postgres'
         then 'PASS'
         else 'FAIL'
       end ||
       '|current_user=' || current_user ||
       '|session_user=' || session_user ||
       '|database=' || current_database();

select 'RESULT|identity|ssl|' ||
       case when coalesce(s.ssl, false) then 'PASS' else 'FAIL' end ||
       '|ssl=' || coalesce(s.ssl::text, 'null') ||
       '|version=' || coalesce(s.version, 'null') ||
       '|backend=' || coalesce(inet_server_addr()::text, 'null') ||
       '|backend_port=' || coalesce(inet_server_port()::text, 'null')
from (select 1) as anchor
left join pg_stat_ssl as s on s.pid = pg_backend_pid();

select 'RESULT|identity|role|' ||
       case when not rolsuper then 'PASS' else 'FAIL' end ||
       '|superuser=' || rolsuper::text ||
       '|bypassrls=' || rolbypassrls::text ||
       '|inherit=' || rolinherit::text
from pg_roles
where rolname = current_user;

select 'RESULT|identity|server|INFO|version=' || current_setting('server_version');

select 'RESULT|identity|roles|' ||
       case
         when to_regrole('anon') is not null
          and to_regrole('authenticated') is not null
         then 'PASS'
         else 'FAIL'
       end ||
       '|anon=' || (to_regrole('anon') is not null)::text ||
       '|authenticated=' || (to_regrole('authenticated') is not null)::text;

select 'RESULT|rollback|authorization_unset|' ||
       case
         when coalesce(current_setting('nchf.phase5a_rollback_authorization', true), '') = ''
         then 'PASS'
         else 'FAIL'
       end;

select 'RESULT|relation|' || required.relname || '|' ||
       case when to_regclass('public.' || required.relname) is null then 'FAIL' else 'PASS' end
from (values
  ('facilities'),
  ('owner_claims'),
  ('listing_edits'),
  ('wa_dshs_listed_facilities'),
  ('wa_afh_map_facilities')
) as required(relname);

select 'RESULT|column|facilities|' || required.attname || '|' ||
       case when attribute.attname is null then 'FAIL' else 'PASS' end
from (values
  ('id'),
  ('canonical_name'),
  ('address_line1'),
  ('city'),
  ('county'),
  ('state_code'),
  ('postal_code'),
  ('license_number'),
  ('licensed_capacity'),
  ('latitude'),
  ('longitude'),
  ('record_status'),
  ('normalized_license_number'),
  ('license_category'),
  ('source_name'),
  ('facility_type')
) as required(attname)
left join pg_attribute as attribute
  on attribute.attrelid = to_regclass('public.facilities')
 and attribute.attname = required.attname
 and attribute.attnum > 0
 and not attribute.attisdropped
order by required.attname;

do $preflight_distribution$
declare
  facilities_oid oid;
  relation_kind "char";
  missing_columns text;
  total_rows bigint;
  distribution_row record;
begin
  facilities_oid := to_regclass('public.facilities');
  if facilities_oid is null then
    raise notice 'RESULT|distribution|total|FAIL|rows=<unavailable>|missing=relation';
    raise notice 'RESULT|distribution|grouped|FAIL|rows=<unavailable>|missing=relation';
    return;
  end if;

  select relation.relkind
    into relation_kind
  from pg_class as relation
  where relation.oid = facilities_oid;
  if relation_kind is distinct from 'r'
     and relation_kind is distinct from 'p'
     and relation_kind is distinct from 'v'
     and relation_kind is distinct from 'm'
     and relation_kind is distinct from 'f' then
    raise notice 'RESULT|distribution|total|FAIL|rows=<unavailable>|missing=structure';
    raise notice 'RESULT|distribution|grouped|FAIL|rows=<unavailable>|missing=structure';
    return;
  end if;

  select string_agg(required.attname, ',' order by required.attname)
    into missing_columns
  from (values ('record_status'), ('source_name')) as required(attname)
  where not exists (
    select 1
    from pg_attribute as attribute
    where attribute.attrelid = facilities_oid
      and attribute.attname = required.attname
      and attribute.attnum > 0
      and not attribute.attisdropped
  );
  if missing_columns is not null then
    raise notice 'RESULT|distribution|total|FAIL|rows=<unavailable>|missing=%', missing_columns;
    raise notice 'RESULT|distribution|grouped|FAIL|rows=<unavailable>|missing=%', missing_columns;
    return;
  end if;

  execute 'select count(*) from public.facilities' into total_rows;
  raise notice 'RESULT|distribution|INFO|total=%', total_rows;
  for distribution_row in
    execute $distribution$
      select coalesce(source_name, '<null>') as source_name,
             coalesce(record_status, '<null>') as record_status,
             count(*) as row_count
      from public.facilities
      group by source_name, record_status
      order by source_name, record_status
    $distribution$
  loop
    raise notice 'RESULT|distribution|INFO|source=%|status=%|rows=%',
      distribution_row.source_name,
      distribution_row.record_status,
      distribution_row.row_count;
  end loop;
exception
  when others then
    raise notice 'RESULT|distribution|total|FAIL|rows=<unavailable>|sqlstate=%', sqlstate;
    raise notice 'RESULT|distribution|grouped|FAIL|rows=<unavailable>|sqlstate=%', sqlstate;
end
$preflight_distribution$;

do $preflight_predicate$
declare
  missing_columns text;
  source_rows bigint;
  qualifying bigint;
  map_ready bigint;
  test_rows bigint;
  test_matches bigint;
begin
  select string_agg(required.attname, ',' order by required.attname)
    into missing_columns
  from (values
    ('id'),
    ('canonical_name'),
    ('address_line1'),
    ('city'),
    ('county'),
    ('state_code'),
    ('postal_code'),
    ('license_number'),
    ('licensed_capacity'),
    ('latitude'),
    ('longitude'),
    ('record_status'),
    ('normalized_license_number'),
    ('license_category'),
    ('source_name'),
    ('facility_type')
  ) as required(attname)
  where to_regclass('public.facilities') is null
     or not exists (
       select 1
       from pg_attribute as attribute
       where attribute.attrelid = to_regclass('public.facilities')
         and attribute.attname = required.attname
         and attribute.attnum > 0
         and not attribute.attisdropped
     );
  if missing_columns is not null then
    raise notice 'RESULT|predicate|source_matched|FAIL|rows=<unavailable>|missing=%', missing_columns;
    raise notice 'RESULT|predicate|qualifying|FAIL|rows=<unavailable>|missing=%', missing_columns;
    raise notice 'RESULT|predicate|map_ready|FAIL|rows=<unavailable>|missing=%', missing_columns;
    raise notice 'RESULT|test_home|row|FAIL|rows=<unavailable>|missing=%', missing_columns;
    raise notice 'RESULT|test_home|predicate|FAIL|rows=<unavailable>|missing=%', missing_columns;
    return;
  end if;

  select count(*) into source_rows
  from public.facilities
  where source_name = 'wa_dshs_afh'
    and record_status = 'source_matched';
  select count(*) into qualifying
  from public.facilities
  where source_name = 'wa_dshs_afh'
    and license_category = 'afh'
    and facility_type = 'AFH'
    and state_code = 'WA'
    and record_status = 'source_matched'
    and normalized_license_number is not null
    and btrim(normalized_license_number, E' \t\r\n') <> ''
    and license_number ~ '^[0-9]{1,20}$';
  select count(*) into map_ready
  from public.facilities
  where source_name = 'wa_dshs_afh'
    and license_category = 'afh'
    and facility_type = 'AFH'
    and state_code = 'WA'
    and record_status = 'source_matched'
    and normalized_license_number is not null
    and btrim(normalized_license_number, E' \t\r\n') <> ''
    and license_number ~ '^[0-9]{1,20}$'
    and latitude is not null
    and longitude is not null
    and postal_code is not null;
  select count(*) into test_rows
  from public.facilities
  where id = '00000000-0000-4000-8000-000000000002'::uuid
    and canonical_name = 'DEVELOPMENT TEST HOME - NOT REAL'
    and record_status = 'unverified';
  select count(*) into test_matches
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

  raise notice 'RESULT|predicate|source_matched|%|rows=%|expected=6265',
    case when source_rows = 6265 then 'PASS' else 'FAIL' end, source_rows;
  raise notice 'RESULT|predicate|qualifying|%|rows=%|expected=6265',
    case when qualifying = 6265 then 'PASS' else 'FAIL' end, qualifying;
  raise notice 'RESULT|predicate|map_ready|%|rows=%|expected=6265',
    case when map_ready = 6265 then 'PASS' else 'FAIL' end, map_ready;
  raise notice 'RESULT|test_home|row|%|rows=%',
    case when test_rows = 1 then 'PASS' else 'FAIL' end, test_rows;
  raise notice 'RESULT|test_home|predicate|%|rows=%',
    case when test_matches = 0 then 'PASS' else 'FAIL' end, test_matches;
end
$preflight_predicate$;

select 'RESULT|policy|new_policy_absent|' ||
       case
         when to_regclass('public.facilities') is null then 'FAIL'
         when count(*) = 0 then 'PASS'
         else 'FAIL'
       end ||
       '|rows=' || count(*)::text
from pg_policy
where polrelid = to_regclass('public.facilities')
  and polname = 'facilities_public_read_wa_afh_source_matched';

select 'RESULT|policy|test_home|' ||
       case
         when observed.roles = 'authenticated'
          and observed.expr =
              '((id=''00000000-0000-4000-8000-000000000002''::uuid)and(canonical_name=''developmenttesthome-notreal''::text))'
         then 'PASS'
         else 'FAIL'
       end ||
       '|roles=' || coalesce(observed.roles, '<absent>')
from (select 1) as anchor
left join lateral (
  select string_agg(pg_get_userbyid(role_id), ',' order by pg_get_userbyid(role_id)) as roles,
         lower(regexp_replace(pg_get_expr(policy.polqual, policy.polrelid), '\s+', '', 'g')) as expr
  from pg_policy as policy
  cross join lateral unnest(policy.polroles) as role_id
  where policy.polrelid = to_regclass('public.facilities')
    and policy.polname = 'Development test facility read'
    and policy.polpermissive
    and policy.polcmd = 'r'
  group by pg_get_expr(policy.polqual, policy.polrelid)
) as observed on true;

select 'RESULT|policy|present|INFO|' || n.nspname || '.' || c.relname || '|' || p.polname
from pg_policy as p
join pg_class as c on c.oid = p.polrelid
join pg_namespace as n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('facilities', 'owner_claims', 'listing_edits')
order by c.relname, p.polname;

select 'RESULT|policy|outside_comparison|INFO|tables=' || count(distinct c.oid)::text ||
       '|policies=' || count(p.oid)::text
from pg_class as c
join pg_namespace as n on n.oid = c.relnamespace
left join pg_policy as p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname not in ('facilities', 'owner_claims', 'listing_edits')
  and p.oid is not null;

select 'RESULT|view|listed_columns|' ||
       case
         when to_regclass('public.wa_dshs_listed_facilities') is null then 'FAIL'
         when listed.cols = 'id,canonical_name,address_line1,city,county,license_number' then 'PASS'
         else 'FAIL'
       end ||
       '|columns=' || coalesce(listed.cols, '<missing>')
from (
  select string_agg(attribute.attname, ',' order by attribute.attnum) as cols
  from pg_attribute as attribute
  where attribute.attrelid = to_regclass('public.wa_dshs_listed_facilities')
    and attribute.attnum > 0
    and not attribute.attisdropped
) as listed;

select 'RESULT|view|listed_definition|' ||
       case
         when present.oid is null then 'FAIL'
         when position('security_invoker=true' in coalesce(array_to_string(relation.reloptions, ','), '')) > 0
          and pg_get_viewdef(present.oid, true) not ilike '%where%'
         then 'PASS'
         else 'FAIL'
       end ||
       '|options=' || coalesce(array_to_string(relation.reloptions, ','), '<none>')
from (select to_regclass('public.wa_dshs_listed_facilities') as oid) as present
left join pg_class as relation on relation.oid = present.oid;

select 'RESULT|view|map_columns|' ||
       case
         when to_regclass('public.wa_afh_map_facilities') is null then 'FAIL'
         when map_view.cols =
              'id,canonical_name,address_line1,city,county,state_code,postal_code,license_number,licensed_capacity,latitude,longitude'
         then 'PASS'
         else 'FAIL'
       end ||
       '|columns=' || coalesce(map_view.cols, '<missing>')
from (
  select string_agg(attribute.attname, ',' order by attribute.attnum) as cols
  from pg_attribute as attribute
  where attribute.attrelid = to_regclass('public.wa_afh_map_facilities')
    and attribute.attnum > 0
    and not attribute.attisdropped
) as map_view;

select 'RESULT|view|map_definition|' ||
       case
         when present.oid is null then 'FAIL'
         when position('security_invoker=true' in coalesce(array_to_string(relation.reloptions, ','), '')) > 0
          and pg_get_viewdef(present.oid, true) not ilike '%source_name%'
          and pg_get_viewdef(present.oid, true) ilike '%facility_type%'
         then 'PASS'
         else 'FAIL'
       end ||
       '|options=' || coalesce(array_to_string(relation.reloptions, ','), '<none>')
from (select to_regclass('public.wa_afh_map_facilities') as oid) as present
left join pg_class as relation on relation.oid = present.oid;

select 'RESULT|snapshot|absent|' ||
       case when to_regclass('public.nchf_phase5a_facilities_acl_snapshot') is null then 'PASS' else 'FAIL' end;

select 'RESULT|grant|table_select|' || required.role_name || '|' ||
       case
         when to_regrole(required.role_name) is null then 'FAIL'
         when to_regclass('public.facilities') is null then 'FAIL'
         when has_table_privilege(required.role_name, 'public.facilities', 'select') then 'PASS'
         else 'FAIL'
       end
from (values ('anon'), ('authenticated')) as required(role_name);

select 'RESULT|grant|column|INFO|' ||
       coalesce(case when column_grant.grantee = 0 then 'public' else pg_get_userbyid(column_grant.grantee) end, '<unknown>') ||
       '|' || attribute.attname ||
       '|grantable=' || column_grant.is_grantable::text
from pg_attribute as attribute
cross join lateral aclexplode(attribute.attacl) as column_grant
where attribute.attrelid = to_regclass('public.facilities')
  and attribute.attnum > 0
  and not attribute.attisdropped
  and column_grant.privilege_type = 'SELECT'
  and (
    column_grant.grantee = 0
    or column_grant.grantee in (select oid from pg_roles where rolname in ('anon', 'authenticated'))
  )
order by attribute.attname, 1;

select 'RESULT|inherited|facilities_select|' ||
       case
         when to_regclass('public.facilities') is null then 'FAIL'
         when inherited.rolname is null then 'PASS'
         else 'FAIL'
       end ||
       '|role=' || coalesce(inherited.rolname, '<none>')
from (
  select (
    with recursive inherited_roles(roleid) as (
      select membership.roleid
      from pg_auth_members as membership
      join pg_roles as member_role on member_role.oid = membership.member
      where member_role.rolname in ('anon', 'authenticated')
        and membership.inherit_option
      union
      select membership.roleid
      from pg_auth_members as membership
      join inherited_roles on inherited_roles.roleid = membership.member
      where membership.inherit_option
    )
    select role_row.rolname
    from inherited_roles
    join pg_roles as role_row on role_row.oid = inherited_roles.roleid
    where role_row.rolname not in ('anon', 'authenticated')
      and (
        role_row.rolsuper
        or role_row.rolname = 'pg_read_all_data'
        or role_row.oid = (
          select facilities.relowner
          from pg_class as facilities
          where facilities.oid = to_regclass('public.facilities')
        )
        or exists (
          select 1
          from pg_class as facilities
          cross join lateral aclexplode(facilities.relacl) as table_grant
          where facilities.oid = to_regclass('public.facilities')
            and table_grant.grantee = role_row.oid
            and table_grant.privilege_type = 'SELECT'
        )
        or exists (
          select 1
          from pg_attribute as attribute
          cross join lateral aclexplode(attribute.attacl) as column_grant
          where attribute.attrelid = to_regclass('public.facilities')
            and attribute.attnum > 0
            and not attribute.attisdropped
            and column_grant.grantee = role_row.oid
            and column_grant.privilege_type = 'SELECT'
        )
      )
    order by role_row.rolname
    limit 1
  ) as rolname
) as inherited;

do $preflight_roles$
declare
  listed_count bigint;
  map_count bigint;
  source_listed bigint;
  source_map bigint;
  test_view bigint;
  test_base bigint;
  readable integer;
  role_name text;
  column_name text;
begin
  if to_regrole('anon') is null
     or to_regrole('authenticated') is null
     or to_regclass('public.facilities') is null
     or to_regclass('public.wa_dshs_listed_facilities') is null
     or to_regclass('public.wa_afh_map_facilities') is null
     or (
       select count(*)
       from pg_attribute as attribute
       where attribute.attrelid = to_regclass('public.facilities')
         and attribute.attname in ('id', 'record_status')
         and attribute.attnum > 0
         and not attribute.attisdropped
     ) is distinct from 2 then
    raise notice 'RESULT|visibility|anon|source_matched_listed|FAIL|rows=<unavailable>';
    raise notice 'RESULT|visibility|authenticated|source_matched_listed|FAIL|rows=<unavailable>';
    raise notice 'RESULT|visibility|anon|source_matched_map|FAIL|rows=<unavailable>';
    raise notice 'RESULT|visibility|authenticated|source_matched_map|FAIL|rows=<unavailable>';
    raise notice 'RESULT|visibility|anon|test_directory|FAIL|rows=<unavailable>';
    raise notice 'RESULT|visibility|authenticated|test_directory|FAIL|rows=<unavailable>';
    raise notice 'RESULT|visibility|anon|test_base|FAIL|rows=<unavailable>';
    raise notice 'RESULT|visibility|authenticated|test_base|FAIL|rows=<unavailable>';
    return;
  end if;

  foreach role_name in array array['anon', 'authenticated']
  loop
    execute format('set local role %I', role_name);
    select count(*) into listed_count from public.wa_dshs_listed_facilities;
    select count(*) into map_count from public.wa_afh_map_facilities;
    select count(*) into source_listed
    from public.wa_dshs_listed_facilities as listed
    join public.facilities as facility on facility.id = listed.id
    where facility.record_status = 'source_matched';
    select count(*) into source_map
    from public.wa_afh_map_facilities as map_row
    join public.facilities as facility on facility.id = map_row.id
    where facility.record_status = 'source_matched';
    select count(*) into test_view
    from public.wa_dshs_listed_facilities
    where id = '00000000-0000-4000-8000-000000000002'::uuid;
    select count(*) into test_base
    from public.facilities
    where id = '00000000-0000-4000-8000-000000000002'::uuid;

    raise notice 'RESULT|visibility|%|listed|INFO|rows=%', role_name, listed_count;
    raise notice 'RESULT|visibility|%|map|INFO|rows=%', role_name, map_count;
    raise notice 'RESULT|visibility|%|source_matched_listed|%|rows=%',
      role_name,
      case when source_listed = 0 then 'PASS' else 'FAIL' end,
      source_listed;
    raise notice 'RESULT|visibility|%|source_matched_map|%|rows=%',
      role_name,
      case when source_map = 0 then 'PASS' else 'FAIL' end,
      source_map;
    raise notice 'RESULT|visibility|%|test_directory|%|rows=%',
      role_name,
      case
        when role_name = 'anon' and test_view = 0 then 'PASS'
        when role_name = 'authenticated' and test_view = 1 then 'PASS'
        else 'FAIL'
      end,
      test_view;
    raise notice 'RESULT|visibility|%|test_base|%|rows=%',
      role_name,
      case
        when role_name = 'anon' and test_base = 0 then 'PASS'
        when role_name = 'authenticated' and test_base = 1 then 'PASS'
        else 'FAIL'
      end,
      test_base;

    foreach column_name in array array['source_hash', 'public_phone']
    loop
      begin
        execute format('select %I from public.facilities limit 1', column_name);
        readable := 1;
      exception
        when insufficient_privilege then
          readable := 0;
        when undefined_column then
          readable := -1;
      end;
      raise notice 'RESULT|restricted|%|%|%|state=%',
        role_name,
        column_name,
        case when readable = 1 then 'PASS' else 'FAIL' end,
        case readable
          when 1 then 'readable_before_migration'
          when 0 then 'denied'
          else 'missing_column'
        end;
    end loop;
  end loop;
  execute 'reset role';
exception
  when others then
    execute 'reset role';
    raise;
end
$preflight_roles$;

ROLLBACK;
