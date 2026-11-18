import os
import re
import tempfile
import unittest
from pathlib import Path

from delaware_roster import map_listing, summary


def child(name, address, license_identifier):
    return f"""
<div class="wp-block-esab-accordion-child">
  <h2 class="esab__heading_tag">{name}</h2>
  <table><tr><td><strong>Address</strong></td><td>{address}</td></tr>
  <tr><td><strong>License #</strong></td><td>{license_identifier}</td></tr></table>
</div>
"""


class DelawareMappingTest(unittest.TestCase):
    def test_listed_address_stays_unverified_and_unpublished(self):
        mapped = map_listing(child("Example Assisted Living", "1 Example Street Dover, DE 19901", "9001"))
        self.assertEqual(len(mapped["accepted"]), 1)
        record = mapped["accepted"][0]
        self.assertEqual(record["original_category"], "Licensed Assisted Living Facility")
        self.assertIsNone(record["physical_address"])
        self.assertEqual(record["unverified_address_provenance"], "listed-address")
        self.assertIsNone(record["official_export_date"])
        self.assertIsNone(record["original_status"])
        self.assertEqual(record["disclosure_kind"], "generic-search")
        self.assertFalse(record["disclosure_verified"])
        self.assertEqual(record["publication"], "unpublished")
        self.assertEqual(summary(mapped)["publication_public"], 0)
        self.assertEqual(summary(mapped)["physical_addresses"], 0)

    def test_duplicate_and_non_delaware_address_are_rejected(self):
        html = "".join(
            [
                child("Example One", "1 Example Street Dover, DE 19901", "9002"),
                child("Example Two", "2 Example Street Dover, DE 19901", "9002"),
                child("Example Three", "3 Example Street Philadelphia, PA 19103", "9003"),
                child("Example Four", "4 Example Street Dover, DE 19901", "ABC"),
            ]
        )
        reasons = summary(map_listing(html))["rejected_reasons"]
        self.assertEqual(reasons["duplicate-license-in-source"], 2)
        self.assertEqual(reasons["listed-address-is-not-delaware"], 1)
        self.assertEqual(reasons["license-identifier-is-not-numeric"], 1)

    def test_script_does_not_publish_or_add_privileges(self):
        source = Path(__file__).with_name("delaware_roster.py").read_text(encoding="utf-8").lower()
        rollback = Path(__file__).resolve().parents[2].joinpath(
            "supabase/proposals/20261110130000_delaware_roster_ingestion_ROLLBACK.sql"
        ).read_text(encoding="utf-8").lower()
        self.assertIsNone(re.search(r"(?m)^\s*create\s+role\b", source))
        self.assertIsNone(re.search(r"(?m)^\s*grant\b", source))
        self.assertNotIn("publication = 'public'", source)
        self.assertIn("delaware-dhcq-assisted-living-pilot-20261110", rollback)
        self.assertNotIn("north-carolina-dhhs-roster-pilot", rollback)
        directory = Path(__file__).resolve().parents[2].joinpath("lib/state-directory.ts").read_text(encoding="utf-8")
        self.assertNotIn("/delaware", directory)

    def test_development_adapter_rejects_an_unauthorized_target(self):
        from delaware_development_adapter import EXECUTION_AUTHORIZATION, assert_execution_target

        keys = ("PGHOST", "PGUSER", "NCHF_DE_DEVELOPMENT_EXECUTION", "NCHF_DE_EXECUTION_TARGET")
        saved = {key: os.environ.get(key) for key in keys}
        try:
            os.environ["PGHOST"] = "127.0.0.1"
            os.environ["PGUSER"] = "proposal_test"
            os.environ["NCHF_DE_EXECUTION_TARGET"] = "disposable"
            os.environ.pop("NCHF_DE_DEVELOPMENT_EXECUTION", None)
            with self.assertRaises(RuntimeError):
                assert_execution_target()
            os.environ["NCHF_DE_DEVELOPMENT_EXECUTION"] = EXECUTION_AUTHORIZATION
            assert_execution_target()
            os.environ["NCHF_DE_EXECUTION_TARGET"] = "development"
            with self.assertRaises(RuntimeError):
                assert_execution_target()
            os.environ["PGHOST"] = "aws-0-us-west-1.pooler.supabase.com"
            with self.assertRaises(RuntimeError):
                assert_execution_target()
        finally:
            for key, value in saved.items():
                if value is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = value


if __name__ == "__main__":
    unittest.main()
