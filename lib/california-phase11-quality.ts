/**
 * California Phase 11 — quality / baseline preservation helpers.
 * Carries forward Phase 10 observed counts. Gate stays blocked.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE11_QUALITY_OBSERVED_ON = "2026-11-19";

export const CALIFORNIA_PHASE11_EXCLUSIVE_BUCKETS = [
  "active-candidate",
  "restricted-candidate",
  "excluded",
  "exception-documented-exclude",
] as const;

export type CaliforniaPhase11ExclusiveBucket =
  (typeof CALIFORNIA_PHASE11_EXCLUSIVE_BUCKETS)[number];

export type CaliforniaPhase11BucketCounts = Record<
  CaliforniaPhase11ExclusiveBucket,
  number
>;

export type CaliforniaPhase11AccountingInvariant = {
  holds: boolean;
  rowCount: number;
  bucketSum: number;
  difference: number;
  buckets: CaliforniaPhase11BucketCounts;
  reason: string;
};

export function emptyPhase11BucketCounts(): CaliforniaPhase11BucketCounts {
  return {
    "active-candidate": 0,
    "restricted-candidate": 0,
    excluded: 0,
    "exception-documented-exclude": 0,
  };
}

export function assertCaliforniaPhase11ExclusiveAccounting(
  buckets: CaliforniaPhase11BucketCounts,
  rowCount: number,
): CaliforniaPhase11AccountingInvariant {
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

/** Phase 10/11 baseline — preserved unless a live revalidation reports drift. */
export const CALIFORNIA_PHASE11_OBSERVED_COUNTS = {
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
} as const;

export type CaliforniaPhase11DisclosureSampleCounts = {
  sampleSize: number;
  working: number;
  missing: number;
  ambiguous: number;
  invalid: number;
};

export type CaliforniaPhase11StatusSampleCounts = {
  sampleSize: number;
  match: number;
  mappingGap: number;
  conflict: number;
  missing: number;
  inconclusive: number;
  invalidId: number;
};

export function evaluateCaliforniaPhase11Quality(input: {
  observedOn?: string;
  buckets?: CaliforniaPhase11BucketCounts;
  rowCount?: number;
  disclosure?: CaliforniaPhase11DisclosureSampleCounts;
  status?: CaliforniaPhase11StatusSampleCounts;
  downloadSha256?: { rcfe: string; arf: string };
} = {}) {
  const buckets = input.buckets ?? CALIFORNIA_PHASE11_OBSERVED_COUNTS.buckets;
  const rowCount = input.rowCount ?? CALIFORNIA_PHASE11_OBSERVED_COUNTS.rowCount;
  const invariant = assertCaliforniaPhase11ExclusiveAccounting(buckets, rowCount);
  const downloadSha256 = input.downloadSha256
    ?? CALIFORNIA_PHASE11_OBSERVED_COUNTS.downloadSha256;
  const shaMatches =
    downloadSha256.rcfe === CALIFORNIA_PHASE11_OBSERVED_COUNTS.downloadSha256.rcfe
    && downloadSha256.arf === CALIFORNIA_PHASE11_OBSERVED_COUNTS.downloadSha256.arf;

  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE11_QUALITY_OBSERVED_ON,
    accounting: invariant,
    baseline: CALIFORNIA_PHASE11_OBSERVED_COUNTS,
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
