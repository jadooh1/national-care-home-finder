-- Proposal only. Drops ingestion_batch_id when no row carries a batch id.
-- It does not drop nationwide_roster or delete facility rows.

begin;

do $guard$
begin
  if current_setting('nchf.nationwide_roster_batch_rollback_authorization', true)
     is distinct from 'authorize-development-nationwide-roster-batch-rollback' then
    raise exception 'nationwide roster batch rollback refused: later development-only authorization is required';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'nationwide_roster'
      and column_name = 'ingestion_batch_id'
  ) and exists (
    select 1 from public.nationwide_roster where ingestion_batch_id is not null
  ) then
    raise exception 'nationwide roster batch rollback refused: a batch identifier is present';
  end if;
end
$guard$;

alter table public.nationwide_roster drop column if exists ingestion_batch_id;

commit;
