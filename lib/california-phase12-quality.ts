/**
 * California Phase 12 — quality / baseline preservation helpers.
 * Carries forward Phase 10/11 observed counts. Gate stays blocked.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE12_QUALITY_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE12_EXCLUSIVE_BUCKETS = [
  "active-candidate",
  "restricted-candidate",
  "excluded",
  "exception-documented-exclude",
] as const;

export type CaliforniaPhase12ExclusiveBucket =
  (typeof CALIFORNIA_PHASE12_EXCLUSIVE_BUCKETS)[number];

export type CaliforniaPhase12BucketCounts = Record<
  CaliforniaPhase12ExclusiveBucket,
  number
>;

export type CaliforniaPhase12AccountingInvariant = {
  holds: boolean;
  rowCount: number;
  bucketSum: number;
  difference: number;
  buckets: CaliforniaPhase12BucketCounts;
  reason: string;
};

export function emptyPhase12BucketCounts(): CaliforniaPhase12BucketCounts {
  return {
    "active-candidate": 0,
    "restricted-candidate": 0,
    excluded: 0,
    "exception-documented-exclude": 0,
  };
}

export function assertCaliforniaPhase12ExclusiveAccounting(
  buckets: CaliforniaPhase12BucketCounts,
  rowCount: number,
): CaliforniaPhase12AccountingInvariant {
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

/** Phase 10/11/12 baseline — preserved unless a live revalidation reports drift. */
export const CALIFORNIA_PHASE12_OBSERVED_COUNTS = {
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
  /**
   * Download-only CLOSED License First Date split (2026-11-20). Consistent
   * with withdrawn coarsening but not FacilityDetail-verified statewide.
   */
  downloadClosedBucket: {
    total: 6109,
    emptyLicenseFirstDate: 1241,
    withLicenseFirstDate: 4868,
  },
} as const;

export type CaliforniaPhase12DisclosureSampleCounts = {
  sampleSize: number;
  working: number;
  missing: number;
  ambiguous: number;
  invalid: number;
  inconclusive: number;
};

export type CaliforniaPhase12StatusSampleCounts = {
  sampleSize: number;
  match: number;
  documentedCoarsening: number;
  conflict: number;
  missing: number;
  inconclusive: number;
  invalidId: number;
};

export function evaluateCaliforniaPhase12Quality(input: {
  observedOn?: string;
  buckets?: CaliforniaPhase12BucketCounts;
  rowCount?: number;
  disclosure?: CaliforniaPhase12DisclosureSampleCounts;
  status?: CaliforniaPhase12StatusSampleCounts;
  downloadSha256?: { rcfe: string; arf: string };
} = {}) {
  const buckets = input.buckets ?? CALIFORNIA_PHASE12_OBSERVED_COUNTS.buckets;
  const rowCount = input.rowCount ?? CALIFORNIA_PHASE12_OBSERVED_COUNTS.rowCount;
  const invariant = assertCaliforniaPhase12ExclusiveAccounting(buckets, rowCount);
  const downloadSha256 = input.downloadSha256
    ?? CALIFORNIA_PHASE12_OBSERVED_COUNTS.downloadSha256;
  const shaMatches =
    downloadSha256.rcfe === CALIFORNIA_PHASE12_OBSERVED_COUNTS.downloadSha256.rcfe
    && downloadSha256.arf === CALIFORNIA_PHASE12_OBSERVED_COUNTS.downloadSha256.arf;

  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE12_QUALITY_OBSERVED_ON,
    accounting: invariant,
    baseline: CALIFORNIA_PHASE12_OBSERVED_COUNTS,
    downloadSha256MatchesBaseline: shaMatches,
    disclosureSample: input.disclosure ?? null,
    statusSample: input.status ?? null,
    authoritativeIsoExportDate: null,
    freshnessRequirementSatisfied: false,
    sampleIsStatewideConclusion: false,
    publication: "unpublished" as const,
    ownerClaimEligible: false,
    allowsPublication: false,
    gate: "blocked" as const,
    cdssClarification: "sent-awaiting-response" as const,
  };
}
