"""Shared nationwide roster ingestion engine.

State modules parse official sources and map fields. This module checks that
unknown values stay unknown, loads one batch idempotently, and rolls that
batch back. The default guard accepts only localhost. It does not create
roles or add privileges.
"""

import copy
import csv
import io
import json
import os
import re
import subprocess
from datetime import datetime
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
APPROVED_BASELINE_PATH = (
    Path(__file__).resolve().parents[2]
    / "supabase"
    / "proposals"
    / "baselines"
    / "20261110.1-development-roster.json"
)
IDENTITY_MARKERS = ("DATABASE_POSTGRES", "SESSION_ROLE_POSTGRES")
MIGRATION_MARKERS = ("DEVELOPMENT_MIGRATION_PRESENT", "ROSTER_PRESENT", "BATCH_COLUMN_PRESENT")
RELATION_NAME = re.compile(r"^[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*$")
MARKER = "ROSTER_INGEST_READY"


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


def assert_validated_extraction_date(records, extraction_date):
    """Accept one official ISO extraction date without relaxing the other safeguards.

    The existing pilot ingest still rejects every supplied export date. This
    check is separate and does not write to a database.
    """
    if not isinstance(extraction_date, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", extraction_date):
        raise RuntimeError("extraction date is not an official ISO date")
    try:
        parsed = datetime.strptime(extraction_date, "%Y-%m-%d").date()
    except ValueError:
        raise RuntimeError("extraction date is not an official ISO date")
    if parsed.isoformat() != extraction_date:
        raise RuntimeError("extraction date is not an official ISO date")
    if not records:
        raise RuntimeError("extraction date requires at least one source row")
    for record in records:
        observed_date = record.get("official_export_date")
        if _blank(observed_date):
            observed_date = record.get("extraction_date")
        if observed_date != extraction_date:
            raise RuntimeError("extraction date does not match the source row")
        if record.get("publication", "unpublished") != "unpublished":
            raise RuntimeError("roster ingestion refused: a row would be published")
        if record.get("disclosure_verified") not in (None, False):
            raise RuntimeError("roster ingestion refused: disclosure is not verified")
        if record.get("freshness_verified") not in (None, False):
            raise RuntimeError("roster ingestion refused: freshness is not verified")
        if not _blank(record.get("original_status")) or not _blank(record.get("normalized_status")):
            raise RuntimeError("roster ingestion refused: an unknown source value was supplied")
        if record.get("review_flags"):
            if not _blank(record.get("original_status")) or not _blank(record.get("normalized_status")):
                raise RuntimeError("roster ingestion refused: a review flag cannot assign a license status")
        physical = _text(record, "physical_address")
        unverified = _text(record, "unverified_address")
        if physical and unverified and physical == unverified:
            raise RuntimeError("roster ingestion refused: an unverified address was copied into the physical address")


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


def _require_text(value, label):
    if not isinstance(value, str) or not value.strip() or "|" in value:
        raise RuntimeError(f"approved baseline is internally inconsistent: {label}")
    return value


def _require_count(value, label):
    if not isinstance(value, int) or isinstance(value, bool) or value < 0:
        raise RuntimeError(f"approved baseline is internally inconsistent: {label}")
    return value


def _validated_relation(relation):
    if not isinstance(relation, str) or not RELATION_NAME.fullmatch(relation):
        raise RuntimeError("approved baseline is internally inconsistent: protected relation")
    return relation


def validate_baseline(baseline):
    if not isinstance(baseline, dict):
        raise RuntimeError("approved baseline is internally inconsistent: manifest")
    _require_text(baseline.get("baseline_version"), "version")
    roster = baseline.get("roster")
    batches = roster.get("batches") if isinstance(roster, dict) else None
    directories = baseline.get("protected_directories")
    if not isinstance(batches, list) or not batches or not isinstance(directories, list) or not directories:
        raise RuntimeError("approved baseline is internally inconsistent: manifest")
    seen = set()
    total = 0
    public_count = 0
    for batch in batches:
        state_name = _require_text(batch.get("state_name"), "state")
        batch_id = _require_text(batch.get("ingestion_batch_id"), "batch")
        authority = _require_text(batch.get("issuing_authority"), "authority")
        _require_text(batch.get("source_url"), "source")
        identifier_type = _require_text(batch.get("identifier_type"), "identifier type")
        publication = _require_text(batch.get("publication"), "publication")
        if identifier_type not in {"license", "certification", "source-id", "facility-id", "object-id"}:
            raise RuntimeError("approved baseline is internally inconsistent: identifier type")
        if publication not in {"unpublished", "development", "public"}:
            raise RuntimeError("approved baseline is internally inconsistent: publication")
        count = _require_count(batch.get("count"), "count")
        key = (state_name, batch_id, authority, publication)
        if key in seen:
            raise RuntimeError("approved baseline is internally inconsistent: duplicate batch")
        seen.add(key)
        total += count
        if publication == "public":
            public_count += count
    if total != _require_count(roster.get("total"), "total") or public_count != _require_count(roster.get("public_count"), "public count"):
        raise RuntimeError("approved baseline is internally inconsistent: totals")
    seen_relations = set()
    for directory in directories:
        relation = _validated_relation(directory.get("relation"))
        _require_text(directory.get("state_name"), "protected state")
        _require_text(directory.get("role"), "protected role")
        _require_count(directory.get("count"), "protected count")
        if relation in seen_relations:
            raise RuntimeError("approved baseline is internally inconsistent: duplicate relation")
        seen_relations.add(relation)
    return baseline


def load_approved_baseline():
    return validate_baseline(json.loads(APPROVED_BASELINE_PATH.read_text(encoding="utf-8")))


def candidate_baseline(baseline, batch):
    """Return a reviewed-style manifest for a new batch without writing the approved file."""
    updated = copy.deepcopy(validate_baseline(baseline))
    updated["roster"]["batches"].append(copy.deepcopy(batch))
    updated["roster"]["total"] += batch["count"]
    if batch.get("publication") == "public":
        updated["roster"]["public_count"] += batch["count"]
    return validate_baseline(updated)


def _batch_key(batch):
    return (
        batch["state_name"],
        batch["ingestion_batch_id"],
        batch["issuing_authority"],
        batch["publication"],
    )


def compare_baseline(observations, baseline):
    baseline = validate_baseline(baseline)
    expected = {_batch_key(batch): batch["count"] for batch in baseline["roster"]["batches"]}
    expected_ids = {batch["ingestion_batch_id"] for batch in baseline["roster"]["batches"]}
    actual = {}
    directories = {}
    for observation in observations:
        if observation.get("kind") == "roster":
            key = (
                observation.get("state_name"),
                observation.get("ingestion_batch_id"),
                observation.get("issuing_authority"),
                observation.get("publication"),
            )
            actual[key] = int(observation["row_count"])
        elif observation.get("kind") == "directory":
            directories[observation.get("relation")] = int(observation["row_count"])
    unexpected_ids = {key[1] for key in actual} - expected_ids
    if unexpected_ids:
        raise RuntimeError("development baseline check failed: unexpected batch")
    for key in actual:
        if key not in expected:
            raise RuntimeError("development baseline check failed: publication change")
    for key, count in expected.items():
        observed = actual.get(key, 0)
        if observed > count:
            raise RuntimeError("development baseline check failed: unauthorized addition")
        if observed < count:
            raise RuntimeError("development baseline check failed: unauthorized deletion")
    for directory in baseline["protected_directories"]:
        if directories.get(directory["relation"]) != directory["count"]:
            raise RuntimeError("development baseline check failed: protected directory")


def _observation_sql(baseline):
    selects = [
        """
        select 'OBS ' || row_to_json(observation)::text
        from (
          select 'roster'::text as kind,
            state_name,
            ingestion_batch_id,
            issuing_authority,
            publication,
            count(*)::bigint as row_count
          from public.nationwide_roster
          group by state_name, ingestion_batch_id, issuing_authority, publication
        ) as observation
        """
    ]
    for directory in baseline["protected_directories"]:
        relation = _validated_relation(directory["relation"])
        selects.append(
            f"""
            select 'OBS ' || json_build_object(
              'kind', 'directory',
              'relation', '{relation}',
              'row_count', (select count(*) from {relation})
            )::text
            """
        )
    return " union all ".join(selects) + ";"


def _parse_observations(output):
    observations = []
    for line in output.splitlines():
        index = line.find("OBS ")
        if index < 0:
            continue
        observations.append(json.loads(line[index + 4:].strip()))
    return observations


def verify_development_session(database, guard=refuse_remote, baseline=None):
    baseline = load_approved_baseline() if baseline is None else validate_baseline(baseline)
    output = psql(
        database,
        f"""
        create temp table identity_markers(marker text primary key);
        do $identity$
        declare
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
          end if;
        end
        $identity$;
        select marker from identity_markers order by marker;
        """,
        guard=guard,
    )
    missing = [marker for marker in (*IDENTITY_MARKERS, *MIGRATION_MARKERS) if marker not in output]
    if any(marker in IDENTITY_MARKERS for marker in missing):
        raise RuntimeError("development identity check failed: project identity")
    if any(marker in MIGRATION_MARKERS for marker in missing):
        raise RuntimeError("development identity check failed: migration")
    observations = _parse_observations(psql(database, _observation_sql(baseline), guard=guard))
    compare_baseline(observations, baseline)
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
