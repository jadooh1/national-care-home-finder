"""Prepare a North Carolina roster load without publishing the state.

The script reads a local workbook or CSV. It does not download files, does not
connect to Supabase, and does not create roles or add privileges.
"""

import csv
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

from roster_ingestion import Pilot, ingest_batch, refuse_remote, reject_duplicate_licenses, rollback_batch

AUTHORITY = (
    "North Carolina Department of Health and Human Services, "
    "Division of Health Service Regulation"
)
GENERIC_SEARCH = "https://info.ncdhhs.gov/dhsr/acls/star/search.asp"
INGEST_AUTHORIZATION = "authorize-development-north-carolina-roster-ingestion"
ROLLBACK_AUTHORIZATION = "authorize-development-north-carolina-roster-rollback"
PILOT_BATCH = "north-carolina-dhhs-roster-pilot-20261110"
PILOT = Pilot(
    state_name="North Carolina",
    authority=AUTHORITY,
    batch_id=PILOT_BATCH,
    disclosure_url=GENERIC_SEARCH,
    ingest_guc="nchf.north_carolina_roster_ingestion_authorization",
    ingest_authorization=INGEST_AUTHORIZATION,
    rollback_guc="nchf.north_carolina_roster_rollback_authorization",
    rollback_authorization=ROLLBACK_AUTHORIZATION,
    rollback_filename="20261110110000_north_carolina_roster_ingestion_ROLLBACK.sql",
)
LICENSE_PATTERN = re.compile(r"^[A-Z]{3}-\d{3}-\d{3}$")
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
MAIN = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

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


def ingest(database, records, guard=refuse_remote, batch_id=PILOT_BATCH):
    return ingest_batch(database, PILOT, records, guard=guard, batch_id=batch_id)


def rollback(database, guard=refuse_remote):
    return rollback_batch(database, PILOT, guard=guard)


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
    accepted, rejected = reject_duplicate_licenses(accepted, rejected, "duplicate-license-in-source")
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
