import os
import re
import unittest
from pathlib import Path

import roster_ingestion
from roster_ingestion import (
    BASELINE_MARKERS,
    IDENTITY_MARKERS,
    MIGRATION_MARKERS,
    Pilot,
    assert_authorized_target,
    assert_unknown_values_stay_unknown,
    ingest_batch,
    preflight_before_write,
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


class DevelopmentPreflightTest(unittest.TestCase):
    def setUp(self):
        self.keys = (
            "PGHOST",
            "PGPORT",
            "PGUSER",
            "PGDATABASE",
            "PGSSLMODE",
            "NCHF_NC_EXECUTION_TARGET",
            "NCHF_NC_DEVELOPMENT_EXECUTION",
            "NCHF_DE_EXECUTION_TARGET",
            "NCHF_DE_DEVELOPMENT_EXECUTION",
        )
        self.saved = {key: os.environ.get(key) for key in self.keys}
        self.original_psql = roster_ingestion.psql

    def tearDown(self):
        roster_ingestion.psql = self.original_psql
        for key, value in self.saved.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value

    def test_incorrect_project_identity_is_rejected_before_a_query(self):
        os.environ["PGHOST"] = "aws-0-us-west-1.pooler.supabase.com"
        os.environ["PGUSER"] = "postgres.yiehgstweswxjakbcdzc"
        os.environ["PGPORT"] = "5432"
        os.environ["PGDATABASE"] = "postgres"
        os.environ["PGSSLMODE"] = "verify-full"
        os.environ["NCHF_NC_EXECUTION_TARGET"] = "development"
        os.environ["NCHF_NC_DEVELOPMENT_EXECUTION"] = "authorize-development-north-carolina-roster-execution"

        def fail_if_called(database, sql, guard=None):
            raise AssertionError("identity query ran against the wrong target")

        roster_ingestion.psql = fail_if_called
        with self.assertRaisesRegex(RuntimeError, "production is not a target"):
            preflight_before_write("postgres", lambda: None)

    def test_unauthorized_development_execution_is_rejected_before_a_query(self):
        os.environ["PGHOST"] = "aws-1-us-west-2.pooler.supabase.com"
        os.environ["PGUSER"] = "postgres.ajjsyloyihcqdomywhik"
        os.environ["PGPORT"] = "5432"
        os.environ["PGDATABASE"] = "postgres"
        os.environ["PGSSLMODE"] = "verify-full"
        os.environ["NCHF_DE_EXECUTION_TARGET"] = "development"
        os.environ.pop("NCHF_DE_DEVELOPMENT_EXECUTION", None)

        def fail_if_called(database, sql, guard=None):
            raise AssertionError("identity query ran without authorization")

        roster_ingestion.psql = fail_if_called
        with self.assertRaisesRegex(RuntimeError, "explicit authorization is required"):
            ingest_batch("postgres", PILOT, [record()], guard=lambda: None)

    def test_a_failed_session_check_blocks_the_import(self):
        os.environ["PGHOST"] = "aws-1-us-west-2.pooler.supabase.com"
        os.environ["PGUSER"] = "postgres.ajjsyloyihcqdomywhik"
        os.environ["PGPORT"] = "5432"
        os.environ["PGDATABASE"] = "postgres"
        os.environ["PGSSLMODE"] = "verify-full"
        os.environ["NCHF_NC_EXECUTION_TARGET"] = "development"
        os.environ["NCHF_NC_DEVELOPMENT_EXECUTION"] = "authorize-development-north-carolina-roster-execution"
        calls = []

        def fake_psql(database, sql, guard=None):
            calls.append(sql)
            guard()
            return "DATABASE_POSTGRES\nSESSION_ROLE_POSTGRES\n"

        roster_ingestion.psql = fake_psql
        with self.assertRaisesRegex(RuntimeError, "migration"):
            ingest_batch("postgres", PILOT, [record()], guard=lambda: None)
        self.assertEqual(len(calls), 1)
        self.assertIn("identity_markers", calls[0])
        self.assertNotIn("insert into public.nationwide_roster", calls[0].lower())

    def test_import_sql_is_sent_only_after_the_session_baseline_matches(self):
        os.environ["PGHOST"] = "aws-1-us-west-2.pooler.supabase.com"
        os.environ["PGUSER"] = "postgres.ajjsyloyihcqdomywhik"
        os.environ["PGPORT"] = "5432"
        os.environ["PGDATABASE"] = "postgres"
        os.environ["PGSSLMODE"] = "verify-full"
        os.environ["NCHF_NC_EXECUTION_TARGET"] = "development"
        os.environ["NCHF_NC_DEVELOPMENT_EXECUTION"] = "authorize-development-north-carolina-roster-execution"
        calls = []

        def fake_psql(database, sql, guard=None):
            calls.append(sql)
            guard()
            if len(calls) == 1:
                return "\n".join((*IDENTITY_MARKERS, *MIGRATION_MARKERS, *BASELINE_MARKERS))
            return "ROSTER_INGEST_READY | 1 | 0\nCOMMIT"

        roster_ingestion.psql = fake_psql
        result = ingest_batch("postgres", PILOT, [record()], guard=lambda: None)
        self.assertEqual(result["inserted"], 1)
        self.assertIn("identity_markers", calls[0])
        self.assertIn("insert into public.nationwide_roster", calls[1].lower())


if __name__ == "__main__":
    unittest.main()
