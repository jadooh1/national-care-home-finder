-- Development-only rollback for one unpublished Illinois source batch.
-- Do not run this against Supabase unless a later authorization names that
-- exact action. A session setting does not prove which database is connected.
-- This deletes nationwide_source_record rows whose ingestion_batch_id is
-- illinois-idph-assisted-living-20261028.
-- It does not delete nationwide_roster rows or change Washington, Oregon,
-- North Carolina, or Delaware data.

begin;

do $rollback$
begin
  if current_setting('nchf.illinois_source_rollback_authorization', true)
     is distinct from 'authorize-development-illinois-source-rollback' then
    raise exception 'illinois source rollback refused: later development-only authorization is required';
  end if;
  if to_regclass('public.nationwide_source_record') is null then
    raise exception 'illinois source rollback refused: nationwide_source_record is not present';
  end if;
  if to_regclass('public.nationwide_roster') is not null then
    if (select count(*) from public.nationwide_roster
        where ingestion_batch_id = 'north-carolina-dhhs-roster-pilot-20261110') is distinct from 1086 then
      raise exception 'illinois source rollback refused: North Carolina baseline changed';
    end if;
    if (select count(*) from public.nationwide_roster
        where ingestion_batch_id = 'delaware-dhcq-assisted-living-pilot-20261110') is distinct from 39 then
      raise exception 'illinois source rollback refused: Delaware baseline changed';
    end if;
    if (select count(*) from public.nationwide_roster where publication = 'public') is distinct from 0 then
      raise exception 'illinois source rollback refused: a roster row is public';
    end if;
  end if;
  if to_regclass('public.wa_dshs_listed_facilities') is not null
     and (select count(*) from public.wa_dshs_listed_facilities) is distinct from 6278 then
    raise exception 'illinois source rollback refused: Washington directory baseline changed';
  end if;
  if to_regclass('public.wa_afh_map_facilities') is not null
     and (select count(*) from public.wa_afh_map_facilities) is distinct from 6278 then
    raise exception 'illinois source rollback refused: Washington map baseline changed';
  end if;
  if to_regclass('public.or_odhs_listed_afh') is not null
     and (select count(*) from public.or_odhs_listed_afh) is distinct from 1584 then
    raise exception 'illinois source rollback refused: Oregon directory baseline changed';
  end if;
  if exists (
    select 1
    from public.nationwide_source_record
    where ingestion_batch_id = 'illinois-idph-assisted-living-20261028'
      and (
        state_name is distinct from 'Illinois'
        or publication is distinct from 'unpublished'
        or original_status is not null
        or normalized_status is not null
      )
  ) then
    raise exception 'illinois source rollback refused: the batch is not an unpublished Illinois batch';
  end if;
end
$rollback$;

delete from public.nationwide_source_record
where state_name = 'Illinois'
  and publication = 'unpublished'
  and ingestion_batch_id = 'illinois-idph-assisted-living-20261028';

commit;
