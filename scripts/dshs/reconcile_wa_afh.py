"""Compare a DSHS adult-family-home snapshot with the approved published catalog.

The comparison reads and writes local files only. It does not connect to a
database. A later refresh, if an owner approves one, may change official DSHS
fields for licenses in this report. It must not change owner claims, listing
edits, published owner text, unverified records, Oregon listings, security
policies, authentication, or DNS.
"""

from __future__ import annotations

import argparse
import csv
import sys
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

BASELINE_PATH = Path(__file__).resolve().parent / "baselines" / "wa_afh_published_20261109.csv"
BASELINE_RETRIEVED_AT = "2026-11-09T05:54:02Z"
BASELINE_COUNT = 6278
MAX_SOURCE_AGE = timedelta(days=8)
MAX_NEW = 100
MAX_ARCHIVED = 40
MAX_FIELD_CHANGES = 400
CAPACITY_MIN = 1
CAPACITY_MAX = 16
LATITUDE_RANGE = (45.0, 50.0)
LONGITUDE_RANGE = (-125.0, -116.0)
EXAMPLE_LIMIT = 10

CATALOG_FIELDS = (
    "license_number",
    "facility_name",
    "address",
    "city",
    "county",
    "postal_code",
    "licensed_capacity",
    "license_status",
    "latitude",
    "longitude",
)
SOURCE_TO_CATALOG = {
    "LicenseNumber": "license_number",
    "FacilityName": "facility_name",
    "LocationAddress": "address",
    "LocationCity": "city",
    "LocationCounty": "county",
    "LocationZipCode": "postal_code",
    "LicensedBedCount": "licensed_capacity",
    "FacilityStatus": "license_status",
    "Latitude": "latitude",
    "Longitude": "longitude",
}
ADDRESS_FIELDS = ("address", "city", "county", "postal_code")
COMPARED_FIELDS = (
    "facility_name",
    "address",
    "city",
    "county",
    "postal_code",
    "licensed_capacity",
    "license_status",
    "latitude",
    "longitude",
)
REQUIRED_FIELDS = COMPARED_FIELDS


@dataclass(frozen=True)
class Facility:
    license_number: str
    facility_name: str
    address: str
    city: str
    county: str
    postal_code: str
    licensed_capacity: str
    license_status: str
    latitude: str
    longitude: str

    def value(self, field: str) -> str:
        return getattr(self, field)


@dataclass(frozen=True)
class Change:
    change_type: str
    license_number: str
    field: str
    catalog_value: str
    source_value: str


@dataclass(frozen=True)
class Reconciliation:
    catalog_count: int
    source_count: int
    new_licenses: tuple[str, ...]
    archived_licenses: tuple[str, ...]
    name_changes: tuple[str, ...]
    address_changes: tuple[str, ...]
    capacity_changes: tuple[str, ...]
    status_changes: tuple[str, ...]
    coordinate_only_changes: tuple[str, ...]
    duplicate_licenses: tuple[str, ...]
    changes: tuple[Change, ...]
    anomalies: tuple[str, ...]

    @property
    def field_change_count(self) -> int:
        changed = set(self.name_changes)
        changed.update(self.address_changes)
        changed.update(self.capacity_changes)
        changed.update(self.status_changes)
        changed.update(self.coordinate_only_changes)
        return len(changed)


def parse_time(value: str) -> datetime:
    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    parsed = datetime.fromisoformat(text)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def clean(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()


def capacity(value: str) -> str:
    if value == "":
        return ""
    try:
        number = float(value)
    except ValueError:
        return value
    if number != int(number):
        return value
    return str(int(number))


def coordinate(value: str) -> str:
    if value == "":
        return ""
    try:
        number = float(value)
    except ValueError:
        return value
    return f"{number:.6f}"


def normalize_field(field: str, value: str) -> str:
    if field == "licensed_capacity":
        return capacity(value)
    if field in ("latitude", "longitude"):
        return coordinate(value)
    return value


def facility_from_mapping(row: dict[str, str]) -> Facility:
    return Facility(
        license_number=clean(row.get("license_number")),
        facility_name=clean(row.get("facility_name")),
        address=clean(row.get("address")),
        city=clean(row.get("city")),
        county=clean(row.get("county")),
        postal_code=clean(row.get("postal_code")),
        licensed_capacity=capacity(clean(row.get("licensed_capacity"))),
        license_status=clean(row.get("license_status")),
        latitude=coordinate(clean(row.get("latitude"))),
        longitude=coordinate(clean(row.get("longitude"))),
    )


def load_facilities(path: Path) -> list[Facility]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise ValueError(f"{path} has no header.")
        header = [name.strip() for name in reader.fieldnames]
        if set(CATALOG_FIELDS).issubset(header):
            mapping = {name: name for name in CATALOG_FIELDS}
        elif set(SOURCE_TO_CATALOG).issubset(header):
            mapping = SOURCE_TO_CATALOG
        else:
            raise ValueError(f"{path} is not a DSHS source file or published catalog.")
        facilities = []
        for raw in reader:
            mapped = {target: raw.get(source, "") for source, target in mapping.items()}
            facilities.append(facility_from_mapping(mapped))
    return facilities


def write_catalog(facilities: list[Facility], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(CATALOG_FIELDS))
        writer.writeheader()
        for facility in facilities:
            writer.writerow({field: facility.value(field) for field in CATALOG_FIELDS})


def index_facilities(facilities: list[Facility]) -> tuple[dict[str, list[Facility]], tuple[str, ...]]:
    grouped: dict[str, list[Facility]] = defaultdict(list)
    for facility in facilities:
        if facility.license_number:
            grouped[facility.license_number].append(facility)
    duplicates = tuple(sorted(license_number for license_number, rows in grouped.items() if len(rows) > 1))
    return grouped, duplicates


def source_anomalies(facilities: list[Facility]) -> list[str]:
    anomalies = []
    missing_license = sum(1 for facility in facilities if not facility.license_number)
    if missing_license:
        anomalies.append(f"{missing_license} source rows have no license number.")
    non_numeric = sorted(
        facility.license_number
        for facility in facilities
        if facility.license_number and not facility.license_number.isdigit()
    )
    if non_numeric:
        anomalies.append(f"{len(non_numeric)} license numbers are not numeric, including {non_numeric[0]}.")
    missing_required = 0
    outside_area = 0
    invalid_capacity = 0
    unexpected_status = 0
    for facility in facilities:
        if any(facility.value(field) == "" for field in REQUIRED_FIELDS):
            missing_required += 1
        try:
            latitude = float(facility.latitude)
            longitude = float(facility.longitude)
            outside = (
                latitude < LATITUDE_RANGE[0]
                or latitude > LATITUDE_RANGE[1]
                or longitude < LONGITUDE_RANGE[0]
                or longitude > LONGITUDE_RANGE[1]
            )
        except ValueError:
            outside = facility.latitude != "" or facility.longitude != ""
        if outside:
            outside_area += 1
        try:
            beds = int(facility.licensed_capacity)
            invalid_beds = beds < CAPACITY_MIN or beds > CAPACITY_MAX
        except ValueError:
            invalid_beds = True
        if invalid_beds:
            invalid_capacity += 1
        if facility.license_status != "OP":
            unexpected_status += 1
    if missing_required:
        anomalies.append(f"{missing_required} source rows are missing a required official field.")
    if outside_area:
        anomalies.append(f"{outside_area} source rows are outside the Washington coordinate bounds.")
    if invalid_capacity:
        anomalies.append(
            f"{invalid_capacity} source rows have a licensed capacity outside {CAPACITY_MIN} to {CAPACITY_MAX}."
        )
    if unexpected_status:
        anomalies.append(f"{unexpected_status} source rows have a status other than OP.")
    return anomalies


def reconcile(
    catalog: list[Facility],
    source: list[Facility],
    retrieved_at: datetime,
    now: datetime,
) -> Reconciliation:
    catalog_index, catalog_duplicates = index_facilities(catalog)
    source_index, source_duplicates = index_facilities(source)
    duplicates = tuple(sorted(set(catalog_duplicates) | set(source_duplicates)))
    duplicate_set = set(duplicates)
    anomalies = source_anomalies(source)
    if catalog_duplicates:
        anomalies.append(f"The published catalog has {len(catalog_duplicates)} duplicate licenses.")
    if source_duplicates:
        anomalies.append(f"The DSHS source has {len(source_duplicates)} duplicate licenses.")
    blank_catalog = sum(1 for facility in catalog if not facility.license_number)
    if blank_catalog:
        anomalies.append(f"{blank_catalog} catalog rows have no license number.")
    if len(source) != len(source_index):
        anomalies.append(
            f"The source has {len(source)} rows but {len(source_index)} licenses with a value."
        )
    age = now - retrieved_at
    if age > MAX_SOURCE_AGE:
        anomalies.append(f"The source was retrieved {age.days} days before this check.")
    if retrieved_at - now > timedelta(days=1):
        anomalies.append("The source retrieval time is in the future.")

    new_licenses = tuple(sorted(set(source_index) - set(catalog_index) - duplicate_set))
    archived_licenses = tuple(sorted(set(catalog_index) - set(source_index) - duplicate_set))
    changes: list[Change] = []
    name_changes = []
    address_changes = []
    capacity_changes = []
    status_changes = []
    coordinate_only = []
    for license_number in sorted(set(catalog_index) & set(source_index) - duplicate_set):
        current = catalog_index[license_number][0]
        incoming = source_index[license_number][0]
        differed = []
        for field in COMPARED_FIELDS:
            catalog_value = normalize_field(field, current.value(field))
            source_value = normalize_field(field, incoming.value(field))
            if catalog_value == source_value:
                continue
            change_type = {
                "facility_name": "name",
                "licensed_capacity": "capacity",
                "license_status": "status",
            }.get(field, field)
            differed.append(field)
            changes.append(
                Change(change_type, license_number, field, catalog_value, source_value)
            )
        if "facility_name" in differed:
            name_changes.append(license_number)
        if any(field in differed for field in ADDRESS_FIELDS):
            address_changes.append(license_number)
        if "licensed_capacity" in differed:
            capacity_changes.append(license_number)
        if "license_status" in differed:
            status_changes.append(license_number)
        if differed and all(field in ("latitude", "longitude") for field in differed):
            coordinate_only.append(license_number)
    for license_number in new_licenses:
        incoming = source_index[license_number][0]
        changes.append(Change("new", license_number, "license_number", "", incoming.facility_name))
    for license_number in archived_licenses:
        current = catalog_index[license_number][0]
        changes.append(Change("archived", license_number, "license_number", current.facility_name, ""))

    if len(new_licenses) > MAX_NEW:
        anomalies.append(f"{len(new_licenses)} new licenses exceed the review guard of {MAX_NEW}.")
    if len(archived_licenses) > MAX_ARCHIVED:
        anomalies.append(
            f"{len(archived_licenses)} archived candidates exceed the review guard of {MAX_ARCHIVED}."
        )
    field_changes = set(name_changes + address_changes + capacity_changes + status_changes + coordinate_only)
    if len(field_changes) > MAX_FIELD_CHANGES:
        anomalies.append(
            f"{len(field_changes)} field changes exceed the review guard of {MAX_FIELD_CHANGES}."
        )
    return Reconciliation(
        catalog_count=len(catalog_index),
        source_count=len(source_index),
        new_licenses=new_licenses,
        archived_licenses=archived_licenses,
        name_changes=tuple(name_changes),
        address_changes=tuple(address_changes),
        capacity_changes=tuple(capacity_changes),
        status_changes=tuple(status_changes),
        coordinate_only_changes=tuple(coordinate_only),
        duplicate_licenses=duplicates,
        changes=tuple(sorted(changes, key=lambda change: (change.license_number, change.field, change.change_type))),
        anomalies=tuple(anomalies),
    )


def examples(licenses: tuple[str, ...]) -> str:
    if not licenses:
        return "none"
    shown = ", ".join(licenses[:EXAMPLE_LIMIT])
    remaining = len(licenses) - EXAMPLE_LIMIT
    if remaining > 0:
        return f"{shown}, and {remaining} more"
    return shown


def render_report(result: Reconciliation, retrieved_at: datetime) -> str:
    lines = [
        "Washington DSHS adult family home reconciliation",
        f"Source retrieved: {retrieved_at.isoformat().replace('+00:00', 'Z')}",
        f"Published catalog licenses: {result.catalog_count}",
        f"Current source licenses: {result.source_count}",
        f"New licenses: {len(result.new_licenses)} ({examples(result.new_licenses)})",
        f"Archived candidates: {len(result.archived_licenses)} ({examples(result.archived_licenses)})",
        f"Name corrections: {len(result.name_changes)} ({examples(result.name_changes)})",
        f"Address corrections: {len(result.address_changes)} ({examples(result.address_changes)})",
        f"Capacity changes: {len(result.capacity_changes)} ({examples(result.capacity_changes)})",
        f"Status changes: {len(result.status_changes)} ({examples(result.status_changes)})",
        f"Coordinate-only changes: {len(result.coordinate_only_changes)} ({examples(result.coordinate_only_changes)})",
        f"Duplicate licenses: {len(result.duplicate_licenses)} ({examples(result.duplicate_licenses)})",
        f"Anomalies: {len(result.anomalies)}",
    ]
    if result.anomalies:
        lines.extend(f"- {anomaly}" for anomaly in result.anomalies)
    else:
        lines.append("- none")
    lines.extend(
        [
            "",
            "This check does not write to a database.",
            "Official DSHS fields in this report are the only fields a later approved refresh may change.",
            "Do not change owner claims, listing edits, published owner text, or unverified records.",
            "Do not publish Oregon listings or change security policies, authentication, or DNS.",
        ]
    )
    return "\n".join(lines) + "\n"


def write_changes(result: Reconciliation, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=("change_type", "license_number", "field", "catalog_value", "source_value"),
        )
        writer.writeheader()
        for change in result.changes:
            writer.writerow(
                {
                    "change_type": change.change_type,
                    "license_number": change.license_number,
                    "field": change.field,
                    "catalog_value": change.catalog_value,
                    "source_value": change.source_value,
                }
            )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Reconcile a DSHS snapshot with the published catalog.")
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--catalog", type=Path)
    parser.add_argument("--retrieved-at")
    parser.add_argument("--now")
    parser.add_argument("--report", type=Path)
    parser.add_argument("--changes", type=Path)
    parser.add_argument("--write-catalog", type=Path)
    args = parser.parse_args(argv)
    try:
        source = load_facilities(args.source)
        if args.write_catalog:
            write_catalog(source, args.write_catalog)
            print(f"Wrote {len(source)} catalog rows to {args.write_catalog}")
            return 0
        if args.catalog is None or args.retrieved_at is None or args.report is None:
            parser.error("--catalog, --retrieved-at, and --report are required unless --write-catalog is used.")
        catalog = load_facilities(args.catalog)
        retrieved_at = parse_time(args.retrieved_at)
        now = parse_time(args.now) if args.now else datetime.now(timezone.utc)
        result = reconcile(catalog, source, retrieved_at, now)
    except (OSError, ValueError) as error:
        print(f"Reconciliation failed: {error}", file=sys.stderr)
        return 1
    report = render_report(result, retrieved_at)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(report, encoding="utf-8")
    if args.changes:
        write_changes(result, args.changes)
    print(report, end="")
    if result.anomalies:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
