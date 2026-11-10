"""Prepare a Delaware assisted-living roster load without publishing the state.

The parser reads a local HTML listing. It does not download files, does not
connect to Supabase, and does not create roles or add privileges. The default
database guard accepts only localhost.
"""

import csv
import io
import os
import re
import subprocess
from pathlib import Path

AUTHORITY = (
    "Delaware Department of Health and Social Services, "
    "Division of Health Care Quality"
)
LISTING_URL = "https://dhss.delaware.gov/dhcq/dhcq/licensed-assisted-living-facilities/"
CATEGORY = "Licensed Assisted Living Facility"
INGEST_AUTHORIZATION = "authorize-development-delaware-roster-ingestion"
ROLLBACK_AUTHORIZATION = "authorize-development-delaware-roster-rollback"
PILOT_BATCH = "delaware-dhcq-assisted-living-pilot-20261110"
LICENSE_PATTERN = re.compile(r"^\d+$")
DELAWARE_ADDRESS = re.compile(r"\bDE\s+\d{5}(?:-\d{4})?\s*$")
PSQL = os.environ.get("PSQL", "psql")


def refuse_remote():
    host = os.environ.get("PGHOST", "")
    lowered = host.lower()
    if host not in {"localhost", "127.0.0.1", "::1"} or "supabase" in lowered or "pooler" in lowered:
        raise RuntimeError("Refusing to run outside a local disposable database")


def clean(value):
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def listing_blocks(html):
    return re.findall(
        r'<div class="wp-block-esab-accordion-child"[\s\S]*?(?=<div class="wp-block-esab-accordion-child"|$)',
        html,
    )


def block_fields(block):
    name_match = re.search(r'class="esab__heading_tag"[^>]*>(.*?)</', block, re.S)
    fields = {"name": clean(name_match.group(1)) if name_match else ""}
    for label, value in re.findall(r"<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>", block, re.S):
        label = clean(label)
        if label and label not in fields:
            fields[label] = clean(value)
    return fields


def map_listing(html):
    accepted = []
    rejected = []
    for block in listing_blocks(html):
        fields = block_fields(block)
        name = fields.get("name", "")
        license_identifier = fields.get("License #", "")
        address = fields.get("Address", "")
        if not name and not license_identifier and not address:
            continue
        if not license_identifier:
            rejected.append({"reason": "license-identifier-missing"})
            continue
        if not LICENSE_PATTERN.fullmatch(license_identifier):
            rejected.append({"reason": "license-identifier-is-not-numeric"})
            continue
        if not name:
            rejected.append({"reason": "facility-name-missing"})
            continue
        if not address:
            rejected.append({"reason": "listed-address-missing"})
            continue
        if not DELAWARE_ADDRESS.search(address):
            rejected.append({"reason": "listed-address-is-not-delaware"})
            continue
        accepted.append(
            {
                "license_identifier": license_identifier,
                "source_record_id": f"assisted-living:{license_identifier}",
                "facility_name": name,
                "unverified_address": address,
                "unverified_address_provenance": "listed-address",
                "physical_address": None,
                "original_category": CATEGORY,
                "official_export_date": None,
                "original_status": None,
                "disclosure_url": LISTING_URL,
                "disclosure_kind": "generic-search",
                "disclosure_verified": False,
                "coordinate_source": "absent",
                "publication": "unpublished",
            }
        )
    seen = {}
    for record in accepted:
        seen.setdefault(record["license_identifier"], []).append(record)
    duplicates = {license_identifier for license_identifier, group in seen.items() if len(group) > 1}
    if duplicates:
        rejected.extend(
            {"reason": "duplicate-license-in-source"}
            for record in accepted
            if record["license_identifier"] in duplicates
        )
        accepted = [record for record in accepted if record["license_identifier"] not in duplicates]
    return {"accepted": accepted, "rejected": rejected}


def map_path(path):
    return map_listing(Path(path).read_text(encoding="utf-8", errors="replace"))


def summary(mapped):
    reasons = {}
    for item in mapped["rejected"]:
        reasons[item["reason"]] = reasons.get(item["reason"], 0) + 1
    accepted = mapped["accepted"]
    return {
        "accepted": len(accepted),
        "rejected": len(mapped["rejected"]),
        "rejected_reasons": reasons,
        "unverified_addresses": sum(bool(record["unverified_address"]) for record in accepted),
        "physical_addresses": sum(record["physical_address"] is not None for record in accepted),
        "unresolved_official_export_date": sum(record["official_export_date"] is None for record in accepted),
        "unresolved_original_status": sum(record["original_status"] is None for record in accepted),
        "unresolved_facility_specific_disclosure": sum(record["disclosure_kind"] != "facility-specific" for record in accepted),
        "publication_unpublished": sum(record["publication"] == "unpublished" for record in accepted),
        "publication_public": sum(record["publication"] == "public" for record in accepted),
    }


def stage_csv(records):
    buffer = io.StringIO()
    writer = csv.DictWriter(
        buffer,
        fieldnames=[
            "license_identifier",
            "source_record_id",
            "facility_name",
            "unverified_address",
            "original_category",
        ],
        lineterminator="\n",
    )
    writer.writeheader()
    for record in records:
        writer.writerow({name: record[name] for name in writer.fieldnames})
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


def ingestion_sql(csv_text, batch_id=PILOT_BATCH):
    return f"""
select set_config('nchf.delaware_roster_ingestion_authorization', '{INGEST_AUTHORIZATION}', false);
begin;
do $guard$
begin
  if current_setting('nchf.delaware_roster_ingestion_authorization', true)
     is distinct from '{INGEST_AUTHORIZATION}' then
    raise exception 'delaware roster ingestion refused: later development-only authorization is required';
  end if;
  if to_regclass('public.nationwide_roster') is null then
    raise exception 'delaware roster ingestion refused: nationwide_roster is not present';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'nationwide_roster'
      and column_name = 'ingestion_batch_id'
  ) then
    raise exception 'delaware roster ingestion refused: ingestion_batch_id is not present';
  end if;
end
$guard$;
lock table public.nationwide_roster in share row exclusive mode;
create temp table de_stage (
  license_identifier text not null,
  source_record_id text not null,
  facility_name text not null,
  unverified_address text not null,
  original_category text not null
);
copy de_stage from stdin with (format csv, header true);
{csv_text}\\.
create temp table de_result(inserted bigint, already_present bigint);
do $load$
declare
  conflict_count bigint;
  inserted_count bigint;
  already_count bigint;
begin
  select count(*) into conflict_count
  from de_stage as incoming
  join public.nationwide_roster as existing
    on existing.state_name = 'Delaware'
   and existing.identifier_type = 'license'
   and coalesce(existing.issuing_authority, '') = '{AUTHORITY}'
   and existing.license_identifier = incoming.license_identifier
  where existing.facility_name is distinct from incoming.facility_name
     or existing.source_record_id is distinct from incoming.source_record_id
     or existing.unverified_address is distinct from incoming.unverified_address
     or existing.unverified_address_provenance is distinct from 'listed-address'
     or existing.physical_address is not null
     or existing.original_category is distinct from incoming.original_category
     or existing.official_export_date is not null
     or existing.original_status is not null
     or existing.freshness_verified
     or existing.disclosure_verified
     or existing.disclosure_kind is distinct from 'generic-search'
     or existing.disclosure_url is distinct from '{LISTING_URL}'
     or existing.publication is distinct from 'unpublished'
     or existing.coordinate_source is distinct from 'absent'
     or existing.ingestion_batch_id is distinct from '{batch_id}';
  if conflict_count > 0 then
    raise exception 'delaware roster ingestion conflict: %', conflict_count;
  end if;
  select count(*) into already_count
  from de_stage as incoming
  join public.nationwide_roster as existing
    on existing.state_name = 'Delaware'
   and existing.identifier_type = 'license'
   and coalesce(existing.issuing_authority, '') = '{AUTHORITY}'
   and existing.license_identifier = incoming.license_identifier;
  insert into public.nationwide_roster (
    state_name, license_identifier, certification_identifier, facility_identifier,
    identifier_type, issuing_authority, source_record_id, facility_name,
    physical_address, physical_address_provenance,
    unverified_address, unverified_address_provenance,
    official_export_date, source_publication_date, retrieval_timestamp,
    freshness_verified, original_category, normalized_category,
    original_status, normalized_status,
    disclosure_url, disclosure_kind, disclosure_verified, disclosure_verification_evidence,
    latitude, longitude, coordinate_source, coordinate_accuracy, publication,
    ingestion_batch_id
  )
  select
    'Delaware', incoming.license_identifier, null, null,
    'license', '{AUTHORITY}', incoming.source_record_id, incoming.facility_name,
    null, null,
    incoming.unverified_address, 'listed-address',
    null, null, null,
    false, incoming.original_category, null,
    null, null,
    '{LISTING_URL}', 'generic-search', false, null,
    null, null, 'absent', null, 'unpublished', '{batch_id}'
  from de_stage as incoming
  where not exists (
    select 1 from public.nationwide_roster as existing
    where existing.state_name = 'Delaware'
      and existing.identifier_type = 'license'
      and coalesce(existing.issuing_authority, '') = '{AUTHORITY}'
      and existing.license_identifier = incoming.license_identifier
  );
  get diagnostics inserted_count = row_count;
  if inserted_count + already_count <> (select count(*) from de_stage) then
    raise exception 'delaware roster ingestion refused: the row tally does not match';
  end if;
  insert into de_result(inserted, already_present) values (inserted_count, already_count);
end
$load$;
select 'DE_INGEST_READY' as marker, inserted, already_present from de_result;
commit;
"""


def ingest(database, records, guard=refuse_remote, batch_id=PILOT_BATCH):
    if not records:
        return {"inserted": 0, "already_present": 0, "conflicts": 0}
    try:
        output = psql(database, ingestion_sql(stage_csv(records), batch_id), guard=guard)
    except RuntimeError as error:
        match = re.search(r"ingestion conflict: (\d+)", str(error))
        if match:
            return {"inserted": 0, "already_present": 0, "conflicts": int(match.group(1))}
        raise
    if "DE_INGEST_READY" not in output or "COMMIT" not in output:
        raise RuntimeError(output)
    for line in output.splitlines():
        parts = [part.strip() for part in line.split("|")]
        if len(parts) == 3 and parts[0] == "DE_INGEST_READY":
            return {"inserted": int(parts[1]), "already_present": int(parts[2]), "conflicts": 0}
    raise RuntimeError(output)


def rollback(database, guard=refuse_remote):
    rollback_file = (
        Path(__file__).resolve().parents[2]
        / "supabase"
        / "proposals"
        / "20261110130000_delaware_roster_ingestion_ROLLBACK.sql"
    )
    output = psql(
        database,
        "select set_config('nchf.delaware_roster_rollback_authorization', "
        f"'{ROLLBACK_AUTHORIZATION}', false);\n"
        + rollback_file.read_text(encoding="utf-8"),
        guard=guard,
    )
    if "COMMIT" not in output:
        raise RuntimeError(output)
    return output
