"""Build the review-only Washington ZCTA census file.

The script reads the official 2020-2024 ACS five-year summary files and the
2020 ZCTA-to-county relationship file. It writes aggregate census rows only.
It does not connect to a database.
"""

from __future__ import annotations

import csv
import hashlib
import re
from pathlib import Path

ZCTA_ID = re.compile(r"^860(?:0000|Z200)US(\d{5})$")
UNAVAILABLE_ESTIMATE = "-666666666"
UNAVAILABLE_MARGIN = "-222222222"
JAM_MARGIN = "-333333333"
TOP_CODED_MEDIAN = "250001"
BOTTOM_CODED_MEDIAN = "2499"
AGE_60_69 = ("018", "019", "020", "021", "042", "043", "044", "045")
AGE_70_79 = ("022", "023", "046", "047")
AGE_80_84 = ("024", "048")
AGE_85_PLUS = ("025", "049")
HOUSEHOLD_100K = ("014", "015", "016", "017")
COLUMNS = (
    "zip_code",
    "population_total",
    "age_60_69",
    "age_70_79",
    "age_80_84",
    "age_85_plus",
    "median_household_income",
    "median_income_margin_error",
    "total_households",
    "households_100k_plus",
)
SOURCE_SHA256 = {
    "acsdt5y2024-b01001.dat": "1637b18a96881b81e050df1cd3d5ac38a33208b9b69b40e1dbeb3c4e13718f0e",
    "acsdt5y2024-b19001.dat": "1af421b3b9d0f85dbd938cd518ad5d01c693fa2870f24e1089552ea5c1e6683f",
    "acsdt5y2024-b19013.dat": "b25a176b0e6c339b6f3a2a0d3d8446bf06f5f080b4395993ec9a8313efb1c229",
    "tab20_zcta520_county20_natl.txt": "3ed41278d637dc249e0323306f68be8a6c234e3090f4de88ef328dee71aeaaaf",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_sources(source_dir: Path) -> None:
    for name, expected in SOURCE_SHA256.items():
        actual = sha256(source_dir / name)
        if actual != expected:
            raise RuntimeError(f"{name} checksum does not match the validated download")


def _rows_by_zcta(path: Path) -> dict[str, dict[str, str]]:
    rows: dict[str, dict[str, str]] = {}
    with path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="|")
        for row in reader:
            match = ZCTA_ID.match(row["GEO_ID"])
            if match:
                rows[match.group(1)] = row
    return rows


def washington_zctas(path: Path) -> set[str]:
    found: set[str] = set()
    with path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle, delimiter="|"):
            zcta = (row.get("GEOID_ZCTA5_20") or "").strip()
            county = (row.get("GEOID_COUNTY_20") or "").strip()
            if zcta and county.startswith("53"):
                found.add(zcta)
    return found


def _integer(token: str | None, *, median: bool = False) -> int | None:
    value = (token or "").strip()
    if value in {"", UNAVAILABLE_ESTIMATE, UNAVAILABLE_MARGIN, JAM_MARGIN, BOTTOM_CODED_MEDIAN}:
        return None
    if not re.fullmatch(r"-?\d+", value):
        raise RuntimeError(f"unexpected Census value {value!r}")
    if value.startswith("-"):
        raise RuntimeError(f"unexpected negative Census value {value}")
    if median and value == TOP_CODED_MEDIAN:
        return int(value)
    if not median and value in {TOP_CODED_MEDIAN, BOTTOM_CODED_MEDIAN}:
        raise RuntimeError(f"median code used in a count field: {value}")
    return int(value)


def _sum(row: dict[str, str], table: str, numbers: tuple[str, ...] | list[str]) -> int | None:
    total = 0
    for number in numbers:
        value = _integer(row[f"{table}_E{number}"])
        if value is None:
            return None
        total += value
    return total


def build_rows(source_dir: Path) -> list[dict[str, int | str | None]]:
    age = _rows_by_zcta(source_dir / "acsdt5y2024-b01001.dat")
    households = _rows_by_zcta(source_dir / "acsdt5y2024-b19001.dat")
    income = _rows_by_zcta(source_dir / "acsdt5y2024-b19013.dat")
    selected = sorted(washington_zctas(source_dir / "tab20_zcta520_county20_natl.txt"))
    output: list[dict[str, int | str | None]] = []
    for zip_code in selected:
        if zip_code not in age or zip_code not in households or zip_code not in income:
            raise RuntimeError(f"Washington ZCTA {zip_code} is missing from an ACS table")
        output.append({
            "zip_code": zip_code,
            "population_total": _integer(age[zip_code]["B01001_E001"]),
            "age_60_69": _sum(age[zip_code], "B01001", AGE_60_69),
            "age_70_79": _sum(age[zip_code], "B01001", AGE_70_79),
            "age_80_84": _sum(age[zip_code], "B01001", AGE_80_84),
            "age_85_plus": _sum(age[zip_code], "B01001", AGE_85_PLUS),
            "median_household_income": _integer(income[zip_code]["B19013_E001"], median=True),
            "median_income_margin_error": _integer(income[zip_code]["B19013_M001"], median=True),
            "total_households": _integer(households[zip_code]["B19001_E001"]),
            "households_100k_plus": _sum(households[zip_code], "B19001", HOUSEHOLD_100K),
        })
    return output


def write_rows(rows: list[dict[str, int | str | None]], destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Write the review-only Washington ZCTA census file.")
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--expect-rows", type=int, required=True)
    args = parser.parse_args()
    verify_sources(args.source_dir)
    rows = build_rows(args.source_dir)
    if len(rows) != args.expect_rows:
        raise SystemExit(f"expected {args.expect_rows} rows, found {len(rows)}")
    write_rows(rows, args.output)
    print(f"rows={len(rows)} sha256={sha256(args.output)}")
