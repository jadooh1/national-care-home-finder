-- Development-only rollback for a future North Carolina roster pilot.
-- Do not run this against Supabase unless a later authorization names that
-- exact action. A session setting does not prove which database is connected.
-- This deletes unpublished North Carolina rows from public.nationwide_roster.
-- It does not delete another state, drop the table, or change privileges.

begin;

do $rollback$
begin
  if current_setting('nchf.north_carolina_roster_rollback_authorization', true)
     is distinct from 'authorize-development-north-carolina-roster-rollback' then
    raise exception 'north carolina roster rollback refused: later development-only authorization is required';
  end if;
  if to_regclass('public.nationwide_roster') is null then
    raise exception 'north carolina roster rollback refused: nationwide_roster is not present';
  end if;
  if exists (
    select 1
    from public.nationwide_roster
    where state_name = 'North Carolina'
      and publication is distinct from 'unpublished'
  ) then
    raise exception 'north carolina roster rollback refused: a North Carolina row is not unpublished';
  end if;
end
$rollback$;

delete from public.nationwide_roster
where state_name = 'North Carolina'
  and publication = 'unpublished';

commit;
