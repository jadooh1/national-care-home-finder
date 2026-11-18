-- Proposal only. This is not authorized for execution.
-- It creates public.nationwide_source_record on a later development-only
-- authorization. It does not load rows, alter nationwide_roster, or change
-- Washington, Oregon, North Carolina, or Delaware data.
-- A session setting is not proof of which database is connected.
--   nchf.nationwide_source_record_authorization
--     = authorize-development-nationwide-source-record

begin;

do $guard$
begin
  if current_setting('nchf.nationwide_source_record_authorization', true)
     is distinct from 'authorize-development-nationwide-source-record' then
    raise exception 'source record proposal refused: later development-only authorization is required';
  end if;
  if to_regclass('public.nationwide_source_record') is not null then
    raise exception 'source record proposal refused: the table already exists';
  end if;
  if to_regclass('public.nationwide_roster') is not null then
    if (select count(*) from public.nationwide_roster
        where ingestion_batch_id = 'north-carolina-dhhs-roster-pilot-20261110') is distinct from 1086 then
      raise exception 'source record proposal refused: North Carolina baseline changed';
    end if;
    if (select count(*) from public.nationwide_roster
        where ingestion_batch_id = 'delaware-dhcq-assisted-living-pilot-20261110') is distinct from 39 then
      raise exception 'source record proposal refused: Delaware baseline changed';
    end if;
    if (select count(*) from public.nationwide_roster where publication = 'public') is distinct from 0 then
      raise exception 'source record proposal refused: a roster row is public';
    end if;
  end if;
  if to_regclass('public.wa_dshs_listed_facilities') is not null
     and (select count(*) from public.wa_dshs_listed_facilities) is distinct from 6278 then
    raise exception 'source record proposal refused: Washington directory baseline changed';
  end if;
  if to_regclass('public.wa_afh_map_facilities') is not null
     and (select count(*) from public.wa_afh_map_facilities) is distinct from 6278 then
    raise exception 'source record proposal refused: Washington map baseline changed';
  end if;
  if to_regclass('public.or_odhs_listed_afh') is not null
     and (select count(*) from public.or_odhs_listed_afh) is distinct from 1584 then
    raise exception 'source record proposal refused: Oregon directory baseline changed';
  end if;
end
$guard$;

create table public.nationwide_source_record (
  id uuid primary key default gen_random_uuid(),
  state_name text not null,
  issuing_authority text not null,
  identifier_type text not null,
  facility_identifier text,
  license_identifier text,
  certification_identifier text,
  source_record_id text,
  original_identifiers jsonb not null,
  source_attributes jsonb not null,
  provenance text not null,
  source_sha256 text not null,
  extraction_date date not null,
  source_effective_date date,
  source_expiration_date date,
  review_flags text[] not null default '{}',
  original_status text,
  normalized_status text,
  publication text not null default 'unpublished',
  ingestion_batch_id text not null,
  constraint nationwide_source_record_state_name check (state_name in (
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
    'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
    'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin',
    'Wyoming'
  )),
  constraint nationwide_source_record_identifier_type check (
    identifier_type in ('license', 'certification', 'source-id', 'facility-id', 'object-id')
  ),
  constraint nationwide_source_record_identifier_present check (
    facility_identifier is not null
    or license_identifier is not null
    or certification_identifier is not null
    or source_record_id is not null
  ),
  constraint nationwide_source_record_objects check (
    jsonb_typeof(original_identifiers) = 'object'
    and jsonb_typeof(source_attributes) = 'object'
    and original_identifiers <> '{}'::jsonb
  ),
  constraint nationwide_source_record_sha256 check (source_sha256 ~ '^[0-9a-f]{64}$'),
  constraint nationwide_source_record_dates check (
    source_effective_date is null
    or source_expiration_date is null
    or source_effective_date <= source_expiration_date
  ),
  constraint nationwide_source_record_status_unassigned check (
    original_status is null and normalized_status is null
  ),
  constraint nationwide_source_record_publication check (publication = 'unpublished'),
  constraint nationwide_source_record_batch check (length(btrim(ingestion_batch_id)) > 0)
);

create unique index nationwide_source_record_facility_key
  on public.nationwide_source_record (
    state_name, issuing_authority, ingestion_batch_id, identifier_type, facility_identifier
  )
  where facility_identifier is not null;

alter table public.nationwide_source_record enable row level security;

revoke all on table public.nationwide_source_record from public;

do $grants$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table public.nationwide_source_record from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table public.nationwide_source_record from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    revoke all on table public.nationwide_source_record from service_role;
  end if;
end
$grants$;

comment on table public.nationwide_source_record is
  'Unpublished state source records. State-specific fields stay here. Not a public directory.';

commit;
