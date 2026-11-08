-- Proposal only. Do not apply this file until a human authorizes it on the
-- development project ajjsyloyihcqdomywhik. It does not insert Oregon rows
-- into public.facilities, and it does not change Washington views, policies,
-- or owner functions.
-- Rollback: drop view if exists public.or_odhs_listed_afh;

begin;

do $guard$
declare
  column_names text;
begin
  if to_regclass('public.oregon_odhs_afh_public') is null
     or to_regclass('public.facilities') is null
     or to_regclass('public.wa_dshs_listed_facilities') is null
     or to_regclass('public.wa_afh_map_facilities') is null
     or to_regclass('public.or_odhs_listed_afh') is not null then
    raise exception 'oregon public directory prerequisites are missing or the view already exists';
  end if;
  if (select count(*) from public.facilities) <> 6284
     or (select count(*) from public.facilities where facility_type = 'AFH' and state_code = 'WA') <> 6284
     or exists (
       select 1 from public.facilities
       where facility_type is distinct from 'AFH' or state_code is distinct from 'WA'
     ) then
    raise exception 'refusing to add the oregon public view outside the development facility set';
  end if;
  select string_agg(column_name, ',' order by ordinal_position)
    into column_names
  from information_schema.columns
  where table_schema = 'public' and table_name = 'oregon_odhs_afh_public';
  if column_names is distinct from 'source_id,facility_name,city,county,license_type,status,licensed_beds,official_profile_url' then
    raise exception 'oregon table no longer has only the eight approved columns';
  end if;
  if (select count(*) from public.oregon_odhs_afh_public) <> 1584
     or (select count(distinct source_id) from public.oregon_odhs_afh_public) <> 1584
     or (select coalesce(sum(licensed_beds), 0) from public.oregon_odhs_afh_public) <> 7346
     or (select min(licensed_beds) from public.oregon_odhs_afh_public) <> 1
     or (select max(licensed_beds) from public.oregon_odhs_afh_public) <> 5 then
    raise exception 'oregon table is not the accepted 1584-row public set';
  end if;
  if exists (
    select 1 from public.oregon_odhs_afh_public as row
    where row.license_type is distinct from 'Oregon adult foster home'
       or row.status is distinct from 'Open'
       or row.licensed_beds not between 1 and 5
       or row.source_id !~ '^[A-Za-z0-9]{1,32}$'
       or row.official_profile_url is distinct from 'https://ltclicensing.oregon.gov/Providers/Details/' || row.source_id
  ) then
    raise exception 'oregon table contains a row outside the approved rules';
  end if;
  if has_table_privilege('anon', 'public.oregon_odhs_afh_public', 'SELECT')
     or has_table_privilege('authenticated', 'public.oregon_odhs_afh_public', 'SELECT')
     or has_table_privilege('service_role', 'public.oregon_odhs_afh_public', 'SELECT')
     or exists (
       select 1
       from pg_class as relation
       join pg_namespace as namespace on namespace.oid = relation.relnamespace
       cross join lateral aclexplode(relation.relacl) as entry
       where namespace.nspname = 'public'
         and relation.relname = 'oregon_odhs_afh_public'
         and entry.grantee = 0
         and entry.privilege_type = 'SELECT'
     ) then
    raise exception 'oregon base table is already exposed';
  end if;
end
$guard$;

create view public.or_odhs_listed_afh
with (security_barrier = true, security_invoker = false) as
select row.source_id,
       row.facility_name,
       row.city,
       row.county,
       row.license_type,
       row.status,
       row.licensed_beds,
       row.official_profile_url
from public.oregon_odhs_afh_public as row
where row.license_type = 'Oregon adult foster home'
  and row.status = 'Open'
  and row.licensed_beds between 1 and 5
  and row.source_id ~ '^[A-Za-z0-9]{1,32}$'
  and row.official_profile_url = 'https://ltclicensing.oregon.gov/Providers/Details/' || row.source_id;

revoke all on table public.or_odhs_listed_afh from public, anon, authenticated, service_role;
grant select on table public.or_odhs_listed_afh to anon, authenticated;

do $check$
declare
  column_names text;
  view_options text;
  view_definition text;
  listed_count bigint;
  map_count bigint;
  oregon_count bigint;
  oregon_beds bigint;
begin
  select string_agg(column_name, ',' order by ordinal_position)
    into column_names
  from information_schema.columns
  where table_schema = 'public' and table_name = 'or_odhs_listed_afh';
  if column_names is distinct from 'source_id,facility_name,city,county,license_type,status,licensed_beds,official_profile_url' then
    raise exception 'oregon public view does not expose exactly the eight approved columns';
  end if;

  select coalesce(array_to_string(relation.reloptions, ','), ''), pg_get_viewdef(relation.oid, true)
    into view_options, view_definition
  from pg_class as relation
  join pg_namespace as namespace on namespace.oid = relation.relnamespace
  where namespace.nspname = 'public' and relation.relname = 'or_odhs_listed_afh' and relation.relkind = 'v';
  if position('security_barrier=true' in view_options) = 0
     or position('security_invoker=false' in view_options) = 0
     or position('security_invoker=true' in view_options) > 0
     or position('oregon_odhs_afh_public' in view_definition) = 0
     or position('facilities' in view_definition) > 0
     or position('*' in view_definition) > 0 then
    raise exception 'oregon public view is not a fixed eight-column owner-rights view';
  end if;

  if has_table_privilege('anon', 'public.oregon_odhs_afh_public', 'SELECT')
     or has_table_privilege('authenticated', 'public.oregon_odhs_afh_public', 'SELECT')
     or has_table_privilege('service_role', 'public.oregon_odhs_afh_public', 'SELECT')
     or has_table_privilege('anon', 'public.or_odhs_listed_afh', 'INSERT')
     or has_table_privilege('anon', 'public.or_odhs_listed_afh', 'UPDATE')
     or has_table_privilege('anon', 'public.or_odhs_listed_afh', 'DELETE')
     or has_table_privilege('authenticated', 'public.or_odhs_listed_afh', 'INSERT')
     or has_table_privilege('service_role', 'public.or_odhs_listed_afh', 'SELECT')
     or not has_table_privilege('anon', 'public.or_odhs_listed_afh', 'SELECT')
     or not has_table_privilege('authenticated', 'public.or_odhs_listed_afh', 'SELECT')
     or exists (
       select 1
       from pg_class as relation
       join pg_namespace as namespace on namespace.oid = relation.relnamespace
       cross join lateral aclexplode(relation.relacl) as entry
       where namespace.nspname = 'public'
         and relation.relname in ('oregon_odhs_afh_public', 'or_odhs_listed_afh')
         and entry.grantee = 0
         and entry.privilege_type = 'SELECT'
     ) then
    raise exception 'oregon public grants are not limited to select on the view';
  end if;

  if (select count(*) from public.facilities) <> 6284 then
    raise exception 'washington facilities changed while adding the oregon view';
  end if;

  set local role anon;
  select count(*) into listed_count from public.wa_dshs_listed_facilities;
  select count(*) into map_count from public.wa_afh_map_facilities;
  select count(*) into oregon_count from public.or_odhs_listed_afh;
  select coalesce(sum(licensed_beds), 0) into oregon_beds from public.or_odhs_listed_afh;
  begin
    perform 1 from public.oregon_odhs_afh_public;
    raise exception 'anon can read the oregon base table';
  exception
    when insufficient_privilege then
      null;
  end;
  reset role;

  if listed_count <> 6278 or map_count <> 6278 or oregon_count <> 1584 or oregon_beds <> 7346 then
    raise exception 'oregon public view changed the development directory counts';
  end if;
end
$check$;

commit;
