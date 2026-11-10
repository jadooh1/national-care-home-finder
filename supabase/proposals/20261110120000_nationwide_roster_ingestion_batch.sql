-- Proposal only. Do not apply this to Supabase without a later authorization.
-- The nationwide_roster table already exists in development. This file adds
-- ingestion_batch_id. It does not create or replace the table, load rows, or
-- add privileges. A session setting is not proof of which database is connected.

begin;

do $guard$
begin
  if current_setting('nchf.nationwide_roster_batch_authorization', true)
     is distinct from 'authorize-development-nationwide-roster-batch' then
    raise exception 'nationwide roster batch proposal refused: later development-only authorization is required';
  end if;
  if to_regclass('public.nationwide_roster') is null then
    raise exception 'nationwide roster batch proposal refused: nationwide_roster is not present';
  end if;
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'nationwide_roster'
      and column_name = 'ingestion_batch_id'
  ) then
    raise exception 'nationwide roster batch proposal refused: ingestion_batch_id already exists';
  end if;
end
$guard$;

alter table public.nationwide_roster
  add column ingestion_batch_id text;

alter table public.nationwide_roster
  add constraint nationwide_roster_ingestion_batch
  check (ingestion_batch_id is null or length(btrim(ingestion_batch_id)) > 0);

create index nationwide_roster_ingestion_batch
  on public.nationwide_roster (ingestion_batch_id)
  where ingestion_batch_id is not null;

comment on column public.nationwide_roster.ingestion_batch_id is
  'Authorized ingestion batch. Null when the row is not part of a batch.';

commit;
