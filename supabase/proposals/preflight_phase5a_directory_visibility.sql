-- Read-only Phase 5A development preflight. Not a migration.
-- The first statement is BEGIN READ ONLY. The last statement is ROLLBACK.
-- Run it only against the development project as postgres.ajjsyloyihcqdomywhik.
-- Confirm that login in the psql banner. current_user does not contain the project ref.

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

select 'RESULT|distribution|INFO|total=' || count(*)::text
from public.facilities;

select 'RESULT|distribution|INFO|source=' || coalesce(source_name, '<null>') ||
       '|status=' || coalesce(record_status, '<null>') ||
       '|rows=' || count(*)::text
from public.facilities
group by source_name, record_status
order by source_name, record_status;

select 'RESULT|predicate|source_matched|' ||
       case when count(*) = 6265 then 'PASS' else 'FAIL' end ||
       '|rows=' || count(*)::text || '|expected=6265'
from public.facilities
where source_name = 'wa_dshs_afh'
  and record_status = 'source_matched';

select 'RESULT|predicate|qualifying|' ||
       case when count(*) = 6265 then 'PASS' else 'FAIL' end ||
       '|rows=' || count(*)::text || '|expected=6265'
from public.facilities
where source_name = 'wa_dshs_afh'
  and license_category = 'afh'
  and facility_type = 'AFH'
  and state_code = 'WA'
  and record_status = 'source_matched'
  and normalized_license_number is not null
  and btrim(normalized_license_number, E' \t\r\n') <> ''
  and license_number ~ '^[0-9]{1,20}$';

select 'RESULT|predicate|map_ready|' ||
       case when count(*) = 6265 then 'PASS' else 'FAIL' end ||
       '|rows=' || count(*)::text || '|expected=6265'
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

select 'RESULT|test_home|row|' ||
       case when count(*) = 1 then 'PASS' else 'FAIL' end ||
       '|rows=' || count(*)::text
from public.facilities
where id = '00000000-0000-4000-8000-000000000002'::uuid
  and canonical_name = 'DEVELOPMENT TEST HOME - NOT REAL'
  and record_status = 'unverified';

select 'RESULT|test_home|predicate|' ||
       case when count(*) = 0 then 'PASS' else 'FAIL' end ||
       '|rows=' || count(*)::text
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

select 'RESULT|policy|new_policy_absent|' ||
       case when count(*) = 0 then 'PASS' else 'FAIL' end ||
       '|rows=' || count(*)::text
from pg_policy
where polrelid = 'public.facilities'::regclass
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
  where policy.polrelid = 'public.facilities'::regclass
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

select 'RESULT|grant|table_select|' || role_name || '|' ||
       case when has_table_privilege(role_name, 'public.facilities', 'select') then 'PASS' else 'FAIL' end
from (values ('anon'), ('authenticated')) as required(role_name);

select 'RESULT|grant|column|INFO|' ||
       coalesce(case when column_grant.grantee = 0 then 'public' else pg_get_userbyid(column_grant.grantee) end, '<unknown>') ||
       '|' || attribute.attname ||
       '|grantable=' || column_grant.is_grantable::text
from pg_attribute as attribute
cross join lateral aclexplode(attribute.attacl) as column_grant
where attribute.attrelid = 'public.facilities'::regclass
  and attribute.attnum > 0
  and not attribute.attisdropped
  and column_grant.privilege_type = 'SELECT'
  and (
    column_grant.grantee = 0
    or column_grant.grantee in (select oid from pg_roles where rolname in ('anon', 'authenticated'))
  )
order by attribute.attname, 1;

select 'RESULT|inherited|facilities_select|' ||
       case when inherited.rolname is null then 'PASS' else 'FAIL' end ||
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
          where facilities.oid = 'public.facilities'::regclass
        )
        or exists (
          select 1
          from pg_class as facilities
          cross join lateral aclexplode(facilities.relacl) as table_grant
          where facilities.oid = 'public.facilities'::regclass
            and table_grant.grantee = role_row.oid
            and table_grant.privilege_type = 'SELECT'
        )
        or exists (
          select 1
          from pg_attribute as attribute
          cross join lateral aclexplode(attribute.attacl) as column_grant
          where attribute.attrelid = 'public.facilities'::regclass
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
  test_view bigint;
  test_base bigint;
  readable integer;
  role_name text;
  column_name text;
begin
  foreach role_name in array array['anon', 'authenticated']
  loop
    execute format('set local role %I', role_name);
    select count(*) into listed_count from public.wa_dshs_listed_facilities;
    select count(*) into map_count from public.wa_afh_map_facilities;
    select count(*) into test_view
    from public.wa_dshs_listed_facilities
    where id = '00000000-0000-4000-8000-000000000002'::uuid;
    select count(*) into test_base
    from public.facilities
    where id = '00000000-0000-4000-8000-000000000002'::uuid;

    raise notice 'RESULT|visibility|%|listed|%|rows=%',
      role_name,
      case
        when role_name = 'anon' and listed_count = 0 then 'PASS'
        when role_name = 'authenticated' and listed_count = 1 then 'PASS'
        else 'FAIL'
      end,
      listed_count;
    raise notice 'RESULT|visibility|%|map|%|rows=%',
      role_name,
      case when map_count = 0 then 'PASS' else 'FAIL' end,
      map_count;
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
