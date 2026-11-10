"""Shared nationwide roster ingestion engine.

State modules parse official sources and map fields. This module checks that
unknown values stay unknown, loads one batch idempotently, and rolls that
batch back. The default guard accepts only localhost. It does not create
roles or add privileges.
"""

import csv
import io
import os
import re
import subprocess
from pathlib import Path

PSQL = os.environ.get("PSQL", "psql")
DEVELOPMENT_HOST = "aws-1-us-west-2.pooler.supabase.com"
DEVELOPMENT_USER = "postgres.ajjsyloyihcqdomywhik"
DEVELOPMENT_PORT = "5432"
DEVELOPMENT_DATABASE = "postgres"
DEVELOPMENT_SESSION_USER = "postgres"
DEVELOPMENT_SSLMODE = "verify-full"
DEVELOPMENT_MIGRATION = "20261108221940"
DEVELOPMENT_MIGRATION_NAME = "development_oregon_directory"
NORTH_CAROLINA_EXECUTION = "authorize-development-north-carolina-roster-execution"
DELAWARE_EXECUTION = "authorize-development-delaware-roster-execution"
BASELINE_ROSTER = 1125
BASELINE_NORTH_CAROLINA = 1086
BASELINE_DELAWARE = 39
BASELINE_PUBLIC = 0
BASELINE_WASHINGTON_DIRECTORY = 6278
BASELINE_WASHINGTON_MAP = 6278
BASELINE_OREGON_DIRECTORY = 1584
IDENTITY_MARKERS = ("DATABASE_POSTGRES", "SESSION_ROLE_POSTGRES")
MIGRATION_MARKERS = ("DEVELOPMENT_MIGRATION_PRESENT", "ROSTER_PRESENT", "BATCH_COLUMN_PRESENT")
BASELINE_MARKERS = (
    "ROSTER_BASELINE",
    "NORTH_CAROLINA_BASELINE",
    "DELAWARE_BASELINE",
    "PUBLIC_BASELINE",
    "WASHINGTON_DIRECTORY_BASELINE",
    "WASHINGTON_MAP_BASELINE",
    "OREGON_DIRECTORY_BASELINE",
)
MARKER = "ROSTER_INGEST_READY"
PUBLIC_PUBLICATION = "public"


class Pilot:
    def __init__(
        self,
        *,
        state_name,
        authority,
        batch_id,
        disclosure_url,
        ingest_guc,
        ingest_authorization,
        rollback_guc,
        rollback_authorization,
        rollback_filename,
    ):
        self.state_name = state_name
        self.authority = authority
        self.batch_id = batch_id
        self.disclosure_url = disclosure_url
        self.ingest_guc = ingest_guc
        self.ingest_authorization = ingest_authorization
        self.rollback_guc = rollback_guc
        self.rollback_authorization = rollback_authorization
        self.rollback_filename = rollback_filename


def refuse_remote():
    host = os.environ.get("PGHOST", "")
    lowered = host.lower()
    if host not in {"localhost", "127.0.0.1", "::1"} or "supabase" in lowered or "pooler" in lowered:
        raise RuntimeError("Refusing to run outside a local disposable database")


def assert_authorized_target(target_variable, authorization_variable, expected_authorization):
    host = os.environ.get("PGHOST", "")
    user = os.environ.get("PGUSER", "")
    target = os.environ.get(target_variable, "")
    authorization = os.environ.get(authorization_variable, "")
    lowered = f"{host} {user}".lower()
    if "us-west-1" in lowered or "yiehgstweswxjakbcdzc" in lowered:
        raise RuntimeError("development execution refused: production is not a target")
    if authorization != expected_authorization:
        raise RuntimeError("development execution refused: explicit authorization is required")
    if target == "disposable" and host in {"localhost", "127.0.0.1", "::1"}:
        return
    if target == "development" and host == DEVELOPMENT_HOST and user == DEVELOPMENT_USER:
        return
    raise RuntimeError("development execution refused: the target is not authorized")


def reject_duplicate_licenses(accepted, rejected, reason):
    seen = {}
    for record in accepted:
        seen.setdefault(record["license_identifier"], []).append(record)
    duplicates = {license_identifier for license_identifier, group in seen.items() if len(group) > 1}
    if not duplicates:
        return accepted, rejected
    rejected = list(rejected)
    rejected.extend({"reason": reason} for record in accepted if record["license_identifier"] in duplicates)
    accepted = [record for record in accepted if record["license_identifier"] not in duplicates]
    return accepted, rejected


def _text(record, name):
    value = record.get(name)
    if value is None:
        return ""
    return str(value)


def _blank(value):
    return value is None or value == ""


def assert_unknown_values_stay_unknown(pilot, records):
    for record in records:
        if record.get("publication", "unpublished") != "unpublished":
            raise RuntimeError("roster ingestion refused: a row would be published")
        if record.get("disclosure_verified") not in (None, False):
            raise RuntimeError("roster ingestion refused: disclosure is not verified")
        if record.get("freshness_verified") not in (None, False):
            raise RuntimeError("roster ingestion refused: freshness is not verified")
        if not _blank(record.get("official_export_date")) or not _blank(record.get("original_status")):
            raise RuntimeError("roster ingestion refused: an unknown source value was supplied")
        if record.get("disclosure_kind", "generic-search") != "generic-search":
            raise RuntimeError("roster ingestion refused: disclosure kind is not the shared list")
        if record.get("disclosure_url", pilot.disclosure_url) != pilot.disclosure_url:
            raise RuntimeError("roster ingestion refused: disclosure url does not match the pilot")
        physical = _text(record, "physical_address")
        unverified = _text(record, "unverified_address")
        if physical and unverified and physical == unverified:
            raise RuntimeError("roster ingestion refused: an unverified address was copied into the physical address")


def _stage_csv(records):
    fieldnames = [
        "license_identifier",
        "source_record_id",
        "facility_name",
        "physical_address",
        "physical_address_provenance",
        "mailing_address",
        "mailing_address_provenance",
        "unverified_address",
        "unverified_address_provenance",
        "original_category",
    ]
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=fieldnames, lineterminator="\n")
    writer.writeheader()
    for record in records:
        writer.writerow({name: _text(record, name) for name in fieldnames})
    return buffer.getvalue()


def psql(database, sql, guard=refuse_remote):
    guard()
    completed = subprocess.run(
        [PSQL, "-d", database, "-X", "-v", "ON_ERROR_STOP=1", "-f", "-"],
        input=sql,
        text=True,
        capture_output=True,
        check=False,
    )
    output = completed.stdout + completed.stderr
    if completed.returncode != 0:
        raise RuntimeError(output)
    return output


def _quote(value):
    return value.replace("'", "''")


def ingestion_sql(pilot, csv_text, batch_id):
    state_name = _quote(pilot.state_name)
    authority = _quote(pilot.authority)
    disclosure_url = _quote(pilot.disclosure_url)
    batch_id = _quote(batch_id)
    authorization = _quote(pilot.ingest_authorization)
    return f"""
select set_config('{pilot.ingest_guc}', '{authorization}', false);
begin;
do $guard$
begin
  if current_setting('{pilot.ingest_guc}', true) is distinct from '{authorization}' then
    raise exception 'roster ingestion refused: later development-only authorization is required';
  end if;
  if to_regclass('public.nationwide_roster') is null then
    raise exception 'roster ingestion refused: nationwide_roster is not present';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'nationwide_roster'
      and column_name = 'ingestion_batch_id'
  ) then
    raise exception 'roster ingestion refused: ingestion_batch_id is not present';
  end if;
end
$guard$;
lock table public.nationwide_roster in share row exclusive mode;
create temp table roster_stage (
  license_identifier text not null,
  source_record_id text not null,
  facility_name text not null,
  physical_address text,
  physical_address_provenance text,
  mailing_address text,
  mailing_address_provenance text,
  unverified_address text,
  unverified_address_provenance text,
  original_category text not null
);
copy roster_stage from stdin with (format csv, header true);
{csv_text}\\.
create temp table roster_result(inserted bigint, already_present bigint);
do $load$
declare
  conflict_count bigint;
  inserted_count bigint;
  already_count bigint;
begin
  select count(*) into conflict_count
  from roster_stage as incoming
  join public.nationwide_roster as existing
    on existing.state_name = '{state_name}'
   and existing.identifier_type = 'license'
   and coalesce(existing.issuing_authority, '') = '{authority}'
   and existing.license_identifier = incoming.license_identifier
  where existing.facility_name is distinct from incoming.facility_name
     or existing.source_record_id is distinct from incoming.source_record_id
     or existing.physical_address is distinct from nullif(incoming.physical_address, '')
     or existing.physical_address_provenance is distinct from nullif(incoming.physical_address_provenance, '')
     or existing.mailing_address is distinct from nullif(incoming.mailing_address, '')
     or existing.mailing_address_provenance is distinct from nullif(incoming.mailing_address_provenance, '')
     or existing.unverified_address is distinct from nullif(incoming.unverified_address, '')
     or existing.unverified_address_provenance is distinct from nullif(incoming.unverified_address_provenance, '')
     or existing.original_category is distinct from incoming.original_category
     or existing.official_export_date is not null
     or existing.source_publication_date is not null
     or existing.retrieval_timestamp is not null
     or existing.freshness_verified
     or existing.original_status is not null
     or existing.normalized_status is not null
     or existing.normalized_category is not null
     or existing.disclosure_verified
     or existing.disclosure_kind is distinct from 'generic-search'
     or existing.disclosure_url is distinct from '{disclosure_url}'
     or existing.publication is distinct from 'unpublished'
     or existing.coordinate_source is distinct from 'absent'
     or existing.ingestion_batch_id is distinct from '{batch_id}';
  if conflict_count > 0 then
    raise exception 'roster ingestion conflict: %', conflict_count;
  end if;
  select count(*) into already_count
  from roster_stage as incoming
  join public.nationwide_roster as existing
    on existing.state_name = '{state_name}'
   and existing.identifier_type = 'license'
   and coalesce(existing.issuing_authority, '') = '{authority}'
   and existing.license_identifier = incoming.license_identifier;
  insert into public.nationwide_roster (
    state_name, license_identifier, certification_identifier, facility_identifier,
    identifier_type, issuing_authority, source_record_id, facility_name,
    physical_address, physical_address_provenance,
    mailing_address, mailing_address_provenance,
    unverified_address, unverified_address_provenance,
    official_export_date, source_publication_date, retrieval_timestamp,
    freshness_verified, original_category, normalized_category,
    original_status, normalized_status,
    disclosure_url, disclosure_kind, disclosure_verified, disclosure_verification_evidence,
    latitude, longitude, coordinate_source, coordinate_accuracy, publication,
    ingestion_batch_id
  )
  select
    '{state_name}', incoming.license_identifier, null, null,
    'license', '{authority}', incoming.source_record_id, incoming.facility_name,
    nullif(incoming.physical_address, ''), nullif(incoming.physical_address_provenance, ''),
    nullif(incoming.mailing_address, ''), nullif(incoming.mailing_address_provenance, ''),
    nullif(incoming.unverified_address, ''), nullif(incoming.unverified_address_provenance, ''),
    null, null, null,
    false, incoming.original_category, null,
    null, null,
    '{disclosure_url}', 'generic-search', false, null,
    null, null, 'absent', null, 'unpublished', '{batch_id}'
  from roster_stage as incoming
  where not exists (
    select 1 from public.nationwide_roster as existing
    where existing.state_name = '{state_name}'
      and existing.identifier_type = 'license'
      and coalesce(existing.issuing_authority, '') = '{authority}'
      and existing.license_identifier = incoming.license_identifier
  );
  get diagnostics inserted_count = row_count;
  if inserted_count + already_count <> (select count(*) from roster_stage) then
    raise exception 'roster ingestion refused: the row tally does not match';
  end if;
  insert into roster_result(inserted, already_present) values (inserted_count, already_count);
end
$load$;
select '{MARKER}' as marker, inserted, already_present from roster_result;
commit;
"""


def _development_requested():
    targets = (
        os.environ.get("NCHF_NC_EXECUTION_TARGET", ""),
        os.environ.get("NCHF_DE_EXECUTION_TARGET", ""),
    )
    return os.environ.get("PGHOST", "") == DEVELOPMENT_HOST or "development" in targets


def _assert_development_authorization():
    checks = (
        ("NCHF_NC_EXECUTION_TARGET", "NCHF_NC_DEVELOPMENT_EXECUTION", NORTH_CAROLINA_EXECUTION),
        ("NCHF_DE_EXECUTION_TARGET", "NCHF_DE_DEVELOPMENT_EXECUTION", DELAWARE_EXECUTION),
    )
    requested = False
    for target_variable, authorization_variable, expected in checks:
        if os.environ.get(target_variable, "") != "development":
            continue
        requested = True
        if os.environ.get(authorization_variable, "") != expected:
            raise RuntimeError("development execution refused: explicit authorization is required")
    if requested:
        return
    authorized = (
        os.environ.get("NCHF_NC_DEVELOPMENT_EXECUTION", "") == NORTH_CAROLINA_EXECUTION
        or os.environ.get("NCHF_DE_DEVELOPMENT_EXECUTION", "") == DELAWARE_EXECUTION
    )
    if not authorized:
        raise RuntimeError("development execution refused: explicit authorization is required")


def assert_development_connection():
    host = os.environ.get("PGHOST", "")
    user = os.environ.get("PGUSER", "")
    lowered = f"{host} {user}".lower()
    if "us-west-1" in lowered or "yiehgstweswxjakbcdzc" in lowered:
        raise RuntimeError("development execution refused: production is not a target")
    if (
        host != DEVELOPMENT_HOST
        or user != DEVELOPMENT_USER
        or os.environ.get("PGPORT", "") != DEVELOPMENT_PORT
        or os.environ.get("PGDATABASE", "") != DEVELOPMENT_DATABASE
        or os.environ.get("PGSSLMODE", "") != DEVELOPMENT_SSLMODE
    ):
        raise RuntimeError("development execution refused: the database target does not match development")


def verify_development_session(database, guard=refuse_remote):
    public_publication = PUBLIC_PUBLICATION
    output = psql(
        database,
        f"""
        create temp table identity_markers(marker text primary key);
        do $identity$
        declare
          roster_count bigint;
          state_count bigint;
          public_count bigint;
          relation_count bigint;
          migration_present boolean := false;
        begin
          if current_database() = '{DEVELOPMENT_DATABASE}' then
            insert into identity_markers(marker) values ('DATABASE_POSTGRES');
          end if;
          if current_user = '{DEVELOPMENT_SESSION_USER}' then
            insert into identity_markers(marker) values ('SESSION_ROLE_POSTGRES');
          end if;
          if to_regclass('supabase_migrations.schema_migrations') is not null then
            execute
              'select exists (select 1 from supabase_migrations.schema_migrations where version = $1 and name = $2)'
              into migration_present
              using '{DEVELOPMENT_MIGRATION}', '{DEVELOPMENT_MIGRATION_NAME}';
          end if;
          if migration_present then
            insert into identity_markers(marker) values ('DEVELOPMENT_MIGRATION_PRESENT');
          end if;
          if to_regclass('public.nationwide_roster') is not null then
            insert into identity_markers(marker) values ('ROSTER_PRESENT');
            if exists (
              select 1 from information_schema.columns
              where table_schema = 'public'
                and table_name = 'nationwide_roster'
                and column_name = 'ingestion_batch_id'
            ) then
              insert into identity_markers(marker) values ('BATCH_COLUMN_PRESENT');
            end if;
            select count(*) into roster_count from public.nationwide_roster;
            if roster_count = {BASELINE_ROSTER} then
              insert into identity_markers(marker) values ('ROSTER_BASELINE');
            end if;
            select count(*) into state_count from public.nationwide_roster where state_name = 'North Carolina';
            if state_count = {BASELINE_NORTH_CAROLINA} then
              insert into identity_markers(marker) values ('NORTH_CAROLINA_BASELINE');
            end if;
            select count(*) into state_count from public.nationwide_roster where state_name = 'Delaware';
            if state_count = {BASELINE_DELAWARE} then
              insert into identity_markers(marker) values ('DELAWARE_BASELINE');
            end if;
            select count(*) into public_count
            from public.nationwide_roster
            where publication = '{public_publication}';
            if public_count = {BASELINE_PUBLIC} then
              insert into identity_markers(marker) values ('PUBLIC_BASELINE');
            end if;
          end if;
          if to_regclass('public.wa_dshs_listed_facilities') is not null then
            select count(*) into relation_count from public.wa_dshs_listed_facilities;
            if relation_count = {BASELINE_WASHINGTON_DIRECTORY} then
              insert into identity_markers(marker) values ('WASHINGTON_DIRECTORY_BASELINE');
            end if;
          end if;
          if to_regclass('public.wa_afh_map_facilities') is not null then
            select count(*) into relation_count from public.wa_afh_map_facilities;
            if relation_count = {BASELINE_WASHINGTON_MAP} then
              insert into identity_markers(marker) values ('WASHINGTON_MAP_BASELINE');
            end if;
          end if;
          if to_regclass('public.or_odhs_listed_afh') is not null then
            select count(*) into relation_count from public.or_odhs_listed_afh;
            if relation_count = {BASELINE_OREGON_DIRECTORY} then
              insert into identity_markers(marker) values ('OREGON_DIRECTORY_BASELINE');
            end if;
          end if;
        end
        $identity$;
        select marker from identity_markers order by marker;
        """,
        guard=guard,
    )
    missing = [marker for marker in (*IDENTITY_MARKERS, *MIGRATION_MARKERS, *BASELINE_MARKERS) if marker not in output]
    if any(marker in IDENTITY_MARKERS for marker in missing):
        raise RuntimeError("development identity check failed: project identity")
    if any(marker in MIGRATION_MARKERS for marker in missing):
        raise RuntimeError("development identity check failed: migration")
    if missing:
        raise RuntimeError("development identity check failed: baseline")
    return output


def verify_development_identity(database, guard=refuse_remote):
    assert_development_connection()
    return verify_development_session(database, guard)


def preflight_before_write(database, guard=refuse_remote):
    host = os.environ.get("PGHOST", "")
    user = os.environ.get("PGUSER", "")
    lowered = f"{host} {user}".lower()
    if "us-west-1" in lowered or "yiehgstweswxjakbcdzc" in lowered:
        raise RuntimeError("development execution refused: production is not a target")
    if not _development_requested():
        if host not in {"localhost", "127.0.0.1", "::1"} or "supabase" in lowered or "pooler" in lowered:
            raise RuntimeError("development execution refused: the target is not authorized")
        return
    _assert_development_authorization()
    verify_development_identity(database, guard)


def ingest_batch(database, pilot, records, guard=refuse_remote, batch_id=None):
    preflight_before_write(database, guard)
    batch_id = pilot.batch_id if batch_id is None else batch_id
    if not records:
        return {"inserted": 0, "already_present": 0, "conflicts": 0}
    assert_unknown_values_stay_unknown(pilot, records)
    try:
        output = psql(database, ingestion_sql(pilot, _stage_csv(records), batch_id), guard=guard)
    except RuntimeError as error:
        match = re.search(r"ingestion conflict: (\d+)", str(error))
        if match:
            return {"inserted": 0, "already_present": 0, "conflicts": int(match.group(1))}
        raise
    if MARKER not in output or "COMMIT" not in output:
        raise RuntimeError(output)
    for line in output.splitlines():
        parts = [part.strip() for part in line.split("|")]
        if len(parts) == 3 and parts[0] == MARKER:
            return {"inserted": int(parts[1]), "already_present": int(parts[2]), "conflicts": 0}
    raise RuntimeError(output)


def rollback_batch(database, pilot, guard=refuse_remote):
    preflight_before_write(database, guard)
    rollback_file = Path(__file__).resolve().parents[2] / "supabase" / "proposals" / pilot.rollback_filename
    output = psql(
        database,
        f"select set_config('{pilot.rollback_guc}', '{_quote(pilot.rollback_authorization)}', false);\n"
        + rollback_file.read_text(encoding="utf-8"),
        guard=guard,
    )
    if "COMMIT" not in output:
        raise RuntimeError(output)
    return output
