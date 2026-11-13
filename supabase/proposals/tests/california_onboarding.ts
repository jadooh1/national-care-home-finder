import assert from "node:assert/strict";
import test from "node:test";
import {
  CALIFORNIA_ARF_ELIGIBLE_BY_STATUS,
  CALIFORNIA_EXCLUDED_RECORDS,
  CALIFORNIA_DETAIL_VERIFICATION,
  CALIFORNIA_FACILITY_DETAIL_PREFIX,
  CALIFORNIA_RAW_FILE_DATES,
  CALIFORNIA_RECORDED_EXPORT_DATE,
  CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS,
  CALIFORNIA_SOURCE_RECONCILIATION,
  californiaDirectoryReady,
  californiaDisclosureUrl,
  californiaEligibleCount,
  californiaExcludedCount,
  californiaStatusLabel,
  countStatuses,
} from "../../../lib/california-directory.ts";
import { directoryContract, directoryHref, mapHref } from "../../../lib/state-directory.ts";
import {
  CALIFORNIA_ARF_PROFILE,
  CALIFORNIA_CDSS_HEADER,
  CALIFORNIA_RCFE_PROFILE,
  adoptExportDate,
  publicationReadiness,
  validateStateSource,
} from "../../../lib/state-source-validation.ts";

const DEVELOPMENT_URL = "https://ajjsyloyihcqdomywhik.supabase.co";
const HEADER = [...CALIFORNIA_CDSS_HEADER];

function row(values: Record<string, string>): string[] {
  return HEADER.map(name => values[name] ?? "");
}

test("reconciled California eligibility counts and exclusions stay unchanged", () => {
  assert.equal(countStatuses(CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS), 12521);
  assert.equal(countStatuses(CALIFORNIA_ARF_ELIGIBLE_BY_STATUS), 8610);
  assert.equal(californiaEligibleCount(), 21131);
  assert.equal(californiaExcludedCount(), 1889);
  assert.equal(CALIFORNIA_EXCLUDED_RECORDS.blankCategory, 1);
  assert.equal(CALIFORNIA_EXCLUDED_RECORDS.otherLicenseCategory, 1887);
  assert.equal(CALIFORNIA_EXCLUDED_RECORDS.shiftedRow, 1);
  assert.equal(CALIFORNIA_SOURCE_RECONCILIATION.rcfeRows, 12522);
  assert.equal(CALIFORNIA_SOURCE_RECONCILIATION.arfRows, 10498);
  assert.equal(CALIFORNIA_SOURCE_RECONCILIATION.rcfeRows, 12521 + CALIFORNIA_EXCLUDED_RECORDS.blankCategory);
  assert.equal(
    CALIFORNIA_SOURCE_RECONCILIATION.arfRows,
    8610 + CALIFORNIA_EXCLUDED_RECORDS.otherLicenseCategory + CALIFORNIA_EXCLUDED_RECORDS.shiftedRow,
  );
});

test("license identity is preserved and a repeated license is reported", () => {
  const report = validateStateSource(CALIFORNIA_RCFE_PROFILE, [
    HEADER,
    row({
      facility_type: "RESIDENTIAL CARE ELDERLY",
      facility_number: "FIXTURE-100",
      facility_name: "Fixture Home A",
      facility_address: "1 Fixture Street",
      facility_state: "CA",
      facility_zip: "95814",
      facility_status: "LICENSED",
      file_date: "5252025",
    }),
    row({
      facility_type: "RESIDENTIAL CARE ELDERLY",
      facility_number: "FIXTURE-100",
      facility_name: "Fixture Home A Copy",
      facility_address: "2 Fixture Street",
      facility_state: "CA",
      facility_zip: "95814",
      facility_status: "LICENSED",
      file_date: "5252025",
    }),
  ]);
  assert.deepEqual(report.records.map(record => record.license_id), ["FIXTURE-100", "FIXTURE-100"]);
  assert.deepEqual(report.duplicate_license_ids, ["FIXTURE-100"]);
  assert.equal(report.persists_records, false);
});

test("category eligibility keeps other license categories excluded", () => {
  const report = validateStateSource(CALIFORNIA_ARF_PROFILE, [
    HEADER,
    row({
      facility_type: "ADULT RESIDENTIAL",
      facility_number: "FIXTURE-200",
      facility_name: "Fixture Adult Home",
      facility_address: "3 Fixture Street",
      facility_state: "CA",
      facility_zip: "95814",
      facility_status: "LICENSED",
      file_date: "05252025",
    }),
    row({
      facility_type: "ADULT DAY PROGRAM",
      facility_number: "FIXTURE-201",
      facility_name: "Fixture Day Program",
      facility_address: "4 Fixture Street",
      facility_state: "CA",
      facility_zip: "95814",
      facility_status: "LICENSED",
      file_date: "05252025",
    }),
  ]);
  const readiness = publicationReadiness(CALIFORNIA_ARF_PROFILE, report);
  assert.equal(readiness.eligible, 1);
  assert.equal(readiness.excluded_by_reason.unverified_category, 1);
  assert.equal(report.records[1]?.license_category, "ADULT DAY PROGRAM");
});

test("original status text is preserved and an unrecognized status is not relabeled", () => {
  const report = validateStateSource(CALIFORNIA_ARF_PROFILE, [
    HEADER,
    row({
      facility_type: "ADULT RESIDENTIAL",
      facility_number: "FIXTURE-300",
      facility_name: "Fixture Shifted Row",
      facility_address: "5 Fixture Street",
      facility_state: "92354",
      facility_zip: "9235",
      facility_status: "9/2/1997",
      file_date: "05252025",
    }),
  ]);
  assert.equal(report.records[0]?.official_fields.facility_status, "9/2/1997");
  assert.equal(californiaStatusLabel("9/2/1997"), null);
  assert.equal(californiaStatusLabel("LICENSED"), "Licensed");
  assert.equal(californiaStatusLabel("ON PROBATION"), "On probation");
  const readiness = publicationReadiness(CALIFORNIA_ARF_PROFILE, report);
  assert.equal(readiness.eligible, 0);
  assert.equal(readiness.excluded_by_reason.unrecognized_status, 1);
  assert.equal(readiness.source_fields_rewritten, false);
});

test("publication safeguards reject an invented export date and disclosure link", () => {
  assert.equal(CALIFORNIA_RECORDED_EXPORT_DATE, null);
  assert.equal(adoptExportDate("2025-05-25", [CALIFORNIA_RAW_FILE_DATES.rcfe, CALIFORNIA_RAW_FILE_DATES.arf]), null);
  assert.equal(adoptExportDate(CALIFORNIA_RAW_FILE_DATES.rcfe, [CALIFORNIA_RAW_FILE_DATES.rcfe]), null);
  assert.equal(adoptExportDate(CALIFORNIA_SOURCE_RECONCILIATION.packageMetadataModified, [CALIFORNIA_RAW_FILE_DATES.arf]), null);
  assert.equal(californiaDisclosureUrl("FIXTURE-100"), null);
  assert.equal(californiaDisclosureUrl("0"), null);
  assert.equal(californiaDisclosureUrl("1234567"), null);
  assert.equal(californiaDisclosureUrl("1234567890"), null);
  assert.equal(californiaDisclosureUrl("12345678"), `${CALIFORNIA_FACILITY_DETAIL_PREFIX}12345678`);
  assert.equal(californiaDisclosureUrl("123456789"), `${CALIFORNIA_FACILITY_DETAIL_PREFIX}123456789`);
  assert.equal(CALIFORNIA_DETAIL_VERIFICATION.identifierMatched, true);
  assert.equal(CALIFORNIA_DETAIL_VERIFICATION.categoryMatched, true);
  assert.equal(CALIFORNIA_DETAIL_VERIFICATION.openDataStatusConfirmed, false);
  assert.equal(CALIFORNIA_DETAIL_VERIFICATION.invalidZeroReturnsFacility, false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryHref("California", DEVELOPMENT_URL), null);
  assert.equal(mapHref("California"), null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryHref("Oregon", DEVELOPMENT_URL), "/oregon");
});
