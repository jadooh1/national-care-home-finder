import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE18_APPROVAL_PACKAGE,
  californiaPhase18RequestsPublicationGateOpen,
  evaluateCaliforniaPhase18ApprovalOptions,
} from "../../../lib/california-phase18-approval-options.ts";
import {
  CALIFORNIA_PHASE18_EXCLUSION_POLICY,
  CALIFORNIA_PHASE18_EXCLUSION_RULES,
  californiaPhase18ExclusionAltersGovernmentRecords,
  californiaPhase18ExclusionPolicyActivated,
  californiaPhase18ExclusionPolicyAdopted,
  evaluateCaliforniaPhase18ExclusionPolicy,
} from "../../../lib/california-phase18-exclusion-policy.ts";
import {
  CALIFORNIA_PHASE18_OBSERVED_COUNTS,
  assertCaliforniaPhase18ExclusiveAccounting,
  evaluateCaliforniaPhase18Quality,
} from "../../../lib/california-phase18-quality.ts";
import {
  CALIFORNIA_PHASE18_FACILITY_SPECIFIC_EXCEPTIONS,
  CALIFORNIA_PHASE18_GLOBAL_LAUNCH_BLOCKERS,
  CALIFORNIA_PHASE18_PUBLICATION_STOP_GO,
  CALIFORNIA_PHASE18_READINESS_DECISION,
  californiaPhase18AllowsPublication,
  evaluateCaliforniaPhase18Readiness,
} from "../../../lib/california-phase18-readiness.ts";
import {
  CALIFORNIA_PHASE18_HARNESS_DEFAULTS,
  CALIFORNIA_PHASE18_SAMPLE_EVIDENCE,
  CALIFORNIA_PHASE18_VERIFICATION_PLAN,
  californiaPhase18AllowsCrawlWithoutApproval,
  californiaPhase18CrawlStarted,
  estimateCaliforniaPhase18FullRosterDuration,
  evaluateCaliforniaPhase18VerificationPlan,
} from "../../../lib/california-phase18-verification-plan.ts";
import {
  assembleCaliforniaPhase18VerificationExclusionDossier,
  californiaPhase18VerificationExclusionAllowsPublication,
} from "../../../lib/california-phase18-verification-exclusion.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase18-verification-exclusion",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("verification plan: estimates from 462/15451 sample; crawl not started", () => {
  const plan = evaluateCaliforniaPhase18VerificationPlan();
  assert.equal(plan.performNow, false);
  assert.equal(plan.crawlStarted, false);
  assert.equal(plan.authorizedNow, false);
  assert.equal(plan.requiresSeparateHumanApproval, true);
  assert.equal(plan.gate, "blocked");
  assert.equal(plan.allowsPublication, false);
  assert.equal(CALIFORNIA_PHASE18_SAMPLE_EVIDENCE.cumulativeVerifiedDisclosure, 462);
  assert.equal(CALIFORNIA_PHASE18_SAMPLE_EVIDENCE.rosterDenominator, 15451);
  assert.equal(CALIFORNIA_PHASE18_SAMPLE_EVIDENCE.remainingUnverifiedApprox, 14989);
  assert.equal(CALIFORNIA_PHASE18_SAMPLE_EVIDENCE.statewideCoverageClaimed, false);
  assert.equal(CALIFORNIA_PHASE18_HARNESS_DEFAULTS.minIntervalMs, 450);
  assert.equal(CALIFORNIA_PHASE18_HARNESS_DEFAULTS.concurrency, 1);
  assert.equal(CALIFORNIA_PHASE18_HARNESS_DEFAULTS.maxAttempts, 3);
  assert.deepEqual(
    [...CALIFORNIA_PHASE18_HARNESS_DEFAULTS.backoffMs],
    [500, 1500, 3000],
  );
  assert.equal(CALIFORNIA_PHASE18_HARNESS_DEFAULTS.checkpointEvery, 10);
  assert.equal(CALIFORNIA_PHASE18_HARNESS_DEFAULTS.maxConsecutiveInconclusive, 8);

  const estimate = estimateCaliforniaPhase18FullRosterDuration();
  assert.equal(estimate.remainingFacilities, 14989);
  assert.equal(estimate.estimatedSessionsAtCap, 60);
  assert.equal(estimate.minWallHoursApprox, 3.75);
  assert.equal(estimate.conservativeWallHoursApprox, 4.68);
  assert.equal(plan.recommendedOptionIfCrawlAuthorized, "limited-pilot");
  assert.equal(plan.recommendedFollowOnAfterPilot, "staged-statewide");
  assert.equal(plan.cdssServiceProtection.concurrency, 1);
  assert.equal(plan.cdssServiceProtection.noUncontrolledStatewideCrawl, true);
  assert.equal(plan.cdssServiceProtection.noDuplicateCdssEmail, true);
  assert.equal(plan.errorStopThresholds.neverAutoOpenPublicationGate, true);
  assert.equal(plan.retentionAudit.doNotAlterAuthoritativeGovernmentRecords, true);
  assert.equal(californiaPhase18AllowsCrawlWithoutApproval(), false);
  assert.equal(californiaPhase18CrawlStarted(), false);
  assert.equal(CALIFORNIA_PHASE18_VERIFICATION_PLAN.crawlStarted, false);

  const fixture = loadJson<{
    performNow: boolean;
    crawlStarted: boolean;
    sampleEvidence: { cumulativeVerifiedDisclosure: number; statewideCoverageClaimed: boolean };
    harnessDefaults: { concurrency: number; minIntervalMs: number };
  }>("verification-plan.json");
  assert.equal(fixture.performNow, false);
  assert.equal(fixture.crawlStarted, false);
  assert.equal(fixture.sampleEvidence.cumulativeVerifiedDisclosure, 462);
  assert.equal(fixture.sampleEvidence.statewideCoverageClaimed, false);
  assert.equal(fixture.harnessDefaults.concurrency, 1);
  assert.equal(fixture.harnessDefaults.minIntervalMs, 450);
});

test("exclusion policy: draft only; listing vs feature scopes; records unaltered", () => {
  const policy = evaluateCaliforniaPhase18ExclusionPolicy();
  assert.equal(policy.status, "draft-for-approval");
  assert.equal(policy.activated, false);
  assert.equal(policy.adopted, false);
  assert.equal(policy.allowsPublication, false);
  assert.equal(policy.gate, "blocked");
  assert.equal(policy.preservesFailClosedSafeguards, true);
  assert.equal(policy.preservesAuthoritativeRecordsUnaltered, true);
  assert.equal(CALIFORNIA_PHASE18_EXCLUSION_RULES.length, 6);
  assert.equal(CALIFORNIA_PHASE18_EXCLUSION_POLICY.activated, false);

  const missingDate = CALIFORNIA_PHASE18_EXCLUSION_RULES.find(
    r => r.id === "missing-license-evidence",
  );
  assert.equal(missingDate?.knownCounts.statewide, 14);
  assert.ok(missingDate?.scopes.includes("complete-listing-exclusion"));
  assert.equal(missingDate?.activated, false);
  assert.equal(missingDate?.altersAuthoritativeGovernmentRecords, false);

  const coords = CALIFORNIA_PHASE18_EXCLUSION_RULES.find(
    r => r.id === "unverified-coordinates",
  );
  assert.equal(coords?.knownCounts.statewide, 28);
  assert.ok(coords?.scopes.includes("feature-suppression-map"));
  assert.equal(coords?.scopes.includes("complete-listing-exclusion"), false);

  const disclosure = CALIFORNIA_PHASE18_EXCLUSION_RULES.find(
    r => r.id === "bad-disclosure-links",
  );
  assert.ok(disclosure?.scopes.includes("feature-suppression-disclosure"));

  assert.equal(californiaPhase18ExclusionPolicyActivated(), false);
  assert.equal(californiaPhase18ExclusionPolicyAdopted(), false);
  assert.equal(californiaPhase18ExclusionAltersGovernmentRecords(), false);

  const fixture = loadJson<{
    activated: boolean;
    adopted: boolean;
    ruleIds: string[];
    statewideMissingLicenseDate: number;
    unresolvedCoordinates: number;
  }>("exclusion-policy.json");
  assert.equal(fixture.activated, false);
  assert.equal(fixture.adopted, false);
  assert.equal(fixture.ruleIds.length, 6);
  assert.equal(fixture.statewideMissingLicenseDate, 14);
  assert.equal(fixture.unresolvedCoordinates, 28);
});

test("approval options: pilot vs staged; exclusion adoption; no gate-open request", () => {
  const package_ = evaluateCaliforniaPhase18ApprovalOptions();
  assert.equal(package_.requestsPublicationGateOpen, false);
  assert.equal(package_.crawlAuthorized, false);
  assert.equal(package_.exclusionPolicyAdopted, false);
  assert.equal(package_.allowsPublication, false);
  assert.equal(package_.gate, "blocked");
  assert.equal(package_.options.length, 3);
  assert.ok(package_.options.every(o => o.requestsPublicationGateOpen === false));
  assert.ok(package_.options.every(o => o.humanOnly === true));
  assert.ok(package_.options.every(o => o.actionableByAgent === false));
  assert.ok(
    CALIFORNIA_PHASE18_APPROVAL_PACKAGE.agentMustNot.includes(
      "request-permission-to-open-publication-gate-in-this-phase",
    ),
  );
  assert.equal(californiaPhase18RequestsPublicationGateOpen(), false);

  const crawl = package_.options.find(o => o.id === "crawl-authorization");
  assert.ok(crawl?.alternatives.includes("authorize-limited-pilot"));
  assert.ok(crawl?.alternatives.includes("authorize-staged-statewide"));
  assert.ok(crawl?.alternatives.includes("deny-crawl-keep-sample-only"));

  const exclusion = package_.options.find(o => o.id === "exclusion-policy-adoption");
  assert.ok(exclusion?.alternatives.includes("adopt-exclusion-policy"));

  const preconditions = package_.options.find(o => o.id === "publication-preconditions");
  assert.equal(preconditions?.requestsPublicationGateOpen, false);
  assert.equal(
    preconditions?.alternatives.includes("request-publication-gate-open" as never),
    false,
  );

  const fixture = loadJson<{
    requestsPublicationGateOpen: boolean;
    optionIds: string[];
  }>("approval-options.json");
  assert.equal(fixture.requestsPublicationGateOpen, false);
  assert.deepEqual(fixture.optionIds, [
    "crawl-authorization",
    "exclusion-policy-adoption",
    "publication-preconditions",
  ]);
});

test("readiness: STOP; baseline preserved; global vs facility-specific split", () => {
  const readiness = evaluateCaliforniaPhase18Readiness();
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.publicationReady, false);
  assert.equal(readiness.allowsPublication, false);
  assert.equal(californiaPhase18AllowsPublication(), false);
  assert.equal(californiaPhase18VerificationExclusionAllowsPublication(), false);
  assert.equal(readiness.publication, "unpublished");
  assert.equal(readiness.ownerClaimEligible, false);
  assert.equal(readiness.authoritativeIsoExportDate, null);
  assert.equal(readiness.crawlStarted, false);
  assert.equal(readiness.exclusionPolicyActivated, false);
  assert.equal(readiness.exclusionPolicyAdopted, false);
  assert.equal(readiness.requestsPublicationGateOpen, false);
  assert.equal(readiness.cdssClarification.status, "sent-awaiting-response");
  assert.equal(readiness.cdssClarification.replyReceived, false);
  assert.equal(readiness.cdssClarification.duplicateInquiryAllowed, false);

  assert.equal(readiness.baselinePreserved.officialRecords, 24377);
  assert.equal(readiness.baselinePreserved.activeRestrictedCandidates, 15451);
  assert.equal(readiness.baselinePreserved.verifiedCoords, 15423);
  assert.equal(readiness.baselinePreserved.unresolvedCoords, 28);
  assert.equal(readiness.baselinePreserved.disclosureSamples, 462);
  assert.equal(readiness.baselinePreserved.statewideMissingLicenseDateFlags, 14);

  assert.ok(CALIFORNIA_PHASE18_GLOBAL_LAUNCH_BLOCKERS.includes("authoritative-iso-export-date"));
  assert.ok(
    CALIFORNIA_PHASE18_FACILITY_SPECIFIC_EXCEPTIONS.includes(
      "licensed-missing-initial-date-statewide",
    ),
  );
  assert.equal(
    readiness.globalLaunchBlockers.includes("licensed-missing-initial-date-statewide"),
    false,
  );
  assert.equal(
    readiness.facilitySpecificExceptions.includes("authoritative-iso-export-date"),
    false,
  );

  assert.equal(CALIFORNIA_PHASE18_PUBLICATION_STOP_GO.recommendation, "STOP");
  assert.equal(CALIFORNIA_PHASE18_PUBLICATION_STOP_GO.publicationReady, false);
  assert.ok(
    CALIFORNIA_PHASE18_PUBLICATION_STOP_GO.agentMustNot.includes("start-statewide-or-pilot-crawl"),
  );
  assert.ok(
    CALIFORNIA_PHASE18_PUBLICATION_STOP_GO.agentMustNot.includes(
      "request-permission-to-open-publication-gate-in-this-phase",
    ),
  );
  assert.deepEqual(readiness, CALIFORNIA_PHASE18_READINESS_DECISION);

  const accounting = assertCaliforniaPhase18ExclusiveAccounting(
    CALIFORNIA_PHASE18_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE18_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(accounting.holds, true);
  assert.equal(accounting.rowCount, 24377);

  const quality = evaluateCaliforniaPhase18Quality();
  assert.equal(quality.gate, "blocked");
  assert.equal(quality.allowsPublication, false);
  assert.equal(quality.crawlStarted, false);
  assert.equal(quality.exclusionPolicyActivated, false);
  assert.equal(quality.verifiedCoverage.cumulativeVerifiedCount, 462);
  assert.equal(quality.verifiedCoverage.statewideCoverageClaimed, false);
  assert.equal(quality.coordinates.unresolved, 28);
  assert.equal(quality.coordinates.verifiedOfficialCoords, 15423);

  const dossier = assembleCaliforniaPhase18VerificationExclusionDossier({
    verificationPlan: {
      performNow: false,
      crawlStarted: false,
      requiresSeparateHumanApproval: true,
      remainingFacilitiesApprox: 14989,
      recommendedOptionIfCrawlAuthorized: "limited-pilot",
      minWallHoursApprox: 3.75,
      conservativeWallHoursApprox: 4.68,
      estimatedSessionsAtCap: 60,
    },
    exclusionPolicy: {
      status: "draft-for-approval",
      activated: false,
      adopted: false,
      ruleCount: 6,
      preservesAuthoritativeRecordsUnaltered: true,
    },
    approvalOptions: {
      requestsPublicationGateOpen: false,
      crawlAuthorized: false,
      exclusionPolicyAdopted: false,
      optionIds: [
        "crawl-authorization",
        "exclusion-policy-adoption",
        "publication-preconditions",
      ],
    },
    accounting: {
      officialRecords: 24377,
      activeRestrictedCandidates: 15451,
      verifiedCoords: 15423,
      unresolvedCoords: 28,
      disclosureSamples: 462,
      statewideMissingLicenseDateFlags: 14,
    },
    globalLaunchBlockers: [...CALIFORNIA_PHASE18_GLOBAL_LAUNCH_BLOCKERS],
    facilitySpecificExceptions: [...CALIFORNIA_PHASE18_FACILITY_SPECIFIC_EXCEPTIONS],
    stopGo: { recommendation: "STOP", publicationReady: false },
    humanDecisionsRequired: [...readiness.humanDecisionsRequired],
  });
  assert.equal(dossier.gate, "blocked");
  assert.equal(dossier.allowsPublication, false);
  assert.equal(dossier.publicationReady, false);
  assert.equal(dossier.crawlStarted, false);
  assert.equal(dossier.exclusionPolicyActivated, false);
  assert.equal(dossier.requestsPublicationGateOpen, false);
  assert.equal(dossier.stopGo.recommendation, "STOP");

  const readinessFixture = loadJson<{
    gate: string;
    publicationReady: boolean;
    crawlStarted: boolean;
    requestsPublicationGateOpen: boolean;
    stopGo: { recommendation: string };
    baselinePreserved: {
      officialRecords: number;
      disclosureSamples: number;
      statewideMissingLicenseDateFlags: number;
    };
  }>("readiness-report.json");
  assert.equal(readinessFixture.gate, "blocked");
  assert.equal(readinessFixture.publicationReady, false);
  assert.equal(readinessFixture.crawlStarted, false);
  assert.equal(readinessFixture.requestsPublicationGateOpen, false);
  assert.equal(readinessFixture.stopGo.recommendation, "STOP");
  assert.equal(readinessFixture.baselinePreserved.officialRecords, 24377);
  assert.equal(readinessFixture.baselinePreserved.disclosureSamples, 462);
  assert.equal(readinessFixture.baselinePreserved.statewideMissingLicenseDateFlags, 14);

  const dossierFixture = loadJson<{
    gate: string;
    crawlStarted: boolean;
    requestsPublicationGateOpen: boolean;
  }>("verification-exclusion-dossier.json");
  assert.equal(dossierFixture.gate, "blocked");
  assert.equal(dossierFixture.crawlStarted, false);
  assert.equal(dossierFixture.requestsPublicationGateOpen, false);

  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
      || directoryContract("Oregon")?.publication === "development",
  );
});
