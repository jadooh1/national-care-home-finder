import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  detectCaliforniaPhase16FacilityIdExceptions,
  detectCaliforniaPhase16LicensedMissingDateExceptions,
  detectCaliforniaPhase16SourceDataChangeExceptions,
  detectCaliforniaPhase16StatusConflictExceptions,
  runCaliforniaPhase16RegressionExceptionDetection,
  summarizeCaliforniaPhase16ExceptionReport,
  CALIFORNIA_PHASE16_STATUS_CONFLICT_FACILITY_NUMBER as PHASE16_CONFLICT_ID,
} from "../../../lib/california-phase16-exception-detection.ts";
import {
  CALIFORNIA_PHASE16_PHASE15_CUMULATIVE_VERIFIED_COUNT,
  CALIFORNIA_PHASE16_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  californiaPhase16ClaimsStatewideCoverage,
  classifyCaliforniaPhase16DisclosureLink,
  generateCaliforniaPhase16DisclosureLinks,
  summarizeCaliforniaPhase16Coverage,
} from "../../../lib/california-phase16-disclosure-audit.ts";
import {
  appendCaliforniaPhase13AuditResult,
  californiaPhase13DefaultAuditConfig,
  createCaliforniaPhase13AuditCheckpoint,
  finalizeCaliforniaPhase13AuditCheckpoint,
  remainingCaliforniaPhase13AuditQueue,
  shouldStopCaliforniaPhase13Audit,
} from "../../../lib/california-phase13-disclosure-audit.ts";
import {
  CALIFORNIA_PHASE16_INVALID_DISCLOSURE_CASE,
  CALIFORNIA_PHASE16_UNRESOLVED_COORDINATE_BASELINE,
  CALIFORNIA_PHASE16_UNRESOLVED_COORDINATE_CASES,
  californiaPhase16AllowsCoordinateFabrication,
  californiaPhase16ShouldReprobeUnresolvedCoordinates,
  investigateCaliforniaPhase16InvalidDisclosure,
  preserveCaliforniaPhase16AmbiguousDisclosure,
  summarizeCaliforniaPhase16Exceptions,
} from "../../../lib/california-phase16-exceptions.ts";
import {
  CALIFORNIA_PHASE16_DISCLOSURE_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE16_PRIOR_PROBED_SET,
  CALIFORNIA_PHASE16_STATUS_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE16_STATUS_SEED,
  CALIFORNIA_PHASE16_WITHDRAWN_REGRESSION_IDS,
  classifyCaliforniaPhase16GeographicRegion,
  isCaliforniaPhase16PreviouslyUnverified,
} from "../../../lib/california-phase16-sample.ts";
import {
  CALIFORNIA_PHASE16_OBSERVED_COUNTS,
  assertCaliforniaPhase16ExclusiveAccounting,
  evaluateCaliforniaPhase16Quality,
} from "../../../lib/california-phase16-quality.ts";
import {
  CALIFORNIA_PHASE16_READINESS_DECISION,
  CALIFORNIA_PHASE16_READINESS_ITEMS,
  californiaPhase16AllowsPublication,
  evaluateCaliforniaPhase16Readiness,
} from "../../../lib/california-phase16-readiness.ts";
import {
  CALIFORNIA_PHASE16_STATUS_CONFLICT_BASELINE_EVIDENCE,
  CALIFORNIA_PHASE16_STATUS_CONFLICT_FACILITY_NUMBER,
  californiaPhase16ConflictFacilityAllowsOwnerClaim,
  californiaPhase16ConflictFacilityAllowsPublication,
  investigateCaliforniaPhase16StatusConflict,
} from "../../../lib/california-phase16-status-conflict.ts";
import {
  CALIFORNIA_PHASE16_WITHDRAWN_EVIDENCE,
  interpretCaliforniaPhase16ClosedMapping,
} from "../../../lib/california-phase16-status-verification.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase16-exception-detection",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("Phase 16 reuses Phase 13 harness: generator + stop conditions + resume", () => {
  const leading = generateCaliforniaPhase16DisclosureLinks("019200521");
  assert.equal(leading.validIdentifier, true);
  assert.ok(leading.pageUrl?.includes("019200521"));
  assert.ok(!leading.pageUrl?.includes("FacDetail/19200521"));

  const invalid = generateCaliforniaPhase16DisclosureLinks("95354");
  assert.equal(invalid.validIdentifier, false);
  assert.equal(invalid.pageUrl, null);

  const queue = [
    {
      facilityNumber: "197608012",
      file: "RCFE" as const,
      downloadStatus: "LICENSED",
      downloadType: "RESIDENTIAL CARE ELDERLY",
      stratum: "rcfe-licensed",
      label: "a",
      publicationCandidate: true,
    },
    {
      facilityNumber: "306004891",
      file: "ARF" as const,
      downloadStatus: "LICENSED",
      downloadType: "ADULT RESIDENTIAL",
      stratum: "arf-licensed",
      label: "b",
      publicationCandidate: true,
    },
  ];
  let checkpoint = createCaliforniaPhase13AuditCheckpoint({
    mode: "stratified-sample",
    observedOn: "2026-11-20",
    queue,
    config: { maxRequests: 1 },
  });
  const first = classifyCaliforniaPhase16DisclosureLink({
    facilityNumber: "197608012",
    apiHttpStatus: 200,
    liveFacilityNumber: "197608012",
    apiFound: true,
  });
  checkpoint = appendCaliforniaPhase13AuditResult(checkpoint, queue[0], first, {
    liveStatus: "Licensed",
    attempts: 1,
  });
  assert.equal(remainingCaliforniaPhase13AuditQueue(queue, checkpoint).length, 1);
  assert.equal(
    shouldStopCaliforniaPhase13Audit({
      requestsThisSession: 1,
      elapsedMs: 10,
      consecutiveInconclusive: 0,
      remainingCount: 1,
      config: californiaPhase13DefaultAuditConfig({ maxRequests: 1 }),
    }),
    "max-requests",
  );
  checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(checkpoint, "max-requests");
  assert.equal(checkpoint.stopReason, "max-requests");
  assert.equal(checkpoint.statewideCoverageClaimed, false);
  assert.equal(californiaPhase16ClaimsStatewideCoverage(467, 15451), false);
});

test("incremental sample excludes Phase 13–15 probed IDs and covers geographic bands", () => {
  assert.equal(CALIFORNIA_PHASE16_PHASE15_CUMULATIVE_VERIFIED_COUNT, 347);
  assert.ok(CALIFORNIA_PHASE16_DISCLOSURE_SAMPLE_TARGET_SIZE >= 100);
  assert.ok(CALIFORNIA_PHASE16_PRIOR_PROBED_SET.has("502701867"));
  assert.ok(CALIFORNIA_PHASE16_PRIOR_PROBED_SET.has("015601219"));
  assert.equal(isCaliforniaPhase16PreviouslyUnverified("502701867"), false);
  assert.equal(classifyCaliforniaPhase16GeographicRegion("90210"), "southern");
  assert.equal(classifyCaliforniaPhase16GeographicRegion("93701"), "central");
  assert.equal(classifyCaliforniaPhase16GeographicRegion("94103"), "bay-northern");
});

test("status conflict 502701867 stays unknown-ineligible and cannot publish or claim", () => {
  const finding = investigateCaliforniaPhase16StatusConflict({
    download: CALIFORNIA_PHASE16_STATUS_CONFLICT_BASELINE_EVIDENCE.download,
    facilityDetail: {
      ...CALIFORNIA_PHASE16_STATUS_CONFLICT_BASELINE_EVIDENCE.facilityDetail,
      found: true,
    },
    gisHitCount: CALIFORNIA_PHASE16_STATUS_CONFLICT_BASELINE_EVIDENCE.gisHitCount,
  });

  assert.equal(finding.facilityNumber, CALIFORNIA_PHASE16_STATUS_CONFLICT_FACILITY_NUMBER);
  assert.equal(finding.relation, "conflict");
  assert.equal(finding.eligibility, "unknown-ineligible");
  assert.equal(finding.resolution, "unresolved-conflict-keep-unknown-ineligible");
  assert.equal(finding.neverLicensedMarkersPresent, true);
  assert.equal(finding.identity.overallIdentityMatched, true);
  assert.equal(finding.identity.recordReuseSupported, false);
  assert.equal(finding.gisHitCount, 0);
  assert.equal(finding.adoptedHypothesis, null);
  assert.equal(finding.inventedEquivalence, false);
  assert.equal(finding.publicationEligible, false);
  assert.equal(finding.ownerClaimEligible, false);
  assert.equal(finding.canPublish, false);
  assert.equal(finding.canClaim, false);
  assert.equal(californiaPhase16ConflictFacilityAllowsPublication(finding), false);
  assert.equal(californiaPhase16ConflictFacilityAllowsOwnerClaim(finding), false);
  assert.equal(finding.safeguards.statewidePublicationBlocker, false);
  assert.equal(finding.safeguards.individualFacilityException, true);

  const fixture = loadJson<{
    facilityNumber: string;
    relation: string;
    eligibility: string;
    resolution: string;
    canPublish: boolean;
    canClaim: boolean;
    identityMatched: boolean;
  }>("status-conflict-502701867.json");
  assert.equal(fixture.facilityNumber, "502701867");
  assert.equal(fixture.relation, "conflict");
  assert.equal(fixture.eligibility, "unknown-ineligible");
  assert.equal(fixture.resolution, "unresolved-conflict-keep-unknown-ineligible");
  assert.equal(fixture.canPublish, false);
  assert.equal(fixture.canClaim, false);
  assert.equal(fixture.identityMatched, true);
});

test("exception safeguards preserved: withdrawn, 95354, leading zeros, no coord re-probe", () => {
  assert.equal(CALIFORNIA_PHASE16_WITHDRAWN_REGRESSION_IDS.length, 5);
  assert.deepEqual(
    [...CALIFORNIA_PHASE16_WITHDRAWN_REGRESSION_IDS],
    [...CALIFORNIA_PHASE16_WITHDRAWN_EVIDENCE.phase11GapIds],
  );
  for (const id of CALIFORNIA_PHASE16_WITHDRAWN_REGRESSION_IDS) {
    assert.ok(CALIFORNIA_PHASE16_STATUS_SEED.some(t => t.facilityNumber === id));
  }
  assert.ok(CALIFORNIA_PHASE16_STATUS_SAMPLE_TARGET_SIZE >= 30);

  const interpreted = interpretCaliforniaPhase16ClosedMapping({
    downloadStatus: "CLOSED",
    liveStatus: "Application Withdrawn",
    downloadLicenseFirstDate: "",
    liveLicenseFirstDate: null,
    liveLicenseEffectiveDate: null,
  });
  assert.equal(interpreted.relation, "documented-coarsening");
  assert.equal(interpreted.eligibility, "withdrawn-ineligible");
  assert.equal(interpreted.treatsAsClosedStar, false);

  const invalid = investigateCaliforniaPhase16InvalidDisclosure();
  assert.equal(invalid.resolution, "confirmed-invalid-id-refuse-closed");
  assert.equal(
    invalid.officialFacilityNumber,
    CALIFORNIA_PHASE16_INVALID_DISCLOSURE_CASE.facilityNumber,
  );
  assert.equal(invalid.fabricatedLink, false);

  const ambiguous = preserveCaliforniaPhase16AmbiguousDisclosure();
  assert.equal(ambiguous.resolution, "preserved-from-phase15-no-repeat");
  assert.equal(ambiguous.fabricatedLink, false);

  assert.equal(CALIFORNIA_PHASE16_UNRESOLVED_COORDINATE_CASES.length, 28);
  assert.equal(CALIFORNIA_PHASE16_UNRESOLVED_COORDINATE_BASELINE, 28);
  assert.equal(
    californiaPhase16ShouldReprobeUnresolvedCoordinates({
      genuinelyNewAuthoritativeEvidence: false,
    }),
    false,
  );
  assert.equal(californiaPhase16AllowsCoordinateFabrication(), false);

  const withdrawn = loadJson<{
    count: number;
    allWithdrawnIneligible: boolean;
    allDocumentedCoarsening: boolean;
  }>("withdrawn-regression-controls.json");
  assert.equal(withdrawn.count, 5);
  assert.equal(withdrawn.allWithdrawnIneligible, true);
  assert.equal(withdrawn.allDocumentedCoarsening, true);

  const coords = loadJson<{
    summary: {
      remainingUnresolved: number;
      fabricatedCoordinates: number;
      reProbedUnsuccessfulChecks: boolean;
    };
    reProbed: boolean;
  }>("coordinate-exceptions.json");
  assert.equal(coords.reProbed, false);
  assert.equal(coords.summary.remainingUnresolved, 28);
  assert.equal(coords.summary.fabricatedCoordinates, 0);
  assert.equal(coords.summary.reProbedUnsuccessfulChecks, false);
});

test("fixtures report incremental+cumulative coverage without statewide claim", () => {
  const disclosure = loadJson<{
    sampleSize: number;
    phase15CumulativeVerifiedCount: number;
    incrementalVerifiedCount: number;
    cumulativeVerifiedCount: number;
    summary: {
      working: number;
      missing: number;
      ambiguous: number;
      invalid: number;
      inconclusive: number;
      verifiedCoverage: {
        rosterDenominator: number;
        cumulative: number;
      };
      statewideCoverageClaimed: boolean;
    };
  }>("disclosure-link-sample.json");

  assert.ok(disclosure.sampleSize >= 100);
  assert.equal(disclosure.phase15CumulativeVerifiedCount, 347);
  assert.equal(disclosure.incrementalVerifiedCount, disclosure.sampleSize);
  assert.equal(
    disclosure.cumulativeVerifiedCount,
    disclosure.phase15CumulativeVerifiedCount + disclosure.incrementalVerifiedCount,
  );
  assert.equal(
    disclosure.summary.working
      + disclosure.summary.missing
      + disclosure.summary.ambiguous
      + disclosure.summary.invalid
      + disclosure.summary.inconclusive,
    disclosure.sampleSize,
  );
  assert.equal(disclosure.summary.verifiedCoverage.rosterDenominator, 15451);
  assert.equal(disclosure.summary.statewideCoverageClaimed, false);
  assert.ok(disclosure.cumulativeVerifiedCount < 15451);

  const coverage = summarizeCaliforniaPhase16Coverage({
    incrementalResults: Array.from({ length: disclosure.sampleSize }, () =>
      classifyCaliforniaPhase16DisclosureLink({
        facilityNumber: "197608012",
        apiHttpStatus: 200,
        liveFacilityNumber: "197608012",
        apiFound: true,
      })),
  });
  assert.equal(coverage.phase15CumulativeVerifiedCount, 347);
  assert.equal(coverage.cumulativeVerifiedCount, 347 + disclosure.sampleSize);
  assert.equal(coverage.statewideCoverageClaimed, false);
  assert.equal(coverage.rosterDenominator, CALIFORNIA_PHASE16_PUBLICATION_CANDIDATE_ROSTER_SIZE);

  const status = loadJson<{
    sampleSize: number;
    summary: {
      match: number;
      documentedCoarsening: number;
      conflict: number;
      invalidId: number;
      regressionControlsResolvedAsDocumentedCoarsening: number;
      sampleIsStatewideConclusion: boolean;
    };
    observations: Array<{
      facilityNumber: string;
      relation: string;
      eligibility: string;
      evidenceKind: string;
      regressionControl?: boolean;
    }>;
  }>("status-mapping-sample.json");
  assert.ok(status.sampleSize >= 30);
  assert.ok(status.sampleSize <= 50);
  assert.equal(status.summary.regressionControlsResolvedAsDocumentedCoarsening, 5);
  assert.equal(status.summary.sampleIsStatewideConclusion, false);
  assert.equal(status.summary.invalidId, 1);
  assert.ok(status.summary.conflict >= 1);

  const gaps = status.observations.filter(o =>
    (CALIFORNIA_PHASE16_WITHDRAWN_REGRESSION_IDS as readonly string[]).includes(o.facilityNumber),
  );
  assert.equal(gaps.length, 5);
  for (const gap of gaps) {
    assert.equal(gap.relation, "documented-coarsening");
    assert.equal(gap.eligibility, "withdrawn-ineligible");
    assert.equal(gap.evidenceKind, "facility-detail-verified");
  }

  const conflictObs = status.observations.find(o => o.facilityNumber === "502701867");
  assert.ok(conflictObs);
  assert.equal(conflictObs?.relation, "conflict");
  assert.equal(conflictObs?.eligibility, "unknown-ineligible");

  const summarized = summarizeCaliforniaPhase16Exceptions({
    disclosureFindings: [
      investigateCaliforniaPhase16InvalidDisclosure(),
      preserveCaliforniaPhase16AmbiguousDisclosure(),
    ],
  });
  assert.equal(summarized.publication, "unpublished");
  assert.equal(summarized.coordinateExceptions.fabricatedCoordinates, 0);
  assert.equal(summarized.coordinateExceptions.remainingUnresolved, 28);
});


test("automated exception detection covers ID/status/date/disclosure/source-change regressions", () => {
  const findings = runCaliforniaPhase16RegressionExceptionDetection();
  const report = summarizeCaliforniaPhase16ExceptionReport({
    observedOn: "2026-11-20",
    findings,
  });
  assert.equal(report.gate, "blocked");
  assert.equal(report.publication, "unpublished");
  assert.equal(report.sampleIsStatewideConclusion, false);
  assert.ok(report.byClass["withdrawn-ineligible-control"] >= 5);
  assert.ok(
    report.byClass["unknown-ineligible-control"] >= 1
      || report.byClass["status-conflict"] >= 1
      || report.byClass["licensed-missing-initial-date"] >= 1,
  );
  assert.ok(
    report.byClass["facility-id-malformed"] >= 1
      || report.byClass["disclosure-invalid"] >= 1,
  );
  assert.ok(report.byClass["facility-id-lost-leading-zeros"] >= 1);

  const malformed = detectCaliforniaPhase16FacilityIdExceptions({
    facilityNumber: "95354",
  });
  assert.equal(malformed[0]?.exceptionClass, "facility-id-malformed");
  assert.equal(malformed[0]?.eligibility, "invalid-id-ineligible");
  assert.equal(malformed[0]?.publicationEligible, false);

  const lostZeros = detectCaliforniaPhase16FacilityIdExceptions({
    facilityNumber: "15601219",
    liveFacilityNumber: "015601219",
    apiFound: true,
    apiHttpStatus: 200,
  });
  assert.equal(lostZeros[0]?.exceptionClass, "facility-id-lost-leading-zeros");

  const conflict = detectCaliforniaPhase16StatusConflictExceptions({
    facilityNumber: PHASE16_CONFLICT_ID,
    downloadStatus: "LICENSED",
    liveStatus: "Pending Incomplete Application",
    downloadLicenseFirstDate: "",
    liveLicenseFirstDate: "",
    liveLicenseEffectiveDate: "",
    apiHttpStatus: 200,
    scope: "regression-control",
  });
  assert.equal(conflict[0]?.eligibility, "unknown-ineligible");
  assert.equal(conflict[0]?.publicationEligible, false);

  const missingDate = detectCaliforniaPhase16LicensedMissingDateExceptions({
    facilityNumber: PHASE16_CONFLICT_ID,
    downloadStatus: "LICENSED",
    downloadLicenseFirstDate: "",
  });
  assert.equal(missingDate[0]?.exceptionClass, "licensed-missing-initial-date");

  const noDrift = detectCaliforniaPhase16SourceDataChangeExceptions({
    downloadSha256: {
      rcfe: "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
      arf: "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
    },
  });
  assert.equal(noDrift.length, 0);

  const drift = detectCaliforniaPhase16SourceDataChangeExceptions({
    downloadSha256: { rcfe: "aaa", arf: "bbb" },
  });
  assert.equal(drift[0]?.exceptionClass, "source-data-unexpected-change");
  assert.equal(drift[0]?.scope, "statewide-check");
  assert.equal(drift[0]?.sampleIsStatewideConclusion, false);

  const fixture = loadJson<{
    gate: string;
    sampleIsStatewideConclusion: boolean;
    byClass: Record<string, number>;
  }>("exception-detection-report.json");
  assert.equal(fixture.gate, "blocked");
  assert.equal(fixture.sampleIsStatewideConclusion, false);
  assert.ok(typeof fixture.byClass === "object");
});

test("readiness gate stays blocked with baseline preserved", () => {
  const readiness = evaluateCaliforniaPhase16Readiness();
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.publicationReady, false);
  assert.equal(readiness.allowsPublication, false);
  assert.equal(californiaPhase16AllowsPublication(), false);
  assert.equal(readiness.publication, "unpublished");
  assert.equal(readiness.ownerClaimEligible, false);
  assert.equal(readiness.authoritativeIsoExportDate, null);
  assert.equal(readiness.cdssClarification.duplicateInquiryAllowed, false);
  assert.equal(readiness.cdssClarification.status, "sent-awaiting-response");
  assert.equal(readiness.baselinePreserved.officialRecords, 24377);
  assert.equal(readiness.baselinePreserved.activeRestrictedCandidates, 15451);
  assert.equal(readiness.baselinePreserved.verifiedCoords, 15423);
  assert.equal(readiness.baselinePreserved.unresolvedCoords, 28);
  assert.equal(readiness.baselinePreserved.missingCapacitiesOnExcluded, 21);
  assert.equal(readiness.statusMapping.inventedClosedStarEquivalence, false);
  assert.equal(readiness.statusMapping.treatsWithdrawnAsLicensed, false);
  assert.equal(readiness.statusMapping.statusConflict502701867.eligibility, "unknown-ineligible");
  assert.equal(readiness.statusMapping.statusConflict502701867.publicationEligible, false);
  assert.equal(readiness.statusMapping.statusConflict502701867.statewidePublicationBlocker, false);
  assert.equal(readiness.statusMapping.statusConflict502701867.individualFacilityException, true);
  assert.equal(readiness.disclosureAudit.statewideCoverageClaimed, false);
  assert.equal(readiness.disclosureAudit.phase15CumulativeVerifiedCount, 347);
  assert.equal(readiness.exceptions.allowsFabrication, false);
  assert.equal(readiness.exceptions.avoidsRepeatingUnsuccessfulCoordChecks, true);
  assert.deepEqual(readiness, CALIFORNIA_PHASE16_READINESS_DECISION);
  assert.ok(
    CALIFORNIA_PHASE16_READINESS_ITEMS.some(
      item => item.id === "authoritative-iso-export-date" && item.status === "fail",
    ),
  );
  assert.ok(
    CALIFORNIA_PHASE16_READINESS_ITEMS.some(
      item => item.id === "status-conflict-502701867" && item.status === "partial",
    ),
  );

  const accounting = assertCaliforniaPhase16ExclusiveAccounting(
    CALIFORNIA_PHASE16_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE16_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(accounting.holds, true);
  assert.equal(accounting.rowCount, 24377);

  const quality = evaluateCaliforniaPhase16Quality();
  assert.equal(quality.gate, "blocked");
  assert.equal(quality.allowsPublication, false);
  assert.equal(quality.verifiedCoverage.statewideCoverageClaimed, false);
  assert.equal(quality.statusConflict.eligibility, "unknown-ineligible");

  const readinessFixture = loadJson<{
    gate: string;
    publicationReady: boolean;
    baselinePreserved: { officialRecords: number; unresolvedCoords: number };
    cdssClarification: { duplicateInquiryAllowed: boolean };
    statusConflict: { eligibility: string; canPublish?: boolean; publicationEligible: boolean };
  }>("readiness-report.json");
  assert.equal(readinessFixture.gate, "blocked");
  assert.equal(readinessFixture.publicationReady, false);
  assert.equal(readinessFixture.baselinePreserved.officialRecords, 24377);
  assert.equal(readinessFixture.baselinePreserved.unresolvedCoords, 28);
  assert.equal(readinessFixture.cdssClarification.duplicateInquiryAllowed, false);
  assert.equal(readinessFixture.statusConflict.eligibility, "unknown-ineligible");
  assert.equal(readinessFixture.statusConflict.publicationEligible, false);

  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
      || directoryContract("Oregon")?.publication === "development",
  );
});
