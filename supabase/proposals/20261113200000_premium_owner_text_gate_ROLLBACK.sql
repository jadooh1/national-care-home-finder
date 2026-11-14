-- Rollback for the review-only premium gate.
-- Restoring select on wa_afh_published_owner_content makes owner text public
-- again. Run it only with the same reviewed authorization, and only when the
-- new subscription tables are still empty.
--   nchf.premium_gate_authorization = authorize-premium-owner-text-gate
--   nchf.premium_gate_target = yiehgstweswxjakbcdzc

do $rollback$
begin
  if current_setting('nchf.premium_gate_authorization', true) is distinct from 'authorize-premium-owner-text-gate'
     or current_setting('nchf.premium_gate_target', true) is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'premium owner-text gate rollback target is not the reviewed production project';
  end if;
  if to_regclass('public.wa_afh_premium_owner_content') is null then
    raise exception 'premium owner-text gate is absent';
  end if;
  if exists (select 1 from public.premium_subscriptions)
     or exists (select 1 from public.premium_subscription_events) then
    raise exception 'premium owner-text gate rollback refuses existing entitlement rows';
  end if;
end;
$rollback$;

revoke all on table public.wa_afh_premium_owner_content from public, anon, authenticated;
drop view public.wa_afh_premium_owner_content;
drop trigger premium_subscription_events_no_write on public.premium_subscription_events;
drop function public.nchf_premium_subscription_event_guard();
drop table public.premium_subscription_events;
drop table public.premium_subscriptions;

grant select on table public.wa_afh_published_owner_content to anon, authenticated;

do $restored$
begin
  if not has_table_privilege('anon', 'public.wa_afh_published_owner_content', 'SELECT')
     or not has_table_privilege('authenticated', 'public.wa_afh_published_owner_content', 'SELECT') then
    raise exception 'premium owner-text gate rollback did not restore the previous view grant';
  end if;
  if to_regclass('public.wa_afh_premium_owner_content') is not null
     or to_regclass('public.premium_subscriptions') is not null then
    raise exception 'premium owner-text gate rollback left an object behind';
  end if;
end;
$restored$;
