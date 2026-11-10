-- Proposal only. This is not a migration and it is not authorized for execution.
-- A later human authorization would be required, and only for the development
-- project. The operator must confirm that connection outside this file.
-- A session setting is not proof of which database is connected.
-- This file refuses to run unless that later authorization is set in the
-- same session:
--   nchf.nationwide_roster_authorization
--     = authorize-development-nationwide-roster
-- It creates public.nationwide_roster only. It does not alter Washington or
-- Oregon relations, load rows, grant a public directory, or publish a state.

begin;

do $guard$
begin
  if current_setting('nchf.nationwide_roster_authorization', true)
     is distinct from 'authorize-development-nationwide-roster' then
    raise exception 'nationwide roster proposal refused: execution requires a later development-only authorization';
  end if;
  if to_regclass('public.nationwide_roster') is not null then
    raise exception 'nationwide roster proposal refused: the roster table already exists';
  end if;
end
$guard$;

create table public.nationwide_roster (
  id uuid primary key default gen_random_uuid(),
  state_name text not null,
  license_identifier text,
  certification_identifier text,
  facility_identifier text,
  identifier_type text not null,
  issuing_authority text,
  source_record_id text,
  facility_name text not null,
  physical_address text,
  physical_address_provenance text,
  mailing_address text,
  mailing_address_provenance text,
  supplemental_address text,
  supplemental_address_provenance text,
  unverified_address text,
  unverified_address_provenance text,
  official_export_date date,
  source_publication_date date,
  retrieval_timestamp timestamptz,
  freshness_verified boolean not null default false,
  original_category text,
  normalized_category text,
  original_status text,
  normalized_status text,
  disclosure_url text,
  disclosure_kind text,
  disclosure_verified boolean not null default false,
  disclosure_verification_evidence text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  coordinate_source text not null default 'absent',
  coordinate_accuracy text,
  publication text not null default 'unpublished',
  constraint nationwide_roster_state_name check (state_name in (
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
  constraint nationwide_roster_identifier_type check (
    identifier_type in ('license', 'certification', 'source-id', 'facility-id', 'object-id')
  ),
  constraint nationwide_roster_certification_is_not_a_license check (
    (identifier_type <> 'certification' or (
      certification_identifier is not null
      and length(btrim(certification_identifier)) > 0
      and license_identifier is null
      and issuing_authority is not null
      and length(btrim(issuing_authority)) > 0
    ))
    and (identifier_type <> 'license' or (
      license_identifier is not null
      and length(btrim(license_identifier)) > 0
      and certification_identifier is null
      and issuing_authority is not null
      and length(btrim(issuing_authority)) > 0
    ))
    and (identifier_type <> 'facility-id' or (
      facility_identifier is not null
      and length(btrim(facility_identifier)) > 0
      and license_identifier is null
      and certification_identifier is null
      and issuing_authority is not null
    ))
    and (identifier_type <> 'object-id' or (
      source_record_id is not null
      and length(btrim(source_record_id)) > 0
      and license_identifier is null
      and certification_identifier is null
    ))
    and (identifier_type <> 'source-id' or (
      source_record_id is not null
      and length(btrim(source_record_id)) > 0
      and license_identifier is null
      and certification_identifier is null
    ))
  ),
  constraint nationwide_roster_address_provenance check (
    (physical_address is null or physical_address_provenance is not null)
    and (mailing_address is null or mailing_address_provenance is not null)
    and (supplemental_address is null or supplemental_address_provenance is not null)
    and (unverified_address is null or unverified_address_provenance is not null)
    and (physical_address is null or mailing_address is null or physical_address is distinct from mailing_address)
    and (physical_address is null or supplemental_address is null or physical_address is distinct from supplemental_address)
    and (physical_address is null or unverified_address is null or physical_address is distinct from unverified_address)
  ),
  constraint nationwide_roster_freshness check (
    freshness_verified = false or official_export_date is not null
  ),
  constraint nationwide_roster_disclosure check (
    (disclosure_kind is null or disclosure_kind in ('facility-specific', 'generic-search', 'unverified-pattern'))
    and (disclosure_kind is distinct from 'facility-specific' or (
      disclosure_url is not null
      and disclosure_verified
      and disclosure_verification_evidence is not null
      and length(btrim(disclosure_verification_evidence)) > 0
    ))
    and (disclosure_verified = false or (
      disclosure_kind = 'facility-specific'
      and disclosure_url is not null
      and disclosure_verification_evidence is not null
      and length(btrim(disclosure_verification_evidence)) > 0
    ))
  ),
  constraint nationwide_roster_classification check (
    (normalized_category is null or original_category is not null)
    and (normalized_status is null or original_status is not null)
  ),
  constraint nationwide_roster_coordinates check (
    coordinate_source in ('licensing', 'georeferenced', 'absent')
    and (
      (coordinate_source = 'absent' and latitude is null and longitude is null)
      or (
        coordinate_source <> 'absent'
        and (
          (latitude is null and longitude is null)
          or (
            latitude between -90 and 90
            and longitude between -180 and 180
            and coordinate_accuracy is not null
          )
        )
      )
    )
  ),
  constraint nationwide_roster_publication check (
    publication in ('public', 'development', 'unpublished')
    and (
      publication <> 'public'
      or (
        freshness_verified
        and official_export_date is not null
        and disclosure_kind = 'facility-specific'
        and disclosure_url is not null
        and disclosure_verified
        and disclosure_verification_evidence is not null
        and length(btrim(disclosure_verification_evidence)) > 0
        and coordinate_source is distinct from 'georeferenced'
      )
    )
  )
);

create unique index nationwide_roster_license_key
  on public.nationwide_roster (state_name, coalesce(issuing_authority, ''), identifier_type, license_identifier)
  where license_identifier is not null;

create unique index nationwide_roster_certification_key
  on public.nationwide_roster (state_name, coalesce(issuing_authority, ''), identifier_type, certification_identifier)
  where certification_identifier is not null;

create unique index nationwide_roster_facility_key
  on public.nationwide_roster (state_name, coalesce(issuing_authority, ''), identifier_type, facility_identifier)
  where facility_identifier is not null;

create unique index nationwide_roster_source_record_key
  on public.nationwide_roster (state_name, coalesce(issuing_authority, ''), identifier_type, source_record_id)
  where source_record_id is not null;

alter table public.nationwide_roster enable row level security;

revoke all on table public.nationwide_roster from public;

do $grants$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table public.nationwide_roster from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table public.nationwide_roster from authenticated;
  end if;
end
$grants$;

comment on table public.nationwide_roster is
  'Development-only nationwide roster proposal. Unpublished by default. Not a public directory.';

commit;
