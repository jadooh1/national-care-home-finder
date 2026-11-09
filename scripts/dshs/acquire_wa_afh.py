"""Read-only Washington DSHS adult-family-home acquisition.

Downloads current Adult Family Home records from the public ArcGIS service,
pages through every response, and writes a raw snapshot, a normalized CSV,
and a validation report. It does not connect to a database.
"""

from __future__ import annotations

import csv
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

SOURCE_URL = (
    "https://services2.arcgis.com/WW3T8U6q5EkZ9U3n/arcgis/rest/services/"
    "Long_Term_Care_Residential_Care_view/FeatureServer/1"
)
WHERE = "FacilityType = 'AF' AND GDLArchiveDate IS NULL"
FIELDS = (
    "OBJECTID",
    "LicenseNumber",
    "FacilityName",
    "FacilityType",
    "FacilityStatus",
    "LocationAddress",
    "LocationCity",
    "LocationCounty",
    "LocationState",
    "LocationZipCode",
    "LicensedBedCount",
    "Latitude",
    "Longitude",
    "GDLPublishDate",
    "GDLArchiveDate",
    "acAddress1",
    "acCity",
    "acState",
    "acZip",
    "gcGrade",
    "gcWAMASId",
    "gcLocatorName",
)
PAGE_SIZE = 2000
TIMEOUT_SECONDS = 60
MAX_ATTEMPTS = 4
OUTPUT_DIR = Path(__file__).resolve().parent / "output"


class AcquisitionError(RuntimeError):
    """The public source could not be read completely."""


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def stamp(value: datetime) -> str:
    return value.strftime("%Y%m%dT%H%M%SZ")


def iso(value: datetime) -> str:
    return value.isoformat().replace("+00:00", "Z")


def request_json(params: dict[str, str]) -> dict:
    query = urllib.parse.urlencode(params)
    url = f"{SOURCE_URL}/query?{query}"
    last_error: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        started = time.monotonic()
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "nchf-dshs-readonly/1"})
            with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
                status = getattr(response, "status", 200)
                body = response.read()
            if status >= 400:
                raise AcquisitionError(f"ArcGIS returned HTTP {status}.")
            try:
                payload = json.loads(body.decode("utf-8"))
            except json.JSONDecodeError as error:
                raise AcquisitionError(f"ArcGIS returned a response that is not JSON: {error}.") from error
            if "error" in payload:
                detail = payload["error"]
                message = detail.get("message") if isinstance(detail, dict) else str(detail)
                raise AcquisitionError(f"ArcGIS query failed: {message}.")
            return payload
        except AcquisitionError:
            raise
        except (urllib.error.URLError, TimeoutError, ConnectionError) as error:
            last_error = error
            if attempt == MAX_ATTEMPTS:
                break
            delay = 2 ** (attempt - 1)
            print(
                f"Request failed on attempt {attempt} of {MAX_ATTEMPTS} "
                f"after {time.monotonic() - started:.1f}s: {error}. Retrying in {delay}s.",
                file=sys.stderr,
            )
            time.sleep(delay)
    raise AcquisitionError(
        f"Could not reach the DSHS ArcGIS service after {MAX_ATTEMPTS} attempts: {last_error}."
    )


def query_page(offset: int) -> dict:
    return request_json(
        {
            "where": WHERE,
            "outFields": ",".join(FIELDS),
            "orderByFields": "OBJECTID",
            "resultOffset": str(offset),
            "resultRecordCount": str(PAGE_SIZE),
            "returnGeometry": "false",
            "f": "json",
        }
    )


def query_count() -> int:
    payload = request_json({"where": WHERE, "returnCountOnly": "true", "f": "json"})
    count = payload.get("count")
    if not isinstance(count, int) or count < 0:
        raise AcquisitionError(f"ArcGIS did not return a usable record count: {count!r}.")
    return count


def blank(value: object) -> bool:
    return value is None or (isinstance(value, str) and value.strip() == "")


def arcgis_time(value: object) -> str:
    if value is None or value == "":
        return ""
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value / 1000, timezone.utc).isoformat().replace("+00:00", "Z")
    return str(value)


def coordinate_problem(latitude: object, longitude: object) -> str | None:
    if blank(latitude) or blank(longitude):
        return "missing"
    try:
        lat = float(latitude)
        lon = float(longitude)
    except (TypeError, ValueError):
        return "invalid"
    if lat != lat or lon != lon or lat in (float("inf"), float("-inf")) or lon in (float("inf"), float("-inf")):
        return "invalid"
    if lat < -90 or lat > 90 or lon < -180 or lon > 180:
        return "invalid"
    return None


def text(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()


def acquire() -> dict:
    started = utc_now()
    expected = query_count()
    pages: list[dict] = []
    features: list[dict] = []
    object_counts: Counter[str] = Counter()
    offset = 0
    while True:
        if offset > expected:
            raise AcquisitionError(
                f"Pagination continued past the reported count of {expected} at offset {offset}."
            )
        page = query_page(offset)
        batch = page.get("features")
        if not isinstance(batch, list):
            raise AcquisitionError("ArcGIS response did not contain a feature list.")
        for feature in batch:
            attributes = feature.get("attributes") if isinstance(feature, dict) else None
            if not isinstance(attributes, dict):
                raise AcquisitionError("ArcGIS returned a feature without attributes.")
            object_id = attributes.get("OBJECTID")
            if object_id is not None:
                object_counts[str(object_id)] += 1
        features.extend(batch)
        pages.append(
            {
                "offset": offset,
                "returned": len(batch),
                "exceededTransferLimit": bool(page.get("exceededTransferLimit")),
            }
        )
        print(
            f"Page {len(pages)}: offset {offset}, received {len(batch)}, "
            f"running total {len(features)} of {expected}."
        )
        if not batch:
            break
        offset += len(batch)
        if len(batch) < PAGE_SIZE and not page.get("exceededTransferLimit"):
            break
        if len(pages) > (expected // PAGE_SIZE) + 5:
            raise AcquisitionError("Pagination did not finish within the expected number of pages.")
    finished = utc_now()
    return {
        "source_url": SOURCE_URL,
        "where": WHERE,
        "fields": list(FIELDS),
        "retrieved_at": iso(started),
        "completed_at": iso(finished),
        "duration_seconds": round((finished - started).total_seconds(), 3),
        "expected_count": expected,
        "pages": pages,
        "duplicate_object_ids": {
            object_id: count for object_id, count in object_counts.items() if count > 1
        },
        "features": features,
        "started": started,
    }


def validate(snapshot: dict) -> dict:
    rows = []
    for feature in snapshot["features"]:
        attributes = feature["attributes"]
        rows.append({name: attributes.get(name) for name in FIELDS})
    licenses = [text(row["LicenseNumber"]) for row in rows]
    present_licenses = [license_number for license_number in licenses if license_number]
    license_counts = Counter(present_licenses)
    duplicate_licenses = {key: count for key, count in license_counts.items() if count > 1}
    missing_coordinates = 0
    invalid_coordinates = 0
    beds = []
    missing_beds = 0
    for row in rows:
        problem = coordinate_problem(row["Latitude"], row["Longitude"])
        if problem == "missing":
            missing_coordinates += 1
        elif problem == "invalid":
            invalid_coordinates += 1
        if blank(row["LicensedBedCount"]):
            missing_beds += 1
        else:
            beds.append(int(row["LicensedBedCount"]))
    unique_ids = {
        row["OBJECTID"] for row in rows if row["OBJECTID"] is not None
    }
    return {
        "total_records": len(rows),
        "expected_count": snapshot["expected_count"],
        "count_matches_service": len(rows) == snapshot["expected_count"],
        "pages": snapshot["pages"],
        "unique_object_ids": len(unique_ids),
        "duplicate_object_ids": snapshot["duplicate_object_ids"],
        "unique_license_numbers": len(license_counts),
        "duplicate_license_numbers": duplicate_licenses,
        "missing_license_numbers": sum(1 for value in licenses if not value),
        "missing_names": sum(1 for row in rows if blank(row["FacilityName"])),
        "missing_addresses": sum(1 for row in rows if blank(row["LocationAddress"])),
        "missing_zip_codes": sum(1 for row in rows if blank(row["LocationZipCode"])),
        "missing_coordinates": missing_coordinates,
        "invalid_coordinates": invalid_coordinates,
        "geocode_grade_distribution": dict(Counter(text(row["gcGrade"]) or "(blank)" for row in rows).most_common()),
        "facility_status_distribution": dict(Counter(text(row["FacilityStatus"]) or "(blank)" for row in rows).most_common()),
        "county_distribution": dict(Counter(text(row["LocationCounty"]) or "(blank)" for row in rows).most_common()),
        "licensed_bed_records": len(beds),
        "licensed_bed_total": sum(beds),
        "licensed_bed_missing": missing_beds,
        "rows": rows,
    }


def write_outputs(snapshot: dict, report: dict, output_dir: Path | None = None) -> dict[str, Path]:
    destination = output_dir or OUTPUT_DIR
    destination.mkdir(parents=True, exist_ok=True)
    token = stamp(snapshot["started"])
    raw_path = destination / f"wa_afh_raw_{token}.json"
    csv_path = destination / f"wa_afh_normalized_{token}.csv"
    report_path = destination / f"wa_afh_validation_{token}.txt"
    raw_document = {
        key: value
        for key, value in snapshot.items()
        if key != "started"
    }
    raw_path.write_text(json.dumps(raw_document, indent=2), encoding="utf-8")
    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(FIELDS))
        writer.writeheader()
        for row in report["rows"]:
            normalized = {name: row[name] for name in FIELDS}
            normalized["GDLPublishDate"] = arcgis_time(row["GDLPublishDate"])
            normalized["GDLArchiveDate"] = arcgis_time(row["GDLArchiveDate"])
            writer.writerow(normalized)
    lines = [
        "Washington DSHS adult family home validation",
        f"Source URL: {snapshot['source_url']}",
        f"Filter: {snapshot['where']}",
        f"Retrieval started: {snapshot['retrieved_at']}",
        f"Retrieval completed: {snapshot['completed_at']}",
        f"Duration seconds: {snapshot['duration_seconds']}",
        f"Service count: {report['expected_count']}",
        f"Records retrieved: {report['total_records']}",
        f"Count matches service: {report['count_matches_service']}",
        f"Pages: {len(report['pages'])}",
        f"Unique OBJECTIDs: {report['unique_object_ids']}",
        f"Duplicate OBJECTIDs: {report['duplicate_object_ids'] or 'none'}",
        f"Unique license numbers: {report['unique_license_numbers']}",
        f"Duplicate license numbers: {report['duplicate_license_numbers'] or 'none'}",
        f"Missing license numbers: {report['missing_license_numbers']}",
        f"Missing names: {report['missing_names']}",
        f"Missing addresses: {report['missing_addresses']}",
        f"Missing ZIP codes: {report['missing_zip_codes']}",
        f"Missing coordinates: {report['missing_coordinates']}",
        f"Invalid coordinates: {report['invalid_coordinates']}",
        f"Licensed bed records: {report['licensed_bed_records']}",
        f"Licensed bed total: {report['licensed_bed_total']}",
        f"Licensed beds missing: {report['licensed_bed_missing']}",
        "",
        "Facility status distribution:",
    ]
    lines.extend(f"  {name}: {count}" for name, count in report["facility_status_distribution"].items())
    lines.append("")
    lines.append("Geocoding grade distribution:")
    lines.extend(f"  {name}: {count}" for name, count in report["geocode_grade_distribution"].items())
    lines.append("")
    lines.append("County distribution:")
    lines.extend(f"  {name}: {count}" for name, count in report["county_distribution"].items())
    lines.append("")
    lines.append("Pagination:")
    lines.extend(
        f"  offset {page['offset']}: {page['returned']} records, exceededTransferLimit={page['exceededTransferLimit']}"
        for page in report["pages"]
    )
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return {"raw": raw_path, "csv": csv_path, "report": report_path}


def main(argv: list[str] | None = None) -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Download the current public Washington DSHS adult family home list.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Directory for the raw snapshot, normalized CSV, and validation report. Defaults to scripts/dshs/output.",
    )
    args = parser.parse_args(argv)
    try:
        snapshot = acquire()
        report = validate(snapshot)
        paths = write_outputs(snapshot, report, args.output_dir)
    except AcquisitionError as error:
        print(f"Acquisition failed: {error}", file=sys.stderr)
        return 1
    print(f"Raw snapshot: {paths['raw']}")
    print(f"Normalized CSV: {paths['csv']}")
    print(f"Validation report: {paths['report']}")
    print(
        f"Retrieved {report['total_records']} of {report['expected_count']} "
        f"current AF records in {snapshot['duration_seconds']} seconds."
    )
    if not report["count_matches_service"] or report["duplicate_object_ids"]:
        print("Validation failed: pagination did not return each current record once.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
