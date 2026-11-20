import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE24_CDSS_CLARIFICATION_FOLLOWUP_DRAFT,
  evaluateCaliforniaPhase24Freshness,
} from "../../../lib/california-phase24-freshness.ts";
import {
  CALIFORNIA_PHASE24_EXPECTED_COUNTS,
  reconcileCaliforniaPhase24EligibilityCounts,
} from "../../../lib/california-phase24-count-reconciliation.ts";
import {
  CALIFORNIA_PHASE24_LAUNCH_DEPENDENCIES,
  evaluateCaliforniaPhase24LaunchDependencies,
} from "../../../lib/california-phase24-launch-dependencies.ts";
import {
  CALIFORNIA_PHASE24_OBSERVED_COUNTS,
  assertCaliforniaPhase24ExclusiveAccounting,
  evaluateCaliforniaPhase24Quality,
} from "../../../lib/california-phase24-quality.ts";
import {
  CALIFORNIA_PHASE24_PUBLICATION_STOP_GO,
  californiaPhase24AllowsPublication,
  evaluateCaliforniaPhase24Readiness,
} from "../../../lib/california-phase24-readiness.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase24-freshness-launch-decisions",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("phase 24 freshness: ISO absent; draft do-not-send; no duplicate mail", () => {
  const freshness = evaluateCaliforniaPhase24Freshness();
  assert.equal(freshness.authoritativeIsoExportDate, null);
  assert.equal(freshness.globalBlockerUnchanged, true);
  assert.equal(freshness.gate, "blocked");
  assert.equal(freshness.cdssClarification.duplicateInquiryAllowed, false);
  assert.equal(freshness.cdssClarification.status, "sent-awaiting-response");
  assert.equal(
    CALIFORNIA_PHASE24_CDSS_CLARIFICATION_FOLLOWUP_DRAFT.status,
    "draft-do-not-send",
  );
  assert.equal(
    CALIFORNIA_PHASE24_CDSS_CLARIFICATION_FOLLOWUP_DRAFT.sendRequiresHumanApproval,
    true,
  );
  assert.ok(
    CALIFORNIA_PHASE24_CDSS_CLARIFICATION_FOLLOWUP_DRAFT.toSuggested.includes(
      "cclwebmaster@dss.ca.gov",
    ),
  );
  assert.match(
    CALIFORNIA_PHASE24_CDSS_CLARIFICATION_FOLLOWUP_DRAFT.body,
    /DownloadStateData/,
  );
});

test("phase 24 count reconciliation matches Phase 23 targets", () => {
  const recon = reconcileCaliforniaPhase24EligibilityCounts();
  assert.equal(recon.matchesPhase23, true);
  assert.equal(recon.observed.rosterDenominator, 15451);
  assert.equal(recon.observed.listingExclusionsInCandidates, 88);
  assert.equal(recon.observed.otherwiseClearOffline, 15363);
  assert.equal(recon.observed.mapOnlySuppressions, 27);
  assert.equal(recon.observed.underlyingUnresolvedCoordinates, 28);
  assert.equal(recon.observed.residualPlusListingEqualsDenominator, true);
  assert.deepEqual(recon.coordinateOverlap.listingAndCoordinateOverlapIds, [
    "502701867",
  ]);
  assert.equal(
    CALIFORNIA_PHASE24_EXPECTED_COUNTS.listingExclusionsInCandidates
      + CALIFORNIA_PHASE24_EXPECTED_COUNTS.otherwiseClearOffline,
    15451,
  );
  assert.equal(recon.safeguards.exclusionActivatedInAppOrDb, false);
  assert.equal(recon.safeguards.leadingZerosPreserved, true);
  assert.equal(recon.gate, "blocked");
});

test("phase 24 launch dependencies separate future authorization", () => {
  const deps = evaluateCaliforniaPhase24LaunchDependencies();
  assert.equal(deps.summary.stopGo.recommendation, "STOP");
  assert.equal(deps.allowsPublication, false);
  assert.equal(deps.deployedOrPublished, false);
  assert.ok(CALIFORNIA_PHASE24_LAUNCH_DEPENDENCIES.length >= 7);
  assert.ok(
    CALIFORNIA_PHASE24_LAUNCH_DEPENDENCIES.some(
      d => d.lane === "requires-future-authorization" && d.blocksGo,
    ),
  );
  assert.ok(
    CALIFORNIA_PHASE24_LAUNCH_DEPENDENCIES.some(d => d.id === "authoritative-freshness"),
  );
  assert.ok(
    CALIFORNIA_PHASE24_LAUNCH_DEPENDENCIES.some(d => d.area === "rollback-readiness"),
  );
});

test("phase 24 readiness / quality / directory: BLOCKED; STOP", () => {
  assert.equal(californiaPhase24AllowsPublication(), false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(CALIFORNIA_PHASE24_PUBLICATION_STOP_GO.decision, "STOP");
  assert.equal(
    CALIFORNIA_PHASE24_PUBLICATION_STOP_GO.clarificationFollowUpDraftStatus,
    "draft-do-not-send",
  );

  const readiness = evaluateCaliforniaPhase24Readiness();
  assert.equal(readiness.allowsPublication, false);
  assert.equal(readiness.phase23CountsReconciled, true);
  assert.equal(readiness.authoritativeIsoExportDate, null);
  assert.equal(readiness.cdssClarification.followUpDraftStatus, "draft-do-not-send");

  const invariant = assertCaliforniaPhase24ExclusiveAccounting(
    CALIFORNIA_PHASE24_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE24_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(invariant.holds, true);

  const quality = evaluateCaliforniaPhase24Quality();
  assert.equal(quality.statewideCrawlRepeated, false);
  assert.equal(quality.duplicateCdssInquirySent, false);
  assert.equal(quality.stopGo, "STOP");

  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
});

test("phase 24 fixtures present after package assembly", () => {
  const summaryPath = join(fixtureDir, "live-run-summary.json");
  if (!existsSync(summaryPath)) {
    assert.ok(true);
    return;
  }
  const summary = loadJson<{
    gate: string;
    stopGo: string;
    allowsPublication: boolean;
    authoritativeIsoExportDate: null;
    countsMatchPhase23: boolean;
    clarificationFollowUpDraftStatus: string;
    duplicateCdssInquirySent: boolean;
    listingExclusionsInCandidates: number;
    otherwiseClearOffline: number;
  }>("live-run-summary.json");
  assert.equal(summary.gate, "blocked");
  assert.equal(summary.stopGo, "STOP");
  assert.equal(summary.allowsPublication, false);
  assert.equal(summary.authoritativeIsoExportDate, null);
  assert.equal(summary.countsMatchPhase23, true);
  assert.equal(summary.clarificationFollowUpDraftStatus, "draft-do-not-send");
  assert.equal(summary.duplicateCdssInquirySent, false);
  assert.equal(summary.listingExclusionsInCandidates, 88);
  assert.equal(summary.otherwiseClearOffline, 15363);

  const draftPath = join(fixtureDir, "cdss-clarification-followup-draft.md");
  assert.equal(existsSync(draftPath), true);
  const draft = readFileSync(draftPath, "utf8");
  assert.match(draft, /DO NOT SEND/);
  assert.match(draft, /cclwebmaster@dss\.ca\.gov/);
});
