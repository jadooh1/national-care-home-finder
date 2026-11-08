-- An unknown public read policy must stop the migration before any change.
-- The expected result is an exception. This transaction rolls back.

begin;

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

create table public.facilities (
  id uuid primary key,
  record_status text,
  presence text,
  source_name text,
  license_category text,
  facility_type text,
  state_code text,
  normalized_license_number text,
  license_number text
);

alter table public.facilities enable row level security;

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

create policy "Public read verified facilities"
  on public.facilities
  for select
  to anon, authenticated
  using (record_status = 'verified');

create policy "Unexpected public facility read"
  on public.facilities
  for select
  to anon
  using (true);

\ir ../../migrations/20261107234500_absent_facility_public_read.sql
