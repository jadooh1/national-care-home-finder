import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE12_DISCLOSURE_URL_PATTERNS,
  CALIFORNIA_PHASE12_FACILITY_DETAIL_API,
  CALIFORNIA_PHASE12_FACILITY_DETAIL_PAGE_PREFIX,
  classifyCaliforniaPhase12DisclosureLink,
  generateCaliforniaPhase12DisclosureLinks,
  isCaliforniaPhase12CanonicalDisclosureUrl,
  summarizeCaliforniaPhase12DisclosureLinks,
} from "../../../lib/california-phase12-disclosure-links.ts";
import {
  CALIFORNIA_PHASE12_DISCLOSURE_LINK_SAMPLE,
  CALIFORNIA_PHASE12_STATUS_MAPPING_SAMPLE,
} from "../../../lib/california-phase12-sample.ts";
import {
  CALIFORNIA_PHASE12_OBSERVED_COUNTS,
  assertCaliforniaPhase12ExclusiveAccounting,
  evaluateCaliforniaPhase12Quality,
} from "../../../lib/california-phase12-quality.ts";
import {
  CALIFORNIA_PHASE12_READINESS_DECISION,
  CALIFORNIA_PHASE12_READINESS_ITEMS,
  californiaPhase12AllowsPublication,
  evaluateCaliforniaPhase12Readiness,
} from "../../../lib/california-phase12-readiness.ts";
import {
  CALIFORNIA_PHASE12_WITHDRAWN_EVIDENCE,
  interpretCaliforniaPhase12ClosedMapping,
  observeCaliforniaPhase12StatusMapping,
  relateCaliforniaPhase12DownloadToFacilityDetail,
  summarizeCaliforniaPhase12StatusMapping,
} from "../../../lib/california-phase12-status-mapping.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase12-status-mapping",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("link generator preserves leading zeros and refuses invalid IDs", () => {
  const leading = generateCaliforniaPhase12DisclosureLinks("011400493");
  assert.equal(leading.validIdentifier, true);
  assert.equal(
    leading.pageUrl,
    `${CALIFORNIA_PHASE12_FACILITY_DETAIL_PAGE_PREFIX}011400493`,
  );
  assert.equal(
    leading.apiUrl,
    `${CALIFORNIA_PHASE12_FACILITY_DETAIL_API}011400493`,
  );
  assert.equal(leading.preservesLeadingZeros, true);
  assert.ok(leading.pageUrl?.includes("011400493"));
  assert.ok(!leading.pageUrl?.includes("FacDetail/11400493"));

  const invalid = generateCaliforniaPhase12DisclosureLinks("95354");
  assert.equal(invalid.validIdentifier, false);
  assert.equal(invalid.pageUrl, null);
  assert.equal(invalid.apiUrl, null);
  assert.equal(invalid.rejectionReason, "facility-number-not-8-or-9-digits");

  assert.equal(
    isCaliforniaPhase12CanonicalDisclosureUrl(
      "100403816",
      `${CALIFORNIA_PHASE12_FACILITY_DETAIL_PAGE_PREFIX}100403816`,
    ),
    true,
  );
  assert.ok(CALIFORNIA_PHASE12_DISCLOSURE_URL_PATTERNS.some(p => p.canonicalForPublication));
});

test("disclosure-link classification covers working/missing/ambiguous/invalid/inconclusive", () => {
  const working = classifyCaliforniaPhase12DisclosureLink({
    facilityNumber: "100403816",
    apiHttpStatus: 200,
    liveFacilityNumber: "100403816",
    apiFound: true,
    pageHttpStatus: 200,
  });
  assert.equal(working.classification, "working");

  const missing = classifyCaliforniaPhase12DisclosureLink({
    facilityNumber: "999999999",
    apiHttpStatus: 200,
    liveFacilityNumber: null,
    apiFound: false,
    pageHttpStatus: 200,
  });
  assert.equal(missing.classification, "missing");

  const ambiguous = classifyCaliforniaPhase12DisclosureLink({
    facilityNumber: "15601219",
    apiHttpStatus: 200,
    liveFacilityNumber: "015601219",
    apiFound: true,
    pageHttpStatus: 200,
  });
  assert.equal(ambiguous.classification, "ambiguous");
  assert.equal(ambiguous.identifierRelation, "leading-zero-canonicalization");

  const invalid = classifyCaliforniaPhase12DisclosureLink({
    facilityNumber: "95354",
    apiHttpStatus: 200,
    liveFacilityNumber: null,
    apiFound: false,
  });
  assert.equal(invalid.classification, "invalid");

  const inconclusive = classifyCaliforniaPhase12DisclosureLink({
    facilityNumber: "100403816",
    apiHttpStatus: 0,
    timedOut: true,
  });
  assert.equal(inconclusive.classification, "inconclusive");
});

test("CLOSED + Application Withdrawn with never-licensed markers is documented coarsening", () => {
  const interpreted = interpretCaliforniaPhase12ClosedMapping({
    downloadStatus: "CLOSED",
    liveStatus: "Application Withdrawn",
    downloadLicenseFirstDate: "",
    liveLicenseFirstDate: null,
    liveLicenseEffectiveDate: null,
    downloadClosedDate: "8/14/2025",
    liveDateClosed: "8/14/2025",
  });
  assert.equal(interpreted.relation, "documented-coarsening");
  assert.equal(
    interpreted.closedInterpretation,
    "application-withdrawn-documented-coarsening",
  );
  assert.equal(interpreted.eligibility, "withdrawn-ineligible");
  assert.equal(interpreted.treatsAsClosedStar, false);
  assert.equal(interpreted.neverLicensedMarkersPresent, true);
  assert.equal(interpreted.closedDatesAligned, true);

  const closedStar = interpretCaliforniaPhase12ClosedMapping({
    downloadStatus: "CLOSED",
    liveStatus: "Closed, Licensee Initiated",
    downloadLicenseFirstDate: "1/28/1994",
    liveLicenseFirstDate: "1/28/1994",
    liveLicenseEffectiveDate: "1/28/1994",
    downloadClosedDate: "4/28/2025",
    liveDateClosed: "4/28/2025",
  });
  assert.equal(closedStar.relation, "match");
  assert.equal(closedStar.closedInterpretation, "closed-star-formerly-licensed");
  assert.equal(closedStar.eligibility, "closed-ineligible");
  assert.equal(closedStar.treatsAsClosedStar, true);

  // Never invent Closed* equivalence for Application Withdrawn.
  const related = relateCaliforniaPhase12DownloadToFacilityDetail(
    "CLOSED",
    "Application Withdrawn",
    {
      downloadFacilityNumber: "306006749",
      identifierMatched: true,
      httpStatus: 200,
      found: true,
      downloadLicenseFirstDate: "",
      liveLicenseFirstDate: null,
      liveLicenseEffectiveDate: null,
      downloadClosedDate: "8/14/2025",
      liveDateClosed: "8/14/2025",
    },
  );
  assert.equal(related.relation, "documented-coarsening");
  assert.notEqual(related.relation, "match");
  assert.equal(related.eligibility, "withdrawn-ineligible");
});

test("expanded samples cover required strata and Phase 11 gap IDs", () => {
  assert.equal(CALIFORNIA_PHASE12_DISCLOSURE_LINK_SAMPLE.length, 40);
  assert.ok(CALIFORNIA_PHASE12_DISCLOSURE_LINK_SAMPLE.length > 20);
  assert.ok(CALIFORNIA_PHASE12_DISCLOSURE_LINK_SAMPLE.some(t => t.stratum === "withdrawn"));
  assert.ok(CALIFORNIA_PHASE12_DISCLOSURE_LINK_SAMPLE.some(t => t.stratum === "pending"));
  assert.ok(CALIFORNIA_PHASE12_DISCLOSURE_LINK_SAMPLE.some(t => t.stratum === "closed"));
  assert.ok(CALIFORNIA_PHASE12_DISCLOSURE_LINK_SAMPLE.some(t => t.stratum === "probationary"));
  assert.ok(
    CALIFORNIA_PHASE12_DISCLOSURE_LINK_SAMPLE.some(
      t => t.stratum === "truncated-leading-zero-request",
    ),
  );
  assert.ok(
    CALIFORNIA_PHASE12_DISCLOSURE_LINK_SAMPLE.some(t => t.stratum === "exceptional-invalid"),
  );

  for (const id of CALIFORNIA_PHASE12_WITHDRAWN_EVIDENCE.phase11GapIds) {
    assert.ok(
      CALIFORNIA_PHASE12_STATUS_MAPPING_SAMPLE.some(t => t.facilityNumber === id),
      `status sample missing Phase 11 gap id ${id}`,
    );
  }
  assert.ok(CALIFORNIA_PHASE12_STATUS_MAPPING_SAMPLE.some(t => t.stratum === "closed-star"));
  assert.ok(
    CALIFORNIA_PHASE12_STATUS_MAPPING_SAMPLE.some(t => t.stratum === "application-withdrawn"),
  );
});

test("fixture status mapping resolves five Phase 11 gaps as documented coarsening", () => {
  const fixture = loadJson<{
    sampleSize: number;
    summary: {
      match: number;
      documentedCoarsening: number;
      conflict: number;
      invalidId: number;
      phase11GapIdsResolvedAsDocumentedCoarsening: number;
    };
    observations: Array<{
      facilityNumber: string;
      downloadStatus: string;
      liveStatus: string | null;
      relation: string;
      closedInterpretation: string;
      eligibility: string;
      treatsAsClosedStar: boolean;
      neverLicensedMarkersPresent: boolean;
      closedDatesAligned: boolean | null;
      downloadLicenseFirstDate: string | null;
      liveLicenseFirstDate: string | null;
      downloadClosedDate: string | null;
      liveDateClosed: string | null;
    }>;
  }>("status-mapping-sample.json");

  assert.equal(fixture.sampleSize, 21);
  assert.equal(fixture.summary.documentedCoarsening, 5);
  assert.equal(fixture.summary.phase11GapIdsResolvedAsDocumentedCoarsening, 5);
  assert.equal(fixture.summary.conflict, 0);
  assert.equal(fixture.summary.invalidId, 1);

  const gaps = fixture.observations.filter(o =>
    (CALIFORNIA_PHASE12_WITHDRAWN_EVIDENCE.phase11GapIds as readonly string[])
      .includes(o.facilityNumber),
  );
  assert.equal(gaps.length, 5);
  for (const gap of gaps) {
    assert.equal(gap.downloadStatus, "CLOSED");
    assert.equal(gap.liveStatus, "Application Withdrawn");
    assert.equal(gap.relation, "documented-coarsening");
    assert.equal(
      gap.closedInterpretation,
      "application-withdrawn-documented-coarsening",
    );
    assert.equal(gap.eligibility, "withdrawn-ineligible");
    assert.equal(gap.treatsAsClosedStar, false);
    assert.equal(gap.neverLicensedMarkersPresent, true);
    assert.equal(gap.closedDatesAligned, true);
    assert.equal((gap.downloadLicenseFirstDate ?? "").trim(), "");
    assert.equal(gap.liveLicenseFirstDate, null);
    assert.equal(gap.downloadClosedDate, gap.liveDateClosed);
  }

  const closedStars = fixture.observations.filter(
    o => o.closedInterpretation === "closed-star-formerly-licensed",
  );
  assert.ok(closedStars.length >= 5);
  for (const row of closedStars) {
    assert.equal(row.relation, "match");
    assert.equal(row.treatsAsClosedStar, true);
    assert.ok((row.downloadLicenseFirstDate ?? "").trim() !== "");
    assert.ok((row.liveLicenseFirstDate ?? "").trim() !== "");
  }

  const observed = fixture.observations.map(row =>
    observeCaliforniaPhase12StatusMapping(
      {
        facilityNumber: row.facilityNumber,
        file: "ARF",
        downloadStatus: row.downloadStatus,
        downloadType: "test",
        stratum: "application-withdrawn",
        label: row.facilityNumber,
      },
      {
        httpStatus: 200,
        attempts: 1,
        liveFacilityNumber: row.facilityNumber,
        liveStatus: row.liveStatus,
        liveFacilityType: null,
        liveDateClosed: row.liveDateClosed,
        liveLicenseFirstDate: row.liveLicenseFirstDate,
        liveLicenseEffectiveDate: row.liveLicenseFirstDate,
        downloadClosedDate: row.downloadClosedDate,
        downloadLicenseFirstDate: row.downloadLicenseFirstDate,
        found: row.liveStatus != null,
      },
    ),
  );
  // Rebuild only for gap IDs with correct found flag for invalid id
  const summary = summarizeCaliforniaPhase12StatusMapping(
    fixture.observations.map(row => ({
      facilityNumber: row.facilityNumber,
      file: "ARF" as const,
      downloadStatus: row.downloadStatus,
      downloadType: "test",
      stratum: "application-withdrawn" as const,
      label: row.facilityNumber,
      httpStatus: 200,
      attempts: 1,
      timedOut: false,
      liveFacilityNumber: row.liveStatus ? row.facilityNumber : null,
      liveStatus: row.liveStatus,
      liveFacilityType: null,
      liveDateClosed: row.liveDateClosed,
      liveLicenseFirstDate: row.liveLicenseFirstDate,
      liveLicenseEffectiveDate: row.liveLicenseFirstDate,
      downloadClosedDate: row.downloadClosedDate,
      downloadLicenseFirstDate: row.downloadLicenseFirstDate,
      found: row.liveStatus != null && row.facilityNumber !== "95354",
      identifierMatched: row.facilityNumber !== "95354" && row.liveStatus != null,
      closedDatesAligned: row.closedDatesAligned,
      neverLicensedMarkersPresent: row.neverLicensedMarkersPresent,
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
      treatsAsLicensed: false as const,
      treatsAsClosedStar: row.treatsAsClosedStar,
    })),
  );
  assert.equal(summary["documented-coarsening"], 5);
  assert.equal(summary.phase11GapIdsResolvedAsDocumentedCoarsening, 5);
  assert.equal(summary.inventedClosedStarEquivalence, false);
  assert.equal(summary.treatsWithdrawnAsLicensed, false);
  assert.equal(summary.sampleIsStatewideConclusion, false);
  assert.equal(observed.length, fixture.observations.length);
});

test("fixture disclosure sample reports exact denominators and stays non-statewide", () => {
  const fixture = loadJson<{
    sampleSize: number;
    summary: {
      working: number;
      missing: number;
      ambiguous: number;
      invalid: number;
      inconclusive: number;
      leadingZeroPreservedWorking: number;
    };
  }>("disclosure-link-sample.json");

  assert.equal(fixture.sampleSize, 40);
  assert.equal(
    fixture.summary.working
      + fixture.summary.missing
      + fixture.summary.ambiguous
      + fixture.summary.invalid
      + fixture.summary.inconclusive,
    40,
  );
  assert.ok(fixture.summary.working >= 30);
  assert.equal(fixture.summary.invalid, 1);
  assert.equal(fixture.summary.ambiguous, 1);
  assert.ok(fixture.summary.leadingZeroPreservedWorking >= 3);

  const summarized = summarizeCaliforniaPhase12DisclosureLinks([]);
  assert.equal(summarized.statewideCoverageClaimed, false);
  assert.equal(summarized.sampleIsStatewideConclusion, false);
  assert.equal(summarized.publication, "unpublished");
});

test("readiness gate stays blocked with baseline preserved", () => {
  const readiness = evaluateCaliforniaPhase12Readiness();
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.publicationReady, false);
  assert.equal(readiness.allowsPublication, false);
  assert.equal(californiaPhase12AllowsPublication(), false);
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
  assert.deepEqual(readiness, CALIFORNIA_PHASE12_READINESS_DECISION);
  assert.ok(
    CALIFORNIA_PHASE12_READINESS_ITEMS.some(
      item => item.id === "authoritative-iso-export-date" && item.status === "fail",
    ),
  );

  const accounting = assertCaliforniaPhase12ExclusiveAccounting(
    CALIFORNIA_PHASE12_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE12_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(accounting.holds, true);
  assert.equal(accounting.rowCount, 24377);

  const quality = evaluateCaliforniaPhase12Quality();
  assert.equal(quality.gate, "blocked");
  assert.equal(quality.allowsPublication, false);
  assert.equal(quality.authoritativeIsoExportDate, null);

  const readinessFixture = loadJson<{
    gate: string;
    publicationReady: boolean;
    baselinePreserved: { officialRecords: number };
  }>("readiness-report.json");
  assert.equal(readinessFixture.gate, "blocked");
  assert.equal(readinessFixture.publicationReady, false);
  assert.equal(readinessFixture.baselinePreserved.officialRecords, 24377);

  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
      || directoryContract("Oregon")?.publication === "development",
  );
});
