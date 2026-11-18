-- Removes only the Option A development premium ledger.
-- It does not change official facility records, publication rows, or claims.

drop view if exists public.wa_afh_premium_owner_content;
drop function if exists public.development_record_premium_subscription(uuid, uuid, text, timestamptz, boolean, text);
drop function if exists public.premium_period_is_open(text, timestamptz);
drop table if exists public.premium_subscription_events;
drop table if exists public.premium_subscriptions;

do $role$
begin
  if exists (select 1 from pg_catalog.pg_roles where rolname = 'billing_recorder') then
    drop owned by billing_recorder;
    drop role billing_recorder;
  end if;
end;
$role$;
