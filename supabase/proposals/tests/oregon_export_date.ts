import assert from "node:assert/strict";
import test from "node:test";
import { ODHS_EXPORT_HEADER } from "../../../lib/oregon-odhs-roster.ts";
import {
  OREGON_DIRECTORY_ACCEPTED_ROWS,
  OREGON_DIRECTORY_ZERO_BED_ROWS,
  OREGON_EXPORT_AFH_OPEN_ACCEPTED_BEDS,
  OREGON_EXPORT_AFH_OPEN_ROWS,
  OREGON_EXPORT_AFH_OPEN_ZERO_BEDS,
  OREGON_EXPORT_CLOSED_ROWS,
  OREGON_EXPORT_FILENAME,
  OREGON_EXPORT_HAS_DATE_COLUMN,
  OREGON_EXPORT_HTTP_DATE,
  OREGON_EXPORT_OPEN_ROWS,
  OREGON_EXPORT_ROWS,
  OREGON_EXPORT_REPLY_FOUND,
  OREGON_RECORDED_EXPORT_DATE,
  OREGON_UPDATE_NOTICE,
  adoptOregonExportDate,
  oregonExportComparison,
  oregonExportDateReady,
} from "../../../lib/oregon-export-date.ts";
import { onboardingProfile } from "../../../lib/nationwide-onboarding.ts";
import { directoryContract } from "../../../lib/state-directory.ts";
import { onboardingDecision } from "../../../lib/state-onboarding.ts";

const OBSERVED_HEADER = [
  "ID",
  "Name",
  "Type",
  "Address",
  "City",
  "Zip",
  "County",
  "Phone",
  "Email",
  "Licensed beds",
  "Accepts Medicaid",
  "Memory Care",
  "Status",
];

test("the provider export has no authoritative date column", () => {
  assert.deepEqual(OBSERVED_HEADER, [...ODHS_EXPORT_HEADER]);
  assert.equal(OBSERVED_HEADER.some(name => /date|effective|snapshot|updated/i.test(name)), false);
  assert.equal(OREGON_EXPORT_HAS_DATE_COLUMN, false);
  assert.equal(OREGON_RECORDED_EXPORT_DATE, null);
  assert.equal(adoptOregonExportDate(null), null);
  assert.equal(adoptOregonExportDate(OREGON_EXPORT_FILENAME), null);
  assert.equal(adoptOregonExportDate(OREGON_EXPORT_HTTP_DATE), null);
  assert.equal(adoptOregonExportDate(OREGON_UPDATE_NOTICE), null);
  assert.equal(adoptOregonExportDate("2026-11-13"), null);
  assert.equal(oregonExportDateReady(), false);
  assert.equal(OREGON_EXPORT_REPLY_FOUND, false);
});

test("the later count is recorded separately from the development directory", () => {
  const comparison = oregonExportComparison();
  assert.equal(OREGON_EXPORT_OPEN_ROWS + OREGON_EXPORT_CLOSED_ROWS, OREGON_EXPORT_ROWS);
  assert.equal(OREGON_EXPORT_AFH_OPEN_ACCEPTED_BEDS + OREGON_EXPORT_AFH_OPEN_ZERO_BEDS, OREGON_EXPORT_AFH_OPEN_ROWS);
  assert.equal(comparison.recordedAcceptedRows, OREGON_DIRECTORY_ACCEPTED_ROWS);
  assert.equal(comparison.laterAcceptedRows, 1582);
  assert.equal(comparison.recordedZeroBedRows, OREGON_DIRECTORY_ZERO_BED_ROWS);
  assert.equal(comparison.laterZeroBedRows, 24);
  assert.equal(comparison.recordsChanged, false);
  assert.equal(comparison.exportDateAdopted, false);
  assert.equal(onboardingProfile("Oregon").recordedExportDate, null);
  assert.equal(onboardingProfile("Oregon").publication, "development");
  assert.deepEqual(onboardingProfile("Oregon").blockers, onboardingDecision("Oregon").blockers);
  assert.ok(onboardingDecision("Oregon").blockers.includes("provider-export-has-no-date-column"));
  assert.ok(onboardingDecision("Oregon").blockers.includes("download-filename-is-not-an-export-date"));
  assert.ok(onboardingDecision("Oregon").blockers.includes("twenty-four-hour-update-notice-is-not-an-export-date"));
  assert.equal(directoryContract("Oregon")?.publication, "development");
  assert.equal(directoryContract("Oregon")?.directoryPath, "/oregon");
  assert.equal(directoryContract("Washington")?.publication, "public");
});
