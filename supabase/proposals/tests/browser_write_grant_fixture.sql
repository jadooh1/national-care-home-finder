-- Disposable production-shaped fixture. It is not production data.
-- Browser roles hold the confirmed write grants. Facilities row level
-- security allows only the reviewed SELECT policy. Claim and listing
-- tables have no row level security, so their INSERT grants are effective
-- until the proposal revokes them.

create schema if not exists auth;
create table auth.users (
  id uuid primary key,
  email_confirmed_at timestamptz
);
insert into auth.users (id, email_confirmed_at)
values ('00000000-0000-4000-8000-0000000000aa', pg_catalog.clock_timestamp());

create function auth.uid()
returns uuid
language sql
stable
as $$
  select '00000000-0000-4000-8000-0000000000aa'::uuid;
$$;

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

grant usage on schema public to anon, authenticated;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

create table public.facilities (
  id uuid primary key,
  canonical_name text not null,
  record_status text not null,
  license_number text
);

insert into public.facilities (id, canonical_name, record_status, license_number)
select pg_catalog.gen_random_uuid(),
       'Synthetic facility ' || series.n,
       'unclassified',
       series.n::text
from pg_catalog.generate_series(1, 8121) as series(n);

create table public.owner_claims (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  facility_id uuid not null references public.facilities (id),
  claimant_user_id uuid not null,
  verification_status text not null,
  evidence_notes text
);

create table public.listing_edits (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  facility_id uuid not null references public.facilities (id),
  submitted_by_user_id uuid,
  field_name text,
  proposed_value text,
  review_status text
);

create table public.app_admins (
  user_id uuid primary key
);
insert into public.app_admins (user_id)
values ('00000000-0000-4000-8000-0000000000bb');

alter table public.facilities enable row level security;
grant select, insert, update, delete, truncate, references, trigger, maintain
  on table public.facilities to anon, authenticated;
create policy "Public read verified facilities"
  on public.facilities
  for select
  to anon, authenticated
  using (record_status = 'verified');

grant insert, update, delete, truncate, references, trigger, maintain
  on table public.owner_claims to anon, authenticated;
grant insert on table public.listing_edits to authenticated;

create view public.wa_dshs_listed_facilities
with (security_barrier = true) as
select id, canonical_name, license_number, record_status
from public.facilities;

create view public.wa_afh_map_facilities as
select id, canonical_name, license_number
from public.facilities;

grant select on table public.wa_dshs_listed_facilities, public.wa_afh_map_facilities
  to anon, authenticated;

create function public.probe_owner_claim(p_facility_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_claim uuid;
begin
  insert into public.owner_claims (
    facility_id, claimant_user_id, verification_status, evidence_notes
  ) values (
    p_facility_id, (select auth.uid()), 'pending', 'synthetic evidence notes'
  )
  returning id into new_claim;
  return new_claim;
end;
$$;

revoke all on function public.probe_owner_claim(uuid) from public, anon, authenticated;
grant execute on function public.probe_owner_claim(uuid) to authenticated;

create function public.probe_admin_visible()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = '00000000-0000-4000-8000-0000000000bb'::uuid
  );
$$;

revoke all on function public.probe_admin_visible() from public, anon, authenticated;
grant execute on function public.probe_admin_visible() to authenticated;
