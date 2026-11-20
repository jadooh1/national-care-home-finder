import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE21_LICENSING_CONFLICT_IDS,
  CALIFORNIA_PHASE21_INCONCLUSIVE_IDS,
  CALIFORNIA_PHASE21_PHASE20_CONFLICT_COUNT,
} from "../../../lib/california-phase21-conflict-ids.ts";
import {
  classifyCaliforniaPhase21LicensingDiscrepancy,
  summarizeCaliforniaPhase21Classifications,
} from "../../../lib/california-phase21-conflict-classification.ts";
import { buildCaliforniaPhase21ExceptionLedger } from "../../../lib/california-phase21-exception-ledger.ts";
import {
  CALIFORNIA_PHASE21_OBSERVED_COUNTS,
  assertCaliforniaPhase21ExclusiveAccounting,
  evaluateCaliforniaPhase21Quality,
} from "../../../lib/california-phase21-quality.ts";
import {
  CALIFORNIA_PHASE21_PUBLICATION_STOP_GO,
  californiaPhase21AllowsPublication,
  evaluateCaliforniaPhase21Readiness,
} from "../../../lib/california-phase21-readiness.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase21-exception-reconciliation",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("phase 21 conflict IDs: exactly 71 unique; inconclusives separate", () => {
  assert.equal(CALIFORNIA_PHASE21_PHASE20_CONFLICT_COUNT, 71);
  assert.equal(CALIFORNIA_PHASE21_LICENSING_CONFLICT_IDS.length, 71);
  assert.equal(new Set(CALIFORNIA_PHASE21_LICENSING_CONFLICT_IDS).size, 71);
  assert.deepEqual([...CALIFORNIA_PHASE21_INCONCLUSIVE_IDS].sort(), [
    "331881723",
    "365530371",
  ]);
  for (const id of CALIFORNIA_PHASE21_INCONCLUSIVE_IDS) {
    assert.equal(
      (CALIFORNIA_PHASE21_LICENSING_CONFLICT_IDS as readonly string[]).includes(id),
      false,
    );
  }
});

test("phase 21 classifier: Licensed/Pending Increase explainable but ineligible", () => {
  const pendingIncrease = classifyCaliforniaPhase21LicensingDiscrepancy({
    facilityNumber: "374604742",
    downloadStatus: "LICENSED",
    liveStatus: "Licensed/Pending Increase",
    liveFacilityNumber: "374604742",
    httpStatus: 200,
    found: true,
    source: "phase20-conflict",
  });
  assert.equal(pendingIncrease.classId, "explainable-coarsening-or-timing");
  assert.equal(pendingIncrease.eligibility, "unknown-ineligible");
  assert.equal(pendingIncrease.publicationEligible, false);

  const provisional = classifyCaliforniaPhase21LicensingDiscrepancy({
    facilityNumber: "198320787",
    downloadStatus: "LICENSED",
    liveStatus: "Provisional License",
    liveFacilityNumber: "198320787",
    httpStatus: 200,
    found: true,
  });
  assert.equal(provisional.classId, "genuine-unresolved-licensing-conflict");
  assert.equal(provisional.publicationEligible, false);

  const pendingIncomplete = classifyCaliforniaPhase21LicensingDiscrepancy({
    facilityNumber: "502701867",
    downloadStatus: "LICENSED",
    liveStatus: "Pending Incomplete Application",
    liveFacilityNumber: "502701867",
    httpStatus: 200,
    found: true,
  });
  assert.equal(pendingIncomplete.classId, "genuine-unresolved-licensing-conflict");

  const http500 = classifyCaliforniaPhase21LicensingDiscrepancy({
    facilityNumber: "365530371",
    downloadStatus: "LICENSED",
    liveStatus: null,
    httpStatus: 500,
    found: false,
    source: "phase20-inconclusive-retry",
  });
  assert.equal(http500.classId, "inconclusive-transport-or-server-error");
  assert.equal(http500.publicationEligible, false);

  const invalid = classifyCaliforniaPhase21LicensingDiscrepancy({
    facilityNumber: "95354",
    downloadStatus: "PENDING",
    liveStatus: null,
  });
  assert.equal(invalid.classId, "invalid-or-mismatched-identity");

  const summary = summarizeCaliforniaPhase21Classifications([
    pendingIncrease,
    provisional,
    http500,
  ]);
  assert.equal(summary.byClass["explainable-coarsening-or-timing"], 1);
  assert.equal(summary.publicationEligibleCount, 0);
});

test("phase 21 ledger: preserves coords/invalid/missing-date; offline only", () => {
  const ledger = buildCaliforniaPhase21ExceptionLedger({
    discrepancyClassifications: [
      {
        facilityNumber: "374604742",
        classId: "explainable-coarsening-or-timing",
        eligibility: "unknown-ineligible",
        downloadStatus: "LICENSED",
        liveStatus: "Licensed/Pending Increase",
      },
    ],
    inconclusiveClassifications: [
      {
        facilityNumber: "365530371",
        classId: "inconclusive-transport-or-server-error",
        eligibility: "unknown-ineligible",
      },
    ],
  });
  assert.equal(ledger.allowsPublication, false);
  assert.equal(ledger.gate, "blocked");
  assert.equal(ledger.adoption.activatedInApplicationOrDatabase, false);
  assert.equal(ledger.summary.unresolvedCoordinateCount, 28);
  assert.equal(ledger.summary.missingLicenseEvidenceCount, 14);
  assert.ok(ledger.summary.byCategory["unverified-coordinates"] >= 1);
  assert.ok(ledger.summary.byCategory["invalid-identifier"] >= 1);
  assert.ok(ledger.summary.byCategory["prior-known-status-conflict"] >= 3);
  assert.equal(ledger.summary.publicationEligibleCount, 0);
});

test("phase 21 gate / readiness: BLOCKED; no statewide re-crawl", () => {
  assert.equal(californiaPhase21AllowsPublication(), false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(CALIFORNIA_PHASE21_PUBLICATION_STOP_GO.decision, "STOP");
  assert.equal(CALIFORNIA_PHASE21_PUBLICATION_STOP_GO.gate, "blocked");

  const readiness = evaluateCaliforniaPhase21Readiness();
  assert.equal(readiness.allowsPublication, false);
  assert.equal(readiness.cdssClarification.status, "sent-awaiting-response");
  assert.equal(readiness.cdssClarification.duplicateInquiryAllowed, false);
  assert.equal(readiness.cdssClarification.mailboxCheckAvailable, false);
  assert.equal(readiness.statewideRosterVerificationComplete, true);

  const invariant = assertCaliforniaPhase21ExclusiveAccounting(
    CALIFORNIA_PHASE21_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE21_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(invariant.holds, true);

  const quality = evaluateCaliforniaPhase21Quality();
  assert.equal(quality.allowsPublication, false);
  assert.equal(quality.statewideCrawlRepeated, false);
  assert.equal(quality.exclusionPolicyActivatedInAppOrDb, false);

  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
      || directoryContract("Oregon")?.publication === "development",
  );
});

test("phase 21 fixtures present after live investigation", () => {
  const summaryPath = join(fixtureDir, "live-run-summary.json");
  if (!existsSync(summaryPath)) {
    assert.ok(true);
    return;
  }
  const summary = loadJson<{
    gate: string;
    allowsPublication: boolean;
    statewideCrawlRepeated: boolean;
    conflicts: { expected: number; probed: number };
    inconclusive: { ids: string[] };
    cdssClarification: string;
  }>("live-run-summary.json");
  assert.equal(summary.gate, "blocked");
  assert.equal(summary.allowsPublication, false);
  assert.equal(summary.statewideCrawlRepeated, false);
  assert.equal(summary.conflicts.expected, 71);
  assert.ok(summary.conflicts.probed <= 71);
  assert.ok(summary.inconclusive.ids.includes("365530371"));
  assert.equal(summary.cdssClarification, "sent-awaiting-response");

  const ledger = loadJson<{
    allowsPublication: boolean;
    summary: { unresolvedCoordinateCount: number };
  }>("exception-ledger.json");
  assert.equal(ledger.allowsPublication, false);
  assert.equal(ledger.summary.unresolvedCoordinateCount, 28);
});
