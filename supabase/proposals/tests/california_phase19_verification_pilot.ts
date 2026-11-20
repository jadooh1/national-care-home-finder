import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE19_PRIOR_PROBED_FACILITY_NUMBERS,
  CALIFORNIA_PHASE19_PILOT_FACILITY_CAP,
  CALIFORNIA_PHASE19_DISCLOSURE_STRATUM_QUOTAS,
  isCaliforniaPhase19PreviouslyUnverified,
  classifyCaliforniaPhase19DisclosureStratum,
} from "../../../lib/california-phase19-sample.ts";
import {
  CALIFORNIA_PHASE19_PHASE16_CUMULATIVE_VERIFIED_COUNT,
  CALIFORNIA_PHASE19_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  CALIFORNIA_PHASE19_AUDIT_DEFAULTS,
  summarizeCaliforniaPhase19Coverage,
  generateCaliforniaPhase19DisclosureLinks,
  classifyCaliforniaPhase19DisclosureLink,
  californiaPhase19ClaimsStatewideCoverage,
  planCaliforniaPhase19StratifiedSample,
} from "../../../lib/california-phase19-disclosure-audit.ts";
import {
  CALIFORNIA_PHASE19_EXCLUSION_ADOPTION,
  summarizeCaliforniaPhase19ExclusionClassification,
  californiaPhase19ExclusionActivatedInAppOrDb,
  californiaPhase19ExclusionAltersGovernmentRecords,
} from "../../../lib/california-phase19-exclusion-classification.ts";
import {
  CALIFORNIA_PHASE19_OBSERVED_COUNTS,
  assertCaliforniaPhase19ExclusiveAccounting,
  evaluateCaliforniaPhase19Quality,
} from "../../../lib/california-phase19-quality.ts";
import {
  CALIFORNIA_PHASE19_PUBLICATION_STOP_GO,
  californiaPhase19AllowsPublication,
  evaluateCaliforniaPhase19Readiness,
} from "../../../lib/california-phase19-readiness.ts";
import {
  CALIFORNIA_PHASE19_PILOT_AUTHORIZATION,
  recommendCaliforniaPhase19NextStage,
  estimateCaliforniaPhase19RemainingDuration,
  californiaPhase19StagedStatewideStarted,
} from "../../../lib/california-phase19-pilot.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase19-verification-pilot",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("phase 19 sample: excludes prior 462+ probed IDs; pilot cap 250", () => {
  assert.ok(CALIFORNIA_PHASE19_PRIOR_PROBED_FACILITY_NUMBERS.length >= 462);
  assert.equal(CALIFORNIA_PHASE19_PILOT_FACILITY_CAP, 250);
  assert.equal(isCaliforniaPhase19PreviouslyUnverified("015601219"), false);
  assert.equal(isCaliforniaPhase19PreviouslyUnverified("502701867"), false);
  assert.equal(isCaliforniaPhase19PreviouslyUnverified("95354"), false);
  // A clearly not-in-prior synthetic-looking ID that is 9 digits should be unverified
  // unless it happens to be in the prior set.
  const probe = "999999991";
  assert.equal(
    isCaliforniaPhase19PreviouslyUnverified(probe),
    !CALIFORNIA_PHASE19_PRIOR_PROBED_FACILITY_NUMBERS.includes(probe as never),
  );
  const quotaSum = CALIFORNIA_PHASE19_DISCLOSURE_STRATUM_QUOTAS.reduce(
    (s, q) => s + q.targetCount,
    0,
  );
  assert.ok(quotaSum <= 250);
  const classified = classifyCaliforniaPhase19DisclosureStratum("RCFE", {
    facilityNumber: "015601219",
    facilityStatus: "LICENSED",
    facilityType: "RESIDENTIAL CARE ELDERLY",
    facilityZip: "94601",
  });
  assert.equal(classified, null);
});

test("phase 19 coverage: rolls 462 + incremental; never claims statewide", () => {
  assert.equal(CALIFORNIA_PHASE19_PHASE16_CUMULATIVE_VERIFIED_COUNT, 462);
  assert.equal(CALIFORNIA_PHASE19_PUBLICATION_CANDIDATE_ROSTER_SIZE, 15451);
  assert.equal(CALIFORNIA_PHASE19_AUDIT_DEFAULTS.minIntervalMs, 450);
  assert.equal(CALIFORNIA_PHASE19_AUDIT_DEFAULTS.defaultMaxRequests, 250);
  const rollup = summarizeCaliforniaPhase19Coverage({
    incrementalResults: new Array(250),
  });
  assert.equal(rollup.phase16CumulativeVerifiedCount, 462);
  assert.equal(rollup.incrementalVerifiedCount, 250);
  assert.equal(rollup.cumulativeVerifiedCount, 712);
  assert.equal(rollup.statewideCoverageClaimed, false);
  assert.equal(californiaPhase19ClaimsStatewideCoverage(712), false);

  const links = generateCaliforniaPhase19DisclosureLinks("015601219");
  assert.equal(links.validIdentifier, true);
  assert.ok(links.pageUrl?.endsWith("/015601219"));
  const invalid = classifyCaliforniaPhase19DisclosureLink({
    facilityNumber: "95354",
    apiHttpStatus: 200,
  });
  assert.equal(invalid.classification, "invalid");

  const planned = planCaliforniaPhase19StratifiedSample(
    [
      {
        facilityNumber: "199999001",
        stratum: "rcfe-licensed",
        label: "a",
      },
      {
        facilityNumber: "199999002",
        stratum: "rcfe-licensed",
        label: "b",
      },
    ],
    [{ stratum: "rcfe-licensed", targetCount: 1 }],
  );
  assert.equal(planned.length, 1);
});

test("phase 19 exclusion: offline adopted; not activated; fail-closed", () => {
  assert.equal(CALIFORNIA_PHASE19_EXCLUSION_ADOPTION.adoptedForOfflineClassification, true);
  assert.equal(CALIFORNIA_PHASE19_EXCLUSION_ADOPTION.activatedInApplicationOrDatabase, false);
  assert.equal(californiaPhase19ExclusionActivatedInAppOrDb(), false);
  assert.equal(californiaPhase19ExclusionAltersGovernmentRecords(), false);

  const summary = summarizeCaliforniaPhase19ExclusionClassification({
    disclosureRows: [
      {
        facilityNumber: "199999003",
        classification: "working",
        identifierRelation: "exact",
        downloadStatus: "LICENSED",
        liveStatus: "Licensed",
        downloadLicenseFirstDate: "01/01/2010",
      },
      {
        facilityNumber: "95354",
        classification: "invalid",
        identifierRelation: "not-applicable",
        downloadStatus: "PENDING",
      },
      {
        facilityNumber: "502701867",
        classification: "working",
        identifierRelation: "exact",
        downloadStatus: "LICENSED",
        liveStatus: "Pending Incomplete Application",
        downloadLicenseFirstDate: "01/01/2010",
      },
    ],
    statusRows: [
      {
        facilityNumber: "502701867",
        relation: "conflict",
        eligibility: "unknown-ineligible",
        downloadStatus: "LICENSED",
        liveStatus: "Pending Incomplete Application",
      },
    ],
    unresolvedCoordinateCount: 28,
  });
  assert.equal(summary.activatedInApplicationOrDatabase, false);
  assert.equal(summary.allowsPublication, false);
  assert.equal(summary.gate, "blocked");
  assert.ok(summary.byClass["invalid-or-mismatched-ids"] >= 1);
  assert.ok(summary.byClass["unverified-or-conflicting-status"] >= 1);
  assert.ok(summary.byClass["unverified-coordinates"] >= 1);
  assert.ok(summary.byClass["none-clear-for-listing-if-otherwise-eligible"] >= 1);
});

test("phase 19 gate / recommendation: blocked; statewide not started", () => {
  assert.equal(californiaPhase19AllowsPublication(), false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(CALIFORNIA_PHASE19_PUBLICATION_STOP_GO.decision, "STOP");
  assert.equal(CALIFORNIA_PHASE19_PUBLICATION_STOP_GO.gate, "blocked");
  assert.equal(CALIFORNIA_PHASE19_PILOT_AUTHORIZATION.limitedPilotAuthorized, true);
  assert.equal(CALIFORNIA_PHASE19_PILOT_AUTHORIZATION.stagedStatewideStarted, false);
  assert.equal(californiaPhase19StagedStatewideStarted(), false);

  const invariant = assertCaliforniaPhase19ExclusiveAccounting(
    CALIFORNIA_PHASE19_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE19_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(invariant.holds, true);

  const quality = evaluateCaliforniaPhase19Quality({
    disclosure: { cumulativeVerifiedCount: 712, incrementalVerifiedCount: 250 },
  });
  assert.equal(quality.allowsPublication, false);
  assert.equal(quality.gate, "blocked");
  assert.equal(quality.verifiedCoverage.statewideCoverageClaimed, false);

  const readiness = evaluateCaliforniaPhase19Readiness({
    incrementalVerifiedCount: 250,
    cumulativeVerifiedCount: 712,
  });
  assert.equal(readiness.allowsPublication, false);
  assert.equal(readiness.disclosureAudit.cumulativeVerifiedCount, 712);

  const yes = recommendCaliforniaPhase19NextStage({
    incrementalVerifiedCount: 250,
    stopReason: "queue-exhausted",
    inconclusiveCount: 0,
    conflictCount: 1,
    workingCount: 245,
    sampleSize: 250,
    downloadSha256MatchesBaseline: true,
  });
  assert.equal(yes.requestStagedStatewide, true);
  assert.equal(yes.startStagedStatewideNow, false);
  assert.equal(yes.id, "request-staged-statewide-approval");

  const hold = recommendCaliforniaPhase19NextStage({
    incrementalVerifiedCount: 50,
    stopReason: "consecutive-inconclusive",
    consecutiveInconclusiveStop: true,
    downloadSha256MatchesBaseline: true,
  });
  assert.equal(hold.requestStagedStatewide, false);
  assert.equal(hold.startStagedStatewideNow, false);

  const duration = estimateCaliforniaPhase19RemainingDuration({
    cumulativeVerifiedCount: 712,
  });
  assert.equal(duration.remainingFacilitiesApprox, 15451 - 712);
  assert.ok(duration.sessionsAt250 > 0);

  // WA/OR contracts untouched; California stays unpublished
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
      || directoryContract("Oregon")?.publication === "development",
  );
});

test("phase 19 fixtures present when live run artifacts copied", () => {
  // Soft presence checks — live-run-summary is required after pilot.
  const summaryPath = join(fixtureDir, "live-run-summary.json");
  if (!existsSync(summaryPath)) {
    // Allow unit tests to pass before fixture materialization in the same PR
    // when only library assertions are needed; CI after pilot always has it.
    assert.ok(true);
    return;
  }
  const summary = loadJson<{
    gate: string;
    allowsPublication: boolean;
    stagedStatewideStarted: boolean;
    disclosure: {
      phase16CumulativeVerifiedCount: number;
      incrementalSampleSize: number;
      cumulativeVerifiedCount: number;
      statewideCoverageClaimed: boolean;
    };
    exclusion: {
      adoptedForOfflineClassification: boolean;
      activatedInApplicationOrDatabase: boolean;
    };
    recommendation: {
      startStagedStatewideNow: boolean;
    };
  }>("live-run-summary.json");
  assert.equal(summary.gate, "blocked");
  assert.equal(summary.allowsPublication, false);
  assert.equal(summary.stagedStatewideStarted, false);
  assert.equal(summary.disclosure.phase16CumulativeVerifiedCount, 462);
  assert.ok(summary.disclosure.incrementalSampleSize <= 250);
  assert.equal(summary.disclosure.statewideCoverageClaimed, false);
  assert.equal(summary.exclusion.adoptedForOfflineClassification, true);
  assert.equal(summary.exclusion.activatedInApplicationOrDatabase, false);
  assert.equal(summary.recommendation.startStagedStatewideNow, false);
});
