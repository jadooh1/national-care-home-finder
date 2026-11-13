-- Development-only rollback for one Delaware roster batch.
-- Do not run this against Supabase unless a later authorization names that
-- exact action. A session setting does not prove which database is connected.
-- This deletes unpublished rows whose ingestion_batch_id is
-- delaware-dhcq-assisted-living-pilot-20261110.
-- It does not delete another batch, another state, or the table.

begin;

do $rollback$
begin
  if current_setting('nchf.delaware_roster_rollback_authorization', true)
     is distinct from 'authorize-development-delaware-roster-rollback' then
    raise exception 'delaware roster rollback refused: later development-only authorization is required';
  end if;
  if to_regclass('public.nationwide_roster') is null then
    raise exception 'delaware roster rollback refused: nationwide_roster is not present';
  end if;
  if exists (
    select 1
    from public.nationwide_roster
    where ingestion_batch_id = 'delaware-dhcq-assisted-living-pilot-20261110'
      and (
        state_name is distinct from 'Delaware'
        or publication is distinct from 'unpublished'
      )
  ) then
    raise exception 'delaware roster rollback refused: the pilot batch is not an unpublished Delaware batch';
  end if;
end
$rollback$;

delete from public.nationwide_roster
where state_name = 'Delaware'
  and publication = 'unpublished'
  and ingestion_batch_id = 'delaware-dhcq-assisted-living-pilot-20261110';

commit;
