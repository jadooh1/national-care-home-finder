-- Development-only rollback for the empty source-record table.
-- Do not run this unless a later authorization names that exact action.
-- It drops public.nationwide_source_record only when that table is empty.
-- It does not delete nationwide_roster rows or change Washington, Oregon,
-- North Carolina, or Delaware data.

begin;

do $rollback$
begin
  if current_setting('nchf.nationwide_source_record_rollback_authorization', true)
     is distinct from 'authorize-development-nationwide-source-record-rollback' then
    raise exception 'source record rollback refused: later development-only authorization is required';
  end if;
  if to_regclass('public.nationwide_source_record') is null then
    raise exception 'source record rollback refused: the table is not present';
  end if;
  if (select count(*) from public.nationwide_source_record) is distinct from 0 then
    raise exception 'source record rollback refused: the table has rows and requires the Illinois batch rollback first';
  end if;
  if to_regclass('public.nationwide_roster') is not null then
    if (select count(*) from public.nationwide_roster
        where ingestion_batch_id = 'north-carolina-dhhs-roster-pilot-20261110') is distinct from 1086 then
      raise exception 'source record rollback refused: North Carolina baseline changed';
    end if;
    if (select count(*) from public.nationwide_roster
        where ingestion_batch_id = 'delaware-dhcq-assisted-living-pilot-20261110') is distinct from 39 then
      raise exception 'source record rollback refused: Delaware baseline changed';
    end if;
    if (select count(*) from public.nationwide_roster where publication = 'public') is distinct from 0 then
      raise exception 'source record rollback refused: a roster row is public';
    end if;
  end if;
  if to_regclass('public.wa_dshs_listed_facilities') is not null
     and (select count(*) from public.wa_dshs_listed_facilities) is distinct from 6278 then
    raise exception 'source record rollback refused: Washington directory baseline changed';
  end if;
  if to_regclass('public.wa_afh_map_facilities') is not null
     and (select count(*) from public.wa_afh_map_facilities) is distinct from 6278 then
    raise exception 'source record rollback refused: Washington map baseline changed';
  end if;
  if to_regclass('public.or_odhs_listed_afh') is not null
     and (select count(*) from public.or_odhs_listed_afh) is distinct from 1584 then
    raise exception 'source record rollback refused: Oregon directory baseline changed';
  end if;
end
$rollback$;

drop table public.nationwide_source_record;

commit;
