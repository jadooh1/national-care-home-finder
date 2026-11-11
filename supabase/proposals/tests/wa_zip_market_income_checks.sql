-- Reconciliation and public-view grants for the Washington ZIP market proposal.
-- Set both expected counts in the same transaction before running this file.
-- Development values are 6278 published facilities and 606 Washington ZCTAs.
-- This file grants SELECT on the view only. It does not grant the staging table.

do $reconcile$
declare
  expected_facilities integer := nullif(current_setting('nchf.wa_market_expected_facilities', true), '')::integer;
  expected_zctas integer := nullif(current_setting('nchf.wa_market_expected_zctas', true), '')::integer;
  facility_count integer;
  unnormalized integer;
  staged integer;
  view_rows integer;
  summed integer;
  missing_stage integer;
  missing_facility integer;
  column_names text;
  view_options text;
begin
  if expected_facilities is null or expected_zctas is null then
    raise exception 'set the expected facility and ZCTA counts before reconciliation';
  end if;

  select count(*) into facility_count from public.wa_dshs_listed_facilities;
  select count(*) into unnormalized
  from public.wa_dshs_listed_facilities
  where btrim(coalesce(postal_code, '')) !~ '^[0-9]{5}$'
    and btrim(coalesce(postal_code, '')) !~ '^[0-9]{9}$'
    and btrim(coalesce(postal_code, '')) !~ '^[0-9]{5}-[0-9]{4}$';
  select count(*) into staged from public.wa_zip_market_census_staging;
  select count(*) into view_rows from public.wa_zip_market_income;
  select coalesce(sum(total_afhs), 0) into summed from public.wa_zip_market_income;

  select count(*) into missing_stage
  from public.wa_zip_market_census_staging as stage
  where not exists (
    select 1 from public.wa_zip_market_income as market
    where market.zip_code = stage.zip_code
  );

  select count(*) into missing_facility
  from (
    select
      case
        when btrim(postal_code) ~ '^[0-9]{5}$' then btrim(postal_code)
        when btrim(postal_code) ~ '^[0-9]{9}$' then left(btrim(postal_code), 5)
        when btrim(postal_code) ~ '^[0-9]{5}-[0-9]{4}$' then left(btrim(postal_code), 5)
        else null
      end as zip_code
    from public.wa_dshs_listed_facilities
  ) as normalized
  where normalized.zip_code is not null
    and not exists (
      select 1 from public.wa_zip_market_income as market
      where market.zip_code = normalized.zip_code
    );

  if facility_count <> expected_facilities
     or unnormalized <> 0
     or staged <> expected_zctas
     or summed <> facility_count
     or view_rows < staged
     or missing_stage <> 0
     or missing_facility <> 0 then
    raise exception 'wa_zip_market_income reconciliation failed';
  end if;

  select string_agg(attribute.attname, ',' order by attribute.attnum)
    into column_names
  from pg_attribute as attribute
  where attribute.attrelid = 'public.wa_zip_market_income'::regclass
    and attribute.attnum > 0
    and not attribute.attisdropped;
  if column_names is distinct from
     'zip_code,total_afhs,homes_with_capacity,known_licensed_beds,population_total,age_60_69,age_70_79,age_80_84,age_85_plus,age_70_plus,census_period,median_household_income,median_income_margin_error,total_households,households_100k_plus,households_100k_plus_pct,income_census_period' then
    raise exception 'wa_zip_market_income columns do not match the application';
  end if;
  if exists (
    select 1
    from pg_attribute as attribute
    where attribute.attrelid = 'public.wa_zip_market_income'::regclass
      and attribute.attnum > 0
      and not attribute.attisdropped
      and attribute.attname in (
        'license_number', 'canonical_name', 'address_line1', 'phone', 'email'
      )
  ) then
    raise exception 'wa_zip_market_income exposes an identifying column';
  end if;

  select coalesce(array_to_string(relation.reloptions, ','), '')
    into view_options
  from pg_class as relation
  where relation.oid = 'public.wa_zip_market_income'::regclass;
  if position('security_barrier=true' in view_options) = 0
     or position('security_invoker=false' in view_options) = 0
     or position('security_invoker=true' in view_options) > 0 then
    raise exception 'wa_zip_market_income must use a security barrier without security invoker';
  end if;
  if pg_get_viewdef('public.wa_zip_market_income'::regclass, true) ~ '\mfacilities\M' then
    raise exception 'wa_zip_market_income reads facility records directly';
  end if;
  if has_table_privilege('anon', 'public.wa_zip_market_census_staging', 'SELECT')
     or has_table_privilege('anon', 'public.wa_zip_market_census_staging', 'INSERT')
     or has_table_privilege('anon', 'public.wa_zip_market_census_staging', 'UPDATE')
     or has_table_privilege('anon', 'public.wa_zip_market_census_staging', 'DELETE')
     or has_table_privilege('authenticated', 'public.wa_zip_market_census_staging', 'SELECT')
     or has_table_privilege('service_role', 'public.wa_zip_market_census_staging', 'SELECT')
     or has_table_privilege('service_role', 'public.wa_zip_market_census_staging', 'INSERT') then
    raise exception 'wa_zip_market_census_staging is readable by a public or service role';
  end if;
end
$reconcile$;

grant select on table public.wa_zip_market_income to anon, authenticated;

do $view_grants$
begin
  if not has_table_privilege('anon', 'public.wa_zip_market_income', 'SELECT')
     or not has_table_privilege('authenticated', 'public.wa_zip_market_income', 'SELECT')
     or has_table_privilege('anon', 'public.wa_zip_market_income', 'INSERT')
     or has_table_privilege('authenticated', 'public.wa_zip_market_income', 'INSERT')
     or has_table_privilege('service_role', 'public.wa_zip_market_income', 'SELECT')
     or has_table_privilege('anon', 'public.wa_zip_market_census_staging', 'SELECT')
     or has_table_privilege('service_role', 'public.wa_zip_market_census_staging', 'SELECT') then
    raise exception 'wa_zip_market_income grants are not limited to public read of the view';
  end if;
end
$view_grants$;

select 'WA_ZIP_MARKET_INCOME_READY' as result;
