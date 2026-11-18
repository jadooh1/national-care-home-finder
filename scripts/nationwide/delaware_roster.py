"""Prepare a Delaware assisted-living roster load without publishing the state.

The parser reads a local HTML listing. It does not download files, does not
connect to Supabase, and does not create roles or add privileges. The default
database guard accepts only localhost.
"""

import re
from pathlib import Path

from roster_ingestion import Pilot, ingest_batch, refuse_remote, reject_duplicate_licenses, rollback_batch

AUTHORITY = (
    "Delaware Department of Health and Social Services, "
    "Division of Health Care Quality"
)
LISTING_URL = "https://dhss.delaware.gov/dhcq/dhcq/licensed-assisted-living-facilities/"
CATEGORY = "Licensed Assisted Living Facility"
INGEST_AUTHORIZATION = "authorize-development-delaware-roster-ingestion"
ROLLBACK_AUTHORIZATION = "authorize-development-delaware-roster-rollback"
PILOT_BATCH = "delaware-dhcq-assisted-living-pilot-20261110"
PILOT = Pilot(
    state_name="Delaware",
    authority=AUTHORITY,
    batch_id=PILOT_BATCH,
    disclosure_url=LISTING_URL,
    ingest_guc="nchf.delaware_roster_ingestion_authorization",
    ingest_authorization=INGEST_AUTHORIZATION,
    rollback_guc="nchf.delaware_roster_rollback_authorization",
    rollback_authorization=ROLLBACK_AUTHORIZATION,
    rollback_filename="20261110130000_delaware_roster_ingestion_ROLLBACK.sql",
)
LICENSE_PATTERN = re.compile(r"^\d+$")
DELAWARE_ADDRESS = re.compile(r"\bDE\s+\d{5}(?:-\d{4})?\s*$")


def ingest(database, records, guard=refuse_remote, batch_id=PILOT_BATCH):
    return ingest_batch(database, PILOT, records, guard=guard, batch_id=batch_id)


def rollback(database, guard=refuse_remote):
    return rollback_batch(database, PILOT, guard=guard)


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
    accepted, rejected = reject_duplicate_licenses(accepted, rejected, "duplicate-license-in-source")
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
