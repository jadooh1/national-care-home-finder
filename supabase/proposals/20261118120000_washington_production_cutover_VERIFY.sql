-- REVIEW ONLY / VERIFY ONLY. Do not apply from an agent task.
-- Human-gated production catalog confirmation for the Washington cutover.
-- This script performs no CREATE/ALTER/GRANT/REVOKE/INSERT/UPDATE/DELETE/DROP.
-- It only raises if the connected database fails the cutover posture checks.
-- The transaction is READ ONLY so accidental writes cannot commit.
--
-- Required session settings (same session, human-set):
--   nchf.cutover_verify_authorization = authorize-washington-cutover-verify
--   nchf.cutover_verify_target = yiehgstweswxjakbcdzc
-- Those settings do not prove which database is connected.
--
-- Privilege checks use has_table_privilege for roles anon and authenticated.
-- They do not depend on the current session role's ability to SELECT.
--
-- Development behavior (expected FAIL, not a production pass path):
--   public.development_record_premium_subscription(...) exists on development,
--   so this verify raises and refuses that host. Production must keep it absent.

begin;
set transaction read only;

do $verify$
declare
  role_name text;
  privilege text;
  entitlement_count bigint := 0;
begin
  if current_setting('nchf.cutover_verify_authorization', true) is distinct from 'authorize-washington-cutover-verify'
     or current_setting('nchf.cutover_verify_target', true) is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'washington cutover verify target is not the reviewed production project';
  end if;

  if to_regclass('public.wa_afh_published_owner_content') is null
     or to_regclass('public.wa_afh_premium_owner_content') is null
     or to_regclass('public.wa_afh_claimed_owner_content') is null
     or to_regclass('public.published_owner_listings') is null
     or to_regclass('public.premium_subscriptions') is null
     or to_regclass('public.premium_subscription_events') is null
     or to_regclass('public.app_admins') is null then
    raise exception 'washington cutover verify is missing a required relation';
  end if;

  -- Production must not carry the development Option A ledger RPC.
  -- On development this procedure exists, so verify fails there by design.
  if to_regprocedure(
    'public.development_record_premium_subscription(uuid, uuid, text, timestamptz, boolean, text)'
  ) is not null then
    raise exception 'washington cutover verify refuses the development premium ledger RPC';
  end if;

  -- Informational only for a privileged verifier session. Empty entitlements are the approved MVP default.
  -- READ ONLY transaction: this SELECT cannot mutate rows.
  select count(*) into entitlement_count from public.premium_subscriptions;
  raise notice 'washington cutover verify entitlement row count: %', entitlement_count;

  foreach role_name in array array['anon', 'authenticated'] loop
    if has_table_privilege(role_name, 'public.wa_afh_published_owner_content', 'SELECT') then
      raise exception 'washington cutover verify refuses SELECT on ungated published owner content for %', role_name;
    end if;

    foreach privilege in array array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
      if has_table_privilege(role_name, 'public.wa_afh_published_owner_content', privilege) then
        raise exception 'washington cutover verify refuses write privilege % on ungated published owner content for %', privilege, role_name;
      end if;
    end loop;

    if not has_table_privilege(role_name, 'public.wa_afh_premium_owner_content', 'SELECT') then
      raise exception 'washington cutover verify requires SELECT on premium owner content for %', role_name;
    end if;

    foreach privilege in array array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
      if has_table_privilege(role_name, 'public.wa_afh_premium_owner_content', privilege) then
        raise exception 'washington cutover verify refuses write privilege % on premium owner content for %', privilege, role_name;
      end if;
    end loop;

    foreach privilege in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
      if has_table_privilege(role_name, 'public.premium_subscriptions', privilege)
         or has_table_privilege(role_name, 'public.premium_subscription_events', privilege) then
        raise exception 'washington cutover verify refuses subscription privilege % for %', privilege, role_name;
      end if;
    end loop;
  end loop;

  if has_table_privilege('anon', 'public.wa_afh_claimed_owner_content', 'SELECT') then
    raise exception 'washington cutover verify refuses SELECT on claimed owner content for anon';
  end if;

  if not has_table_privilege('authenticated', 'public.wa_afh_claimed_owner_content', 'SELECT') then
    raise exception 'washington cutover verify requires SELECT on claimed owner content for authenticated';
  end if;

  foreach privilege in array array['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
    if has_table_privilege('anon', 'public.wa_afh_claimed_owner_content', privilege)
       or has_table_privilege('authenticated', 'public.wa_afh_claimed_owner_content', privilege) then
      raise exception 'washington cutover verify refuses write privilege % on claimed owner content', privilege;
    end if;
  end loop;

  raise notice 'washington cutover verify posture OK (published closed; premium SELECT for anon+authenticated; claimed SELECT for authenticated only; ledger RPC absent)';
end;
$verify$;

commit;
