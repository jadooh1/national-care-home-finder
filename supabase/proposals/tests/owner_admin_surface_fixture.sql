create extension if not exists pgcrypto;

do $roles$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end;
$roles$;

create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key,
  email_confirmed_at timestamptz
);
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  facility_type text not null,
  state_code text not null,
  license_number text,
  record_status text not null default 'unverified',
  source_name text,
  license_category text,
  normalized_license_number text,
  presence text,
  constraint facilities_record_status_check check (
    record_status in ('unverified', 'source_matched', 'verified', 'needs_review', 'inactive')
  ),
  constraint facilities_presence_check check (presence is null or presence in ('active', 'absent'))
);
create table public.owner_claims (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id),
  claimant_user_id uuid not null,
  verification_status text not null default 'pending',
  evidence_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default clock_timestamp()
);
create table public.listing_edits (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id),
  submitted_by_user_id uuid,
  field_name text not null,
  proposed_value jsonb,
  review_status text not null default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default clock_timestamp()
);
create table public.app_admins (
  user_id uuid primary key,
  created_at timestamptz not null default clock_timestamp()
);
alter table public.facilities enable row level security;
alter table public.owner_claims enable row level security;
alter table public.listing_edits enable row level security;
alter table public.app_admins enable row level security;

insert into public.facilities (canonical_name, facility_type, state_code, license_number)
select 'Home ' || series.n, 'AF', 'WA', series.n::text
from generate_series(1, 8121) as series(n);
insert into public.app_admins (user_id)
values ('00000000-0000-4000-8000-0000000000aa');

create function public.submit_owner_claim(p_facility_id uuid, p_evidence_notes text)
returns uuid language sql security definer set search_path = '' as $$ select null::uuid $$;
create function public.admin_approve_owner_claim(p_claim_id uuid)
returns boolean language sql security definer set search_path = '' as $$ select true $$;
create function public.admin_reject_owner_claim(p_claim_id uuid)
returns boolean language sql security definer set search_path = '' as $$ select true $$;
create function public.admin_review_listing_edit(p_edit_id uuid, p_decision text)
returns boolean language sql security definer set search_path = '' as $$ select true $$;

grant select on public.facilities to anon, authenticated;
revoke insert, update, delete, truncate on public.facilities from anon, authenticated;
