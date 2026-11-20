import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE20_AUTHORIZED_ADDITIONAL,
  CALIFORNIA_PHASE20_BATCH_FACILITY_CAP,
  CALIFORNIA_PHASE20_COVERAGE_BASELINE,
  CALIFORNIA_PHASE20_PRIOR_VERIFIED_EXCLUDE_IDS,
  CALIFORNIA_PHASE20_PHASE19_INCREMENTAL_IDS,
  CALIFORNIA_PHASE20_ROSTER_DENOMINATOR,
  isCaliforniaPhase20PreviouslyUnverified,
  classifyCaliforniaPhase20RemainingCandidate,
  planCaliforniaPhase20RemainingQueue,
  sliceCaliforniaPhase20Batch,
} from "../../../lib/california-phase20-sample.ts";
import {
  CALIFORNIA_PHASE20_AUDIT_DEFAULTS,
  CALIFORNIA_PHASE20_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  summarizeCaliforniaPhase20Coverage,
  generateCaliforniaPhase20DisclosureLinks,
  classifyCaliforniaPhase20DisclosureLink,
  californiaPhase20ClaimsStatewideCoverage,
} from "../../../lib/california-phase20-disclosure-audit.ts";
import {
  CALIFORNIA_PHASE20_EXCLUSION_ADOPTION,
  summarizeCaliforniaPhase20ExclusionClassification,
  californiaPhase20ExclusionActivatedInAppOrDb,
  californiaPhase20ExclusionAltersGovernmentRecords,
} from "../../../lib/california-phase20-exclusion-classification.ts";
import {
  CALIFORNIA_PHASE20_OBSERVED_COUNTS,
  assertCaliforniaPhase20ExclusiveAccounting,
  evaluateCaliforniaPhase20Quality,
} from "../../../lib/california-phase20-quality.ts";
import {
  CALIFORNIA_PHASE20_PUBLICATION_STOP_GO,
  californiaPhase20AllowsPublication,
  evaluateCaliforniaPhase20Readiness,
} from "../../../lib/california-phase20-readiness.ts";
import {
  CALIFORNIA_PHASE20_STAGED_AUTHORIZATION,
  assembleCaliforniaPhase20StagedProgress,
  californiaPhase20StagedStatewideAuthorized,
  californiaPhase20StagedStatewideStarted,
  estimateCaliforniaPhase20RemainingDuration,
} from "../../../lib/california-phase20-staged.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase20-staged-verification",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("phase 20 sample: excludes prior verified; batch/auth caps", () => {
  assert.equal(CALIFORNIA_PHASE20_COVERAGE_BASELINE, 707);
  assert.equal(CALIFORNIA_PHASE20_AUTHORIZED_ADDITIONAL, 14744);
  assert.equal(CALIFORNIA_PHASE20_BATCH_FACILITY_CAP, 250);
  assert.equal(CALIFORNIA_PHASE20_ROSTER_DENOMINATOR, 15451);
  assert.ok(CALIFORNIA_PHASE20_PRIOR_VERIFIED_EXCLUDE_IDS.length >= 707);
  assert.equal(CALIFORNIA_PHASE20_PHASE19_INCREMENTAL_IDS.length, 245);
  assert.equal(isCaliforniaPhase20PreviouslyUnverified("015601219"), false);
  assert.equal(isCaliforniaPhase20PreviouslyUnverified("342701533"), false);
  assert.equal(isCaliforniaPhase20PreviouslyUnverified("502701867"), false);

  const excluded = classifyCaliforniaPhase20RemainingCandidate("RCFE", {
    facilityNumber: "015601219",
    facilityStatus: "LICENSED",
    facilityType: "RESIDENTIAL CARE ELDERLY",
    facilityZip: "94601",
  });
  assert.equal(excluded, null);

  const pool = [
    {
      facilityNumber: "199999001",
      file: "RCFE" as const,
      downloadStatus: "LICENSED",
      downloadType: "RESIDENTIAL CARE ELDERLY",
      stratum: "active-licensed" as const,
      label: "a",
      publicationCandidate: true as const,
      geographicRegion: "southern" as const,
      previouslyUnverified: true as const,
    },
    {
      facilityNumber: "199999002",
      file: "RCFE" as const,
      downloadStatus: "LICENSED",
      downloadType: "RESIDENTIAL CARE ELDERLY",
      stratum: "active-licensed" as const,
      label: "b",
      publicationCandidate: true as const,
      geographicRegion: "southern" as const,
      previouslyUnverified: true as const,
    },
  ];
  const planned = planCaliforniaPhase20RemainingQueue(pool, {
    authorizedAdditional: 14744,
  });
  assert.equal(planned.length, 2);
  const batch0 = sliceCaliforniaPhase20Batch(planned, 0, 1);
  assert.equal(batch0.length, 1);
});

test("phase 20 coverage: rolls 707 + incremental; claims only when complete", () => {
  assert.equal(CALIFORNIA_PHASE20_PUBLICATION_CANDIDATE_ROSTER_SIZE, 15451);
  assert.equal(CALIFORNIA_PHASE20_AUDIT_DEFAULTS.minIntervalMs, 450);
  assert.equal(CALIFORNIA_PHASE20_AUDIT_DEFAULTS.batchFacilityCap, 250);
  assert.equal(CALIFORNIA_PHASE20_AUDIT_DEFAULTS.authorizedAdditional, 14744);

  const partial = summarizeCaliforniaPhase20Coverage({
    incrementalResults: new Array(250),
    queueExhausted: false,
  });
  assert.equal(partial.coverageBaseline, 707);
  assert.equal(partial.incrementalVerifiedCount, 250);
  assert.equal(partial.cumulativeVerifiedCount, 957);
  assert.equal(partial.statewideCoverageClaimed, false);
  assert.equal(californiaPhase20ClaimsStatewideCoverage(957, 15451, false), false);

  const complete = summarizeCaliforniaPhase20Coverage({
    incrementalResults: new Array(14744),
    queueExhausted: true,
  });
  assert.equal(complete.cumulativeVerifiedCount, 15451);
  assert.equal(complete.statewideCoverageClaimed, true);
  assert.equal(californiaPhase20ClaimsStatewideCoverage(15451, 15451, true), true);

  const links = generateCaliforniaPhase20DisclosureLinks("015601219");
  assert.equal(links.validIdentifier, true);
  assert.ok(links.pageUrl?.endsWith("/015601219"));
  const invalid = classifyCaliforniaPhase20DisclosureLink({
    facilityNumber: "95354",
    apiHttpStatus: 200,
  });
  assert.equal(invalid.classification, "invalid");
});

test("phase 20 exclusion: offline adopted; not activated; fail-closed", () => {
  assert.equal(CALIFORNIA_PHASE20_EXCLUSION_ADOPTION.adoptedForOfflineClassification, true);
  assert.equal(CALIFORNIA_PHASE20_EXCLUSION_ADOPTION.activatedInApplicationOrDatabase, false);
  assert.equal(californiaPhase20ExclusionActivatedInAppOrDb(), false);
  assert.equal(californiaPhase20ExclusionAltersGovernmentRecords(), false);

  const summary = summarizeCaliforniaPhase20ExclusionClassification({
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
        facilityNumber: "019201167",
        classification: "working",
        identifierRelation: "exact",
        downloadStatus: "LICENSED",
        liveStatus: "Licensed/Pending Increase",
        downloadLicenseFirstDate: "01/01/2010",
      },
    ],
    statusRows: [
      {
        facilityNumber: "019201167",
        relation: "conflict",
        eligibility: "unknown-ineligible",
        downloadStatus: "LICENSED",
        liveStatus: "Licensed/Pending Increase",
      },
    ],
    unresolvedCoordinateCount: 28,
  });
  assert.equal(summary.activatedInApplicationOrDatabase, false);
  assert.equal(summary.allowsPublication, false);
  assert.equal(summary.gate, "blocked");
  assert.ok(summary.byClass["unverified-or-conflicting-status"] >= 1);
  assert.ok(summary.byClass["unverified-coordinates"] >= 1);
  assert.ok(summary.byClass["none-clear-for-listing-if-otherwise-eligible"] >= 1);
});

test("phase 20 gate / staged auth: blocked; staged authorized and started", () => {
  assert.equal(californiaPhase20AllowsPublication(), false);
  assert.equal(californiaDirectoryReady(), false);
  assert.equal(CALIFORNIA_PHASE20_PUBLICATION_STOP_GO.decision, "STOP");
  assert.equal(CALIFORNIA_PHASE20_PUBLICATION_STOP_GO.gate, "blocked");
  assert.equal(CALIFORNIA_PHASE20_STAGED_AUTHORIZATION.stagedStatewideAuthorized, true);
  assert.equal(CALIFORNIA_PHASE20_STAGED_AUTHORIZATION.stagedStatewideStarted, true);
  assert.equal(CALIFORNIA_PHASE20_STAGED_AUTHORIZATION.authorizedAdditionalUnique, 14744);
  assert.equal(californiaPhase20StagedStatewideAuthorized(), true);
  assert.equal(californiaPhase20StagedStatewideStarted(), true);

  const invariant = assertCaliforniaPhase20ExclusiveAccounting(
    CALIFORNIA_PHASE20_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE20_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(invariant.holds, true);

  const quality = evaluateCaliforniaPhase20Quality({
    disclosure: { cumulativeVerifiedCount: 1000, incrementalVerifiedCount: 293 },
  });
  assert.equal(quality.allowsPublication, false);
  assert.equal(quality.gate, "blocked");

  const readiness = evaluateCaliforniaPhase20Readiness({
    incrementalVerifiedCount: 293,
    cumulativeVerifiedCount: 1000,
  });
  assert.equal(readiness.allowsPublication, false);
  assert.equal(readiness.disclosureAudit.cumulativeVerifiedCount, 1000);

  const progress = assembleCaliforniaPhase20StagedProgress({
    newlyVerified: 500,
    queueExhausted: false,
  });
  assert.equal(progress.cumulativeVerified, 1207);
  assert.equal(progress.statewideCoverageClaimed, false);
  assert.equal(progress.remainingApprox, 15451 - 1207);

  const duration = estimateCaliforniaPhase20RemainingDuration({
    remainingFacilities: 14744,
  });
  assert.equal(duration.remainingFacilitiesApprox, 14744);
  assert.ok(duration.sessionsAt250 >= 59);

  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
      || directoryContract("Oregon")?.publication === "development",
  );
});

test("phase 20 fixtures: prior-verified list present; live summary gate blocked when present", () => {
  const priorPath = join(fixtureDir, "prior-verified-facility-numbers.json");
  assert.equal(existsSync(priorPath), true);
  const prior = loadJson<{
    coverageBaseline: number;
    phase19Incremental: number;
    excludeUnionIds: string[];
  }>("prior-verified-facility-numbers.json");
  assert.equal(prior.coverageBaseline, 707);
  assert.equal(prior.phase19Incremental, 245);
  assert.ok(prior.excludeUnionIds.length >= 707);

  const summaryPath = join(fixtureDir, "live-run-summary.json");
  if (!existsSync(summaryPath)) {
    assert.ok(true);
    return;
  }
  const summary = loadJson<{
    gate: string;
    allowsPublication: boolean;
    stagedStatewideStarted: boolean;
    disclosure: {
      coverageBaseline: number;
      statewideCoverageClaimed: boolean;
    };
    exclusion: {
      adoptedForOfflineClassification: boolean;
      activatedInApplicationOrDatabase: boolean;
    };
  }>("live-run-summary.json");
  assert.equal(summary.gate, "blocked");
  assert.equal(summary.allowsPublication, false);
  assert.equal(summary.stagedStatewideStarted, true);
  assert.equal(summary.disclosure.coverageBaseline, 707);
  assert.equal(summary.exclusion.adoptedForOfflineClassification, true);
  assert.equal(summary.exclusion.activatedInApplicationOrDatabase, false);
});
