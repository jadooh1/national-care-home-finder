/**
 * California Phase 18 — quality / baseline preservation helpers.
 * Carries forward Phase 10–17 observed counts. Gate stays blocked.
 * Cumulative disclosure baseline remains Phase 16's 462 (no new crawl).
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE18_QUALITY_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE18_EXCLUSIVE_BUCKETS = [
  "active-candidate",
  "restricted-candidate",
  "excluded",
  "exception-documented-exclude",
] as const;

export type CaliforniaPhase18ExclusiveBucket =
  (typeof CALIFORNIA_PHASE18_EXCLUSIVE_BUCKETS)[number];

export type CaliforniaPhase18BucketCounts = Record<
  CaliforniaPhase18ExclusiveBucket,
  number
>;

export type CaliforniaPhase18AccountingInvariant = {
  holds: boolean;
  rowCount: number;
  bucketSum: number;
  difference: number;
  buckets: CaliforniaPhase18BucketCounts;
  reason: string;
};

export function emptyPhase18BucketCounts(): CaliforniaPhase18BucketCounts {
  return {
    "active-candidate": 0,
    "restricted-candidate": 0,
    excluded: 0,
    "exception-documented-exclude": 0,
  };
}

export function assertCaliforniaPhase18ExclusiveAccounting(
  buckets: CaliforniaPhase18BucketCounts,
  rowCount: number,
): CaliforniaPhase18AccountingInvariant {
  const bucketSum =
    buckets["active-candidate"]
    + buckets["restricted-candidate"]
    + buckets.excluded
    + buckets["exception-documented-exclude"];
  const difference = rowCount - bucketSum;
  const holds = difference === 0
    && rowCount >= 0
    && Object.values(buckets).every(n => Number.isInteger(n) && n >= 0);
  return {
    holds,
    rowCount,
    bucketSum,
    difference,
    buckets: { ...buckets },
    reason: holds
      ? "Every input row belongs to exactly one exclusive classification bucket."
      : `Exclusive-bucket sum ${bucketSum} does not equal rowCount ${rowCount} (difference ${difference}).`,
  };
}

/** Phase 10–17 baseline — preserved; Phase 18 adds no new crawl evidence. */
export const CALIFORNIA_PHASE18_OBSERVED_COUNTS = {
  rcfeRows: 13337,
  arfRows: 11040,
  rowCount: 24377,
  buckets: {
    "active-candidate": 15413,
    "restricted-candidate": 38,
    excluded: 8921,
    "exception-documented-exclude": 5,
  },
  publicationCandidatesIfGateOpened: 15451,
  exceptionDocumentedExcludeIds: [
    "374604731",
    "198601400",
    "306006749",
    "306006799",
    "95354",
  ] as const,
  downloadSha256: {
    rcfe: "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
    arf: "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
  },
  authoritativeIsoExportDate: null,
  filenameIsoCandidate: "2026-11-15",
  officialWeeklyCadence: "The data is updated weekly.",
  coordinates: {
    candidateCount: 15451,
    verifiedOfficialCoords: 15423,
    unresolved: 28,
    fabricatedCoordinates: 0,
  },
  missingCapacity: {
    totalMissing: 21,
    publicationCandidateMissing: 0,
  },
  downloadClosedBucket: {
    total: 6109,
    emptyLicenseFirstDate: 1241,
    withLicenseFirstDate: 4868,
  },
  disclosureCumulative: 462,
  sampledExceptions: 21,
  statewideLicensedMissingDate: 14,
  statusConflictFacilityNumber: "502701867",
} as const;

export function evaluateCaliforniaPhase18Quality(input: {
  observedOn?: string;
  buckets?: CaliforniaPhase18BucketCounts;
  rowCount?: number;
  downloadSha256?: { rcfe: string; arf: string };
  unresolvedCoords?: number;
  verifiedCoords?: number;
  disclosureCumulative?: number;
} = {}) {
  const buckets = input.buckets ?? CALIFORNIA_PHASE18_OBSERVED_COUNTS.buckets;
  const rowCount = input.rowCount ?? CALIFORNIA_PHASE18_OBSERVED_COUNTS.rowCount;
  const invariant = assertCaliforniaPhase18ExclusiveAccounting(buckets, rowCount);
  const downloadSha256 = input.downloadSha256
    ?? CALIFORNIA_PHASE18_OBSERVED_COUNTS.downloadSha256;
  const shaMatches =
    downloadSha256.rcfe === CALIFORNIA_PHASE18_OBSERVED_COUNTS.downloadSha256.rcfe
    && downloadSha256.arf === CALIFORNIA_PHASE18_OBSERVED_COUNTS.downloadSha256.arf;

  const cumulative = input.disclosureCumulative
    ?? CALIFORNIA_PHASE18_OBSERVED_COUNTS.disclosureCumulative;
  const rosterDenominator =
    CALIFORNIA_PHASE18_OBSERVED_COUNTS.publicationCandidatesIfGateOpened;
  const unresolvedCoords = input.unresolvedCoords
    ?? CALIFORNIA_PHASE18_OBSERVED_COUNTS.coordinates.unresolved;
  const verifiedCoords = input.verifiedCoords
    ?? CALIFORNIA_PHASE18_OBSERVED_COUNTS.coordinates.verifiedOfficialCoords;

  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE18_QUALITY_OBSERVED_ON,
    accounting: invariant,
    baseline: CALIFORNIA_PHASE18_OBSERVED_COUNTS,
    downloadSha256MatchesBaseline: shaMatches,
    verifiedCoverage: {
      cumulativeVerifiedCount: cumulative,
      rosterDenominator,
      coverageFraction: rosterDenominator > 0 ? cumulative / rosterDenominator : 0,
      statewideCoverageClaimed: false as const,
    },
    coordinates: {
      verifiedOfficialCoords: verifiedCoords,
      unresolved: unresolvedCoords,
      fabricatedCoordinates: 0 as const,
      baselineUnresolved: 28 as const,
    },
    statusConflict: {
      facilityNumber: "502701867",
      eligibility: "unknown-ineligible" as const,
      publicationEligible: false as const,
      ownerClaimEligible: false as const,
    },
    authoritativeIsoExportDate: null,
    freshnessRequirementSatisfied: false,
    sampleIsStatewideConclusion: false,
    crawlStarted: false as const,
    exclusionPolicyActivated: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false,
    allowsPublication: false,
    gate: "blocked" as const,
    cdssClarification: "sent-awaiting-response" as const,
  };
}
