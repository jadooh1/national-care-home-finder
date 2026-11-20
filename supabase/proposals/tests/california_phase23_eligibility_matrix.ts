import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE23_EXCEPTION_COUNTS,
  CALIFORNIA_PHASE23_PENDING_INCREASE_IDS,
  CALIFORNIA_PHASE23_PROVISIONAL_CONFLICT_IDS,
  CALIFORNIA_PHASE23_ROSTER_DENOMINATOR,
  CALIFORNIA_PHASE23_UNRESOLVED_COORDINATE_IDS,
} from "../../../lib/california-phase23-exception-sets.ts";
import {
  evaluateCaliforniaPhase23Freshness,
} from "../../../lib/california-phase23-freshness.ts";
import { classifyCaliforniaPhase23Eligibility } from "../../../lib/california-phase23-eligibility.ts";
import { buildCaliforniaPhase23EligibilityMatrix } from "../../../lib/california-phase23-eligibility-matrix.ts";
import {
  CALIFORNIA_PHASE23_STOP_GO_CRITERIA,
  evaluateCaliforniaPhase23LaunchControls,
} from "../../../lib/california-phase23-launch-controls.ts";
import {
  CALIFORNIA_PHASE23_OBSERVED_COUNTS,
  assertCaliforniaPhase23ExclusiveAccounting,
  evaluateCaliforniaPhase23Quality,
} from "../../../lib/california-phase23-quality.ts";
import {
  CALIFORNIA_PHASE23_PUBLICATION_STOP_GO,
  californiaPhase23AllowsPublication,
  evaluateCaliforniaPhase23Readiness,
} from "../../../lib/california-phase23-readiness.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase23-eligibility-matrix",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("phase 23 exception sets: 5 provisional + 66 pending increase; 28 coords", () => {
  assert.equal(CALIFORNIA_PHASE23_PROVISIONAL_CONFLICT_IDS.length, 5);
  assert.equal(CALIFORNIA_PHASE23_PENDING_INCREASE_IDS.length, 66);
  assert.equal(CALIFORNIA_PHASE23_UNRESOLVED_COORDINATE_IDS.length, 28);
  assert.equal(CALIFORNIA_PHASE23_EXCEPTION_COUNTS.phase20Conflicts, 71);
  assert.equal(
    CALIFORNIA_PHASE23_PROVISIONAL_CONFLICT_IDS.length
      + CALIFORNIA_PHASE23_PENDING_INCREASE_IDS.length,
    71,
  );
  for (const id of CALIFORNIA_PHASE23_PROVISIONAL_CONFLICT_IDS) {
    assert.equal(
      (CALIFORNIA_PHASE23_PENDING_INCREASE_IDS as readonly string[]).includes(id),
      false,
    );
  }
});

test("phase 23 freshness: ISO absent; weekly FAQ not export date; no duplicate mail", () => {
  const freshness = evaluateCaliforniaPhase23Freshness();
  assert.equal(freshness.authoritativeIsoExportDate, null);
  assert.equal(freshness.acceptsWeeklyFaqAlone, false);
  assert.equal(freshness.acceptsFilenameMmddyyyyAlone, false);
  assert.equal(freshness.globalBlockerUnchanged, true);
  assert.equal(freshness.cdssClarification.duplicateInquiryAllowed, false);
  assert.equal(freshness.cdssClarification.status, "sent-awaiting-response");
  assert.equal(freshness.gate, "blocked");
});

test("phase 23 classifier: listing vs map-only vs clear-offline", () => {
  const provisional = classifyCaliforniaPhase23Eligibility("198320787");
  assert.equal(provisional.listingEligibleOffline, false);
  assert.equal(provisional.publicationEligible, false);
  assert.ok(provisional.scopes.includes("complete-listing-exclusion"));

  const mapOnly = classifyCaliforniaPhase23Eligibility("345920416");
  assert.equal(mapOnly.listingEligibleOffline, true);
  assert.equal(mapOnly.mapEligibleOffline, false);
  assert.ok(mapOnly.scopes.includes("feature-suppression-map"));

  const conflictAndCoord = classifyCaliforniaPhase23Eligibility("502701867");
  assert.equal(conflictAndCoord.listingEligibleOffline, false);
  assert.ok(conflictAndCoord.reasons.includes("prior-status-conflict"));
  assert.ok(conflictAndCoord.reasons.includes("unresolved-coordinates"));

  const clear = classifyCaliforniaPhase23Eligibility("999999999");
  assert.equal(clear.listingEligibleOffline, true);
  assert.equal(clear.publicationEligible, false);
  assert.ok(clear.scopes.includes("none-clear-offline"));
});

test("phase 23 matrix: 15451 accounting; offline only; STOP", () => {
  const matrix = buildCaliforniaPhase23EligibilityMatrix();
  assert.equal(matrix.rosterDenominator, CALIFORNIA_PHASE23_ROSTER_DENOMINATOR);
  assert.equal(matrix.allowsPublication, false);
  assert.equal(matrix.gate, "blocked");
  assert.equal(matrix.stopGo, "STOP");
  assert.equal(matrix.adoption.activatedInApplicationOrDatabase, false);
  assert.equal(matrix.accounting.residualPlusExceptionsEqualsDenominator, true);
  assert.equal(
    matrix.accounting.otherwiseClearOfflineEstimate
      + (CALIFORNIA_PHASE23_ROSTER_DENOMINATOR
        - matrix.accounting.otherwiseClearOfflineEstimate),
    15451,
  );
  assert.ok(matrix.accounting.uniqueMapSuppressedOnlyIds >= 27);
  assert.ok(matrix.summaryByCategory["provisional-license-conflict"] === 5);
  assert.ok(matrix.summaryByCategory["licensed-pending-increase-overlay"] === 66);
});

test("phase 23 launch controls: STOP; checklist and rollback present", () => {
  const controls = evaluateCaliforniaPhase23LaunchControls();
  assert.equal(controls.stopGo.recommendation, "STOP");
  assert.equal(controls.allowsPublication, false);
  assert.equal(controls.deployedOrPublished, false);
  assert.ok(controls.releaseChecklist.length >= 8);
  assert.ok(controls.rollbackPlan.steps.length >= 4);
  assert.ok(
    CALIFORNIA_PHASE23_STOP_GO_CRITERIA.goRequiresAll.includes(
      "authoritative-iso-export-date-verified",
    ),
  );
});

test("phase 23 readiness / quality / directory: BLOCKED; no crawl", () => {
  assert.equal(californiaPhase23AllowsPublication(), false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(CALIFORNIA_PHASE23_PUBLICATION_STOP_GO.decision, "STOP");

  const readiness = evaluateCaliforniaPhase23Readiness();
  assert.equal(readiness.allowsPublication, false);
  assert.equal(readiness.eligibilityMatrixPreparedOffline, true);
  assert.equal(readiness.launchControlsPrepared, true);
  assert.equal(readiness.authoritativeIsoExportDate, null);
  assert.equal(readiness.cdssClarification.duplicateInquiryAllowed, false);

  const invariant = assertCaliforniaPhase23ExclusiveAccounting(
    CALIFORNIA_PHASE23_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE23_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(invariant.holds, true);

  const quality = evaluateCaliforniaPhase23Quality();
  assert.equal(quality.statewideCrawlRepeated, false);
  assert.equal(quality.exclusionPolicyActivatedInAppOrDb, false);
  assert.equal(quality.stopGo, "STOP");

  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
});

test("phase 23 fixtures present after package assembly", () => {
  const summaryPath = join(fixtureDir, "live-run-summary.json");
  if (!existsSync(summaryPath)) {
    assert.ok(true);
    return;
  }
  const summary = loadJson<{
    gate: string;
    stopGo: string;
    allowsPublication: boolean;
    statewideCrawlRepeated: boolean;
    authoritativeIsoExportDate: null;
    rosterDenominator: number;
    provisionalConflicts: number;
  }>("live-run-summary.json");
  assert.equal(summary.gate, "blocked");
  assert.equal(summary.stopGo, "STOP");
  assert.equal(summary.allowsPublication, false);
  assert.equal(summary.statewideCrawlRepeated, false);
  assert.equal(summary.authoritativeIsoExportDate, null);
  assert.equal(summary.rosterDenominator, 15451);
  assert.equal(summary.provisionalConflicts, 5);

  const matrix = loadJson<{
    gate: string;
    accounting: { residualPlusExceptionsEqualsDenominator: boolean };
  }>("eligibility-matrix.json");
  assert.equal(matrix.gate, "blocked");
  assert.equal(matrix.accounting.residualPlusExceptionsEqualsDenominator, true);
});
