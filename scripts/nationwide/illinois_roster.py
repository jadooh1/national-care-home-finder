"""Illinois Department of Public Health roster review.

The official workbook stays outside the repository. This module maps its
Assisted Living/Shared Housing rows onto unpublished nationwide-roster
records and reports data-quality findings. It does not connect to a database.
"""

from __future__ import annotations

import hashlib
import re
import zipfile
from datetime import date, datetime, timedelta
from pathlib import Path
from xml.etree import ElementTree as ET

from roster_ingestion import assert_validated_extraction_date
from state_adapter import StateRosterAdapter, ValidationReport, assert_listing_closed, load_manifest, publication_eligible

AUTHORITY = "Illinois Department of Public Health"
FOIA_REQUEST = "DPH 26-2017"
ASSISTED_LIVING_CATEGORY = "Assisted Living/Shared Housing Establishment"
SOURCE_FILENAME = "3 liner with License-2026-10-28-16-16-10.xlsx"
SOURCE_SHA256 = "de048fc9f80c73615831dffedc01474c07c0cb59c8952e92d653f3f1727b907a"
ILLINOIS_BATCH_ID = "illinois-idph-assisted-living-20261028"
BASELINE = {
    "facility_records": 1459,
    "assisted_living_records": 502,
    "assisted_living_units": 27823,
    "expired_before_extract": 17,
    "duplicate_facility_ids": 0,
    "missing_facility_ids": 0,
}

LICENSEE_ID = "Licensee ID"
EFFECTIVE_DATE = "Effective Date"
EXPIRATION_DATE = "Expiration Date"
FACILITY_ID = "Facility ID"
FACILITY_NAME = "Facility/Establishment Name"
STREET = "Facility Street Address"
CITY = "Facility City"
STATE = "Facility State"
ZIP = "Facility Zip Code"
COUNTY = "Facility County"
FACILITY_TYPE = "Facility Type"
ENTITY = "Type of Entity"
UNITS = "Total number of AL /SH units for license"
MANIFEST_PATH = (
    Path(__file__).resolve().parents[2] / "supabase" / "proposals" / "onboarding" / "illinois.json"
)
ROSTER_SOURCE_FIELDS = {
    FACILITY_ID,
    FACILITY_NAME,
    STREET,
    CITY,
    STATE,
    ZIP,
    FACILITY_TYPE,
}

ROSTER_COLUMNS = (
    "state_name",
    "identifier_type",
    "facility_identifier",
    "license_identifier",
    "certification_identifier",
    "source_record_id",
    "issuing_authority",
    "facility_name",
    "physical_address",
    "physical_address_provenance",
    "mailing_address",
    "mailing_address_provenance",
    "unverified_address",
    "unverified_address_provenance",
    "official_export_date",
    "source_publication_date",
    "freshness_verified",
    "original_category",
    "normalized_category",
    "original_status",
    "normalized_status",
    "disclosure_url",
    "disclosure_kind",
    "disclosure_verified",
    "coordinate_source",
    "publication",
)

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
EXTRACT_DATE = re.compile(r"As of (\d{4}-\d{2}-\d{2})")
EXCEL_EPOCH = date(1899, 12, 30)


def sha256_file(path: str | Path) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _column(reference: str) -> str:
    return "".join(character for character in reference if character.isalpha())


def _cell_text(cell: ET.Element, shared: list[str]) -> str:
    kind = cell.get("t")
    if kind == "inlineStr":
        return "".join(node.text or "" for node in cell.iter(f"{{{NS['m']}}}t")).strip()
    value = cell.find("m:v", NS)
    text = "" if value is None or value.text is None else value.text
    if kind == "s" and text.isdigit():
        return shared[int(text)].strip()
    return text.strip()


def _parse_date(value: str) -> date | None:
    text = value.strip()
    for pattern in ("%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, pattern).date()
        except ValueError:
            continue
    if text.isdigit():
        serial = int(text)
        if 1 <= serial <= 80000:
            return EXCEL_EPOCH + timedelta(days=serial)
    return None


def read_xlsx(path: str | Path) -> dict[str, object]:
    """Read the official workbook without changing it."""
    workbook = Path(path)
    with zipfile.ZipFile(workbook) as book:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in book.namelist():
            root = ET.fromstring(book.read("xl/sharedStrings.xml"))
            for item in root.findall("m:si", NS):
                shared.append("".join(node.text or "" for node in item.iter(f"{{{NS['m']}}}t")))
        sheet = ET.fromstring(book.read("xl/worksheets/sheet1.xml"))

    matrix: list[dict[str, str]] = []
    for row in sheet.findall("m:sheetData/m:row", NS):
        values: dict[str, str] = {}
        for cell in row.findall("m:c", NS):
            values[_column(cell.get("r", ""))] = _cell_text(cell, shared)
        matrix.append(values)

    extract_date = ""
    header_index = None
    for index, row in enumerate(matrix):
        joined = " ".join(row.values())
        match = EXTRACT_DATE.search(joined)
        if match and not extract_date:
            extract_date = match.group(1)
        if FACILITY_ID in row.values() and FACILITY_TYPE in row.values():
            header_index = index
            break
    if header_index is None or not extract_date:
        raise ValueError("Illinois workbook is missing its extract date or header row")

    headers = matrix[header_index]
    column_for = {name: column for column, name in headers.items() if name}
    records: list[dict[str, str]] = []
    excluded: list[dict[str, str]] = []
    for row in matrix[header_index + 1 :]:
        named = {name: row.get(column, "") for name, column in column_for.items()}
        if not any(named.values()):
            continue
        facility_id = named.get(FACILITY_ID, "")
        facility_type = named.get(FACILITY_TYPE, "")
        if facility_id:
            records.append(named)
            continue
        if facility_type:
            records.append(named)
            continue
        reason = "capacity-total-row" if named.get(UNITS, "").isdigit() else "non-facility-row"
        excluded.append({"reason": reason})
    return {
        "extract_date": extract_date,
        "rows": records,
        "excluded": excluded,
        "sha256": sha256_file(workbook),
    }


def _reject(bucket: list[dict[str, str]], reason: str) -> None:
    bucket.append({"reason": reason})


def map_source(source: dict[str, object]) -> dict[str, object]:
    extract = date.fromisoformat(str(source["extract_date"]))
    accepted: list[dict[str, object]] = []
    rejected: list[dict[str, str]] = []
    out_of_scope: dict[str, int] = {}
    seen_facilities: set[str] = set()
    seen_licensees: set[str] = set()
    for row in source["rows"]:
        if not isinstance(row, dict):
            continue
        category = str(row.get(FACILITY_TYPE, "")).strip()
        if category != ASSISTED_LIVING_CATEGORY:
            out_of_scope[category or "(blank)"] = out_of_scope.get(category or "(blank)", 0) + 1
            continue
        facility_id = str(row.get(FACILITY_ID, "")).strip()
        licensee_id = str(row.get(LICENSEE_ID, "")).strip()
        if not facility_id.isdigit():
            _reject(rejected, "missing-or-nonnumeric-facility-id")
            continue
        if facility_id in seen_facilities:
            _reject(rejected, "duplicate-facility-id")
            continue
        seen_facilities.add(facility_id)
        if not licensee_id.isdigit():
            _reject(rejected, "missing-or-nonnumeric-licensee-id")
            continue
        if licensee_id in seen_licensees:
            _reject(rejected, "duplicate-licensee-id")
            continue
        seen_licensees.add(licensee_id)
        if not str(row.get(FACILITY_NAME, "")).strip():
            _reject(rejected, "missing-facility-name")
            continue
        street = str(row.get(STREET, "")).strip()
        city = str(row.get(CITY, "")).strip()
        state_name = str(row.get(STATE, "")).strip()
        zip_code = str(row.get(ZIP, "")).strip()
        if not street or not city:
            _reject(rejected, "missing-listed-address")
            continue
        if state_name != "Illinois":
            _reject(rejected, "listed-state-is-not-illinois")
            continue
        if not re.fullmatch(r"\d{5}", zip_code):
            _reject(rejected, "zip-code-is-not-five-digits")
            continue
        effective = _parse_date(str(row.get(EFFECTIVE_DATE, "")))
        expiration = _parse_date(str(row.get(EXPIRATION_DATE, "")))
        if effective is None or expiration is None:
            _reject(rejected, "unparseable-license-date")
            continue
        if effective > expiration:
            _reject(rejected, "effective-date-after-expiration")
            continue
        units = str(row.get(UNITS, "")).strip()
        if not units.isdigit():
            _reject(rejected, "alsh-units-are-not-numeric")
            continue
        flags: list[str] = []
        if expiration < extract:
            flags.append("expiration-precedes-extract")
        accepted.append(
            {
                "state_name": "Illinois",
                "identifier_type": "facility-id",
                "facility_identifier": facility_id,
                "license_identifier": None,
                "certification_identifier": None,
                "source_record_id": f"idph-licensee:{licensee_id}",
                "issuing_authority": AUTHORITY,
                "facility_name": str(row.get(FACILITY_NAME, "")).strip(),
                "physical_address": None,
                "physical_address_provenance": None,
                "mailing_address": None,
                "mailing_address_provenance": None,
                "unverified_address": f"{street}, {city}, Illinois {zip_code}",
                "unverified_address_provenance": "idph-listed-address",
                "official_export_date": extract.isoformat(),
                "source_publication_date": extract.isoformat(),
                "freshness_verified": False,
                "original_category": ASSISTED_LIVING_CATEGORY,
                "normalized_category": ASSISTED_LIVING_CATEGORY,
                "original_status": None,
                "normalized_status": None,
                "disclosure_url": None,
                "disclosure_kind": None,
                "disclosure_verified": False,
                "coordinate_source": "absent",
                "publication": "unpublished",
                "review_flags": flags,
                "reported_alsh_units": int(units),
                "source_attributes": source_attributes(row, flags),
            }
        )
    return {
        "extract_date": extract.isoformat(),
        "accepted": accepted,
        "rejected": rejected,
        "excluded": list(source.get("excluded", [])),
        "out_of_scope": out_of_scope,
        "sha256": source.get("sha256"),
    }


def source_attributes(row: dict[str, str], flags: list[str]) -> dict[str, object]:
    """Official values that the national roster does not have a column for."""
    retained = {
        key: value
        for key, value in row.items()
        if key not in ROSTER_SOURCE_FIELDS and str(value).strip()
    }
    retained["review_flags"] = list(flags)
    return retained


def _iso_date(value: object) -> str | None:
    text = str(value or "").strip()
    if not text:
        return None
    parsed = _parse_date(text)
    if parsed is None:
        raise ValueError("source date is not parseable")
    return parsed.isoformat()


def source_record_row(record: dict[str, object], extraction_date: str, digest: str) -> dict[str, object]:
    """State-specific retention row. It is not a nationwide_roster row."""
    attributes = dict(record["source_attributes"])
    publication = record.get("publication")
    if publication != "unpublished":
        raise ValueError("Illinois source row refuses a published candidate")
    return {
        "state_name": "Illinois",
        "issuing_authority": AUTHORITY,
        "identifier_type": "facility-id",
        "facility_identifier": record["facility_identifier"],
        "license_identifier": None,
        "certification_identifier": None,
        "source_record_id": record["source_record_id"],
        "original_identifiers": {
            "Facility ID": record["facility_identifier"],
            "Licensee ID": attributes.get(LICENSEE_ID),
        },
        "source_attributes": attributes,
        "provenance": FOIA_REQUEST,
        "source_sha256": digest,
        "extraction_date": extraction_date,
        "source_effective_date": _iso_date(attributes.get(EFFECTIVE_DATE)),
        "source_expiration_date": _iso_date(attributes.get(EXPIRATION_DATE)),
        "review_flags": list(record["review_flags"]),
        "original_status": None,
        "normalized_status": None,
        "publication": "unpublished",
        "ingestion_batch_id": ILLINOIS_BATCH_ID,
        "official_export_date": extraction_date,
        "disclosure_verified": False,
        "freshness_verified": False,
        "physical_address": None,
        "unverified_address": record["unverified_address"],
    }


def roster_row(record: dict[str, object]) -> dict[str, object]:
    """Projection that can later be staged. Review-only fields stay off the row."""
    assert_listing_closed(record)
    if record.get("original_category") != ASSISTED_LIVING_CATEGORY:
        raise ValueError("Illinois staging refuses a reclassified category")
    projected = {column: record.get(column) for column in ROSTER_COLUMNS}
    if "source_attributes" in projected or "review_flags" in projected:
        raise ValueError("Illinois staging refuses a source attribute on the national row")
    return projected


def summary(mapped: dict[str, object]) -> dict[str, object]:
    accepted = list(mapped["accepted"])
    rejected = list(mapped["rejected"])
    excluded = list(mapped["excluded"])
    reasons: dict[str, int] = {}
    for item in rejected:
        reasons[item["reason"]] = reasons.get(item["reason"], 0) + 1
    flags: dict[str, int] = {}
    for record in accepted:
        for flag in record["review_flags"]:
            flags[flag] = flags.get(flag, 0) + 1
    return {
        "facility_records": len(accepted) + len(rejected) + sum(mapped["out_of_scope"].values()),
        "accepted": len(accepted),
        "rejected": len(rejected),
        "assisted_living_units": sum(record["reported_alsh_units"] for record in accepted),
        "review_flags": flags,
        "rejected_reasons": reasons,
        "excluded": len(excluded),
        "excluded_reasons": {
            reason: sum(item["reason"] == reason for item in excluded)
            for reason in {item["reason"] for item in excluded}
        },
        "out_of_scope": dict(mapped["out_of_scope"]),
        "publication_public": sum(record["publication"] == "public" for record in accepted),
        "physical_addresses": sum(record["physical_address"] is not None for record in accepted),
    }


class IllinoisRoster(StateRosterAdapter):
    state_name = "Illinois"
    authority = AUTHORITY

    def profile(self) -> dict[str, object]:
        return dict(self.manifest()["profile"])

    def manifest(self) -> dict[str, object]:
        return load_manifest(MANIFEST_PATH)

    def read(self, path: str) -> dict[str, object]:
        return read_xlsx(path)

    def map_records(self, source: dict[str, object]) -> dict[str, object]:
        return map_source(source)

    def validate(self, mapped: dict[str, object]) -> ValidationReport:
        counts = summary(mapped)
        issues: list[str] = []
        if counts["publication_public"]:
            issues.append("a mapped row is marked public")
        if counts["physical_addresses"]:
            issues.append("a listed address was copied into the physical address")
        expired = counts["review_flags"].get("expiration-precedes-extract", 0)
        if expired:
            issues.append(
                f"{expired} Assisted Living/Shared Housing expirations precede the extract date and need official status verification"
            )
        stray = counts["excluded_reasons"].get("non-facility-row", 0)
        if stray:
            issues.append(f"{stray} non-facility row excluded from ingestion")
        return ValidationReport(
            state_name=self.state_name,
            source_label=f"{FOIA_REQUEST} {mapped['extract_date']}",
            facility_records=counts["facility_records"],
            accepted=counts["accepted"],
            rejected=counts["rejected"],
            excluded_non_facility_rows=counts["excluded"],
            review_flags=counts["review_flags"],
            rejected_reasons=counts["rejected_reasons"],
            publication_public=counts["publication_public"],
            issues=tuple(issues),
        )


def illinois_source_batch(mapped: dict[str, object], digest: str) -> list[dict[str, object]]:
    extraction_date = str(mapped["extract_date"])
    rows = [source_record_row(record, extraction_date, digest) for record in mapped["accepted"]]
    assert_validated_extraction_date(rows, extraction_date)
    if any(row["publication"] != "unpublished" or row["normalized_status"] is not None for row in rows):
        raise ValueError("Illinois source batch refuses a listing status")
    return rows


def matches_baseline(mapped: dict[str, object], digest: str) -> bool:
    counts = summary(mapped)
    return (
        digest == SOURCE_SHA256
        and counts["facility_records"] == BASELINE["facility_records"]
        and counts["accepted"] == BASELINE["assisted_living_records"]
        and counts["rejected"] == 0
        and counts["assisted_living_units"] == BASELINE["assisted_living_units"]
        and counts["review_flags"].get("expiration-precedes-extract", 0) == BASELINE["expired_before_extract"]
        and counts["excluded_reasons"].get("capacity-total-row", 0) == 1
        and counts["excluded_reasons"].get("non-facility-row", 0) == 1
    )
