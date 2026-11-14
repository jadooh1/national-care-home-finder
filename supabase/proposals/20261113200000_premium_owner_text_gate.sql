-- Review-only production proposal. Do not run it in this change.
-- A human verifies the connected host is the production pooler and then sets
-- both settings in the same session:
--   nchf.premium_gate_authorization = authorize-premium-owner-text-gate
--   nchf.premium_gate_target = yiehgstweswxjakbcdzc
-- Those settings do not prove which database is connected.
-- The proposal also refuses the development function and claimed-owner view.
-- It does not insert, update, or delete publication rows or audit events.
-- It does not grant a browser role any way to write a subscription.

begin;

do $proposal$
begin
  if current_setting('nchf.premium_gate_authorization', true) is distinct from 'authorize-premium-owner-text-gate'
     or current_setting('nchf.premium_gate_target', true) is distinct from 'yiehgstweswxjakbcdzc' then
    raise exception 'premium owner-text gate target is not the reviewed production project';
  end if;
  if to_regprocedure('public.development_record_premium_subscription(uuid, uuid, text, timestamptz, boolean, text)') is not null
     or to_regclass('public.wa_afh_claimed_owner_content') is not null then
    raise exception 'premium owner-text gate refuses the development database';
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
  )
offset 0;

revoke all on table public.premium_subscriptions from public, anon, authenticated;
revoke all on table public.premium_subscription_events from public, anon, authenticated;
revoke all on function public.nchf_premium_subscription_event_guard() from public, anon, authenticated;
revoke all on table public.wa_afh_premium_owner_content from public, anon, authenticated;
revoke all on table public.wa_afh_published_owner_content from public, anon, authenticated;

do $service_role$
begin
  if exists (select 1 from pg_catalog.pg_roles where rolname = 'service_role') then
    revoke all on table public.premium_subscriptions from service_role;
    revoke all on table public.premium_subscription_events from service_role;
    revoke all on function public.nchf_premium_subscription_event_guard() from service_role;
    revoke all on table public.wa_afh_premium_owner_content from service_role;
    revoke all on table public.wa_afh_published_owner_content from service_role;
  end if;
end;
$service_role$;

grant select on table public.wa_afh_premium_owner_content to anon, authenticated;

do $permissions$
declare
  role_name text;
  privilege text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    if has_table_privilege(role_name, 'public.wa_afh_published_owner_content', 'SELECT') then
      raise exception 'premium owner-text gate left the ungated view readable';
    end if;
    foreach privilege in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'] loop
      if has_table_privilege(role_name, 'public.premium_subscriptions', privilege)
         or has_table_privilege(role_name, 'public.premium_subscription_events', privilege) then
        raise exception 'premium owner-text gate left a subscription privilege in place';
      end if;
    end loop;
    foreach privilege in array array['INSERT', 'UPDATE', 'DELETE'] loop
      if has_table_privilege(role_name, 'public.wa_afh_premium_owner_content', privilege) then
        raise exception 'premium owner-text gate left a write privilege on the gated view';
      end if;
    end loop;
    if not has_table_privilege(role_name, 'public.wa_afh_premium_owner_content', 'SELECT') then
      raise exception 'premium owner-text gate did not grant the gated view';
    end if;
  end loop;
end;
$permissions$;

commit;
