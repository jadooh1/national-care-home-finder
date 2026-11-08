-- Proposal only. Do not apply this file until a human authorizes it on the
-- development project ajjsyloyihcqdomywhik. It does not grant access to
-- public.oregon_odhs_afh_public and it does not change Washington tables.
-- Rollback: drop function public.development_list_oregon_afh(text, text, text, integer, integer);

do $guard$
declare
  column_names text;
begin
  if to_regclass('public.oregon_odhs_afh_public') is null
     or to_regclass('public.app_admins') is null
     or to_regclass('public.facilities') is null then
    raise exception 'development oregon directory prerequisites are missing';
  end if;
  if (select count(*) from public.facilities) <> 6284
     or (select count(*) from public.facilities where facility_type = 'AFH' and state_code = 'WA') <> 6284
     or exists (
       select 1 from public.facilities
       where facility_type is distinct from 'AFH' or state_code is distinct from 'WA'
     ) then
    raise exception 'refusing to install the development oregon directory outside the development facility set';
  end if;
  select string_agg(column_name, ',' order by ordinal_position)
    into column_names
  from information_schema.columns
  where table_schema = 'public' and table_name = 'oregon_odhs_afh_public';
  if column_names is distinct from 'source_id,facility_name,city,county,license_type,status,licensed_beds,official_profile_url' then
    raise exception 'oregon table no longer has only the eight approved columns';
  end if;
  if (select count(*) from public.oregon_odhs_afh_public)
     <> (select count(distinct source_id) from public.oregon_odhs_afh_public) then
    raise exception 'oregon source ids are not unique';
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
     or has_table_privilege('service_role', 'public.oregon_odhs_afh_public', 'SELECT') then
    raise exception 'oregon table is already exposed to an application role';
  end if;
end
$guard$;

create or replace function public.development_list_oregon_afh(
  p_name text,
  p_city text,
  p_county text,
  p_limit integer,
  p_offset integer
)
returns table (
  source_id text,
  facility_name text,
  city text,
  county text,
  license_type text,
  status text,
  licensed_beds integer,
  official_profile_url text
)
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  v_name text;
  v_city text;
  v_county text;
  v_limit integer;
  v_offset integer;
begin
  if auth.uid() is null or not exists (
    select 1 from public.app_admins as admin_row
    where admin_row.user_id = auth.uid()
  ) then
    raise exception 'administrator required';
  end if;
  v_name := left(regexp_replace(coalesce(p_name, ''), '[^[:alnum:][:space:]-]', '', 'g'), 80);
  v_city := left(regexp_replace(coalesce(p_city, ''), '[^[:alnum:][:space:]-]', '', 'g'), 80);
  v_county := left(regexp_replace(coalesce(p_county, ''), '[^[:alnum:][:space:]-]', '', 'g'), 80);
  v_limit := least(greatest(coalesce(p_limit, 20), 1), 20);
  v_offset := least(greatest(coalesce(p_offset, 0), 0), 10000);
  return query
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
    and row.official_profile_url = 'https://ltclicensing.oregon.gov/Providers/Details/' || row.source_id
    and (v_name = '' or row.facility_name ilike '%' || v_name || '%')
    and (v_city = '' or row.city ilike '%' || v_city || '%')
    and (v_county = '' or row.county ilike '%' || v_county || '%')
  order by row.facility_name, row.source_id
  limit v_limit
  offset v_offset;
end;
$fn$;

revoke all on function public.development_list_oregon_afh(text, text, text, integer, integer) from public, anon, authenticated, service_role;
grant execute on function public.development_list_oregon_afh(text, text, text, integer, integer) to authenticated;
