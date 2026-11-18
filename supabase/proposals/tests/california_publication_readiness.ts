import assert from "node:assert/strict";
import test from "node:test";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_AUTHORITATIVE_EXPORT_DATE,
  CALIFORNIA_GIS_DATA_LAST_EDIT,
  CALIFORNIA_GIS_LAYER_NAME,
  CALIFORNIA_GIS_TEMPORAL_COVERAGE,
  CALIFORNIA_OPEN_DATA_ACCRUAL_PERIODICITY,
  CALIFORNIA_OPEN_DATA_TEMPORAL_COVERAGE,
  CALIFORNIA_READINESS_EVIDENCE,
  adoptCaliforniaExportDate,
  californiaPublicationReadiness,
  historicalLicensedIsCurrentlyActive,
  mayRepresentCaliforniaRecordAsCurrentlyActive,
} from "../../../lib/california-publication-readiness.ts";
import { directoryContract } from "../../../lib/state-directory.ts";
import { onboardingDecision } from "../../../lib/state-onboarding.ts";
import { onboardingProfile } from "../../../lib/nationwide-onboarding.ts";

test("catalog clocks and file-date text are not an authoritative export date", () => {
  assert.equal(CALIFORNIA_AUTHORITATIVE_EXPORT_DATE, null);
  assert.equal(adoptCaliforniaExportDate(null), null);
  assert.equal(adoptCaliforniaExportDate(CALIFORNIA_OPEN_DATA_TEMPORAL_COVERAGE), null);
  assert.equal(adoptCaliforniaExportDate(CALIFORNIA_OPEN_DATA_ACCRUAL_PERIODICITY), null);
  assert.equal(adoptCaliforniaExportDate(CALIFORNIA_GIS_TEMPORAL_COVERAGE), null);
  assert.equal(adoptCaliforniaExportDate(CALIFORNIA_GIS_DATA_LAST_EDIT), null);
  assert.equal(adoptCaliforniaExportDate(CALIFORNIA_GIS_LAYER_NAME), null);
  assert.equal(adoptCaliforniaExportDate("2025-05-25"), null);
  assert.equal(adoptCaliforniaExportDate("2026-11-12"), null);
});

test("historical licensed records stay inactive and the readiness classes stay separate", () => {
  const report = californiaPublicationReadiness();
  assert.equal(report.publication, "unpublished");
  assert.equal(report.authoritativeExportDate, null);
  assert.equal(report.updateFrequencyDocumented, false);
  assert.equal(report.bulkStatusVocabularyPublished, false);
  assert.equal(report.gisDataIsStatic, true);
  assert.equal(report.confirmedStatusConflicts, 2);
  assert.equal(report.inconclusiveTimedOutRequests, 7);
  assert.equal(report.publicDirectoryPermitted, false);
  assert.equal(historicalLicensedIsCurrentlyActive(), false);
  assert.equal(report.historicalLicensedIsCurrentlyActive, false);
  assert.equal(mayRepresentCaliforniaRecordAsCurrentlyActive({
    openDataStatus: "LICENSED",
    liveStatus: "Licensed",
    identifierMatched: true,
    httpStatus: 200,
  }), false);
  assert.equal(mayRepresentCaliforniaRecordAsCurrentlyActive({
    openDataStatus: "LICENSED",
    liveStatus: "Closed, Change of Ownership",
    identifierMatched: true,
    httpStatus: 200,
  }), false);
  const classes = new Set(CALIFORNIA_READINESS_EVIDENCE.map(item => item.className));
  assert.deepEqual([...classes].sort(), [
    "confirmed-status-conflict",
    "historical-or-stale",
    "missing-or-inconclusive",
    "publication-blocker",
    "verified-source-evidence",
  ]);
});

test("California stays unpublished while Washington and Oregon keep their contracts", () => {
  const decision = onboardingDecision("California");
  const profile = onboardingProfile("California");
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(decision.publication, "unpublished");
  assert.equal(decision.recordedExportDate, null);
  assert.equal(profile.publication, "unpublished");
  assert.equal(profile.recordedExportDate, null);
  assert.deepEqual(profile.blockers, decision.blockers);
  assert.ok(decision.blockers.includes("temporal-coverage-text-is-not-an-export-date"));
  assert.ok(decision.blockers.includes("accrual-periodicity-other-is-not-an-update-frequency"));
  assert.ok(decision.blockers.includes("gis-service-edit-time-is-not-an-export-date"));
  assert.ok(decision.blockers.includes("gis-status-code-has-no-published-domain"));
  assert.equal(directoryContract("California")?.directoryPath, null);
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.equal(directoryContract("Oregon")?.publication, "development");
});
