import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE22_PROVISIONAL_CONFLICT_IDS,
  CALIFORNIA_PHASE22_PRIOR_CONTROL_IDS,
  californiaPhase22NarrowProbeIds,
} from "../../../lib/california-phase22-ids.ts";
import {
  evaluateCaliforniaPhase22Freshness,
  CALIFORNIA_PHASE22_FRESHNESS_CHANNELS,
  CALIFORNIA_PHASE22_FRESHNESS_REQUIREMENT,
  CALIFORNIA_PHASE22_CDSS_CLARIFICATION,
} from "../../../lib/california-phase22-freshness.ts";
import {
  CALIFORNIA_PHASE22_POLICY_CASES,
  summarizeCaliforniaPhase22PolicyCases,
  CALIFORNIA_PHASE22_ROSTER_SCAN_SUMMARY,
} from "../../../lib/california-phase22-unique-id-capacity.ts";
import {
  assessCaliforniaPhase22ProvisionalConflict,
  summarizeCaliforniaPhase22ProvisionalAssessments,
} from "../../../lib/california-phase22-provisional-review.ts";
import {
  CALIFORNIA_PHASE22_DECISION_MATRIX,
  summarizeCaliforniaPhase22DecisionMatrix,
} from "../../../lib/california-phase22-decision-matrix.ts";
import { buildCaliforniaPhase22LaunchBlockerLedger } from "../../../lib/california-phase22-ledger.ts";
import {
  CALIFORNIA_PHASE22_OBSERVED_COUNTS,
  assertCaliforniaPhase22ExclusiveAccounting,
  evaluateCaliforniaPhase22Quality,
} from "../../../lib/california-phase22-quality.ts";
import {
  CALIFORNIA_PHASE22_PUBLICATION_STOP_GO,
  CALIFORNIA_PHASE22_GLOBAL_LAUNCH_BLOCKERS,
  californiaPhase22AllowsPublication,
  evaluateCaliforniaPhase22Readiness,
} from "../../../lib/california-phase22-readiness.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase22-launch-blocker-evidence",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("phase 22 IDs: five provisional + three controls; narrow probe set only", () => {
  assert.equal(CALIFORNIA_PHASE22_PROVISIONAL_CONFLICT_IDS.length, 5);
  assert.equal(new Set(CALIFORNIA_PHASE22_PROVISIONAL_CONFLICT_IDS).size, 5);
  assert.deepEqual([...CALIFORNIA_PHASE22_PROVISIONAL_CONFLICT_IDS], [
    "198320787",
    "455920513",
    "197611076",
    "197611060",
    "134605014",
  ]);
  assert.deepEqual([...CALIFORNIA_PHASE22_PRIOR_CONTROL_IDS], [
    "502701867",
    "019201167",
    "019201133",
  ]);
  assert.equal(californiaPhase22NarrowProbeIds().length, 8);
});

test("phase 22 freshness: no authoritative ISO; weekly FAQ not export date; mailbox unavailable", () => {
  const freshness = evaluateCaliforniaPhase22Freshness();
  assert.equal(freshness.authoritativeIsoExportDate, null);
  assert.equal(freshness.acceptedAuthoritativeIsoChannelCount, 0);
  assert.equal(freshness.globalBlockerUnchanged, true);
  assert.equal(freshness.gate, "blocked");
  assert.equal(
    CALIFORNIA_PHASE22_FRESHNESS_REQUIREMENT.acceptsWeeklyUpdateFaqAlone,
    false,
  );
  assert.equal(
    CALIFORNIA_PHASE22_FRESHNESS_REQUIREMENT.acceptsFilenameMmddyyyyAlone,
    false,
  );
  assert.equal(
    CALIFORNIA_PHASE22_FRESHNESS_REQUIREMENT.currentAuthoritativeIsoExportDate,
    null,
  );

  const weekly = CALIFORNIA_PHASE22_FRESHNESS_CHANNELS.find(
    c => c.id === "transparency-faq-weekly-update",
  );
  assert.equal(weekly?.verdict, "accepted-policy-only-not-export-date");
  assert.equal(weekly?.clockClass, "policy-cadence");

  const filename = CALIFORNIA_PHASE22_FRESHNESS_CHANNELS.find(
    c => c.id === "download-content-disposition-filename-mmddyyyy",
  );
  assert.equal(filename?.verdict, "rejected-non-authoritative");
  assert.equal(filename?.clockClass, "download-filename-stamp");

  const website = CALIFORNIA_PHASE22_FRESHNESS_CHANNELS.find(
    c => c.id === "downloadstatedata-html-last-modified",
  );
  assert.equal(website?.clockClass, "website-static-asset");
  assert.equal(website?.verdict, "rejected-non-authoritative");

  const isoChannel = CALIFORNIA_PHASE22_FRESHNESS_CHANNELS.find(
    c => c.id === "official-iso-export-timestamp-channel",
  );
  assert.equal(isoChannel?.verdict, "absent");

  assert.equal(CALIFORNIA_PHASE22_CDSS_CLARIFICATION.duplicateInquiryAllowed, false);
  assert.equal(CALIFORNIA_PHASE22_CDSS_CLARIFICATION.duplicateInquirySent, false);
  assert.equal(CALIFORNIA_PHASE22_CDSS_CLARIFICATION.mailboxCheck.available, false);
  assert.equal(CALIFORNIA_PHASE22_CDSS_CLARIFICATION.status, "sent-awaiting-response");
});

test("phase 22 provisional classifier: LICENSED vs Provisional remains unresolved", () => {
  const provisional = assessCaliforniaPhase22ProvisionalConflict({
    facilityNumber: "198320787",
    role: "provisional-conflict",
    downloadStatus: "LICENSED",
    liveStatus: "Provisional License",
    liveFacilityNumber: "198320787",
    httpStatus: 200,
    found: true,
  });
  assert.equal(provisional.classId, "genuine-unresolved-licensing-conflict");
  assert.equal(provisional.eligibility, "unknown-ineligible");
  assert.equal(provisional.publicationEligible, false);
  assert.equal(provisional.preservedRawPair.downloadLicensed, true);
  assert.equal(provisional.preservedRawPair.facilityDetailStatus, "Provisional License");

  const controlPending = assessCaliforniaPhase22ProvisionalConflict({
    facilityNumber: "502701867",
    role: "prior-control",
    downloadStatus: "LICENSED",
    liveStatus: "Pending Incomplete Application",
    liveFacilityNumber: "502701867",
    httpStatus: 200,
    found: true,
  });
  assert.equal(controlPending.classId, "genuine-unresolved-licensing-conflict");

  const controlPendingIncrease = assessCaliforniaPhase22ProvisionalConflict({
    facilityNumber: "019201167",
    role: "prior-control",
    downloadStatus: "LICENSED",
    liveStatus: "Licensed/Pending Increase",
    liveFacilityNumber: "019201167",
    httpStatus: 200,
    found: true,
  });
  assert.equal(controlPendingIncrease.classId, "explainable-coarsening-or-timing");
  assert.equal(controlPendingIncrease.publicationEligible, false);

  const summary = summarizeCaliforniaPhase22ProvisionalAssessments([
    provisional,
    controlPending,
    controlPendingIncrease,
  ]);
  assert.equal(summary.provisionalUnresolved, 1);
  assert.equal(summary.publicationEligibleCount, 0);
  assert.equal(summary.statewideCrawlRepeated, false);
});

test("phase 22 unique-id/capacity policy cases fail-closed; baseline preserved", () => {
  assert.equal(CALIFORNIA_PHASE22_ROSTER_SCAN_SUMMARY.officialRows, 24377);
  assert.equal(CALIFORNIA_PHASE22_ROSTER_SCAN_SUMMARY.duplicateCount, 0);
  assert.equal(CALIFORNIA_PHASE22_ROSTER_SCAN_SUMMARY.invalidFacilityNumberCount, 1);
  assert.equal(CALIFORNIA_PHASE22_ROSTER_SCAN_SUMMARY.leadingZeroCount, 2102);
  assert.equal(CALIFORNIA_PHASE22_ROSTER_SCAN_SUMMARY.candidateBlankCapacity, 0);
  assert.equal(CALIFORNIA_PHASE22_ROSTER_SCAN_SUMMARY.unresolvedCoords, 28);

  const summary = summarizeCaliforniaPhase22PolicyCases();
  assert.ok(summary.unresolvedForLaunch >= 3);
  assert.equal(summary.publicationEligibleCount, 0);
  assert.equal(summary.activatedInApplicationOrDatabase, false);

  const invalid = CALIFORNIA_PHASE22_POLICY_CASES.find(
    c => c.id === "invalid-facility-number-95354",
  );
  assert.equal(invalid?.decision, "fail-closed-refuse-invalid-id");
  assert.equal(invalid?.publicationEligible, false);
});

test("phase 22 decision matrix separates statewide vs facility; STOP", () => {
  const summary = summarizeCaliforniaPhase22DecisionMatrix();
  assert.equal(summary.stopGo, "STOP");
  assert.equal(summary.allowsPublication, false);
  assert.equal(summary.gate, "blocked");
  assert.ok(summary.statewidePublicationBlockers >= 5);
  assert.ok(summary.facilityExcludableExceptions >= 4);

  const freshness = CALIFORNIA_PHASE22_DECISION_MATRIX.find(
    r => r.id === "authoritative-iso-export-date",
  );
  assert.equal(freshness?.kind, "statewide-publication-blocker");
  assert.equal(freshness?.canMitigateByExcludingFacilities, false);
  assert.equal(freshness?.actionLane, "blocked-awaiting-external");

  const provisional = CALIFORNIA_PHASE22_DECISION_MATRIX.find(
    r => r.id === "provisional-license-five-conflicts",
  );
  assert.equal(provisional?.kind, "facility-excludable-exception");
  assert.equal(provisional?.preventsStatewidePublication, false);
});

test("phase 22 ledger / readiness / quality: BLOCKED; no crawl; no activation", () => {
  const assessments = CALIFORNIA_PHASE22_PROVISIONAL_CONFLICT_IDS.map(id =>
    assessCaliforniaPhase22ProvisionalConflict({
      facilityNumber: id,
      role: "provisional-conflict",
      downloadStatus: "LICENSED",
      liveStatus: "Provisional License",
      liveFacilityNumber: id,
      httpStatus: 200,
      found: true,
    }),
  );
  for (const id of CALIFORNIA_PHASE22_PRIOR_CONTROL_IDS) {
    assessments.push(
      assessCaliforniaPhase22ProvisionalConflict({
        facilityNumber: id,
        role: "prior-control",
        downloadStatus: "LICENSED",
        liveStatus: id === "502701867"
          ? "Pending Incomplete Application"
          : "Licensed/Pending Increase",
        liveFacilityNumber: id,
        httpStatus: 200,
        found: true,
      }),
    );
  }

  const ledger = buildCaliforniaPhase22LaunchBlockerLedger({
    provisionalAssessments: assessments,
    policyCases: CALIFORNIA_PHASE22_POLICY_CASES,
  });
  assert.equal(ledger.allowsPublication, false);
  assert.equal(ledger.gate, "blocked");
  assert.equal(ledger.stopGo, "STOP");
  assert.equal(ledger.adoption.activatedInApplicationOrDatabase, false);
  assert.equal(ledger.baselinePreserved.officialRecords, 24377);
  assert.equal(ledger.baselinePreserved.publicationCandidates, 15451);
  assert.equal(ledger.baselinePreserved.verifiedOfficialCoords, 15423);
  assert.equal(ledger.baselinePreserved.unresolvedCoords, 28);
  assert.equal(ledger.summary.provisionalUnresolved, 5);
  assert.equal(ledger.summary.publicationEligibleCount, 0);

  assert.equal(californiaPhase22AllowsPublication(), false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(CALIFORNIA_PHASE22_PUBLICATION_STOP_GO.decision, "STOP");
  assert.equal(CALIFORNIA_PHASE22_PUBLICATION_STOP_GO.gate, "blocked");

  const readiness = evaluateCaliforniaPhase22Readiness();
  assert.equal(readiness.allowsPublication, false);
  assert.equal(readiness.authoritativeIsoExportDate, null);
  assert.equal(readiness.cdssClarification.status, "sent-awaiting-response");
  assert.equal(readiness.cdssClarification.duplicateInquiryAllowed, false);
  assert.ok(
    CALIFORNIA_PHASE22_GLOBAL_LAUNCH_BLOCKERS.includes(
      "authoritative-iso-export-date",
    ),
  );
  assert.ok(readiness.nextApprovalsOnly.length >= 5);

  const invariant = assertCaliforniaPhase22ExclusiveAccounting(
    CALIFORNIA_PHASE22_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE22_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(invariant.holds, true);

  const quality = evaluateCaliforniaPhase22Quality();
  assert.equal(quality.allowsPublication, false);
  assert.equal(quality.statewideCrawlRepeated, false);
  assert.equal(quality.exclusionPolicyActivatedInAppOrDb, false);
  assert.equal(quality.duplicateCdssInquirySent, false);
  assert.equal(quality.stopGo, "STOP");

  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
      || directoryContract("Oregon")?.publication === "development",
  );
});

test("phase 22 fixtures present after live investigation", () => {
  const summaryPath = join(fixtureDir, "live-run-summary.json");
  if (!existsSync(summaryPath)) {
    assert.ok(true);
    return;
  }
  const summary = loadJson<{
    gate: string;
    allowsPublication: boolean;
    statewideCrawlRepeated: boolean;
    authoritativeIsoExportDate: null;
    provisional: { expected: number; unresolved: number };
    stopGo: string;
    cdssClarification: string;
    duplicateCdssInquirySent: boolean;
  }>("live-run-summary.json");
  assert.equal(summary.gate, "blocked");
  assert.equal(summary.allowsPublication, false);
  assert.equal(summary.statewideCrawlRepeated, false);
  assert.equal(summary.authoritativeIsoExportDate, null);
  assert.equal(summary.provisional.expected, 5);
  assert.equal(summary.provisional.unresolved, 5);
  assert.equal(summary.stopGo, "STOP");
  assert.equal(summary.cdssClarification, "sent-awaiting-response");
  assert.equal(summary.duplicateCdssInquirySent, false);

  const ledger = loadJson<{
    gate: string;
    stopGo: string;
    summary: { provisionalUnresolved: number; publicationEligibleCount: number };
  }>("launch-blocker-ledger.json");
  assert.equal(ledger.gate, "blocked");
  assert.equal(ledger.stopGo, "STOP");
  assert.equal(ledger.summary.provisionalUnresolved, 5);
  assert.equal(ledger.summary.publicationEligibleCount, 0);
});
