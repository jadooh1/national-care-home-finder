"""Prepare a North Carolina roster load without publishing the state.

The script reads a local workbook or CSV. It does not download files, does not
connect to Supabase, and does not create roles or add privileges.
"""

import csv
import io
import os
import re
import subprocess
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

AUTHORITY = (
    "North Carolina Department of Health and Human Services, "
    "Division of Health Service Regulation"
)
GENERIC_SEARCH = "https://info.ncdhhs.gov/dhsr/acls/star/search.asp"
INGEST_AUTHORIZATION = "authorize-development-north-carolina-roster-ingestion"
ROLLBACK_AUTHORIZATION = "authorize-development-north-carolina-roster-rollback"
LICENSE_PATTERN = re.compile(r"^[A-Z]{3}-\d{3}-\d{3}$")
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
MAIN = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
PSQL = os.environ.get("PSQL", "psql")

WORKBOOKS = {
    "adult": {
        "category": "Adult Care Home",
        "prefix": "HAL",
        "source_prefix": "adult-care-home",
    },
    "family": {
        "category": "Family Care Home",
        "prefix": "FCL",
        "source_prefix": "family-care-home",
    },
}


def refuse_remote():
    host = os.environ.get("PGHOST", "")
    lowered = host.lower()
    if host not in {"localhost", "127.0.0.1", "::1"} or "supabase" in lowered or "pooler" in lowered:
        raise RuntimeError("Refusing to run outside a local disposable database")


def column_index(ref):
    letters = "".join(character for character in ref if character.isalpha())
    value = 0
    for character in letters:
        value = value * 26 + ord(character.upper()) - 64
    return value - 1


def cell_text(cell, shared):
    kind = cell.attrib.get("t")
    if kind == "inlineStr":
        return "".join(node.text or "" for node in cell.iter(MAIN + "t")).strip()
    value = cell.find("m:v", NS)
    text = "" if value is None or value.text is None else value.text
    if kind == "s" and text.isdigit():
        return shared[int(text)].strip()
    return text.strip()


def xlsx_rows(path):
    with zipfile.ZipFile(path) as book:
        shared = []
        if "xl/sharedStrings.xml" in book.namelist():
            root = ET.fromstring(book.read("xl/sharedStrings.xml"))
            for item in root.findall("m:si", NS):
                shared.append("".join(node.text or "" for node in item.iter(MAIN + "t")))
        sheet = next(name for name in book.namelist() if name.startswith("xl/worksheets/sheet"))
        root = ET.fromstring(book.read(sheet))
        rows = []
        for row in root.findall("m:sheetData/m:row", NS):
            cells = {}
            for cell in row.findall("m:c", NS):
                cells[column_index(cell.attrib.get("r", "A1"))] = cell_text(cell, shared)
            if any(cells.values()):
                width = max(cells) + 1
                rows.append([cells.get(index, "") for index in range(width)])
        return rows


def csv_rows(path):
    with Path(path).open(newline="", encoding="utf-8") as handle:
        return [row for row in csv.reader(handle) if any(cell.strip() for cell in row)]


def table_rows(path):
    source = Path(path)
    if source.suffix.lower() == ".csv":
        return csv_rows(source)
    if source.suffix.lower() == ".xlsx":
        return xlsx_rows(source)
    raise RuntimeError("North Carolina source must be a CSV or XLSX file")


def header_index(rows):
    for index, row in enumerate(rows[:3]):
        if "License #" in row:
            return index
    raise RuntimeError("North Carolina source is missing the License # column")


def value(row, columns, name):
    index = columns.get(name)
    if index is None or index >= len(row):
        return ""
    return row[index].strip()


def address(parts):
    return ", ".join(part.strip() for part in parts if part and part.strip())


def map_rows(rows, category, prefix, source_prefix):
    header_at = header_index(rows)
    columns = {name.strip(): index for index, name in enumerate(rows[header_at]) if name.strip()}
    for name in ("License #", "DBA Name", "Site Address", "Site City", "Site State", "Site Zip"):
        if name not in columns:
            raise RuntimeError(f"North Carolina source is missing {name}")
    accepted = []
    rejected = []
    for row in rows[header_at + 1 :]:
        license_identifier = value(row, columns, "License #")
        facility_name = value(row, columns, "DBA Name")
        site = value(row, columns, "Site Address")
        site_city = value(row, columns, "Site City")
        site_state = value(row, columns, "Site State")
        site_zip = value(row, columns, "Site Zip")
        if not license_identifier and not facility_name and not site:
            rejected.append({"reason": "not-a-facility-record"})
            continue
        if not LICENSE_PATTERN.fullmatch(license_identifier):
            rejected.append({"reason": "license-identifier-is-not-the-official-pattern"})
            continue
        if not license_identifier.startswith(prefix + "-"):
            rejected.append({"reason": "license-prefix-does-not-match-category"})
            continue
        if not facility_name:
            rejected.append({"reason": "facility-name-missing"})
            continue
        if site_state != "NC" or not site or not site_city or not site_zip:
            rejected.append({"reason": "physical-site-address-is-not-north-carolina"})
            continue
        physical = address([site, site_city, f"{site_state} {site_zip}"])
        mailing = address(
            [
                value(row, columns, "Facility Address"),
                value(row, columns, "Facility Address 2"),
                value(row, columns, "Facility City"),
                " ".join(
                    part
                    for part in (
                        value(row, columns, "Facility State"),
                        value(row, columns, "Facility Zip"),
                    )
                    if part
                ),
            ]
        )
        if mailing == physical:
            mailing = ""
        accepted.append(
            {
                "license_identifier": license_identifier,
                "source_record_id": f"{source_prefix}:{license_identifier}",
                "facility_name": facility_name,
                "physical_address": physical,
                "physical_address_provenance": "site-address",
                "mailing_address": mailing,
                "mailing_address_provenance": "facility-address" if mailing else "",
                "original_category": category,
                "official_export_date": None,
                "source_publication_date": None,
                "retrieval_timestamp": None,
                "freshness_verified": False,
                "original_status": None,
                "normalized_status": None,
                "disclosure_url": GENERIC_SEARCH,
                "disclosure_kind": "generic-search",
                "disclosure_verified": False,
                "disclosure_verification_evidence": None,
                "coordinate_source": "absent",
                "publication": "unpublished",
            }
        )
    seen = {}
    for record in accepted:
        seen.setdefault(record["license_identifier"], []).append(record)
    duplicates = {license_identifier for license_identifier, group in seen.items() if len(group) > 1}
    if duplicates:
        rejected.extend({"reason": "duplicate-license-in-source"} for _ in accepted if _["license_identifier"] in duplicates)
        accepted = [record for record in accepted if record["license_identifier"] not in duplicates]
    return {"accepted": accepted, "rejected": rejected}


def map_source(path, kind):
    spec = WORKBOOKS[kind]
    mapped = map_rows(table_rows(path), spec["category"], spec["prefix"], spec["source_prefix"])
    mapped["kind"] = kind
    return mapped


def combine(groups):
    accepted = []
    rejected = []
    for group in groups:
        accepted.extend(group["accepted"])
        rejected.extend(group["rejected"])
    licenses = [record["license_identifier"] for record in accepted]
    if len(licenses) != len(set(licenses)):
        overlap = {license_identifier for license_identifier in licenses if licenses.count(license_identifier) > 1}
        rejected.extend({"reason": "duplicate-license-across-sources"} for license_identifier in licenses if license_identifier in overlap)
        accepted = [record for record in accepted if record["license_identifier"] not in overlap]
    return {"accepted": accepted, "rejected": rejected}


def summary(mapped):
    reasons = {}
    for item in mapped["rejected"]:
        reasons[item["reason"]] = reasons.get(item["reason"], 0) + 1
    accepted = mapped["accepted"]
    return {
        "accepted": len(accepted),
        "rejected": len(mapped["rejected"]),
        "rejected_reasons": reasons,
        "adult_care_homes": sum(record["original_category"] == "Adult Care Home" for record in accepted),
        "family_care_homes": sum(record["original_category"] == "Family Care Home" for record in accepted),
        "mailing_addresses_retained": sum(bool(record["mailing_address"]) for record in accepted),
        "mailing_addresses_omitted_as_identical": sum(not record["mailing_address"] for record in accepted),
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
            "physical_address",
            "mailing_address",
            "original_category",
        ],
        lineterminator="\n",
    )
    writer.writeheader()
    for record in records:
        writer.writerow({name: record[name] for name in writer.fieldnames})
    return buffer.getvalue()


def psql(database, sql):
    refuse_remote()
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


def ingestion_sql(csv_text):
    return f"""
select set_config('nchf.north_carolina_roster_ingestion_authorization', '{INGEST_AUTHORIZATION}', false);
begin;
do $guard$
begin
  if current_setting('nchf.north_carolina_roster_ingestion_authorization', true)
     is distinct from '{INGEST_AUTHORIZATION}' then
    raise exception 'north carolina roster ingestion refused: later development-only authorization is required';
  end if;
  if to_regclass('public.nationwide_roster') is null then
    raise exception 'north carolina roster ingestion refused: nationwide_roster is not present';
  end if;
end
$guard$;
lock table public.nationwide_roster in share row exclusive mode;
create temp table nc_stage (
  license_identifier text not null,
  source_record_id text not null,
  facility_name text not null,
  physical_address text not null,
  mailing_address text,
  original_category text not null
);
copy nc_stage from stdin with (format csv, header true);
{csv_text}\\.
create temp table nc_result(inserted bigint, already_present bigint);
do $load$
declare
  conflict_count bigint;
  inserted_count bigint;
  already_count bigint;
begin
  select count(*) into conflict_count
  from nc_stage as incoming
  join public.nationwide_roster as existing
    on existing.state_name = 'North Carolina'
   and existing.identifier_type = 'license'
   and coalesce(existing.issuing_authority, '') = '{AUTHORITY}'
   and existing.license_identifier = incoming.license_identifier
  where existing.facility_name is distinct from incoming.facility_name
     or existing.source_record_id is distinct from incoming.source_record_id
     or existing.physical_address is distinct from incoming.physical_address
     or existing.physical_address_provenance is distinct from 'site-address'
     or existing.mailing_address is distinct from nullif(incoming.mailing_address, '')
     or existing.mailing_address_provenance is distinct from case
          when nullif(incoming.mailing_address, '') is null then null
          else 'facility-address'
        end
     or existing.original_category is distinct from incoming.original_category
     or existing.official_export_date is not null
     or existing.source_publication_date is not null
     or existing.retrieval_timestamp is not null
     or existing.freshness_verified
     or existing.original_status is not null
     or existing.normalized_status is not null
     or existing.disclosure_verified
     or existing.disclosure_kind is distinct from 'generic-search'
     or existing.disclosure_url is distinct from '{GENERIC_SEARCH}'
     or existing.publication is distinct from 'unpublished'
     or existing.coordinate_source is distinct from 'absent';
  if conflict_count > 0 then
    raise exception 'north carolina roster ingestion conflict: %', conflict_count;
  end if;
  select count(*) into already_count
  from nc_stage as incoming
  join public.nationwide_roster as existing
    on existing.state_name = 'North Carolina'
   and existing.identifier_type = 'license'
   and coalesce(existing.issuing_authority, '') = '{AUTHORITY}'
   and existing.license_identifier = incoming.license_identifier;
  insert into public.nationwide_roster (
    state_name, license_identifier, certification_identifier, facility_identifier,
    identifier_type, issuing_authority, source_record_id, facility_name,
    physical_address, physical_address_provenance,
    mailing_address, mailing_address_provenance,
    official_export_date, source_publication_date, retrieval_timestamp,
    freshness_verified, original_category, normalized_category,
    original_status, normalized_status,
    disclosure_url, disclosure_kind, disclosure_verified, disclosure_verification_evidence,
    latitude, longitude, coordinate_source, coordinate_accuracy, publication
  )
  select
    'North Carolina', incoming.license_identifier, null, null,
    'license', '{AUTHORITY}', incoming.source_record_id, incoming.facility_name,
    incoming.physical_address, 'site-address',
    nullif(incoming.mailing_address, ''),
    case when nullif(incoming.mailing_address, '') is null then null else 'facility-address' end,
    null, null, null,
    false, incoming.original_category, null,
    null, null,
    '{GENERIC_SEARCH}', 'generic-search', false, null,
    null, null, 'absent', null, 'unpublished'
  from nc_stage as incoming
  where not exists (
    select 1 from public.nationwide_roster as existing
    where existing.state_name = 'North Carolina'
      and existing.identifier_type = 'license'
      and coalesce(existing.issuing_authority, '') = '{AUTHORITY}'
      and existing.license_identifier = incoming.license_identifier
  );
  get diagnostics inserted_count = row_count;
  if inserted_count + already_count <> (select count(*) from nc_stage) then
    raise exception 'north carolina roster ingestion refused: the row tally does not match';
  end if;
  insert into nc_result(inserted, already_present) values (inserted_count, already_count);
end
$load$;
select 'NC_INGEST_READY' as marker, inserted, already_present from nc_result;
commit;
"""


def ingest(database, records):
    if not records:
        return {"inserted": 0, "already_present": 0, "conflicts": 0}
    try:
        output = psql(database, ingestion_sql(stage_csv(records)))
    except RuntimeError as error:
        message = str(error)
        match = re.search(r"ingestion conflict: (\d+)", message)
        if match:
            return {"inserted": 0, "already_present": 0, "conflicts": int(match.group(1))}
        raise
    if "NC_INGEST_READY" not in output or "COMMIT" not in output:
        raise RuntimeError(output)
    for line in output.splitlines():
        parts = [part.strip() for part in line.split("|")]
        if len(parts) == 3 and parts[0] == "NC_INGEST_READY":
            return {"inserted": int(parts[1]), "already_present": int(parts[2]), "conflicts": 0}
    raise RuntimeError(output)


def rollback(database):
    rollback_file = (
        Path(__file__).resolve().parents[2]
        / "supabase"
        / "proposals"
        / "20261110110000_north_carolina_roster_ingestion_ROLLBACK.sql"
    )
    output = psql(
        database,
        "select set_config('nchf.north_carolina_roster_rollback_authorization', "
        f"'{ROLLBACK_AUTHORIZATION}', false);\n"
        + rollback_file.read_text(encoding="utf-8"),
    )
    if "COMMIT" not in output:
        raise RuntimeError(output)
    return output
