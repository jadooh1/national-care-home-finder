-- Rollback for the review-only premium gate.
-- This removes the new objects and leaves the ungated view closed.
-- It does not grant select on wa_afh_published_owner_content.
-- Run it only with the reviewed authorization, and only when the new
-- subscription tables are still empty.
--   nchf.premium_gate_authorization = authorize-premium-owner-text-gate
--   nchf.premium_gate_target = yiehgstweswxjakbcdzc

begin;

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

do $closed$
begin
  if has_table_privilege('anon', 'public.wa_afh_published_owner_content', 'SELECT')
     or has_table_privilege('authenticated', 'public.wa_afh_published_owner_content', 'SELECT') then
    raise exception 'premium owner-text gate rollback reopened public owner text';
  end if;
  if to_regclass('public.wa_afh_premium_owner_content') is not null
     or to_regclass('public.premium_subscriptions') is not null
     or to_regclass('public.premium_subscription_events') is not null then
    raise exception 'premium owner-text gate rollback left an object behind';
  end if;
end;
$closed$;

commit;
