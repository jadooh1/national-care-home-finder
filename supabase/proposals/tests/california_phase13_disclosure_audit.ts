import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE13_DISCLOSURE_URL_PATTERNS,
  CALIFORNIA_PHASE13_FACILITY_DETAIL_API,
  CALIFORNIA_PHASE13_FACILITY_DETAIL_PAGE_PREFIX,
  CALIFORNIA_PHASE13_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  appendCaliforniaPhase13AuditResult,
  californiaPhase13AuditItemKey,
  californiaPhase13ClaimsStatewideCoverage,
  californiaPhase13DefaultAuditConfig,
  classifyCaliforniaPhase13DisclosureLink,
  createCaliforniaPhase13AuditCheckpoint,
  finalizeCaliforniaPhase13AuditCheckpoint,
  generateCaliforniaPhase13DisclosureLinks,
  planCaliforniaPhase13StratifiedSample,
  remainingCaliforniaPhase13AuditQueue,
  shouldStopCaliforniaPhase13Audit,
  summarizeCaliforniaPhase13DisclosureLinks,
} from "../../../lib/california-phase13-disclosure-audit.ts";
import {
  CALIFORNIA_PHASE13_DISCLOSURE_SEED,
  CALIFORNIA_PHASE13_DISCLOSURE_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE13_STATUS_SEED,
  CALIFORNIA_PHASE13_STATUS_SAMPLE_TARGET_SIZE,
  CALIFORNIA_PHASE13_WITHDRAWN_REGRESSION_IDS,
  classifyCaliforniaPhase13DisclosureStratum,
} from "../../../lib/california-phase13-sample.ts";
import {
  CALIFORNIA_PHASE13_OBSERVED_COUNTS,
  assertCaliforniaPhase13ExclusiveAccounting,
  evaluateCaliforniaPhase13Quality,
} from "../../../lib/california-phase13-quality.ts";
import {
  CALIFORNIA_PHASE13_READINESS_DECISION,
  CALIFORNIA_PHASE13_READINESS_ITEMS,
  californiaPhase13AllowsPublication,
  evaluateCaliforniaPhase13Readiness,
} from "../../../lib/california-phase13-readiness.ts";
import {
  CALIFORNIA_PHASE13_WITHDRAWN_EVIDENCE,
  interpretCaliforniaPhase13ClosedMapping,
  isCaliforniaPhase13DownloadOnlyWithdrawnIndicator,
  observeCaliforniaPhase13StatusMapping,
  summarizeCaliforniaPhase13StatusMapping,
} from "../../../lib/california-phase13-status-verification.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase13-disclosure-audit",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("link generator preserves leading zeros and refuses invalid IDs", () => {
  const leading = generateCaliforniaPhase13DisclosureLinks("011400493");
  assert.equal(leading.validIdentifier, true);
  assert.equal(
    leading.pageUrl,
    `${CALIFORNIA_PHASE13_FACILITY_DETAIL_PAGE_PREFIX}011400493`,
  );
  assert.equal(
    leading.apiUrl,
    `${CALIFORNIA_PHASE13_FACILITY_DETAIL_API}011400493`,
  );
  assert.equal(leading.preservesLeadingZeros, true);
  assert.ok(leading.pageUrl?.includes("011400493"));
  assert.ok(!leading.pageUrl?.includes("FacDetail/11400493"));

  const invalid = generateCaliforniaPhase13DisclosureLinks("95354");
  assert.equal(invalid.validIdentifier, false);
  assert.equal(invalid.pageUrl, null);
  assert.equal(invalid.rejectionReason, "facility-number-not-8-or-9-digits");
  assert.ok(CALIFORNIA_PHASE13_DISCLOSURE_URL_PATTERNS.some(p => p.canonicalForPublication));
});

test("disclosure-link classification covers working/missing/ambiguous/invalid/inconclusive", () => {
  assert.equal(
    classifyCaliforniaPhase13DisclosureLink({
      facilityNumber: "100403816",
      apiHttpStatus: 200,
      liveFacilityNumber: "100403816",
      apiFound: true,
    }).classification,
    "working",
  );
  assert.equal(
    classifyCaliforniaPhase13DisclosureLink({
      facilityNumber: "999999999",
      apiHttpStatus: 200,
      liveFacilityNumber: null,
      apiFound: false,
    }).classification,
    "missing",
  );
  assert.equal(
    classifyCaliforniaPhase13DisclosureLink({
      facilityNumber: "15601219",
      apiHttpStatus: 200,
      liveFacilityNumber: "015601219",
      apiFound: true,
    }).classification,
    "ambiguous",
  );
  assert.equal(
    classifyCaliforniaPhase13DisclosureLink({
      facilityNumber: "95354",
    }).classification,
    "invalid",
  );
  assert.equal(
    classifyCaliforniaPhase13DisclosureLink({
      facilityNumber: "100403816",
      apiHttpStatus: 0,
      timedOut: true,
    }).classification,
    "inconclusive",
  );
});

test("audit harness checkpoints, resumes, and enforces stop conditions", () => {
  const queue = [
    {
      facilityNumber: "100403816",
      file: "ARF" as const,
      downloadStatus: "LICENSED",
      downloadType: "ADULT RESIDENTIAL",
      stratum: "arf-licensed",
      label: "a",
      publicationCandidate: true,
    },
    {
      facilityNumber: "197610772",
      file: "RCFE" as const,
      downloadStatus: "LICENSED",
      downloadType: "RESIDENTIAL CARE ELDERLY",
      stratum: "rcfe-licensed",
      label: "b",
      publicationCandidate: true,
    },
    {
      facilityNumber: "011400493",
      file: "ARF" as const,
      downloadStatus: "CLOSED",
      downloadType: "ADULT RESIDENTIAL",
      stratum: "closed",
      label: "c",
      publicationCandidate: false,
    },
  ];
  let checkpoint = createCaliforniaPhase13AuditCheckpoint({
    mode: "stratified-sample",
    observedOn: "2026-11-20",
    queue,
    config: { maxRequests: 2, checkpointEvery: 1 },
  });
  assert.equal(checkpoint.version, 1);
  assert.equal(checkpoint.statewideCoverageClaimed, false);
  assert.equal(checkpoint.publication, "unpublished");

  const first = classifyCaliforniaPhase13DisclosureLink({
    facilityNumber: "100403816",
    apiHttpStatus: 200,
    liveFacilityNumber: "100403816",
    apiFound: true,
  });
  checkpoint = appendCaliforniaPhase13AuditResult(checkpoint, queue[0], first, {
    liveStatus: "Licensed",
    attempts: 1,
    completedAt: "2026-11-20T00:00:00.000Z",
  });
  assert.equal(checkpoint.completedKeys.length, 1);
  assert.equal(checkpoint.requestsThisSession, 1);
  assert.deepEqual(
    remainingCaliforniaPhase13AuditQueue(queue, checkpoint).map(r => r.facilityNumber),
    ["197610772", "011400493"],
  );

  assert.equal(
    shouldStopCaliforniaPhase13Audit({
      requestsThisSession: 2,
      elapsedMs: 10,
      consecutiveInconclusive: 0,
      remainingCount: 2,
      config: californiaPhase13DefaultAuditConfig({ maxRequests: 2 }),
    }),
    "max-requests",
  );
  assert.equal(
    shouldStopCaliforniaPhase13Audit({
      requestsThisSession: 0,
      elapsedMs: 31 * 60 * 1000,
      consecutiveInconclusive: 0,
      remainingCount: 2,
      config: californiaPhase13DefaultAuditConfig(),
    }),
    "max-duration",
  );
  assert.equal(
    shouldStopCaliforniaPhase13Audit({
      requestsThisSession: 0,
      elapsedMs: 10,
      consecutiveInconclusive: 8,
      remainingCount: 2,
      config: californiaPhase13DefaultAuditConfig(),
    }),
    "consecutive-inconclusive",
  );

  checkpoint = finalizeCaliforniaPhase13AuditCheckpoint(checkpoint, "max-requests");
  assert.equal(checkpoint.stopReason, "max-requests");
  assert.equal(californiaPhase13ClaimsStatewideCoverage(1, 15451), false);
  assert.equal(californiaPhase13ClaimsStatewideCoverage(15451, 15451), false);
  assert.equal(californiaPhase13AuditItemKey(queue[0]).includes("100403816"), true);
});

test("stratified planner is deterministic and prefers seed rows", () => {
  const pool = [
    { facilityNumber: "111111111", stratum: "rcfe-licensed", label: "p1" },
    { facilityNumber: "222222222", stratum: "rcfe-licensed", label: "p2" },
    { facilityNumber: "333333333", stratum: "rcfe-licensed", label: "p3" },
    { facilityNumber: "444444444", stratum: "arf-licensed", label: "p4" },
  ];
  const seed = [
    { facilityNumber: "197610772", stratum: "rcfe-licensed", label: "seed" },
  ];
  const a = planCaliforniaPhase13StratifiedSample(
    pool,
    [{ stratum: "rcfe-licensed", targetCount: 2 }, { stratum: "arf-licensed", targetCount: 1 }],
    seed,
  );
  const b = planCaliforniaPhase13StratifiedSample(
    pool,
    [{ stratum: "rcfe-licensed", targetCount: 2 }, { stratum: "arf-licensed", targetCount: 1 }],
    seed,
  );
  assert.deepEqual(a, b);
  assert.equal(a[0].facilityNumber, "197610772");
  assert.equal(a.filter(r => r.stratum === "rcfe-licensed").length, 2);
  assert.equal(a.filter(r => r.stratum === "arf-licensed").length, 1);

  const classified = classifyCaliforniaPhase13DisclosureStratum("RCFE", {
    facilityNumber: "015601219",
    facilityStatus: "ON PROBATION",
    facilityType: "RESIDENTIAL CARE ELDERLY",
  });
  assert.equal(classified?.stratum, "leading-zero-probation");
  assert.equal(classified?.publicationCandidate, true);
});

test("CLOSED + Application Withdrawn remains documented coarsening; download-only distinct", () => {
  const interpreted = interpretCaliforniaPhase13ClosedMapping({
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
  assert.equal(interpreted.evidenceKind, "facility-detail-verified");

  assert.equal(
    isCaliforniaPhase13DownloadOnlyWithdrawnIndicator({
      downloadStatus: "CLOSED",
      downloadLicenseFirstDate: "",
    }),
    true,
  );
  assert.equal(
    isCaliforniaPhase13DownloadOnlyWithdrawnIndicator({
      downloadStatus: "CLOSED",
      downloadLicenseFirstDate: "1/28/1994",
    }),
    false,
  );
});

test("samples cover required strata and retain five withdrawn regression controls", () => {
  assert.ok(CALIFORNIA_PHASE13_DISCLOSURE_SEED.length >= 35);
  assert.ok(CALIFORNIA_PHASE13_DISCLOSURE_SAMPLE_TARGET_SIZE >= 100);
  assert.ok(CALIFORNIA_PHASE13_STATUS_SAMPLE_TARGET_SIZE > 21);
  assert.ok(CALIFORNIA_PHASE13_DISCLOSURE_SEED.some(t => t.stratum === "withdrawn"));
  assert.ok(CALIFORNIA_PHASE13_DISCLOSURE_SEED.some(t => t.stratum === "pending"));
  assert.ok(CALIFORNIA_PHASE13_DISCLOSURE_SEED.some(t => t.stratum === "closed"));
  assert.ok(CALIFORNIA_PHASE13_DISCLOSURE_SEED.some(t => t.stratum === "probationary"));
  assert.ok(
    CALIFORNIA_PHASE13_DISCLOSURE_SEED.some(t => t.stratum === "truncated-leading-zero-request"),
  );
  for (const id of CALIFORNIA_PHASE13_WITHDRAWN_REGRESSION_IDS) {
    assert.ok(
      CALIFORNIA_PHASE13_STATUS_SEED.some(t => t.facilityNumber === id),
      `status seed missing regression id ${id}`,
    );
  }
  assert.equal(CALIFORNIA_PHASE13_WITHDRAWN_REGRESSION_IDS.length, 5);
  assert.deepEqual(
    [...CALIFORNIA_PHASE13_WITHDRAWN_REGRESSION_IDS],
    [...CALIFORNIA_PHASE13_WITHDRAWN_EVIDENCE.phase11GapIds],
  );
});

test("fixture disclosure + status samples report exact denominators and stay non-statewide", () => {
  const disclosure = loadJson<{
    sampleSize: number;
    summary: {
      working: number;
      missing: number;
      ambiguous: number;
      invalid: number;
      inconclusive: number;
      leadingZeroPreservedWorking: number;
      verifiedCoverage: {
        verifiedCount: number;
        rosterDenominator: number;
      };
      statewideCoverageClaimed: boolean;
    };
  }>("disclosure-link-sample.json");

  assert.ok(disclosure.sampleSize >= 100);
  assert.equal(
    disclosure.summary.working
      + disclosure.summary.missing
      + disclosure.summary.ambiguous
      + disclosure.summary.invalid
      + disclosure.summary.inconclusive,
    disclosure.sampleSize,
  );
  assert.equal(disclosure.summary.verifiedCoverage.rosterDenominator, 15451);
  assert.equal(disclosure.summary.verifiedCoverage.verifiedCount, disclosure.sampleSize);
  assert.equal(disclosure.summary.statewideCoverageClaimed, false);
  assert.ok(disclosure.sampleSize < 15451);

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
      closedInterpretation: string;
      eligibility: string;
      evidenceKind: string;
      regressionControl?: boolean;
    }>;
  }>("status-mapping-sample.json");

  assert.ok(status.sampleSize >= 40);
  assert.ok(status.sampleSize <= 60);
  assert.equal(status.summary.regressionControlsResolvedAsDocumentedCoarsening, 5);
  assert.equal(status.summary.sampleIsStatewideConclusion, false);
  assert.equal(status.summary.invalidId, 1);

  const gaps = status.observations.filter(o =>
    (CALIFORNIA_PHASE13_WITHDRAWN_REGRESSION_IDS as readonly string[]).includes(o.facilityNumber),
  );
  assert.equal(gaps.length, 5);
  for (const gap of gaps) {
    assert.equal(gap.relation, "documented-coarsening");
    assert.equal(gap.closedInterpretation, "application-withdrawn-documented-coarsening");
    assert.equal(gap.eligibility, "withdrawn-ineligible");
    assert.equal(gap.evidenceKind, "facility-detail-verified");
  }

  const summarized = summarizeCaliforniaPhase13DisclosureLinks([]);
  assert.equal(summarized.statewideCoverageClaimed, false);
  assert.equal(summarized.verifiedCoverage.rosterDenominator, CALIFORNIA_PHASE13_PUBLICATION_CANDIDATE_ROSTER_SIZE);

  const rebuilt = summarizeCaliforniaPhase13StatusMapping(
    status.observations.map(row => ({
      facilityNumber: row.facilityNumber,
      file: "ARF" as const,
      downloadStatus: "CLOSED",
      downloadType: "test",
      stratum: "application-withdrawn" as const,
      label: row.facilityNumber,
      regressionControl: (CALIFORNIA_PHASE13_WITHDRAWN_REGRESSION_IDS as readonly string[])
        .includes(row.facilityNumber),
      httpStatus: 200,
      attempts: 1,
      timedOut: false,
      liveFacilityNumber: row.facilityNumber === "95354" ? null : row.facilityNumber,
      liveStatus: row.facilityNumber === "95354" ? null : "Application Withdrawn",
      liveFacilityType: null,
      liveDateClosed: null,
      liveLicenseFirstDate: null,
      liveLicenseEffectiveDate: null,
      downloadClosedDate: null,
      downloadLicenseFirstDate: null,
      found: row.facilityNumber !== "95354",
      identifierMatched: row.facilityNumber !== "95354",
      closedDatesAligned: true,
      neverLicensedMarkersPresent: true,
      relation: row.relation as
        | "match"
        | "documented-coarsening"
        | "conflict"
        | "missing"
        | "inconclusive"
        | "invalid-id",
      closedInterpretation: row.closedInterpretation as
        | "closed-star-formerly-licensed"
        | "application-withdrawn-documented-coarsening"
        | "unresolved-inconsistency"
        | "not-applicable",
      eligibility: row.eligibility as
        | "active-candidate"
        | "active-restricted"
        | "pending-ineligible"
        | "closed-ineligible"
        | "withdrawn-ineligible"
        | "invalid-id-ineligible"
        | "unknown-ineligible",
      evidenceKind: row.evidenceKind as
        | "facility-detail-verified"
        | "download-only-indicator"
        | "not-applicable",
      treatsAsLicensed: false as const,
      treatsAsClosedStar: false,
    })),
  );
  assert.equal(rebuilt.sampleIsStatewideConclusion, false);
  assert.equal(observeCaliforniaPhase13StatusMapping.length > 0, true);
});

test("readiness gate stays blocked with baseline preserved", () => {
  const readiness = evaluateCaliforniaPhase13Readiness();
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.publicationReady, false);
  assert.equal(readiness.allowsPublication, false);
  assert.equal(californiaPhase13AllowsPublication(), false);
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
  assert.equal(readiness.statusMapping.rosterWideFacilityDetailComplete, false);
  assert.equal(readiness.disclosureAudit.statewideCoverageClaimed, false);
  assert.equal(readiness.disclosureAudit.rosterDenominator, 15451);
  assert.deepEqual(readiness, CALIFORNIA_PHASE13_READINESS_DECISION);
  assert.ok(
    CALIFORNIA_PHASE13_READINESS_ITEMS.some(
      item => item.id === "authoritative-iso-export-date" && item.status === "fail",
    ),
  );
  assert.ok(
    CALIFORNIA_PHASE13_READINESS_ITEMS.some(
      item => item.id === "resumable-disclosure-audit-harness" && item.status === "pass",
    ),
  );

  const accounting = assertCaliforniaPhase13ExclusiveAccounting(
    CALIFORNIA_PHASE13_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE13_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(accounting.holds, true);
  assert.equal(accounting.rowCount, 24377);

  const quality = evaluateCaliforniaPhase13Quality();
  assert.equal(quality.gate, "blocked");
  assert.equal(quality.allowsPublication, false);
  assert.equal(quality.verifiedCoverage.statewideCoverageClaimed, false);

  const readinessFixture = loadJson<{
    gate: string;
    publicationReady: boolean;
    baselinePreserved: { officialRecords: number };
    cdssClarification: { duplicateInquiryAllowed: boolean };
  }>("readiness-report.json");
  assert.equal(readinessFixture.gate, "blocked");
  assert.equal(readinessFixture.publicationReady, false);
  assert.equal(readinessFixture.baselinePreserved.officialRecords, 24377);
  assert.equal(readinessFixture.cdssClarification.duplicateInquiryAllowed, false);

  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
      || directoryContract("Oregon")?.publication === "development",
  );
});
