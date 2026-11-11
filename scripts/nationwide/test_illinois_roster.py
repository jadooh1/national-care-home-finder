import os
import unittest
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from illinois_roster import (
    ASSISTED_LIVING_CATEGORY,
    BASELINE,
    IllinoisRoster,
    map_source,
    matches_baseline,
    read_xlsx,
    roster_row,
)
from state_adapter import StateRosterAdapter, ValidationReport


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
        self.assertEqual(staged["facility_identifier"], "700")
        self.assertIsNone(staged["license_identifier"])

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

    def test_official_workbook_matches_the_verified_baseline(self):
        workbook = os.environ.get("ILLINOIS_ROSTER_XLSX")
        if not workbook:
            self.skipTest("official workbook is local and is not committed")
        source = read_xlsx(workbook)
        mapped = map_source(source)
        self.assertTrue(matches_baseline(mapped, source["sha256"]))
        report = IllinoisRoster().validate(mapped)
        self.assertEqual(report.facility_records, 1459)
        self.assertEqual(report.accepted, 502)
        self.assertEqual(report.rejected, 0)

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
