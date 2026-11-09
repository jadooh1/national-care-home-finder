import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { directoryContract } from "../../../lib/state-directory.ts";
import {
  CALIFORNIA_ARF_PROFILE,
  CALIFORNIA_CDSS_HEADER,
  CALIFORNIA_RCFE_PROFILE,
  adoptExportDate,
  validateStateSource,
} from "../../../lib/state-source-validation.ts";

const HEADER = [...CALIFORNIA_CDSS_HEADER];

function row(values: Record<string, string>): string[] {
  return HEADER.map(name => values[name] ?? "");
}

test("California source rows keep their original category, license id, and official fields", () => {
  const report = validateStateSource(CALIFORNIA_RCFE_PROFILE, [
    HEADER,
    row({
      facility_type: "RESIDENTIAL CARE ELDERLY",
      facility_number: "010000001",
      facility_name: "Example Home",
      facility_address: "1 Main St",
      facility_city: "Sacramento",
      facility_state: "CA",
      facility_zip: "95814",
      facility_status: "LICENSED",
      file_date: "5252025",
    }),
    row({
      facility_type: "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
      facility_number: "010000002",
      facility_name: "Example Community",
      facility_address: "2 Main St",
      facility_city: "Sacramento",
      facility_state: "CA",
      facility_status: "ON PROBATION",
      file_date: "5252025",
    }),
  ]);

  assert.equal(report.header_ok, true);
  assert.equal(report.rows_read, 2);
  assert.equal(report.records[0]?.license_category, "RESIDENTIAL CARE ELDERLY");
  assert.equal(report.records[0]?.license_id, "010000001");
  assert.equal(report.records[0]?.source_url, "https://data.chhs.ca.gov/dataset/ccl-facilities");
  assert.equal(report.records[0]?.official_fields.file_date, "5252025");
  assert.equal(report.records[1]?.license_category, "RCFE-CONTINUING CARE RETIREMENT COMMUNITY");
  assert.equal(report.raw_file_dates.includes("2025-05-25"), false);
  assert.equal(report.recorded_export_date, null);
  assert.equal(adoptExportDate(null, report.raw_file_dates), null);
  assert.equal(adoptExportDate("2025-05-25", report.raw_file_dates), null);
});

test("the adult residential file preserves other license categories and reports quality problems", () => {
  const report = validateStateSource(CALIFORNIA_ARF_PROFILE, [
    HEADER,
    row({
      facility_type: "ADULT DAY PROGRAM",
      facility_number: "100",
      facility_name: "Day Program",
      facility_address: "3 Main St",
      facility_state: "CA",
      facility_status: "LICENSED",
      file_date: "05252025",
    }),
    row({
      facility_type: "ADULT RESIDENTIAL",
      facility_number: "100",
      facility_name: "Duplicate",
      facility_address: "4 Main St",
      facility_state: "CA",
      facility_status: "LICENSED",
      file_date: "05252025",
    }),
    row({
      facility_type: "",
      facility_number: "",
      facility_name: "",
      facility_address: "",
      facility_state: "92354",
      facility_status: "9/2/1997",
      file_date: "05252025",
    }),
  ]);

  assert.equal(report.records[0]?.license_category, "ADULT DAY PROGRAM");
  assert.deepEqual(report.duplicate_license_ids, ["100"]);
  assert.equal(report.blank_license_ids, 1);
  assert.equal(report.blank_names, 1);
  assert.equal(report.blank_addresses, 1);
  assert.equal(report.blank_categories, 1);
  assert.equal(report.unrecognized_status, 1);
  assert.equal(report.unexpected_state, 1);
  assert.deepEqual(report.raw_file_dates, ["05252025"]);
  assert.equal(report.coordinate_columns, false);
  assert.equal(report.records.some(record => "latitude" in record.official_fields), false);
});

test("California stays unpublished when the table is clean", () => {
  const report = validateStateSource(CALIFORNIA_ARF_PROFILE, [
    HEADER,
    row({
      facility_type: "ADULT RESIDENTIAL",
      facility_number: "200",
      facility_name: "Clean Home",
      facility_address: "5 Main St",
      facility_state: "CA",
      facility_status: "PENDING",
      file_date: "05252025",
    }),
  ]);
  assert.equal(report.duplicate_license_ids.length, 0);
  assert.equal(report.blank_addresses, 0);
  assert.equal(report.unrecognized_status, 0);
  assert.equal(report.directory_ready, false);
  assert.equal(report.refresh_activated, false);
  assert.equal(report.persists_records, false);
  assert.equal(report.disclosure_url, null);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.mapPath, "/washington/map");
  assert.equal(directoryContract("Oregon")?.mapPath, null);
});

test("a mismatched header accepts nothing", () => {
  const report = validateStateSource(CALIFORNIA_RCFE_PROFILE, [["facility_type", "facility_number"]]);
  assert.equal(report.header_ok, false);
  assert.equal(report.rows_read, 0);
  assert.equal(report.directory_ready, false);
});

test("the validator does not fetch or store a California download", () => {
  const source = readFileSync(new URL("../../../lib/state-source-validation.ts", import.meta.url), "utf8");
  assert.equal(source.includes("fetch("), false);
  assert.equal(source.includes("supabase"), false);
  assert.equal(source.includes("insert"), false);
});
