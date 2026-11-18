-- Option A premium ledger for development review. This file is not a migration.
-- It does not change official facility records, publication rows, claims, or policies.
-- Apply it only on a disposable database, and only after setting
-- nchf.billing_environment to development. It refuses the production project.

do $preflight$
begin
  if current_setting('nchf.billing_environment', true) is distinct from 'development' then
    raise exception 'premium ledger requires nchf.billing_environment=development';
  end if;
  if current_setting('nchf.supabase_project_ref', true) = 'yiehgstweswxjakbcdzc' then
    raise exception 'refusing the production project';
  end if;
  if to_regclass('public.published_owner_listings') is null then
    raise exception 'premium ledger requires published owner listings';
  end if;
end;
$preflight$;

do $role$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'billing_recorder') then
    create role billing_recorder nologin;
  end if;
end;
$role$;

create table public.premium_subscriptions (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  facility_id uuid not null,
  owner_user_id uuid not null,
  status text not null,
  price_cents integer not null,
  currency text not null,
  billing_interval text not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  provider text not null,
  provider_reference text not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint premium_subscriptions_one_facility unique (facility_id),
  constraint premium_subscriptions_price_check check (price_cents = 9900),
  constraint premium_subscriptions_currency_check check (currency = 'usd'),
  constraint premium_subscriptions_interval_check check (billing_interval = 'month'),
  constraint premium_subscriptions_provider_check check (provider = 'development-ledger'),
  constraint premium_subscriptions_status_check check (
    status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')
  ),
  constraint premium_subscriptions_reference_check check (
    provider_reference ~ '^dev_[a-z0-9_]{8,64}$'
  )
);

create table public.premium_subscription_events (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  facility_id uuid not null,
  owner_user_id uuid not null,
  status text not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null,
  provider_reference text not null,
  recorded_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint premium_subscription_events_reference_check check (
    provider_reference ~ '^dev_[a-z0-9_]{8,64}$'
  )
);

alter table public.premium_subscriptions enable row level security;
alter table public.premium_subscription_events enable row level security;

create function public.premium_period_is_open(p_status text, p_period_end timestamptz)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select p_status in ('active', 'trialing')
    and p_period_end > pg_catalog.now();
$$;

create function public.development_record_premium_subscription(
  p_facility_id uuid,
  p_owner_user_id uuid,
  p_status text,
  p_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_provider_reference text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_id uuid;
begin
  if current_setting('nchf.billing_environment', true) is distinct from 'development' then
    raise exception 'development billing ledger is closed';
  end if;
  if current_setting('nchf.supabase_project_ref', true) = 'yiehgstweswxjakbcdzc' then
    raise exception 'refusing the production project';
  end if;
  if p_facility_id is null or p_owner_user_id is null then
    raise exception 'facility and owner are required';
  end if;
  if p_status not in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid') then
    raise exception 'subscription status is not allowed';
  end if;
  if p_status in ('active', 'trialing') and p_period_end <= pg_catalog.now() then
    raise exception 'an open subscription needs a future period end';
  end if;
  if p_provider_reference is null or p_provider_reference !~ '^dev_[a-z0-9_]{8,64}$' then
    raise exception 'development reference required';
  end if;

  insert into public.premium_subscriptions (
    facility_id, owner_user_id, status, price_cents, currency, billing_interval,
    current_period_end, cancel_at_period_end, provider, provider_reference
  ) values (
    p_facility_id, p_owner_user_id, p_status, 9900, 'usd', 'month',
    p_period_end, p_cancel_at_period_end, 'development-ledger', p_provider_reference
  )
  on conflict (facility_id) do update
    set owner_user_id = excluded.owner_user_id,
        status = excluded.status,
        current_period_end = excluded.current_period_end,
        cancel_at_period_end = excluded.cancel_at_period_end,
        provider_reference = excluded.provider_reference,
        updated_at = pg_catalog.clock_timestamp()
  returning id into v_id;

  insert into public.premium_subscription_events (
    facility_id, owner_user_id, status, current_period_end,
    cancel_at_period_end, provider_reference
  ) values (
    p_facility_id, p_owner_user_id, p_status, p_period_end,
    p_cancel_at_period_end, p_provider_reference
  );
  return v_id;
end;
$fn$;

create view public.wa_afh_premium_owner_content
with (security_barrier = true, security_invoker = false) as
select content.facility_id,
       content.field_name,
       content.published_value,
       content.published_at
from public.published_owner_listings as content
where exists (
  select 1
  from public.premium_subscriptions as subscription
  where subscription.facility_id = content.facility_id
    and subscription.status in ('active', 'trialing')
    and subscription.current_period_end > pg_catalog.now()
);

revoke all on table public.premium_subscriptions from public, anon, authenticated, billing_recorder;
revoke all on table public.premium_subscription_events from public, anon, authenticated, billing_recorder;
revoke all on function public.premium_period_is_open(text, timestamptz) from public, anon, authenticated;
revoke all on function public.development_record_premium_subscription(uuid, uuid, text, timestamptz, boolean, text)
  from public, anon, authenticated;
revoke all on table public.wa_afh_premium_owner_content from public;

grant select on table public.wa_afh_premium_owner_content to anon, authenticated;
grant execute on function public.development_record_premium_subscription(uuid, uuid, text, timestamptz, boolean, text)
  to billing_recorder;
grant billing_recorder to current_user;

do $guard$
begin
  if has_table_privilege('anon', 'public.premium_subscriptions', 'INSERT')
     or has_table_privilege('authenticated', 'public.premium_subscriptions', 'INSERT')
     or has_table_privilege('authenticated', 'public.premium_subscriptions', 'UPDATE')
     or has_function_privilege(
       'authenticated',
       'public.development_record_premium_subscription(uuid, uuid, text, timestamptz, boolean, text)',
       'EXECUTE'
     )
     or pg_catalog.pg_has_role('authenticated', 'billing_recorder', 'member')
     or pg_catalog.pg_has_role('anon', 'billing_recorder', 'member') then
    raise exception 'premium ledger grants access to a browser role';
  end if;
end;
$guard$;
