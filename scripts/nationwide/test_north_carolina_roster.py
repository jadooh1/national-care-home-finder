import csv
import re
import tempfile
import unittest
from pathlib import Path

from north_carolina_roster import combine, map_source, summary


def write_csv(rows):
    handle = tempfile.NamedTemporaryFile("w", newline="", suffix=".csv", delete=False, encoding="utf-8")
    writer = csv.writer(handle)
    writer.writerows(rows)
    handle.close()
    return handle.name


HEADER = [
    "License #",
    "DBA Name",
    "Site Address",
    "Site City",
    "Site State",
    "Site Zip",
    "Facility Address",
    "Facility Address 2",
    "Facility City",
    "Facility State",
    "Facility Zip",
]


class NorthCarolinaMappingTest(unittest.TestCase):
    def test_synthetic_rows_stay_unpublished_and_unverified(self):
        path = write_csv(
            [
                HEADER,
                ["HAL-900-001", "Example Adult Home", "1 Example Street", "Raleigh", "NC", "27601", "PO Box 1", "", "Raleigh", "NC", "27602"],
                ["", "", "", "", "", "", "workbook note", "", "", "", ""],
            ]
        )
        mapped = map_source(path, "adult")
        self.assertEqual(len(mapped["accepted"]), 1)
        record = mapped["accepted"][0]
        self.assertEqual(record["original_category"], "Adult Care Home")
        self.assertEqual(record["physical_address_provenance"], "site-address")
        self.assertEqual(record["mailing_address_provenance"], "facility-address")
        self.assertIsNone(record["official_export_date"])
        self.assertIsNone(record["original_status"])
        self.assertEqual(record["disclosure_kind"], "generic-search")
        self.assertFalse(record["disclosure_verified"])
        self.assertEqual(record["publication"], "unpublished")
        self.assertEqual(mapped["rejected"], [{"reason": "not-a-facility-record"}])
        totals = summary(mapped)
        self.assertEqual(totals["publication_public"], 0)
        self.assertEqual(totals["unresolved_official_export_date"], 1)

    def test_facility_address_is_not_copied_into_the_physical_address(self):
        path = write_csv(
            [
                HEADER,
                ["FCL-900-001", "Example Family Home", "2 Example Street", "Raleigh", "NC", "27603", "9 Example Drive", "", "Richmond", "VA", "23219"],
            ]
        )
        record = map_source(path, "family")["accepted"][0]
        self.assertIn("2 Example Street", record["physical_address"])
        self.assertIn("NC", record["physical_address"])
        self.assertNotIn("Richmond", record["physical_address"])
        self.assertIn("Richmond", record["mailing_address"])

    def test_duplicate_and_out_of_state_site_are_rejected(self):
        adult = write_csv(
            [
                HEADER,
                ["HAL-900-002", "Example One", "3 Example Street", "Raleigh", "NC", "27601", "PO Box 3", "", "Raleigh", "NC", "27601"],
                ["HAL-900-002", "Example Two", "4 Example Street", "Raleigh", "NC", "27601", "PO Box 4", "", "Raleigh", "NC", "27601"],
                ["HAL-900-003", "Example Three", "5 Example Street", "Danville", "VA", "24541", "PO Box 5", "", "Danville", "VA", "24541"],
            ]
        )
        family = write_csv(
            [
                HEADER,
                ["HAL-900-004", "Wrong Prefix", "6 Example Street", "Raleigh", "NC", "27601", "PO Box 6", "", "Raleigh", "NC", "27601"],
            ]
        )
        mapped = combine([map_source(adult, "adult"), map_source(family, "family")])
        reasons = summary(mapped)["rejected_reasons"]
        self.assertEqual(reasons["duplicate-license-in-source"], 2)
        self.assertEqual(reasons["physical-site-address-is-not-north-carolina"], 1)
        self.assertEqual(reasons["license-prefix-does-not-match-category"], 1)
        self.assertEqual(mapped["accepted"], [])

    def test_script_does_not_create_roles_grant_privileges_or_publish(self):
        source = Path(__file__).with_name("north_carolina_roster.py").read_text(encoding="utf-8").lower()
        rollback = Path(__file__).resolve().parents[2].joinpath(
            "supabase/proposals/20261110110000_north_carolina_roster_ingestion_ROLLBACK.sql"
        ).read_text(encoding="utf-8").lower()
        self.assertIsNone(re.search(r"(?m)^\s*create\s+role\b", source))
        self.assertIsNone(re.search(r"(?m)^\s*grant\b", source))
        self.assertNotIn("'public'", source)
        self.assertIsNone(re.search(r"(?m)^\s*create\s+role\b", rollback))
        self.assertIsNone(re.search(r"(?m)^\s*grant\b", rollback))
        self.assertNotIn("/north-carolina", source)
        directory = Path(__file__).resolve().parents[2].joinpath("lib/state-directory.ts").read_text(encoding="utf-8")
        self.assertNotIn("/north-carolina", directory)
        self.assertIn('directoryPath: null', directory)


if __name__ == "__main__":
    unittest.main()
