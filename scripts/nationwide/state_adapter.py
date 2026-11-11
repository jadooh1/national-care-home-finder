"""Review interface for a future state roster.

An adapter reads a local source, maps it onto the unpublished nationwide
roster, and returns a validation report. Source-specific values stay beside
the roster row. This module does not open a database connection.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

IDENTIFIER_TYPES = ("license", "certification", "source-id", "facility-id", "object-id")
PUBLICATION_ELIGIBILITY = ("ineligible", "eligible")
MANIFEST_KEYS = (
    "state_name",
    "authority",
    "provenance",
    "extraction_date",
    "source_sha256",
    "validation",
    "publication_eligibility",
    "refresh_monitoring",
    "profile",
)
PROFILE_KEYS = (
    "categories",
    "identifier_type",
    "capacity_unit",
    "status_convention",
    "refresh_schedule",
)


@dataclass(frozen=True)
class ValidationReport:
    state_name: str
    source_label: str
    facility_records: int
    accepted: int
    rejected: int
    excluded_non_facility_rows: int
    review_flags: dict[str, int]
    rejected_reasons: dict[str, int]
    publication_public: int
    issues: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, object]:
        return {
            "state_name": self.state_name,
            "source_label": self.source_label,
            "facility_records": self.facility_records,
            "accepted": self.accepted,
            "rejected": self.rejected,
            "excluded_non_facility_rows": self.excluded_non_facility_rows,
            "review_flags": dict(self.review_flags),
            "rejected_reasons": dict(self.rejected_reasons),
            "publication_public": self.publication_public,
            "issues": list(self.issues),
        }


class StateRosterAdapter:
    """Contract implemented by each state review package."""

    state_name = ""
    authority = ""

    def profile(self) -> dict[str, object]:
        raise NotImplementedError

    def manifest(self) -> dict[str, object]:
        raise NotImplementedError

    def read(self, path: str) -> dict[str, object]:
        raise NotImplementedError

    def map_records(self, source: dict[str, object]) -> dict[str, object]:
        raise NotImplementedError

    def validate(self, mapped: dict[str, object]) -> ValidationReport:
        raise NotImplementedError

    def review(self, path: str) -> ValidationReport:
        mapped = self.map_records(self.read(path))
        report = self.validate(mapped)
        check_manifest(self.manifest(), report)
        return report


def load_manifest(path: str | Path) -> dict[str, object]:
    return validate_manifest(json.loads(Path(path).read_text(encoding="utf-8")))


def validate_manifest(manifest: dict[str, object]) -> dict[str, object]:
    missing = [key for key in MANIFEST_KEYS if key not in manifest]
    if missing:
        raise ValueError(f"onboarding manifest is missing {', '.join(missing)}")
    profile = manifest["profile"]
    if not isinstance(profile, dict):
        raise ValueError("onboarding manifest profile must be an object")
    missing_profile = [key for key in PROFILE_KEYS if key not in profile]
    if missing_profile:
        raise ValueError(f"onboarding profile is missing {', '.join(missing_profile)}")
    categories = profile["categories"]
    if not isinstance(categories, list) or not categories or not all(isinstance(item, str) and item for item in categories):
        raise ValueError("onboarding profile requires the official category labels")
    if profile["identifier_type"] not in IDENTIFIER_TYPES:
        raise ValueError("onboarding profile identifier type is not supported")
    if not str(profile["capacity_unit"]).strip():
        raise ValueError("onboarding profile requires a capacity unit")
    if not str(profile["status_convention"]).strip():
        raise ValueError("onboarding profile requires a status convention")
    if not str(profile["refresh_schedule"]).strip():
        raise ValueError("onboarding profile requires a refresh schedule")
    if manifest["publication_eligibility"] not in PUBLICATION_ELIGIBILITY:
        raise ValueError("onboarding publication eligibility is not supported")
    validation = manifest["validation"]
    if not isinstance(validation, dict) or any(not isinstance(value, int) for value in validation.values()):
        raise ValueError("onboarding validation counts must be integers")
    refresh = manifest["refresh_monitoring"]
    if not isinstance(refresh, dict) or not str(refresh.get("schedule", "")).strip():
        raise ValueError("onboarding refresh monitoring requires a schedule")
    if manifest["publication_eligibility"] == "eligible" and validation.get("expiration_review_flags", 0):
        raise ValueError("flagged license rows cannot be publication eligible")
    return manifest


def check_manifest(manifest: dict[str, object], report: ValidationReport) -> None:
    if manifest["state_name"] != report.state_name:
        raise ValueError("onboarding manifest state does not match the review")
    if manifest["publication_eligibility"] == "ineligible" and report.publication_public:
        raise ValueError("an ineligible state produced a public row")
    if manifest["publication_eligibility"] == "eligible" and manifest["validation"].get("expiration_review_flags", 0):
        raise ValueError("flagged license rows cannot be publication eligible")


def publication_eligible(record: dict[str, object]) -> bool:
    """A row can be considered for a public listing only after every gate is open."""
    if record.get("review_flags"):
        return False
    if record.get("publication") != "unpublished":
        return False
    if record.get("original_status") is None or record.get("normalized_status") is None:
        return False
    if record.get("disclosure_verified") is not True or record.get("freshness_verified") is not True:
        return False
    if not record.get("disclosure_url") or record.get("disclosure_kind") != "facility-specific":
        return False
    if not record.get("official_export_date"):
        return False
    return True


def assert_listing_closed(record: dict[str, object]) -> None:
    if record.get("publication") != "unpublished":
        raise ValueError("listing refused: publication stays unpublished")
    if record.get("original_status") is not None or record.get("normalized_status") is not None:
        raise ValueError("listing refused: license status stays unverified")
