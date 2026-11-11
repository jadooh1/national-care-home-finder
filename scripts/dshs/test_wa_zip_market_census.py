import csv
import hashlib
import tempfile
import unittest
from pathlib import Path

import wa_zip_market_census as census

ROOT = Path(__file__).resolve().parents[2]
REVIEW_FILE = ROOT / "supabase" / "proposals" / "data" / "wa_zip_market_census_2020_2024.csv"
REVIEW_SHA256 = "520fee7e98d958541b6de3c652798745c6c3ad62f8cbe048db87247263e727d6"
SENTINELS = {"-666666666", "-222222222", "-333333333", "2499"}


def write_pipe(path: Path, rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]), delimiter="|", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def age_row(zcta: str, total: str, value: str) -> dict[str, str]:
    row = {"GEO_ID": f"8600000US{zcta}"}
    for number in range(1, 50):
        row[f"B01001_E{number:03d}"] = total if number == 1 else value
    return row


def household_row(zcta: str, total: str, high: str) -> dict[str, str]:
    row = {"GEO_ID": f"8600000US{zcta}", "B19001_E001": total}
    for number in range(2, 18):
        row[f"B19001_E{number:03d}"] = high if number >= 14 else "0"
    return row


def income_row(zcta: str, estimate: str, margin: str) -> dict[str, str]:
    return {"GEO_ID": f"8600000US{zcta}", "B19013_E001": estimate, "B19013_M001": margin}


class WashingtonCensusTransformTests(unittest.TestCase):
    def build(self, age, households, income, relationship):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory)
            write_pipe(source / "acsdt5y2024-b01001.dat", age)
            write_pipe(source / "acsdt5y2024-b19001.dat", households)
            write_pipe(source / "acsdt5y2024-b19013.dat", income)
            with (source / "tab20_zcta520_county20_natl.txt").open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=["GEOID_ZCTA5_20", "GEOID_COUNTY_20"], delimiter="|", lineterminator="\n")
                writer.writeheader()
                writer.writerows(relationship)
            return census.build_rows(source)

    def test_washington_rows_keep_top_code_and_clear_unavailable_margins(self):
        rows = self.build(
            [age_row("98001", "100", "2"), age_row("83856", "40", "1"), age_row("83201", "10", "1")],
            [household_row("98001", "10", "1"), household_row("83856", "8", "2"), household_row("83201", "4", "1")],
            [
                income_row("98001", "-666666666", "-222222222"),
                income_row("83856", "250001", "-333333333"),
                income_row("83201", "50000", "1000"),
            ],
            [
                {"GEOID_ZCTA5_20": "98001", "GEOID_COUNTY_20": "53033"},
                {"GEOID_ZCTA5_20": "83856", "GEOID_COUNTY_20": "53055"},
                {"GEOID_ZCTA5_20": "83856", "GEOID_COUNTY_20": "16021"},
                {"GEOID_ZCTA5_20": "83201", "GEOID_COUNTY_20": "16021"},
            ],
        )
        self.assertEqual([row["zip_code"] for row in rows], ["83856", "98001"])
        unavailable = rows[1]
        self.assertIsNone(unavailable["median_household_income"])
        self.assertIsNone(unavailable["median_income_margin_error"])
        self.assertEqual(unavailable["age_60_69"], 16)
        self.assertEqual(unavailable["households_100k_plus"], 4)
        top_coded = rows[0]
        self.assertEqual(top_coded["median_household_income"], 250001)
        self.assertIsNone(top_coded["median_income_margin_error"])

    def test_bottom_coded_median_becomes_null(self):
        rows = self.build(
            [age_row("98001", "10", "0")],
            [household_row("98001", "1", "0")],
            [income_row("98001", "2499", "-333333333")],
            [{"GEOID_ZCTA5_20": "98001", "GEOID_COUNTY_20": "53033"}],
        )
        self.assertIsNone(rows[0]["median_household_income"])
        self.assertIsNone(rows[0]["median_income_margin_error"])

    def test_reviewed_washington_file_has_the_validated_census_rows(self):
        digest = hashlib.sha256(REVIEW_FILE.read_bytes()).hexdigest()
        self.assertEqual(digest, REVIEW_SHA256)
        with REVIEW_FILE.open(encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        self.assertEqual(len(rows), 606)
        self.assertEqual(len({row["zip_code"] for row in rows}), 606)
        self.assertTrue(all(len(row["zip_code"]) == 5 and row["zip_code"].isdigit() for row in rows))
        for forbidden in ("83856", "99033", "99128", "99362"):
            self.assertIn(forbidden, {row["zip_code"] for row in rows})
        flattened = ",".join(",".join(row.values()) for row in rows)
        for sentinel in SENTINELS:
            self.assertNotIn(sentinel, flattened)
        self.assertIn("250001", flattened)

    def test_application_select_lists_are_view_columns(self):
        view_columns = (
            "zip_code,total_afhs,homes_with_capacity,known_licensed_beds,"
            "population_total,age_60_69,age_70_79,age_80_84,age_85_plus,age_70_plus,"
            "census_period,median_household_income,median_income_margin_error,"
            "total_households,households_100k_plus,households_100k_plus_pct,income_census_period"
        ).split(",")
        for relative in ("app/washington/demographics/page.tsx", "app/washington/opportunity/page.tsx"):
            source = (ROOT / relative).read_text(encoding="utf-8")
            selected = source.split('.select("', 1)[1].split('"', 1)[0].split(",")
            self.assertTrue(all(column in view_columns for column in selected))
            self.assertNotIn("license_number", selected)
            self.assertNotIn("canonical_name", selected)


if __name__ == "__main__":
    unittest.main()
