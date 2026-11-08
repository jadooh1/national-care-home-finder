-- Proposal rollback. Do not apply this file.
-- It restores only the browser write grants removed by
-- 20261108024500_browser_write_grant_remediation.sql.
-- Required session settings, which this file does not set:
--   nchf.browser_write_remediation_authorization = authorize-browser-write-remediation
--   nchf.browser_write_remediation_target = yiehgstweswxjakbcdzc

do $rollback$
declare
  facility_count integer;
  claim_count integer;
  edit_count integer;
  admin_count integer;
begin
  perform pg_catalog.set_config('search_path', '', true);

  if pg_catalog.current_setting('nchf.browser_write_remediation_authorization', true)
     is distinct from 'authorize-browser-write-remediation' then
    raise exception 'browser write remediation authorization is missing';
  end if;
  if pg_catalog.current_setting('nchf.browser_write_remediation_target', true)
     is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'browser write remediation target is not the reviewed production project';
  end if;
  if to_regclass('public.nchf_browser_write_remediation_audit') is null then
    raise exception 'browser write remediation audit is missing';
  end if;

  select audit.facility_count, audit.claim_count, audit.edit_count, audit.admin_count
    into facility_count, claim_count, edit_count, admin_count
  from public.nchf_browser_write_remediation_audit as audit
  where audit.remediation_name = '20261108024500';
  if facility_count is null then
    raise exception 'browser write remediation audit is missing';
  end if;

  lock table public.facilities, public.owner_claims, public.listing_edits, public.app_admins
    in share row exclusive mode;

  if (select count(*) from public.facilities) <> facility_count
     or (select count(*) from public.owner_claims) <> claim_count
     or (select count(*) from public.listing_edits) <> edit_count
     or (select count(*) from public.app_admins) <> admin_count
     or facility_count <> 8121
     or claim_count <> 0
     or edit_count <> 0
     or admin_count <> 1
     or (select count(*) filter (where record_status = 'verified') from public.facilities) <> 0
     or (select count(*) filter (where record_status = 'source_matched') from public.facilities) <> 0 then
    raise exception 'refusing rollback because production rows changed after remediation';
  end if;

  if pg_catalog.has_table_privilege('anon', 'public.facilities', 'INSERT')
     or pg_catalog.has_table_privilege('authenticated', 'public.facilities', 'INSERT')
     or pg_catalog.has_table_privilege('anon', 'public.owner_claims', 'INSERT')
     or pg_catalog.has_table_privilege('authenticated', 'public.owner_claims', 'INSERT')
     or pg_catalog.has_table_privilege('authenticated', 'public.listing_edits', 'INSERT') then
    raise exception 'refusing rollback because browser write grants are already present';
  end if;

  grant insert, update, delete on table public.facilities to anon, authenticated;
  grant insert on table public.owner_claims to anon, authenticated;
  grant insert on table public.listing_edits to authenticated;
  drop table public.nchf_browser_write_remediation_audit;

  if not pg_catalog.has_table_privilege('anon', 'public.facilities', 'INSERT')
     or not pg_catalog.has_table_privilege('anon', 'public.facilities', 'UPDATE')
     or not pg_catalog.has_table_privilege('anon', 'public.facilities', 'DELETE')
     or not pg_catalog.has_table_privilege('authenticated', 'public.facilities', 'INSERT')
     or not pg_catalog.has_table_privilege('authenticated', 'public.facilities', 'UPDATE')
     or not pg_catalog.has_table_privilege('authenticated', 'public.facilities', 'DELETE')
     or not pg_catalog.has_table_privilege('anon', 'public.owner_claims', 'INSERT')
     or not pg_catalog.has_table_privilege('authenticated', 'public.owner_claims', 'INSERT')
     or not pg_catalog.has_table_privilege('authenticated', 'public.listing_edits', 'INSERT')
     or pg_catalog.has_table_privilege('anon', 'public.listing_edits', 'INSERT')
     or not pg_catalog.has_table_privilege('anon', 'public.facilities', 'SELECT')
     or not pg_catalog.has_table_privilege('authenticated', 'public.facilities', 'SELECT')
     or to_regclass('public.nchf_browser_write_remediation_audit') is not null
     or (select count(*) from public.facilities) <> 8121 then
    raise exception 'rollback did not restore the reviewed browser write grants';
  end if;
end;
$rollback$;
