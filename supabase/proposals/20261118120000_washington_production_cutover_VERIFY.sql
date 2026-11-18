-- REVIEW ONLY / VERIFY ONLY. Do not apply from an agent task.
-- Human-gated production catalog confirmation for the Washington cutover.
-- This script performs no CREATE/ALTER/GRANT/INSERT/UPDATE/DELETE.
-- It only raises if the connected database fails the cutover posture checks.
--
-- Required session settings (same session, human-set):
--   nchf.cutover_verify_authorization = authorize-washington-cutover-verify
--   nchf.cutover_verify_target = yiehgstweswxjakbcdzc
-- Those settings do not prove which database is connected.

begin;

do $verify$
declare
  published_selectable boolean := false;
  premium_selectable boolean := false;
  claimed_exists boolean := false;
  development_ledger_exists boolean := false;
  entitlement_count bigint := 0;
begin
  if current_setting('nchf.cutover_verify_authorization', true) is distinct from 'authorize-washington-cutover-verify'
     or current_setting('nchf.cutover_verify_target', true) is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'washington cutover verify target is not the reviewed production project';
  end if;

  if to_regclass('public.wa_afh_published_owner_content') is null
     or to_regclass('public.wa_afh_premium_owner_content') is null
     or to_regclass('public.published_owner_listings') is null
     or to_regclass('public.premium_subscriptions') is null
     or to_regclass('public.app_admins') is null then
    raise exception 'washington cutover verify is missing a required relation';
  end if;

  claimed_exists := to_regclass('public.wa_afh_claimed_owner_content') is not null;
  if not claimed_exists then
    raise exception 'washington cutover verify requires wa_afh_claimed_owner_content';
  end if;

  development_ledger_exists := to_regprocedure(
    'public.development_record_premium_subscription(uuid, uuid, text, timestamptz, boolean, text)'
  ) is not null;
  if development_ledger_exists then
    raise exception 'washington cutover verify refuses the development premium ledger RPC';
  end if;

  select count(*) into entitlement_count from public.premium_subscriptions;
  -- Informational only: empty entitlements are the approved MVP default.
  raise notice 'washington cutover verify entitlement row count: %', entitlement_count;

  -- Privilege probes for the current role. Humans should run under a browser-like role
  -- or inspect grants in the dashboard; this block documents the intended posture.
  begin
    perform 1 from public.wa_afh_published_owner_content limit 1;
    published_selectable := true;
  exception
    when insufficient_privilege then
      published_selectable := false;
    when others then
      published_selectable := false;
  end;

  begin
    perform 1 from public.wa_afh_premium_owner_content limit 1;
    premium_selectable := true;
  exception
    when insufficient_privilege then
      premium_selectable := false;
    when others then
      premium_selectable := false;
  end;

  if published_selectable then
    raise exception 'washington cutover verify refuses a selectable ungated published owner view';
  end if;

  if not premium_selectable then
    raise exception 'washington cutover verify requires selectable wa_afh_premium_owner_content for the probing role';
  end if;

  raise notice 'washington cutover verify posture OK (published closed; premium selectable; claimed present; ledger absent)';
end;
$verify$;

commit;
