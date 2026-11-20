import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE14_PHASE13_BASELINE_VERIFIED_COUNT,
  CALIFORNIA_PHASE14_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  californiaPhase14ClaimsStatewideCoverage,
  classifyCaliforniaPhase14DisclosureLink,
  generateCaliforniaPhase14DisclosureLinks,
  summarizeCaliforniaPhase14Coverage,
} from "../../../lib/california-phase14-disclosure-audit.ts";
import {
  appendCaliforniaPhase13AuditResult,
  californiaPhase13DefaultAuditConfig,
  createCaliforniaPhase13AuditCheckpoint,
  finalizeCaliforniaPhase13AuditCheckpoint,
  remainingCaliforniaPhase13AuditQueue,
  shouldStopCaliforniaPhase13Audit,
} from "../../../lib/california-phase13-disclosure-audit.ts";
import {
  CALIFORNIA_PHASE14_AMBIGUOUS_DISCLOSURE_CASE,
  CALIFORNIA_PHASE14_INVALID_DISCLOSURE_CASE,
  CALIFORNIA_PHASE14_UNRESOLVED_COORDINATE_CASES,
  classifyCaliforniaPhase14CoordinateException,
  investigateCaliforniaPhase14AmbiguousDisclosure,
  investigateCaliforniaPhase14InvalidDisclosure,
  summarizeCaliforniaPhase14Exceptions,
  californiaPhase14AllowsCoordinateFabrication,
} from "../../../lib/california-phase14-exceptions.ts";
import {
  CALIFORNIA_PHASE14_DISCLOSURE_SEED,
  CALIFORNIA_PHASE14_DISCLOSURE_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE14_PHASE13_PROBED_SET,
  CALIFORNIA_PHASE14_STATUS_SEED,
  CALIFORNIA_PHASE14_STATUS_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE14_WITHDRAWN_REGRESSION_IDS,
  classifyCaliforniaPhase14GeographicRegion,
  isCaliforniaPhase14PreviouslyUnverified,
} from "../../../lib/california-phase14-sample.ts";
import {
  CALIFORNIA_PHASE14_OBSERVED_COUNTS,
  assertCaliforniaPhase14ExclusiveAccounting,
  evaluateCaliforniaPhase14Quality,
} from "../../../lib/california-phase14-quality.ts";
import {
  CALIFORNIA_PHASE14_READINESS_DECISION,
  CALIFORNIA_PHASE14_READINESS_ITEMS,
  californiaPhase14AllowsPublication,
  evaluateCaliforniaPhase14Readiness,
  withCaliforniaPhase14CoordinateResolution,
} from "../../../lib/california-phase14-readiness.ts";
import {
  CALIFORNIA_PHASE14_WITHDRAWN_EVIDENCE,
  interpretCaliforniaPhase14ClosedMapping,
} from "../../../lib/california-phase14-status-verification.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase14-disclosure-exceptions",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("Phase 14 reuses Phase 13 harness: generator + stop conditions + resume", () => {
  const leading = generateCaliforniaPhase14DisclosureLinks("019200734");
  assert.equal(leading.validIdentifier, true);
  assert.ok(leading.pageUrl?.includes("019200734"));
  assert.ok(!leading.pageUrl?.includes("FacDetail/19200734"));

  const invalid = generateCaliforniaPhase14DisclosureLinks("95354");
  assert.equal(invalid.validIdentifier, false);
  assert.equal(invalid.pageUrl, null);

  const queue = [
    {
      facilityNumber: "345920416",
      file: "RCFE" as const,
      downloadStatus: "LICENSED",
      downloadType: "RESIDENTIAL CARE ELDERLY",
      stratum: "rcfe-licensed",
      label: "a",
      publicationCandidate: true,
    },
    {
      facilityNumber: "502701867",
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
  const first = classifyCaliforniaPhase14DisclosureLink({
    facilityNumber: "345920416",
    apiHttpStatus: 200,
    liveFacilityNumber: "345920416",
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
  assert.equal(californiaPhase14ClaimsStatewideCoverage(233, 15451), false);
});

test("incremental sample excludes Phase 13 probed IDs and covers geographic bands", () => {
  assert.equal(CALIFORNIA_PHASE14_PHASE13_BASELINE_VERIFIED_COUNT, 116);
  assert.ok(CALIFORNIA_PHASE14_DISCLOSURE_SAMPLE_TARGET_SIZE >= 100);
  for (const row of CALIFORNIA_PHASE14_DISCLOSURE_SEED) {
    assert.equal(isCaliforniaPhase14PreviouslyUnverified(row.facilityNumber), true);
    assert.equal(CALIFORNIA_PHASE14_PHASE13_PROBED_SET.has(row.facilityNumber), false);
    assert.equal(row.previouslyUnverified, true);
  }
  assert.equal(classifyCaliforniaPhase14GeographicRegion("90210"), "southern");
  assert.equal(classifyCaliforniaPhase14GeographicRegion("93701"), "central");
  assert.equal(classifyCaliforniaPhase14GeographicRegion("94103"), "bay-northern");
  assert.equal(classifyCaliforniaPhase14GeographicRegion(""), "unknown");
});

test("disclosure + invalid/ambiguous exceptions resolve without fabrication", () => {
  const ambiguous = investigateCaliforniaPhase14AmbiguousDisclosure({
    truncated: {
      apiHttpStatus: 200,
      liveFacilityNumber: "015601219",
      apiFound: true,
    },
    canonical: {
      apiHttpStatus: 200,
      liveFacilityNumber: "015601219",
      apiFound: true,
    },
  });
  assert.equal(ambiguous.resolution, "resolved-exact-official-id-works");
  assert.equal(ambiguous.fabricatedLink, false);
  assert.equal(
    ambiguous.requestFacilityNumber,
    CALIFORNIA_PHASE14_AMBIGUOUS_DISCLOSURE_CASE.truncatedRequest,
  );

  const invalid = investigateCaliforniaPhase14InvalidDisclosure();
  assert.equal(invalid.resolution, "confirmed-invalid-id-refuse-closed");
  assert.equal(
    invalid.officialFacilityNumber,
    CALIFORNIA_PHASE14_INVALID_DISCLOSURE_CASE.facilityNumber,
  );
  assert.equal(invalid.fabricatedLink, false);
  assert.equal(californiaPhase14AllowsCoordinateFabrication(), false);
});

test("coordinate exception classifier never fabricates coords", () => {
  assert.equal(CALIFORNIA_PHASE14_UNRESOLVED_COORDINATE_CASES.length, 28);

  const unmatched = classifyCaliforniaPhase14CoordinateException({
    facilityNumber: "347000691",
    file: "RCFE",
    priorMatchKind: "unmatched",
    facilityDetail: {
      found: true,
      liveFacilityNumber: "347000691",
      liveStatus: "Licensed",
    },
    gisRows: [],
  });
  assert.equal(unmatched.resolution, "confirmed-still-unmatched");
  assert.equal(unmatched.latitude, null);
  assert.equal(unmatched.fabricatedCoordinates, false);
  assert.equal(unmatched.geocoded, false);

  const exact = classifyCaliforniaPhase14CoordinateException({
    facilityNumber: "347000691",
    file: "RCFE",
    priorMatchKind: "unmatched",
    facilityDetail: {
      found: true,
      liveFacilityNumber: "347000691",
      liveStatus: "Licensed",
    },
    gisRows: [{
      FAC_NBR: "347000691",
      FAC_LATITUDE: "38.5",
      FAC_LONGITUDE: "-121.5",
      NAME: "TEST",
    }],
  });
  assert.equal(exact.resolution, "resolved-exact-gis-id-with-valid-coords");
  assert.equal(exact.latitude, "38.5");
  assert.equal(exact.fabricatedCoordinates, false);

  const resolved = withCaliforniaPhase14CoordinateResolution({
    resolvedWithOfficialCoords: 2,
  });
  assert.equal(resolved.verifiedCoords, 15425);
  assert.equal(resolved.unresolvedCoords, 26);
  assert.equal(resolved.fabricatedCoordinates, 0);
});

test("status regression controls stay withdrawn-ineligible; conflict stays unresolved", () => {
  assert.equal(CALIFORNIA_PHASE14_WITHDRAWN_REGRESSION_IDS.length, 5);
  assert.deepEqual(
    [...CALIFORNIA_PHASE14_WITHDRAWN_REGRESSION_IDS],
    [...CALIFORNIA_PHASE14_WITHDRAWN_EVIDENCE.phase11GapIds],
  );
  for (const id of CALIFORNIA_PHASE14_WITHDRAWN_REGRESSION_IDS) {
    assert.ok(CALIFORNIA_PHASE14_STATUS_SEED.some(t => t.facilityNumber === id));
  }
  assert.ok(CALIFORNIA_PHASE14_STATUS_SAMPLE_TARGET_SIZE >= 30);

  const interpreted = interpretCaliforniaPhase14ClosedMapping({
    downloadStatus: "CLOSED",
    liveStatus: "Application Withdrawn",
    downloadLicenseFirstDate: "",
    liveLicenseFirstDate: null,
    liveLicenseEffectiveDate: null,
    downloadClosedDate: "8/14/2025",
    liveDateClosed: "8/14/2025",
  });
  assert.equal(interpreted.relation, "documented-coarsening");
  assert.equal(interpreted.eligibility, "withdrawn-ineligible");
  assert.equal(interpreted.treatsAsClosedStar, false);

  const conflict = loadJson<{
    facilityNumber: string;
    relation: string;
    eligibility: string;
    liveStatus: string;
  }>("status-conflict-502701867.json");
  assert.equal(conflict.facilityNumber, "502701867");
  assert.equal(conflict.relation, "conflict");
  assert.equal(conflict.eligibility, "unknown-ineligible");
  assert.equal(conflict.liveStatus, "Pending Incomplete Application");
});

test("fixtures report incremental+cumulative coverage and exception outcomes", () => {
  const disclosure = loadJson<{
    sampleSize: number;
    phase13BaselineVerifiedCount: number;
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
  assert.equal(disclosure.phase13BaselineVerifiedCount, 116);
  assert.equal(disclosure.incrementalVerifiedCount, disclosure.sampleSize);
  assert.equal(
    disclosure.cumulativeVerifiedCount,
    disclosure.phase13BaselineVerifiedCount + disclosure.incrementalVerifiedCount,
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

  const coverage = summarizeCaliforniaPhase14Coverage({
    incrementalResults: Array.from({ length: disclosure.sampleSize }, () =>
      classifyCaliforniaPhase14DisclosureLink({
        facilityNumber: "345920416",
        apiHttpStatus: 200,
        liveFacilityNumber: "345920416",
        apiFound: true,
      })),
  });
  assert.equal(coverage.phase13BaselineVerifiedCount, 116);
  assert.equal(coverage.cumulativeVerifiedCount, 116 + disclosure.sampleSize);
  assert.equal(coverage.statewideCoverageClaimed, false);
  assert.equal(coverage.rosterDenominator, CALIFORNIA_PHASE14_PUBLICATION_CANDIDATE_ROSTER_SIZE);

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
  assert.equal(status.summary.conflict, 1);

  const gaps = status.observations.filter(o =>
    (CALIFORNIA_PHASE14_WITHDRAWN_REGRESSION_IDS as readonly string[]).includes(o.facilityNumber),
  );
  assert.equal(gaps.length, 5);
  for (const gap of gaps) {
    assert.equal(gap.relation, "documented-coarsening");
    assert.equal(gap.eligibility, "withdrawn-ineligible");
    assert.equal(gap.evidenceKind, "facility-detail-verified");
  }

  const coords = loadJson<{
    summary: {
      investigated: number;
      resolvedWithOfficialCoords: number;
      remainingUnresolvedAfterPhase14: number;
      fabricatedCoordinates: number;
      baselineUnresolved: number;
    };
  }>("coordinate-exceptions.json");
  assert.equal(coords.summary.investigated, 28);
  assert.equal(coords.summary.fabricatedCoordinates, 0);
  assert.equal(coords.summary.baselineUnresolved, 28);
  assert.equal(
    coords.summary.remainingUnresolvedAfterPhase14,
    28 - coords.summary.resolvedWithOfficialCoords,
  );

  const disclosureEx = loadJson<{
    summary: {
      investigated: number;
      resolvedExactOfficialIdWorks: number;
      confirmedInvalidRefuseClosed: number;
    };
  }>("disclosure-exceptions.json");
  assert.equal(disclosureEx.summary.investigated, 2);
  assert.equal(disclosureEx.summary.resolvedExactOfficialIdWorks, 1);
  assert.equal(disclosureEx.summary.confirmedInvalidRefuseClosed, 1);

  const summarized = summarizeCaliforniaPhase14Exceptions({
    disclosureFindings: [
      investigateCaliforniaPhase14InvalidDisclosure(),
    ],
    coordinateFindings: [],
  });
  assert.equal(summarized.publication, "unpublished");
  assert.equal(summarized.coordinateExceptions.fabricatedCoordinates, 0);
});

test("readiness gate stays blocked with baseline preserved", () => {
  const readiness = evaluateCaliforniaPhase14Readiness();
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.publicationReady, false);
  assert.equal(readiness.allowsPublication, false);
  assert.equal(californiaPhase14AllowsPublication(), false);
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
  assert.equal(readiness.disclosureAudit.statewideCoverageClaimed, false);
  assert.equal(readiness.disclosureAudit.phase13BaselineVerifiedCount, 116);
  assert.equal(readiness.exceptions.allowsFabrication, false);
  assert.deepEqual(readiness, CALIFORNIA_PHASE14_READINESS_DECISION);
  assert.ok(
    CALIFORNIA_PHASE14_READINESS_ITEMS.some(
      item => item.id === "authoritative-iso-export-date" && item.status === "fail",
    ),
  );
  assert.ok(
    CALIFORNIA_PHASE14_READINESS_ITEMS.some(
      item => item.id === "exception-investigation" && item.status === "partial",
    ),
  );

  const accounting = assertCaliforniaPhase14ExclusiveAccounting(
    CALIFORNIA_PHASE14_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE14_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(accounting.holds, true);
  assert.equal(accounting.rowCount, 24377);

  const quality = evaluateCaliforniaPhase14Quality();
  assert.equal(quality.gate, "blocked");
  assert.equal(quality.allowsPublication, false);
  assert.equal(quality.verifiedCoverage.statewideCoverageClaimed, false);

  const readinessFixture = loadJson<{
    gate: string;
    publicationReady: boolean;
    baselinePreserved: { officialRecords: number; unresolvedCoords: number };
    cdssClarification: { duplicateInquiryAllowed: boolean };
  }>("readiness-report.json");
  assert.equal(readinessFixture.gate, "blocked");
  assert.equal(readinessFixture.publicationReady, false);
  assert.equal(readinessFixture.baselinePreserved.officialRecords, 24377);
  assert.equal(readinessFixture.baselinePreserved.unresolvedCoords, 28);
  assert.equal(readinessFixture.cdssClarification.duplicateInquiryAllowed, false);

  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
      || directoryContract("Oregon")?.publication === "development",
  );
});
