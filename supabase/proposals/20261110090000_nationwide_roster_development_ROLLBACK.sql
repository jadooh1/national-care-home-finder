-- Proposal only. Do not execute without a separate later authorization.
-- The operator must confirm the development connection outside this file.
-- A session setting is not proof of which database is connected.
-- This file refuses to run unless the same session has set:
--   nchf.nationwide_roster_rollback_authorization
--     = authorize-development-nationwide-roster-rollback
-- It drops only public.nationwide_roster. It does not drop or alter
-- Washington or Oregon relations.

begin;

do $rollback$
begin
  if current_setting('nchf.nationwide_roster_rollback_authorization', true)
     is distinct from 'authorize-development-nationwide-roster-rollback' then
    raise exception 'nationwide roster rollback refused: dropping the proposed roster requires a separate development-only authorization';
  end if;
end
$rollback$;

drop table if exists public.nationwide_roster;

commit;
