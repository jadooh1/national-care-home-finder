import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CALIFORNIA_EXCLUDED_RECORDS,
  CALIFORNIA_PROFILE_URL,
  CALIFORNIA_RECORDED_EXPORT_DATE,
  californiaDirectoryReady,
  californiaDisclosureUrl,
  californiaEligibleCount,
  californiaExcludedCount,
  countStatuses,
  CALIFORNIA_ARF_ELIGIBLE_BY_STATUS,
  CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS,
} from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_ARF_ACCEPTED_CATEGORIES,
  CALIFORNIA_OPTIONAL_ENHANCEMENTS,
  CALIFORNIA_PUBLICATION_BLOCKERS,
  CALIFORNIA_RCFE_ACCEPTED_CATEGORIES,
  CALIFORNIA_RECORDED_STATUS_CONFLICTS,
  californiaSourceReadiness,
  validateCaliforniaSourceRows,
  type CaliforniaSourceRow,
} from "../../../lib/california-source-readiness.ts";
import { reconcileCaliforniaStatus } from "../../../lib/california-status-reconciliation.ts";
import { CALIFORNIA_FIELD_ASSESSMENT } from "../../../lib/facility-data-contract.ts";
import { CALIFORNIA_ARF_CATEGORIES, CALIFORNIA_RCFE_CATEGORIES } from "../../../lib/state-source-validation.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

function sourceRow(overrides: Partial<CaliforniaSourceRow> = {}): CaliforniaSourceRow {
  return {
    file: "RCFE",
    facility_type: "RESIDENTIAL CARE ELDERLY",
    facility_number: "12345678",
    facility_name: "Example Home",
    facility_address: "1 Main St",
    facility_city: "Sacramento",
    facility_state: "CA",
    facility_zip: "95814",
    facility_status: "LICENSED",
    file_date: "5252025",
    ...overrides,
  };
}

test("normalization keeps original source values and accepts none of them", () => {
  const report = validateCaliforniaSourceRows([sourceRow()]);
  const record = report.records[0];
  assert.equal(record?.originalLicenseId, "12345678");
  assert.equal(record?.originalStatus, "LICENSED");
  assert.equal(record?.originalCategory, "RESIDENTIAL CARE ELDERLY");
  assert.equal(record?.originalFileDate, "5252025");
  assert.equal(record?.originalAddress, "1 Main St");
  assert.equal(record?.sourceUrl, "https://data.chhs.ca.gov/dataset/ccl-facilities");
  assert.equal(record?.facilityId, null);
  assert.equal(record?.acceptedName, null);
  assert.equal(record?.acceptedAddress, null);
  assert.equal(record?.acceptedLicense, null);
  assert.equal(record?.exportDate, null);
  assert.equal(record?.disclosureUrl, null);
  assert.equal(californiaDisclosureUrl("12345678")?.includes("12345678"), true);
  assert.equal(record?.latitude, null);
  assert.equal(record?.longitude, null);
  assert.equal(record?.publication, "unpublished");
  assert.equal(record?.ownerClaimEligible, false);
  assert.deepEqual(record?.findings, []);
  assert.equal(report.persistsRecords, false);
});

test("malformed rows, excluded categories, duplicate licenses, and missing values are reported", () => {
  const report = validateCaliforniaSourceRows([
    sourceRow({
      file: "ARF",
      facility_type: "",
      facility_number: "",
      facility_name: "",
      facility_address: "",
      facility_state: "92354",
      facility_status: "9/2/1997",
      file_date: "05252025",
    }),
    sourceRow({
      file: "ARF",
      facility_type: "ADULT DAY PROGRAM",
      facility_number: "100",
      facility_status: "LICENSED",
    }),
    sourceRow({
      file: "ARF",
      facility_type: "ADULT RESIDENTIAL",
      facility_number: "100",
      facility_name: "Duplicate",
      facility_status: "LICENSED",
    }),
    sourceRow({
      file: "RCFE",
      facility_type: "",
      facility_number: "200",
      facility_state: "CA",
      facility_status: "LICENSED",
    }),
    sourceRow({
      facility_status: "",
      facility_state: "",
      facility_address: "   ",
    }),
  ]);

  assert.equal(report.records[0]?.originalStatus, "9/2/1997");
  assert.equal(report.records[0]?.originalFileDate, "05252025");
  assert.equal(report.records[0]?.exportDate, null);
  assert.equal(report.records[0]?.findings.includes("shifted-row"), true);
  assert.equal(report.records[0]?.findings.includes("blank-category"), true);
  assert.equal(report.records[0]?.findings.includes("missing-license"), true);
  assert.equal(report.records[0]?.findings.includes("missing-name"), true);
  assert.equal(report.records[0]?.findings.includes("missing-address"), true);
  assert.equal(report.records[1]?.findings.includes("other-license-category"), true);
  assert.deepEqual(report.duplicateLicenseIds, ["100"]);
  assert.equal(report.records[1]?.findings.includes("duplicate-license"), true);
  assert.equal(report.records[2]?.findings.includes("duplicate-license"), true);
  assert.equal(report.records[2]?.originalLicenseId, "100");
  assert.equal(report.records[3]?.findings.includes("blank-category"), true);
  assert.equal(report.records[3]?.findings.includes("shifted-row"), false);
  assert.equal(report.records[4]?.findings.includes("missing-status"), true);
  assert.equal(report.records[4]?.findings.includes("missing-state"), true);
  assert.equal(report.records[4]?.findings.includes("missing-address"), true);
  assert.equal(report.records[4]?.acceptedAddress, null);
});

test("recorded status conflicts stay conflicts and do not become active rows", () => {
  const notes = CALIFORNIA_RECORDED_STATUS_CONFLICTS.map(conflict => {
    const reconciled = reconcileCaliforniaStatus({
      openDataStatus: conflict.openDataStatus,
      httpStatus: 200,
      liveStatus: conflict.liveStatus,
      identifierMatched: true,
    });
    assert.equal(reconciled.classification, "conflict");
    assert.equal(reconciled.currentlyActive, false);
    assert.equal(reconciled.confirmedClosure, true);
    assert.equal(reconciled.openDataStatus, "LICENSED");
    return reconciled;
  });
  const timedOut = reconcileCaliforniaStatus({
    openDataStatus: "CLOSED",
    httpStatus: null,
    liveStatus: null,
    identifierMatched: false,
  });
  assert.equal(timedOut.classification, "inconclusive");
  const report = validateCaliforniaSourceRows([
    sourceRow({ facility_status: "LICENSED" }),
    sourceRow({ file: "ARF", facility_type: "ADULT RESIDENTIAL", facility_number: "87654321", file_date: "05252025", facility_status: "LICENSED" }),
  ], [...notes, timedOut]);
  assert.equal(report.statusConflicts, 2);
  assert.equal(report.records.every(record => record.originalStatus === "LICENSED"), true);
  assert.equal(report.records.every(record => record.publication === "unpublished"), true);
  assert.equal(report.publication, "unpublished");
});

test("the readiness report separates verified blockers from optional coordinates", () => {
  const readiness = californiaSourceReadiness();
  assert.equal(readiness.verified.structurallyEligible, californiaEligibleCount());
  assert.equal(readiness.verified.rcfeEligible, countStatuses(CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS));
  assert.equal(readiness.verified.arfEligible, countStatuses(CALIFORNIA_ARF_ELIGIBLE_BY_STATUS));
  assert.equal(readiness.verified.excluded, californiaExcludedCount());
  assert.equal(readiness.verified.blankCategory, CALIFORNIA_EXCLUDED_RECORDS.blankCategory);
  assert.equal(readiness.verified.otherLicenseCategory, CALIFORNIA_EXCLUDED_RECORDS.otherLicenseCategory);
  assert.equal(readiness.verified.shiftedRow, CALIFORNIA_EXCLUDED_RECORDS.shiftedRow);
  assert.equal(readiness.verified.confirmedStatusConflicts, 2);
  assert.equal(readiness.verified.authoritativeExportDate, CALIFORNIA_RECORDED_EXPORT_DATE);
  assert.equal(CALIFORNIA_PROFILE_URL, null);
  assert.equal(readiness.verified.disclosureUrlAdopted, false);
  assert.deepEqual(CALIFORNIA_RCFE_ACCEPTED_CATEGORIES, CALIFORNIA_RCFE_CATEGORIES);
  assert.deepEqual(CALIFORNIA_ARF_ACCEPTED_CATEGORIES, CALIFORNIA_ARF_CATEGORIES);
  assert.deepEqual(
    [...CALIFORNIA_PUBLICATION_BLOCKERS, ...CALIFORNIA_OPTIONAL_ENHANCEMENTS].sort(),
    [...CALIFORNIA_FIELD_ASSESSMENT.recordedGaps].sort(),
  );
  assert.equal(CALIFORNIA_OPTIONAL_ENHANCEMENTS.includes("open-data-has-no-coordinate-columns"), true);
  assert.equal(CALIFORNIA_PUBLICATION_BLOCKERS.includes("open-data-has-no-coordinate-columns"), false);
  assert.equal(CALIFORNIA_PUBLICATION_BLOCKERS.includes("no-authoritative-iso-export-date"), true);
  assert.equal(readiness.publicDirectoryPermitted, false);
  assert.equal(readiness.ownerClaimEligible, false);
  assert.equal(readiness.persistsRecords, false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  const home = readFileSync(new URL("../../../lib/copy/home.ts", import.meta.url), "utf8");
  const proposal = readFileSync(new URL("../20261114013000_california_source_readiness.md", import.meta.url), "utf8");
  assert.equal(home.includes("Find the right care home for your loved one."), true);
  assert.equal(proposal.includes("Missing coordinates are recorded and are not a publication blocker."), true);
  assert.equal(proposal.includes("does not download the source again"), true);
});
