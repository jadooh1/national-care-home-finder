import os
import re
import unittest
from pathlib import Path

from roster_ingestion import (
    Pilot,
    assert_authorized_target,
    assert_unknown_values_stay_unknown,
    reject_duplicate_licenses,
)


PILOT = Pilot(
    state_name="Example",
    authority="Example Authority",
    batch_id="example-batch",
    disclosure_url="https://example.test/search",
    ingest_guc="nchf.example_roster_ingestion_authorization",
    ingest_authorization="authorize-development-example-roster-ingestion",
    rollback_guc="nchf.example_roster_rollback_authorization",
    rollback_authorization="authorize-development-example-roster-rollback",
    rollback_filename="example.sql",
)


def record(**changes):
    values = {
        "license_identifier": "1",
        "facility_name": "Example Home",
        "physical_address": "",
        "unverified_address": "1 Example Street",
        "official_export_date": None,
        "original_status": None,
        "disclosure_kind": "generic-search",
        "disclosure_url": PILOT.disclosure_url,
        "disclosure_verified": False,
        "freshness_verified": False,
        "publication": "unpublished",
    }
    values.update(changes)
    return values


class RosterIngestionEngineTest(unittest.TestCase):
    def test_unknown_values_stay_unknown(self):
        assert_unknown_values_stay_unknown(PILOT, [record()])
        for change in (
            {"official_export_date": "2026-11-10"},
            {"original_status": "active"},
            {"disclosure_kind": "facility-specific"},
            {"disclosure_verified": True},
            {"freshness_verified": True},
            {"publication": "public"},
            {"physical_address": "1 Example Street", "unverified_address": "1 Example Street"},
        ):
            with self.assertRaises(RuntimeError):
                assert_unknown_values_stay_unknown(PILOT, [record(**change)])

    def test_duplicate_licenses_are_removed_together(self):
        accepted, rejected = reject_duplicate_licenses(
            [{"license_identifier": "1"}, {"license_identifier": "1"}, {"license_identifier": "2"}],
            [],
            "duplicate-license-in-source",
        )
        self.assertEqual(accepted, [{"license_identifier": "2"}])
        self.assertEqual(len(rejected), 2)

    def test_unauthorized_targets_are_rejected(self):
        keys = ("PGHOST", "PGUSER", "NCHF_EXAMPLE_TARGET", "NCHF_EXAMPLE_AUTHORIZATION")
        saved = {key: os.environ.get(key) for key in keys}
        try:
            os.environ["PGHOST"] = "127.0.0.1"
            os.environ["PGUSER"] = "proposal_test"
            os.environ.pop("NCHF_EXAMPLE_AUTHORIZATION", None)
            os.environ["NCHF_EXAMPLE_TARGET"] = "disposable"
            with self.assertRaises(RuntimeError):
                assert_authorized_target(
                    "NCHF_EXAMPLE_TARGET",
                    "NCHF_EXAMPLE_AUTHORIZATION",
                    "authorize-development-example",
                )
            os.environ["NCHF_EXAMPLE_AUTHORIZATION"] = "authorize-development-example"
            assert_authorized_target(
                "NCHF_EXAMPLE_TARGET",
                "NCHF_EXAMPLE_AUTHORIZATION",
                "authorize-development-example",
            )
            os.environ["PGHOST"] = "aws-0-us-west-1.pooler.supabase.com"
            os.environ["PGUSER"] = "postgres.yiehgstweswxjakbcdzc"
            with self.assertRaises(RuntimeError):
                assert_authorized_target(
                    "NCHF_EXAMPLE_TARGET",
                    "NCHF_EXAMPLE_AUTHORIZATION",
                    "authorize-development-example",
                )
        finally:
            for key, value in saved.items():
                if value is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = value

    def test_engine_does_not_grant_privileges_or_publish(self):
        source = Path(__file__).with_name("roster_ingestion.py").read_text(encoding="utf-8").lower()
        self.assertIsNone(re.search(r"(?m)^\s*create\s+role\b", source))
        self.assertIsNone(re.search(r"(?m)^\s*grant\b", source))
        self.assertNotIn("publication = 'public'", source)
        self.assertIn("'unpublished'", source)


if __name__ == "__main__":
    unittest.main()
