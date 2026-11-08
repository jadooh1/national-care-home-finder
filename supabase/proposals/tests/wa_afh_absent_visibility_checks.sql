-- Disposable checks for archived-facility reads and new claims.
-- Not applied to Supabase. The transaction rolls back.

begin;

create schema if not exists auth;

do $roles$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end
$roles$;

grant anon, authenticated to current_user;
grant usage on schema public to anon, authenticated;
grant usage on schema auth to anon, authenticated;

create table auth.users (
  id uuid primary key,
  email_confirmed_at timestamptz
);

create function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant execute on function auth.uid() to anon, authenticated;

insert into auth.users (id, email_confirmed_at) values
  ('00000000-0000-4000-8000-0000000000a1', '2026-01-01T00:00:00Z');

create table public.facilities (
  id uuid primary key,
  canonical_name text,
  facility_type text,
  state_code text,
  license_number text,
  record_status text,
  normalized_license_number text,
  license_category text,
  source_name text,
  presence text
);

insert into public.facilities (
  id, canonical_name, facility_type, state_code, license_number, record_status,
  normalized_license_number, license_category, source_name, presence
) values
  ('00000000-0000-4000-8000-000000000201', 'Active Home', 'AFH', 'WA', '200001', 'source_matched', '200001', 'afh', 'wa_dshs_afh', 'active'),
  ('00000000-0000-4000-8000-000000000202', 'Unspecified Home', 'AFH', 'WA', '200002', 'source_matched', '200002', 'afh', 'wa_dshs_afh', null),
  ('00000000-0000-4000-8000-000000000203', 'Archived Home', 'AFH', 'WA', '752686', 'source_matched', '752686', 'afh', 'wa_dshs_afh', 'absent');

create table public.owner_claims (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id),
  claimant_user_id uuid not null,
  verification_status text not null,
  evidence_notes text,
  reviewed_at timestamptz
);

create table public.owner_claim_events (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.owner_claims (id),
  facility_id uuid not null references public.facilities (id),
  actor_user_id uuid not null,
  event_type text not null,
  from_status text,
  to_status text not null
);

insert into public.owner_claims (facility_id, claimant_user_id, verification_status, evidence_notes)
values (
  '00000000-0000-4000-8000-000000000203',
  '00000000-0000-4000-8000-0000000000a1',
  'approved',
  'existing claim remains stored'
);

create view public.wa_dshs_listed_facilities as
select id, license_number
from public.facilities
where record_status = 'source_matched'
  and presence is distinct from 'absent';

create view public.wa_afh_map_facilities as
select id, license_number
from public.facilities
where record_status = 'source_matched'
  and presence is distinct from 'absent';

alter table public.facilities enable row level security;

grant select on public.facilities to anon, authenticated;
grant select on public.wa_dshs_listed_facilities to anon, authenticated;
grant select on public.wa_afh_map_facilities to anon, authenticated;

create policy facilities_public_read_wa_afh_source_matched
  on public.facilities
  for select
  to anon, authenticated
  using (
    source_name = 'wa_dshs_afh'
    and license_category = 'afh'
    and facility_type = 'AFH'
    and state_code = 'WA'
    and record_status = 'source_matched'
    and normalized_license_number is not null
    and btrim(normalized_license_number, E' \t\r\n') <> ''
    and license_number ~ '^[0-9]{1,20}$'
  );

create function public.submit_owner_claim(p_facility_id uuid, p_evidence_notes text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if not exists (
    select 1
    from public.facilities as facility
    where facility.id = p_facility_id
      and facility.record_status = 'source_matched'
  ) then
    raise exception 'facility is not eligible';
  end if;
  return p_facility_id;
end;
$fn$;

revoke all on function public.submit_owner_claim(uuid, text) from public, anon, authenticated;
grant execute on function public.submit_owner_claim(uuid, text) to authenticated;

\ir ../../migrations/20261107234500_absent_facility_public_read.sql

do $checks$
declare
  archived_visible integer;
  current_visible integer;
  directory_count integer;
  map_count integer;
  stored_claim integer;
  new_claim uuid;
  rejected boolean := false;
begin
  if (select count(*) from public.wa_dshs_listed_facilities) <> 2
     or (select count(*) from public.wa_afh_map_facilities) <> 2 then
    raise exception 'FAIL directory or map count changed';
  end if;
  if (select count(*) from public.owner_claims) <> 1 then
    raise exception 'FAIL existing claim was removed';
  end if;
  if (select verification_status from public.owner_claims) is distinct from 'approved' then
    raise exception 'FAIL existing claim status changed';
  end if;

  set local role anon;
  select count(*) into archived_visible
  from public.facilities
  where license_number = '752686';
  select count(*) into current_visible
  from public.facilities
  where license_number in ('200001', '200002');
  select count(*) into directory_count from public.wa_dshs_listed_facilities;
  select count(*) into map_count from public.wa_afh_map_facilities;
  reset role;

  if archived_visible <> 0 or current_visible <> 2 or directory_count <> 2 or map_count <> 2 then
    raise exception 'FAIL public read visibility archived %, current %, directory %, map %',
      archived_visible, current_visible, directory_count, map_count;
  end if;

  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-0000000000a1', true);
  set local role authenticated;
  begin
    perform public.submit_owner_claim(
      '00000000-0000-4000-8000-000000000203',
      'this archived home must not accept a new claim'
    );
  exception
    when others then
      if sqlerrm <> 'facility is not eligible' then
        raise;
      end if;
      rejected := true;
  end;
  if not rejected then
    raise exception 'FAIL archived facility accepted a new claim';
  end if;
  new_claim := public.submit_owner_claim(
    '00000000-0000-4000-8000-000000000201',
    'this current home remains eligible for a claim'
  );
  reset role;

  if new_claim is null then
    raise exception 'FAIL current facility claim was rejected';
  end if;
  select count(*) into stored_claim
  from public.owner_claims
  where facility_id = '00000000-0000-4000-8000-000000000203'
    and verification_status = 'approved';
  if stored_claim <> 1 then
    raise exception 'FAIL approved archived claim was not preserved';
  end if;
  raise notice 'absent visibility checks passed';
end
$checks$;

rollback;
