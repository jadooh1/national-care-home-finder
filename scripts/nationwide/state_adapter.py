"""Review interface for a future state roster.

An adapter reads a local source, maps it onto the unpublished nationwide
roster, and returns a validation report. It does not open a database
connection and it does not publish a directory.
"""

from __future__ import annotations

from dataclasses import dataclass


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

    def read(self, path: str) -> dict[str, object]:
        raise NotImplementedError

    def map_records(self, source: dict[str, object]) -> dict[str, object]:
        raise NotImplementedError

    def validate(self, mapped: dict[str, object]) -> ValidationReport:
        raise NotImplementedError

    def review(self, path: str) -> ValidationReport:
        return self.validate(self.map_records(self.read(path)))
