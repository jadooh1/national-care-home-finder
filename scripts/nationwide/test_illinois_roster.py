import json
import os
import unittest
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from illinois_roster import (
    ASSISTED_LIVING_CATEGORY,
    BASELINE,
    ILLINOIS_BATCH_ID,
    IllinoisRoster,
    illinois_source_batch,
    map_source,
    matches_baseline,
    read_xlsx,
    roster_row,
    summary,
)
from state_adapter import (
    StateRosterAdapter,
    ValidationReport,
    load_manifest,
    publication_eligible,
    validate_manifest,
)


HEADERS = [
    "Licensee ID",
    "Effective Date",
    "Expiration Date",
    "Facility ID",
    "Facility/Establishment Name",
    "Facility Street Address",
    "Facility City",
    "Facility State",
    "Facility Zip Code",
    "Facility County",
    "Facility Type",
    "Type of Entity",
    "Total number of AL /SH units for license",
]


def _xlsx(path: Path, rows: list[list[str]]) -> None:
    shared = ["3 liner with License", "As of 2026-10-28 16:16:10 Central Standard Time/CST", *HEADERS]
    matrix = [
        ["3 liner with License"],
        ["As of 2026-10-28 16:16:10 Central Standard Time/CST"],
        [],
        HEADERS,
        *rows,
    ]
    for row in rows:
        for value in row:
            if value and value not in shared:
                shared.append(value)

    def shared_index(value: str) -> str | None:
        if value in shared:
            return str(shared.index(value))
        return None

    sheet_rows = []
    for row_number, row in enumerate(matrix, start=1):
        cells = []
        for column, value in enumerate(row, start=1):
            if not value:
                continue
            letter = chr(ord("A") + column - 1)
            index = shared_index(value)
            if index is None:
                cells.append(f'<c r="{letter}{row_number}"><v>{value}</v></c>')
            else:
                cells.append(f'<c r="{letter}{row_number}" t="s"><v>{index}</v></c>')
        sheet_rows.append(f'<row r="{row_number}">{"".join(cells)}</row>')
    shared_xml = "".join(f"<si><t>{value}</t></si>" for value in shared)
    sheet_xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f"<sheetData>{''.join(sheet_rows)}</sheetData></worksheet>"
    )
    shared_document = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f"{shared_xml}</sst>"
    )
    with zipfile.ZipFile(path, "w") as book:
        book.writestr(
            "[Content_Types].xml",
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/xl/worksheets/sheet1.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            '<Override PartName="/xl/sharedStrings.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>'
            "</Types>",
        )
        book.writestr(
            "xl/workbook.xml",
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            '<sheets><sheet name="Licenses" sheetId="1" r:id="rId1" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></sheets>'
            "</workbook>",
        )
        book.writestr("xl/worksheets/sheet1.xml", sheet_xml)
        book.writestr("xl/sharedStrings.xml", shared_document)


def row(
    licensee: str,
    facility: str,
    category: str = ASSISTED_LIVING_CATEGORY,
    expiration: str = "6/30/2027",
    units: str = "12",
    zip_code: str = "60601",
    state: str = "Illinois",
    name: str = "Example Home",
) -> list[str]:
    return [
        licensee,
        "9/1/2026",
        expiration,
        facility,
        name,
        "1 Example Street",
        "Springfield",
        state,
        zip_code,
        "Sangamon",
        category,
        "Limited Liability Company",
        units,
    ]


class IllinoisMappingTest(unittest.TestCase):
    def test_adapter_interface_reports_unpublished_rows(self):
        self.assertTrue(issubclass(IllinoisRoster, StateRosterAdapter))
        with self.fixture() as path:
            report = IllinoisRoster().review(str(path))
        self.assertIsInstance(report, ValidationReport)
        self.assertEqual(report.state_name, "Illinois")
        self.assertEqual(report.publication_public, 0)
        self.assertEqual(report.accepted, 2)
        self.assertEqual(report.review_flags["expiration-precedes-extract"], 1)
        self.assertEqual(report.excluded_non_facility_rows, 2)

    def test_category_address_and_expiration_flag_stay_unverified(self):
        with self.fixture() as path:
            mapped = map_source(read_xlsx(path))
        record = mapped["accepted"][0]
        self.assertEqual(record["original_category"], ASSISTED_LIVING_CATEGORY)
        self.assertEqual(record["normalized_category"], ASSISTED_LIVING_CATEGORY)
        self.assertIsNone(record["physical_address"])
        self.assertEqual(record["unverified_address_provenance"], "idph-listed-address")
        self.assertIsNone(record["original_status"])
        self.assertEqual(record["publication"], "unpublished")
        self.assertEqual(record["source_record_id"], "idph-licensee:100")
        staged = roster_row(record)
        self.assertNotIn("review_flags", staged)
        self.assertNotIn("reported_alsh_units", staged)
        self.assertNotIn("source_attributes", staged)
        self.assertEqual(record["source_attributes"]["Licensee ID"], "100")
        self.assertEqual(record["source_attributes"]["Total number of AL /SH units for license"], "12")
        self.assertEqual(staged["facility_identifier"], "700")
        self.assertIsNone(staged["license_identifier"])
        flagged = mapped["accepted"][1]
        self.assertIn("expiration-precedes-extract", flagged["review_flags"])
        self.assertFalse(publication_eligible(flagged))
        opened = dict(flagged)
        opened["publication"] = "development"
        with self.assertRaises(ValueError):
            roster_row(opened)
        activated = dict(flagged)
        activated["normalized_status"] = "active"
        with self.assertRaises(ValueError):
            roster_row(activated)

    def test_total_row_and_invalid_rows_do_not_enter_the_roster(self):
        with self.fixture() as path:
            mapped = map_source(read_xlsx(path))
        reasons = {item["reason"] for item in mapped["rejected"]}
        self.assertIn("duplicate-facility-id", reasons)
        self.assertIn("zip-code-is-not-five-digits", reasons)
        self.assertIn("missing-or-nonnumeric-facility-id", reasons)
        self.assertEqual(mapped["out_of_scope"]["Long Term Care Facility"], 1)
        self.assertEqual([item["reason"] for item in mapped["excluded"]], ["capacity-total-row", "non-facility-row"])
        self.assertEqual(sum(record["reported_alsh_units"] for record in mapped["accepted"]), 19)
        source_rows = illinois_source_batch(mapped, "a" * 64)
        self.assertTrue(all(row["publication"] == "unpublished" for row in source_rows))
        self.assertEqual(source_rows[0]["ingestion_batch_id"], ILLINOIS_BATCH_ID)
        flagged = [row for row in source_rows if row["review_flags"]]
        self.assertEqual(len(flagged), 1)
        self.assertIsNone(flagged[0]["original_status"])
        self.assertIsNone(flagged[0]["normalized_status"])
        self.assertIn("Licensee ID", flagged[0]["original_identifiers"])

    def test_script_does_not_publish_or_open_a_directory(self):
        source = Path(__file__).with_name("illinois_roster.py").read_text(encoding="utf-8")
        proposal = Path(__file__).resolve().parents[2].joinpath(
            "supabase/proposals/illinois-roster-onboarding.md"
        ).read_text(encoding="utf-8")
        directory = Path(__file__).resolve().parents[2].joinpath("lib/state-directory.ts").read_text(encoding="utf-8")
        self.assertNotIn("publication = 'public'", source)
        self.assertNotIn("import supabase", source.lower())
        self.assertIn("unpublished", proposal)
        self.assertNotIn("/illinois", directory)
        self.assertEqual(BASELINE["assisted_living_records"], 502)
        self.assertEqual(BASELINE["assisted_living_units"], 27823)
        manifest = load_manifest(Path(__file__).resolve().parents[2] / "supabase/proposals/onboarding/illinois.json")
        profile = IllinoisRoster().profile()
        self.assertEqual(profile["categories"], [ASSISTED_LIVING_CATEGORY])
        self.assertEqual(profile["identifier_type"], "facility-id")
        self.assertEqual(profile["capacity_unit"], "alsh-units")
        self.assertEqual(profile["status_convention"], "review-flag")
        self.assertEqual(profile["refresh_schedule"], "on-new-official-extract")
        self.assertEqual(manifest["publication_eligibility"], "ineligible")
        self.assertEqual(manifest["validation"]["accepted"], 502)
        self.assertEqual(manifest["validation"]["excluded_capacity_total_rows"], 1)
        self.assertEqual(manifest["validation"]["excluded_non_facility_rows"], 1)
        self.assertEqual(manifest["validation"]["expiration_review_flags"], 17)
        proposals = Path(__file__).resolve().parents[2].joinpath("supabase/proposals")
        proposal = proposals.joinpath("20261111180000_nationwide_source_record.sql").read_text(encoding="utf-8")
        rollback = proposals.joinpath("20261111181000_illinois_source_rollback.sql").read_text(encoding="utf-8")
        table_rollback = proposals.joinpath("20261111180000_nationwide_source_record_ROLLBACK.sql").read_text(encoding="utf-8")
        self.assertIn("check (publication = 'unpublished')", proposal)
        self.assertIn("original_status is null and normalized_status is null", proposal)
        self.assertNotIn("insert into", proposal.lower())
        for text in (proposal, rollback, table_rollback):
            self.assertIn("1086", text)
            self.assertIn("north-carolina-dhhs-roster-pilot-20261110", text)
            self.assertIn("39", text)
            self.assertIn("delaware-dhcq-assisted-living-pilot-20261110", text)
            self.assertIn("6278", text)
            self.assertIn("wa_dshs_listed_facilities", text)
            self.assertIn("1584", text)
            self.assertIn("or_odhs_listed_afh", text)
        self.assertIn("delete from public.nationwide_source_record", rollback.lower())
        self.assertNotIn("delete from public.nationwide_roster", rollback.lower())
        self.assertNotIn("delete from public.wa_", rollback.lower())
        self.assertNotIn("delete from public.or_", rollback.lower())
        self.assertIn(ILLINOIS_BATCH_ID, rollback)
        self.assertNotIn("drop table public.nationwide_roster", table_rollback.lower())
        alternate = dict(manifest)
        alternate["publication_eligibility"] = "eligible"
        with self.assertRaises(ValueError):
            validate_manifest(alternate)
        other_state = json.loads(json.dumps(manifest))
        other_state["state_name"] = "Example"
        other_state["authority"] = "Example Licensing Authority"
        other_state["validation"] = {"accepted": 1, "expiration_review_flags": 0}
        other_state["profile"] = {
            "categories": ["Example Care Home"],
            "identifier_type": "license",
            "capacity_unit": "beds",
            "status_convention": "source-status",
            "refresh_schedule": "quarterly",
        }
        other_state["refresh_monitoring"] = {"schedule": "quarterly"}
        self.assertEqual(validate_manifest(other_state)["profile"]["capacity_unit"], "beds")

    def test_official_workbook_matches_the_verified_baseline(self):
        workbook = os.environ.get("ILLINOIS_ROSTER_XLSX")
        if not workbook:
            self.skipTest("official workbook is local and is not committed")
        source = read_xlsx(workbook)
        mapped = map_source(source)
        self.assertTrue(matches_baseline(mapped, source["sha256"]))
        report = IllinoisRoster().validate(mapped)
        counts = summary(mapped)
        self.assertEqual(report.facility_records, 1459)
        self.assertEqual(report.accepted, 502)
        self.assertEqual(report.rejected, 0)
        self.assertEqual(counts["excluded_reasons"]["capacity-total-row"], 1)
        self.assertEqual(counts["excluded_reasons"]["non-facility-row"], 1)
        flagged = [record for record in mapped["accepted"] if record["review_flags"]]
        source_rows = illinois_source_batch(mapped, source["sha256"])
        self.assertEqual(len(source_rows), 502)
        self.assertEqual(len(flagged), 17)
        self.assertEqual(sum(bool(row["review_flags"]) for row in source_rows), 17)
        self.assertTrue(all(
            row["publication"] == "unpublished"
            and row["original_status"] is None
            and row["normalized_status"] is None
            for row in source_rows
        ))
        for record in flagged:
            self.assertEqual(record["publication"], "unpublished")
            self.assertFalse(publication_eligible(record))
            self.assertIsNone(roster_row(record)["normalized_status"])
            self.assertIn("Licensee ID", record["source_attributes"])
            self.assertNotIn("source_attributes", roster_row(record))

    def fixture(self):
        import tempfile

        holder = tempfile.TemporaryDirectory()
        path = Path(holder.name) / "illinois.xlsx"
        _xlsx(
            path,
            [
                row("100", "700", units="12"),
                row("101", "701", expiration="10/1/2026", units="7"),
                row("102", "700", units="4"),
                row("103", "703", zip_code="6060", units="3"),
                row("104", "", units="2"),
                row("200", "800", category="Long Term Care Facility", units="40"),
                ["", "", "", "", "", "", "", "", "", "", "", "", "19"],
                ["", "1472", "", "", "", "", "", "", "", "", "", "", ""],
            ],
        )
        self.fixture_path = path
        return _closing(holder)

    def test_generated_fixture_is_readable_xml(self):
        with self.fixture() as path:
            with zipfile.ZipFile(path) as book:
                root = ET.fromstring(book.read("xl/worksheets/sheet1.xml"))
        self.assertGreater(len(root), 0)


class _closing:
    def __init__(self, holder):
        self.holder = holder

    def __enter__(self):
        return Path(self.holder.name) / "illinois.xlsx"

    def __exit__(self, exc_type, exc, traceback):
        self.holder.cleanup()


if __name__ == "__main__":
    unittest.main()
