import csv
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

import reconcile_wa_afh as reconcile


NOW = datetime(2026, 11, 9, 6, 0, tzinfo=timezone.utc)
RETRIEVED = datetime(2026, 11, 9, 5, 54, 2, tzinfo=timezone.utc)


def facility(**overrides) -> reconcile.Facility:
    values = {
        "license_number": "100001",
        "facility_name": "Example Home",
        "address": "1 Main St",
        "city": "Olympia",
        "county": "Thurston",
        "postal_code": "98501",
        "licensed_capacity": "6",
        "license_status": "OP",
        "latitude": "47.037900",
        "longitude": "-122.900700",
    }
    values.update(overrides)
    return reconcile.Facility(**values)


def write_catalog(path: Path, facilities: list[reconcile.Facility]) -> None:
    reconcile.write_catalog(facilities, path)


class ReconciliationTest(unittest.TestCase):
    def test_matching_catalog_has_no_changes(self):
        rows = [facility(), facility(license_number="100002", facility_name="Second Home")]
        result = reconcile.reconcile(rows, rows, RETRIEVED, NOW)
        self.assertEqual(result.new_licenses, ())
        self.assertEqual(result.archived_licenses, ())
        self.assertEqual(result.field_change_count, 0)
        self.assertEqual(result.anomalies, ())
        self.assertIn("This check does not write to a database.", reconcile.render_report(result, RETRIEVED))

    def test_detects_each_official_change(self):
        catalog = [facility(), facility(license_number="100002"), facility(license_number="100005")]
        source = [
            facility(facility_name="Renamed Home", address="9 Oak Ave", licensed_capacity="4"),
            facility(license_number="100003", facility_name="New Home"),
            facility(license_number="100005", license_status="CL"),
        ]
        result = reconcile.reconcile(catalog, source, RETRIEVED, NOW)
        self.assertEqual(result.new_licenses, ("100003",))
        self.assertEqual(result.archived_licenses, ("100002",))
        self.assertEqual(result.name_changes, ("100001",))
        self.assertEqual(result.address_changes, ("100001",))
        self.assertEqual(result.capacity_changes, ("100001",))
        self.assertEqual(result.status_changes, ("100005",))
        self.assertTrue(any("status other than OP" in anomaly for anomaly in result.anomalies))

    def test_duplicate_and_coordinate_anomalies_are_separate_from_owner_fields(self):
        catalog = [facility()]
        source = [
            facility(),
            facility(license_number="100001", facility_name="Repeated Home"),
            facility(license_number="100009", latitude="20.000000", longitude="-120.000000"),
        ]
        result = reconcile.reconcile(catalog, source, RETRIEVED, NOW)
        self.assertEqual(result.duplicate_licenses, ("100001",))
        self.assertIn("100009", result.new_licenses)
        self.assertTrue(any("duplicate" in anomaly for anomaly in result.anomalies))
        self.assertTrue(any("Washington coordinate bounds" in anomaly for anomaly in result.anomalies))
        report = reconcile.render_report(result, RETRIEVED)
        self.assertIn("owner claims", report)
        self.assertNotIn("public_phone", report)

    def test_stale_source_and_large_change_are_flagged(self):
        catalog = [facility(license_number=str(100000 + index)) for index in range(101)]
        source = [facility(license_number=str(200000 + index)) for index in range(101)]
        stale = datetime(2026, 10, 1, tzinfo=timezone.utc)
        result = reconcile.reconcile(catalog, source, stale, NOW)
        self.assertEqual(len(result.new_licenses), 101)
        self.assertEqual(len(result.archived_licenses), 101)
        self.assertTrue(any("days before" in anomaly for anomaly in result.anomalies))
        self.assertTrue(any("review guard of 100" in anomaly for anomaly in result.anomalies))
        self.assertTrue(any("review guard of 40" in anomaly for anomaly in result.anomalies))

    def test_coordinate_formatting_does_not_create_a_change(self):
        catalog = [facility(latitude="47.037900", longitude="-122.900700")]
        source = [facility(latitude="47.0379", longitude="-122.900700000")]
        result = reconcile.reconcile(catalog, source, RETRIEVED, NOW)
        self.assertEqual(result.coordinate_only_changes, ())
        self.assertEqual(result.changes, ())

    def test_csv_round_trip_and_changes_file(self):
        catalog = [facility()]
        source = [facility(city="Lacey")]
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            catalog_path = root / "catalog.csv"
            source_path = root / "source.csv"
            changes_path = root / "changes.csv"
            write_catalog(catalog_path, catalog)
            write_catalog(source_path, source)
            result = reconcile.reconcile(
                reconcile.load_facilities(catalog_path),
                reconcile.load_facilities(source_path),
                RETRIEVED,
                NOW,
            )
            reconcile.write_changes(result, changes_path)
            with changes_path.open(encoding="utf-8", newline="") as handle:
                rows = list(csv.DictReader(handle))
        self.assertEqual(rows, [
            {
                "change_type": "city",
                "license_number": "100001",
                "field": "city",
                "catalog_value": "Olympia",
                "source_value": "Lacey",
            }
        ])

    def test_november_9_baseline_matches_the_verified_count(self):
        baseline = reconcile.load_facilities(reconcile.BASELINE_PATH)
        result = reconcile.reconcile(baseline, baseline, RETRIEVED, NOW)
        self.assertEqual(len(baseline), reconcile.BASELINE_COUNT)
        self.assertEqual(result.catalog_count, reconcile.BASELINE_COUNT)
        self.assertEqual(result.source_count, reconcile.BASELINE_COUNT)
        self.assertEqual(result.field_change_count, 0)
        self.assertEqual(result.duplicate_licenses, ())
        self.assertEqual(result.anomalies, ())

    def test_workflow_is_read_only(self):
        workflow = Path(__file__).resolve().parents[2] / ".github" / "workflows" / "wa-dshs-maintenance.yml"
        text = workflow.read_text(encoding="utf-8")
        module = Path(reconcile.__file__).read_text(encoding="utf-8")
        for forbidden in ("supabase.co", "BEGIN", "INSERT", "UPDATE", "DELETE", "vercel deploy"):
            self.assertNotIn(forbidden, text)
            self.assertNotIn(forbidden, module)
        self.assertIn("schedule:", text)
        self.assertIn("contents: read", text)


if __name__ == "__main__":
    unittest.main()
