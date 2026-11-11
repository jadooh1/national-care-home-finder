import os
import unittest

from illinois_roster import ILLINOIS_BATCH_ID, SOURCE_RECORD_COLUMNS, SOURCE_SHA256
from illinois_source_loader import (
    EXPECTED_BASELINES,
    EXPECTED_ROWS,
    LOAD_AUTHORIZATION,
    dry_run,
    execute,
    transaction_sql,
    validate_source_batch,
)


def synthetic_rows(flags: int = 17):
    rows = []
    for number in range(EXPECTED_ROWS):
        review_flags = ["expiration-precedes-extract"] if number < flags else []
        facility_id = str(1000 + number)
        licensee_id = str(2000 + number)
        attributes = {
            "Facility ID": facility_id,
            "Licensee ID": licensee_id,
            "Facility/Establishment Name": "Fixture",
            "Facility Street Address": "1 Fixture Street",
            "Facility City": "Springfield",
            "Facility State": "Illinois",
            "Facility Zip Code": "62701",
            "Facility County": "Sangamon",
            "Total number of AL /SH units for license": "1",
            "review_flags": review_flags,
        }
        row = {column: None for column in SOURCE_RECORD_COLUMNS}
        row.update(
            {
                "state_name": "Illinois",
                "issuing_authority": "Illinois Department of Public Health",
                "identifier_type": "facility-id",
                "facility_identifier": facility_id,
                "source_record_id": f"idph-licensee:{licensee_id}",
                "original_identifiers": {"Facility ID": facility_id, "Licensee ID": licensee_id},
                "source_attributes": attributes,
                "provenance": "DPH 26-2017",
                "source_sha256": SOURCE_SHA256,
                "extraction_date": "2026-10-28",
                "source_effective_date": "2026-09-01",
                "source_expiration_date": "2026-10-01" if review_flags else "2027-06-30",
                "review_flags": review_flags,
                "publication": "unpublished",
                "ingestion_batch_id": ILLINOIS_BATCH_ID,
            }
        )
        rows.append(row)
    return rows


class IllinoisSourceLoaderTest(unittest.TestCase):
    def test_transaction_checks_baselines_and_does_not_change_the_roster(self):
        sql = transaction_sql(synthetic_rows(), EXPECTED_BASELINES, 0)
        self.assertTrue(sql.startswith("begin;"))
        self.assertIn("commit;", sql)
        self.assertIn("insert into public.nationwide_source_record", sql)
        self.assertNotIn("insert into public.nationwide_roster", sql.lower())
        self.assertIn("post-load checks failed", sql)
        for marker in ("1086", "39", "6278", "1584", "502", "17"):
            self.assertIn(marker, sql)
        partial = dict(EXPECTED_BASELINES)
        partial["delaware_batch"] = 40
        with self.assertRaisesRegex(RuntimeError, "baseline"):
            validate_source_batch(synthetic_rows(), partial, 0)
        with self.assertRaisesRegex(RuntimeError, "already present"):
            validate_source_batch(synthetic_rows(), EXPECTED_BASELINES, 1)
        duplicated = synthetic_rows()
        duplicated[1]["facility_identifier"] = duplicated[0]["facility_identifier"]
        with self.assertRaisesRegex(RuntimeError, "duplicated"):
            validate_source_batch(duplicated, EXPECTED_BASELINES, 0)

    def test_execute_refuses_production_and_has_no_connection(self):
        keys = ("PGHOST", "PGUSER", "NCHF_IL_EXECUTION_TARGET", "NCHF_IL_DEVELOPMENT_EXECUTION")
        saved = {key: os.environ.get(key) for key in keys}

        def runner(database, sql, guard=None):
            raise AssertionError("runner called")

        try:
            os.environ["PGHOST"] = "aws-0-us-west-1.pooler.supabase.com"
            os.environ["PGUSER"] = "postgres.yiehgstweswxjakbcdzc"
            os.environ["NCHF_IL_EXECUTION_TARGET"] = "development"
            os.environ["NCHF_IL_DEVELOPMENT_EXECUTION"] = LOAD_AUTHORIZATION
            with self.assertRaisesRegex(RuntimeError, "production"):
                execute("unused", "postgres", EXPECTED_BASELINES, runner)
            with self.assertRaises(TypeError):
                execute("unused", "postgres", EXPECTED_BASELINES)
        finally:
            for key, value in saved.items():
                if value is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = value

    def test_official_workbook_dry_run_accepts_502_unpublished_rows(self):
        workbook = os.environ.get("ILLINOIS_ROSTER_XLSX")
        if not workbook:
            self.skipTest("official workbook is local and is not committed")
        report = dry_run(workbook, EXPECTED_BASELINES, 0)
        self.assertEqual(
            report,
            {
                "ready": True,
                "rows": 502,
                "expiration_flags": 17,
                "extraction_date": "2026-10-28",
                "batch_id": ILLINOIS_BATCH_ID,
                "publication": "unpublished",
                "existing_batch_count": 0,
            },
        )
        with self.assertRaisesRegex(RuntimeError, "already present"):
            dry_run(workbook, EXPECTED_BASELINES, 17)
