import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { californiaDirectoryReady } from "../../../lib/california-directory.ts";
import {
  CALIFORNIA_PHASE11_DISCLOSURE_URL_PATTERNS,
  CALIFORNIA_PHASE11_FACILITY_DETAIL_API,
  CALIFORNIA_PHASE11_FACILITY_DETAIL_PAGE_PREFIX,
  classifyCaliforniaPhase11DisclosureLink,
  generateCaliforniaPhase11DisclosureLinks,
  isCaliforniaPhase11CanonicalDisclosureUrl,
  summarizeCaliforniaPhase11DisclosureLinks,
} from "../../../lib/california-phase11-disclosure-links.ts";
import {
  CALIFORNIA_PHASE11_DISCLOSURE_LINK_SAMPLE,
  CALIFORNIA_PHASE11_STATUS_SAMPLE,
} from "../../../lib/california-phase11-sample.ts";
import {
  CALIFORNIA_PHASE11_OBSERVED_COUNTS,
  assertCaliforniaPhase11ExclusiveAccounting,
  evaluateCaliforniaPhase11Quality,
} from "../../../lib/california-phase11-quality.ts";
import {
  CALIFORNIA_PHASE11_READINESS_DECISION,
  CALIFORNIA_PHASE11_READINESS_ITEMS,
  californiaPhase11AllowsPublication,
  evaluateCaliforniaPhase11Readiness,
} from "../../../lib/california-phase11-readiness.ts";
import {
  observeCaliforniaPhase11Status,
  relateCaliforniaPhase11DownloadToFacilityDetail,
  summarizeCaliforniaPhase11StatusVerification,
} from "../../../lib/california-phase11-status-verification.ts";
import { directoryContract } from "../../../lib/state-directory.ts";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/california-phase11-disclosure-status",
);

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8")) as T;
}

test("link generator preserves leading zeros and refuses invalid IDs", () => {
  const leading = generateCaliforniaPhase11DisclosureLinks("011400493");
  assert.equal(leading.validIdentifier, true);
  assert.equal(
    leading.pageUrl,
    `${CALIFORNIA_PHASE11_FACILITY_DETAIL_PAGE_PREFIX}011400493`,
  );
  assert.equal(
    leading.apiUrl,
    `${CALIFORNIA_PHASE11_FACILITY_DETAIL_API}011400493`,
  );
  assert.equal(leading.preservesLeadingZeros, true);
  assert.ok(leading.pageUrl?.includes("011400493"));
  assert.ok(!leading.pageUrl?.includes("FacDetail/11400493"));

  const invalid = generateCaliforniaPhase11DisclosureLinks("95354");
  assert.equal(invalid.validIdentifier, false);
  assert.equal(invalid.pageUrl, null);
  assert.equal(invalid.apiUrl, null);
  assert.equal(invalid.rejectionReason, "facility-number-not-8-or-9-digits");

  assert.equal(
    isCaliforniaPhase11CanonicalDisclosureUrl(
      "100403816",
      `${CALIFORNIA_PHASE11_FACILITY_DETAIL_PAGE_PREFIX}100403816`,
    ),
    true,
  );
  assert.equal(
    isCaliforniaPhase11CanonicalDisclosureUrl(
      "100403816",
      "https://www.ccld.dss.ca.gov/carefacilitysearch/",
    ),
    false,
  );
  assert.ok(CALIFORNIA_PHASE11_DISCLOSURE_URL_PATTERNS.some(p => p.canonicalForPublication));
});

test("disclosure-link classification covers working/missing/ambiguous/invalid", () => {
  const working = classifyCaliforniaPhase11DisclosureLink({
    facilityNumber: "100403816",
    apiHttpStatus: 200,
    liveFacilityNumber: "100403816",
    apiFound: true,
    pageHttpStatus: 200,
  });
  assert.equal(working.classification, "working");

  const missing = classifyCaliforniaPhase11DisclosureLink({
    facilityNumber: "999999999",
    apiHttpStatus: 200,
    liveFacilityNumber: null,
    apiFound: false,
    pageHttpStatus: 200,
  });
  assert.equal(missing.classification, "missing");

  const ambiguous = classifyCaliforniaPhase11DisclosureLink({
    facilityNumber: "15601219",
    apiHttpStatus: 200,
    liveFacilityNumber: "015601219",
    apiFound: true,
    pageHttpStatus: 200,
  });
  assert.equal(ambiguous.classification, "ambiguous");
  assert.equal(ambiguous.identifierRelation, "leading-zero-canonicalization");

  const invalid = classifyCaliforniaPhase11DisclosureLink({
    facilityNumber: "95354",
    apiHttpStatus: 200,
    liveFacilityNumber: null,
    apiFound: false,
  });
  assert.equal(invalid.classification, "invalid");

  const summary = summarizeCaliforniaPhase11DisclosureLinks([
    working,
    missing,
    ambiguous,
    invalid,
  ]);
  assert.equal(summary.sampleSize, 4);
  assert.equal(summary.working, 1);
  assert.equal(summary.missing, 1);
  assert.equal(summary.ambiguous, 1);
  assert.equal(summary.invalid, 1);
  assert.equal(summary.statewideCoverageClaimed, false);
  assert.equal(summary.sampleIsStatewideConclusion, false);
  assert.equal(summary.publication, "unpublished");
});

test("observed disclosure fixture denominators match live sample (20)", () => {
  const observed = loadJson<{
    disclosureLinks: {
      sampleSize: number;
      working: number;
      missing: number;
      ambiguous: number;
      invalid: number;
      leadingZeroPreservedWorking: number;
      statewideCoverageClaimed: boolean;
    };
  }>("observed-live-counts.json");
  const disclosure = loadJson<{
    sampleSize: number;
    summary: {
      working: number;
      missing: number;
      ambiguous: number;
      invalid: number;
    };
  }>("disclosure-link-sample.json");

  assert.equal(observed.disclosureLinks.sampleSize, 20);
  assert.equal(observed.disclosureLinks.working, 18);
  assert.equal(observed.disclosureLinks.missing, 0);
  assert.equal(observed.disclosureLinks.ambiguous, 1);
  assert.equal(observed.disclosureLinks.invalid, 1);
  assert.equal(observed.disclosureLinks.leadingZeroPreservedWorking, 4);
  assert.equal(observed.disclosureLinks.statewideCoverageClaimed, false);
  assert.equal(disclosure.sampleSize, 20);
  assert.equal(
    disclosure.summary.working
      + disclosure.summary.missing
      + disclosure.summary.ambiguous
      + disclosure.summary.invalid,
    20,
  );
  assert.equal(CALIFORNIA_PHASE11_DISCLOSURE_LINK_SAMPLE.length, 20);
});

test("status relation treats Application Withdrawn as CLOSED mapping-gap", () => {
  assert.equal(
    relateCaliforniaPhase11DownloadToFacilityDetail("LICENSED", "Licensed"),
    "match",
  );
  assert.equal(
    relateCaliforniaPhase11DownloadToFacilityDetail(
      "ON PROBATION",
      "Probationary License",
    ),
    "match",
  );
  assert.equal(
    relateCaliforniaPhase11DownloadToFacilityDetail(
      "CLOSED",
      "Closed, Licensee Initiated",
    ),
    "match",
  );
  assert.equal(
    relateCaliforniaPhase11DownloadToFacilityDetail(
      "CLOSED",
      "Application Withdrawn",
    ),
    "mapping-gap",
  );
  assert.equal(
    relateCaliforniaPhase11DownloadToFacilityDetail("PENDING", "Pending"),
    "match",
  );
  assert.equal(
    relateCaliforniaPhase11DownloadToFacilityDetail("PENDING", null, {
      downloadFacilityNumber: "95354",
    }),
    "invalid-id",
  );
});

test("observed status fixture denominators match live sample (22)", () => {
  const observed = loadJson<{
    licensingStatus: {
      sampleSize: number;
      match: number;
      mappingGap: number;
      conflict: number;
      missing: number;
      inconclusive: number;
      invalidId: number;
      applicationWithdrawnGaps: number;
      sampleIsStatewideConclusion: boolean;
      inferredFromHistorical: boolean;
    };
  }>("observed-live-counts.json");
  const status = loadJson<{
    sampleSize: number;
    summary: {
      match: number;
      mappingGap: number;
      conflict: number;
      missing: number;
      inconclusive: number;
      invalidId: number;
    };
    observations: Array<{ relation: string; stratum: string }>;
  }>("status-verification-sample.json");

  assert.equal(observed.licensingStatus.sampleSize, 22);
  assert.equal(observed.licensingStatus.match, 16);
  assert.equal(observed.licensingStatus.mappingGap, 5);
  assert.equal(observed.licensingStatus.conflict, 0);
  assert.equal(observed.licensingStatus.missing, 0);
  assert.equal(observed.licensingStatus.inconclusive, 0);
  assert.equal(observed.licensingStatus.invalidId, 1);
  assert.equal(observed.licensingStatus.applicationWithdrawnGaps, 5);
  assert.equal(observed.licensingStatus.sampleIsStatewideConclusion, false);
  assert.equal(observed.licensingStatus.inferredFromHistorical, false);
  assert.equal(status.sampleSize, 22);
  assert.equal(
    status.summary.match
      + status.summary.mappingGap
      + status.summary.conflict
      + status.summary.missing
      + status.summary.inconclusive
      + status.summary.invalidId,
    22,
  );
  assert.equal(CALIFORNIA_PHASE11_STATUS_SAMPLE.length, 22);
  assert.ok(status.observations.some(o => o.stratum === "active-licensed"));
  assert.ok(status.observations.some(o => o.stratum === "probationary"));
  assert.ok(status.observations.some(o => o.stratum === "closed"));
  assert.ok(status.observations.some(o => o.stratum === "withdrawn"));
  assert.ok(status.observations.some(o => o.stratum === "pending"));
  assert.ok(status.observations.some(o => o.stratum === "exceptional"));
});

test("status summarize never marks sample as statewide or historically inferred", () => {
  const row = observeCaliforniaPhase11Status(
    {
      facilityNumber: "100403816",
      file: "ARF",
      downloadStatus: "LICENSED",
      downloadType: "ADULT RESIDENTIAL",
      stratum: "active-licensed",
      label: "control",
    },
    {
      httpStatus: 200,
      attempts: 1,
      liveFacilityNumber: "100403816",
      liveStatus: "Licensed",
      liveFacilityType: "ADULT RESIDENTIAL",
      found: true,
    },
  );
  assert.equal(row.relation, "match");
  const summary = summarizeCaliforniaPhase11StatusVerification([row]);
  assert.equal(summary.sampleIsStatewideConclusion, false);
  assert.equal(summary.inferredFromHistorical, false);
  assert.equal(summary.publication, "unpublished");
  assert.equal(summary.ownerClaimEligible, false);
});

test("baseline 24377 accounting preserved; gate blocked; WA/OR unchanged", () => {
  const observed = loadJson<{
    accounting: {
      rowCount: number;
      buckets: Record<string, number>;
      invariantHolds: boolean;
      activeRestrictedCandidates: number;
    };
    missingCapacity: { totalMissing: number; publicationCandidateMissing: number };
    coordinates: {
      verifiedOfficialCoords: number;
      unresolved: number;
      fabricatedCoordinates: number;
    };
    download: { authoritativeIsoExportDate: null; sha256MatchesPhase10Baseline: boolean };
    gate: { allowsPublication: boolean; publication: string; gate: string };
    cdssClarification: { status: string; duplicateInquiryAllowed: boolean };
  }>("observed-live-counts.json");

  assert.equal(observed.accounting.rowCount, 24377);
  assert.equal(observed.accounting.invariantHolds, true);
  assert.equal(observed.accounting.activeRestrictedCandidates, 15451);
  assert.equal(observed.accounting.buckets["active-candidate"], 15413);
  assert.equal(observed.accounting.buckets["restricted-candidate"], 38);
  assert.equal(observed.missingCapacity.totalMissing, 21);
  assert.equal(observed.coordinates.verifiedOfficialCoords, 15423);
  assert.equal(observed.coordinates.unresolved, 28);
  assert.equal(observed.download.authoritativeIsoExportDate, null);
  assert.equal(observed.download.sha256MatchesPhase10Baseline, true);
  assert.equal(observed.gate.allowsPublication, false);
  assert.equal(observed.gate.gate, "blocked");
  assert.equal(observed.cdssClarification.status, "sent-awaiting-response");
  assert.equal(observed.cdssClarification.duplicateInquiryAllowed, false);

  const invariant = assertCaliforniaPhase11ExclusiveAccounting(
    CALIFORNIA_PHASE11_OBSERVED_COUNTS.buckets,
    CALIFORNIA_PHASE11_OBSERVED_COUNTS.rowCount,
  );
  assert.equal(invariant.holds, true);

  const readiness = evaluateCaliforniaPhase11Readiness();
  assert.equal(readiness.publicationReady, false);
  assert.equal(readiness.gate, "blocked");
  assert.equal(readiness.allowsPublication, false);
  assert.equal(californiaPhase11AllowsPublication(), false);
  assert.equal(readiness.cdssClarification.status, "sent-awaiting-response");
  assert.ok(readiness.launchBlockingFailures.includes("authoritative-iso-export-date"));
  assert.ok(readiness.launchBlockingFailures.includes("official-disclosure-links"));
  assert.ok(readiness.launchBlockingFailures.includes("licensing-status-eligibility-rules"));
  assert.ok(
    CALIFORNIA_PHASE11_READINESS_ITEMS.some(
      item =>
        item.id === "publication-and-owner-claim-safeguards"
        && item.status === "pass",
    ),
  );
  assert.equal(CALIFORNIA_PHASE11_READINESS_DECISION.baselinePreserved.officialRecords, 24377);

  const quality = evaluateCaliforniaPhase11Quality({
    disclosure: {
      sampleSize: 20,
      working: 18,
      missing: 0,
      ambiguous: 1,
      invalid: 1,
    },
    status: {
      sampleSize: 22,
      match: 16,
      mappingGap: 5,
      conflict: 0,
      missing: 0,
      inconclusive: 0,
      invalidId: 1,
    },
  });
  assert.equal(quality.gate, "blocked");
  assert.equal(quality.allowsPublication, false);

  assert.equal(californiaDirectoryReady(), false);
  assert.equal(directoryContract("California")?.publication, "unpublished");
  assert.equal(directoryContract("Washington")?.publication, "public");
  assert.ok(
    directoryContract("Oregon")?.publication === "public"
    || directoryContract("Oregon")?.publication === "development",
  );

  const fixture = loadJson<typeof CALIFORNIA_PHASE11_READINESS_DECISION>(
    "readiness-report.json",
  );
  assert.equal(fixture.publicationReady, false);
  assert.equal(fixture.gate, "blocked");
});
