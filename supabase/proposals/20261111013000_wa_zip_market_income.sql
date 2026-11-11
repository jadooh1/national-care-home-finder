-- Proposal only. Do not apply this file until a human authorizes it on the
-- development project ajjsyloyihcqdomywhik. It creates an aggregate census
-- staging table and a public market view. It does not modify facility rows,
-- grants no write access, and does not load the census file by itself.
--
-- Apply the staging file and supabase/proposals/tests/wa_zip_market_income_checks.sql
-- in the same transaction. The checks grant public read access to the view
-- only after the facility and ZCTA counts reconcile. The staging table stays
-- closed to public clients and service_role.
--
-- Rollback: supabase/proposals/20261111013000_wa_zip_market_income_rollback.sql

do $roles$
begin
  if to_regclass('public.wa_dshs_listed_facilities') is null then
    raise exception 'wa_zip_market_income requires public.wa_dshs_listed_facilities';
  end if;
  if to_regclass('public.wa_zip_market_income') is not null
     or to_regclass('public.wa_zip_market_census_staging') is not null then
    raise exception 'wa_zip_market_income objects already exist';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon')
     or not exists (select 1 from pg_roles where rolname = 'authenticated')
     or not exists (select 1 from pg_roles where rolname = 'service_role') then
    raise exception 'wa_zip_market_income requires anon, authenticated, and service_role';
  end if;
end
$roles$;

create table public.wa_zip_market_census_staging (
  zip_code text primary key,
  population_total integer,
  age_60_69 integer,
  age_70_79 integer,
  age_80_84 integer,
  age_85_plus integer,
  median_household_income integer,
  median_income_margin_error integer,
  total_households integer,
  households_100k_plus integer,
  constraint wa_zip_market_census_zip_five_digits check (zip_code ~ '^[0-9]{5}$'),
  constraint wa_zip_market_census_counts_nonnegative check (
    (population_total is null or population_total >= 0)
    and (age_60_69 is null or age_60_69 >= 0)
    and (age_70_79 is null or age_70_79 >= 0)
    and (age_80_84 is null or age_80_84 >= 0)
    and (age_85_plus is null or age_85_plus >= 0)
    and (total_households is null or total_households >= 0)
    and (households_100k_plus is null or households_100k_plus >= 0)
  ),
  constraint wa_zip_market_census_high_income_within_total check (
    households_100k_plus is null
    or total_households is null
    or households_100k_plus <= total_households
  ),
  constraint wa_zip_market_census_median_code check (
    median_household_income is null
    or (
      median_household_income >= 0
      and median_household_income <> 2499
      and median_household_income not in (-666666666, -222222222, -333333333)
    )
  ),
  constraint wa_zip_market_census_margin_code check (
    median_income_margin_error is null
    or (
      median_income_margin_error >= 0
      and median_income_margin_error not in (2499, 250001, -666666666, -222222222, -333333333)
    )
  )
);

comment on table public.wa_zip_market_census_staging is
  'Development-only 2020-2024 ACS ZCTA aggregates for Washington. No facility or resident identifiers.';

create view public.wa_zip_market_income
with (security_barrier = true, security_invoker = false) as
with normalized as (
  select
    case
      when btrim(postal_code) ~ '^[0-9]{5}$' then btrim(postal_code)
      when btrim(postal_code) ~ '^[0-9]{9}$' then left(btrim(postal_code), 5)
      when btrim(postal_code) ~ '^[0-9]{5}-[0-9]{4}$' then left(btrim(postal_code), 5)
      else null
    end as zip_code,
    licensed_capacity
  from public.wa_dshs_listed_facilities
),
facility_zip as (
  select
    zip_code,
    count(*)::integer as total_afhs,
    count(licensed_capacity)::integer as homes_with_capacity,
    coalesce(sum(licensed_capacity), 0)::integer as known_licensed_beds
  from normalized
  where zip_code is not null
  group by zip_code
),
census as (
  select
    zip_code,
    population_total,
    age_60_69,
    age_70_79,
    age_80_84,
    age_85_plus,
    case
      when age_70_79 is null or age_80_84 is null or age_85_plus is null then null
      else age_70_79 + age_80_84 + age_85_plus
    end::integer as age_70_plus,
    U&'2020\20132024' as census_period,
    median_household_income,
    median_income_margin_error,
    total_households,
    households_100k_plus,
    case
      when total_households is null or total_households = 0 or households_100k_plus is null then null
      else round((100.0 * households_100k_plus) / total_households, 4)
    end as households_100k_plus_pct,
    U&'2020\20132024' as income_census_period
  from public.wa_zip_market_census_staging
)
select
  coalesce(census.zip_code, facility_zip.zip_code) as zip_code,
  coalesce(facility_zip.total_afhs, 0)::integer as total_afhs,
  coalesce(facility_zip.homes_with_capacity, 0)::integer as homes_with_capacity,
  coalesce(facility_zip.known_licensed_beds, 0)::integer as known_licensed_beds,
  census.population_total,
  census.age_60_69,
  census.age_70_79,
  census.age_80_84,
  census.age_85_plus,
  census.age_70_plus,
  census.census_period,
  census.median_household_income,
  census.median_income_margin_error,
  census.total_households,
  census.households_100k_plus,
  census.households_100k_plus_pct,
  census.income_census_period
from census
full outer join facility_zip on facility_zip.zip_code = census.zip_code;

comment on view public.wa_zip_market_income is
  'Aggregate Washington ZIP market view. Census fields come from the closed staging table; facility counts come from the published directory view without exposing facility identifiers.';

revoke all on table public.wa_zip_market_census_staging from public, anon, authenticated, service_role;
revoke all on table public.wa_zip_market_income from public, anon, authenticated, service_role;
