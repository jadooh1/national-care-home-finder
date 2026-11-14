-- Review-only production proposal. Do not run it in this change.
-- A human verifies the connected host is the production pooler and then sets
-- both settings in the same session:
--   nchf.premium_gate_authorization = authorize-premium-owner-text-gate
--   nchf.premium_gate_target = yiehgstweswxjakbcdzc
-- Those settings do not prove which database is connected.
-- This does not insert, update, or delete publication rows or audit events.
-- It does not grant a browser role any way to write a subscription.

do $proposal$
begin
  if current_setting('nchf.premium_gate_authorization', true) is distinct from 'authorize-premium-owner-text-gate'
     or current_setting('nchf.premium_gate_target', true) is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'premium owner-text gate target is not the reviewed production project';
  end if;
  if to_regclass('public.published_owner_listings') is null
     or to_regclass('public.wa_afh_published_owner_content') is null
     or to_regprocedure('public.nchf_phase5g_facility_is_listed(uuid)') is null then
    raise exception 'premium owner-text gate requires the existing publication view';
  end if;
  if to_regclass('public.wa_afh_premium_owner_content') is not null
     or to_regclass('public.premium_subscriptions') is not null
     or to_regclass('public.premium_subscription_events') is not null then
    raise exception 'premium owner-text gate objects already exist';
  end if;
end;
$proposal$;

create table public.premium_subscriptions (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  facility_id uuid not null,
  status text not null,
  current_period_end timestamptz not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint premium_subscriptions_one_facility unique (facility_id),
  constraint premium_subscriptions_status_check check (
    status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')
  )
);

create table public.premium_subscription_events (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  facility_id uuid not null,
  status text not null,
  current_period_end timestamptz not null,
  recorded_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint premium_subscription_events_status_check check (
    status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')
  )
);

alter table public.premium_subscriptions enable row level security;
alter table public.premium_subscription_events enable row level security;

create function public.nchf_premium_subscription_event_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  raise exception 'premium subscription audit rows cannot be changed';
end;
$fn$;

create trigger premium_subscription_events_no_write
  before update or delete
  on public.premium_subscription_events
  for each row
  execute function public.nchf_premium_subscription_event_guard();

create view public.wa_afh_premium_owner_content
with (security_barrier = true, security_invoker = false) as
select content.facility_id,
       content.field_name,
       content.published_value,
       content.published_at
from public.published_owner_listings as content
where public.nchf_phase5g_facility_is_listed(content.facility_id)
  and exists (
    select 1
    from public.premium_subscriptions as subscription
    where subscription.facility_id = content.facility_id
      and subscription.status in ('active', 'trialing')
      and subscription.current_period_end > pg_catalog.now()
  );

revoke all on table public.premium_subscriptions from public, anon, authenticated;
revoke all on table public.premium_subscription_events from public, anon, authenticated;
revoke all on function public.nchf_premium_subscription_event_guard() from public, anon, authenticated;
revoke all on table public.wa_afh_premium_owner_content from public;
revoke all on table public.wa_afh_published_owner_content from public, anon, authenticated;

grant select on table public.wa_afh_premium_owner_content to anon, authenticated;

do $permissions$
begin
  if has_table_privilege('anon', 'public.wa_afh_published_owner_content', 'SELECT')
     or has_table_privilege('authenticated', 'public.wa_afh_published_owner_content', 'SELECT')
     or has_table_privilege('anon', 'public.premium_subscriptions', 'SELECT')
     or has_table_privilege('authenticated', 'public.premium_subscriptions', 'INSERT')
     or has_table_privilege('authenticated', 'public.premium_subscriptions', 'UPDATE')
     or has_table_privilege('anon', 'public.premium_subscription_events', 'INSERT') then
    raise exception 'premium owner-text gate left a public permission in place';
  end if;
  if not has_table_privilege('anon', 'public.wa_afh_premium_owner_content', 'SELECT')
     or not has_table_privilege('authenticated', 'public.wa_afh_premium_owner_content', 'SELECT') then
    raise exception 'premium owner-text gate did not grant the gated view';
  end if;
end;
$permissions$;
