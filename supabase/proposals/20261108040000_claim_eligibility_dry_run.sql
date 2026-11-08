-- Read-only classifier. It does not modify record_status and does not mark
-- any facility verified. Run it only inside a read-only transaction.

begin read only;

with facility_license as (
  select id,
         pg_catalog.btrim(license_number) as license_key,
         state_code,
         facility_type,
         record_status,
         presence
  from public.facilities
),
license_counts as (
  select license_key, count(*) as facility_count
  from facility_license
  where license_key <> ''
  group by license_key
),
classified as (
  select
    facility.id,
    facility.state_code,
    facility.record_status,
    facility.facility_type,
    facility.presence,
    facility.id in (select listed.id from public.wa_dshs_listed_facilities as listed) as in_directory,
    coalesce(license_counts.facility_count, 0) as facility_count,
    facility.license_key ~ '^[0-9]{1,20}$' as numeric_license
  from facility_license as facility
  left join license_counts
    on license_counts.license_key = facility.license_key
)
select
  count(*) filter (
    where record_status = 'source_matched'
      and facility_type = 'AFH'
      and presence is distinct from 'absent'
  ) as claim_eligible_now,
  count(*) filter (
    where in_directory
      and numeric_license
      and facility_count = 1
      and facility_type = 'AF'
      and state_code = 'WA'
      and presence is distinct from 'absent'
  ) as directory_unique,
  count(*) filter (where not in_directory) as unmatched,
  count(*) filter (
    where in_directory
      and (facility_count > 1 or not numeric_license or facility_type <> 'AF' or state_code <> 'WA')
  ) as ambiguous,
  count(*) filter (where record_status = 'verified') as verified
from classified;

rollback;
