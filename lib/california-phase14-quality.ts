/**
 * California Phase 14 — quality / baseline preservation helpers.
 * Carries forward Phase 10–13 observed counts. Gate stays blocked.
 * Coordinate unresolved count may decrease only when Phase 14 adopts
 * authoritative official coords (never fabricated).
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE14_QUALITY_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE14_EXCLUSIVE_BUCKETS = [
  "active-candidate",
  "restricted-candidate",
  "excluded",
  "exception-documented-exclude",
] as const;

export type CaliforniaPhase14ExclusiveBucket =
  (typeof CALIFORNIA_PHASE14_EXCLUSIVE_BUCKETS)[number];

export type CaliforniaPhase14BucketCounts = Record<
  CaliforniaPhase14ExclusiveBucket,
  number
>;

export type CaliforniaPhase14AccountingInvariant = {
  holds: boolean;
  rowCount: number;
  bucketSum: number;
  difference: number;
  buckets: CaliforniaPhase14BucketCounts;
  reason: string;
};

export function emptyPhase14BucketCounts(): CaliforniaPhase14BucketCounts {
  return {
    "active-candidate": 0,
    "restricted-candidate": 0,
    excluded: 0,
    "exception-documented-exclude": 0,
  };
}

export function assertCaliforniaPhase14ExclusiveAccounting(
  buckets: CaliforniaPhase14BucketCounts,
  rowCount: number,
): CaliforniaPhase14AccountingInvariant {
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

/** Phase 10–14 baseline — preserved unless a live revalidation reports drift. */
export const CALIFORNIA_PHASE14_OBSERVED_COUNTS = {
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
  phase13DisclosureBaseline: 116,
} as const;

export type CaliforniaPhase14DisclosureSampleCounts = {
  sampleSize: number;
  working: number;
  missing: number;
  ambiguous: number;
  invalid: number;
  inconclusive: number;
  verifiedCount?: number;
  rosterDenominator?: number;
  phase13BaselineVerifiedCount?: number;
  incrementalVerifiedCount?: number;
  cumulativeVerifiedCount?: number;
};

export type CaliforniaPhase14StatusSampleCounts = {
  sampleSize: number;
  match: number;
  documentedCoarsening: number;
  conflict: number;
  missing: number;
  inconclusive: number;
  invalidId: number;
  regressionControlsResolved?: number;
};

export function evaluateCaliforniaPhase14Quality(input: {
  observedOn?: string;
  buckets?: CaliforniaPhase14BucketCounts;
  rowCount?: number;
  disclosure?: CaliforniaPhase14DisclosureSampleCounts;
  status?: CaliforniaPhase14StatusSampleCounts;
  downloadSha256?: { rcfe: string; arf: string };
  unresolvedCoords?: number;
  verifiedCoords?: number;
} = {}) {
  const buckets = input.buckets ?? CALIFORNIA_PHASE14_OBSERVED_COUNTS.buckets;
  const rowCount = input.rowCount ?? CALIFORNIA_PHASE14_OBSERVED_COUNTS.rowCount;
  const invariant = assertCaliforniaPhase14ExclusiveAccounting(buckets, rowCount);
  const downloadSha256 = input.downloadSha256
    ?? CALIFORNIA_PHASE14_OBSERVED_COUNTS.downloadSha256;
  const shaMatches =
    downloadSha256.rcfe === CALIFORNIA_PHASE14_OBSERVED_COUNTS.downloadSha256.rcfe
    && downloadSha256.arf === CALIFORNIA_PHASE14_OBSERVED_COUNTS.downloadSha256.arf;

  const phase13Baseline = input.disclosure?.phase13BaselineVerifiedCount
    ?? CALIFORNIA_PHASE14_OBSERVED_COUNTS.phase13DisclosureBaseline;
  const incremental = input.disclosure?.incrementalVerifiedCount
    ?? input.disclosure?.sampleSize
    ?? 0;
  const cumulative = input.disclosure?.cumulativeVerifiedCount
    ?? (phase13Baseline + incremental);
  const rosterDenominator = input.disclosure?.rosterDenominator
    ?? CALIFORNIA_PHASE14_OBSERVED_COUNTS.publicationCandidatesIfGateOpened;

  const unresolvedCoords = input.unresolvedCoords
    ?? CALIFORNIA_PHASE14_OBSERVED_COUNTS.coordinates.unresolved;
  const verifiedCoords = input.verifiedCoords
    ?? CALIFORNIA_PHASE14_OBSERVED_COUNTS.coordinates.verifiedOfficialCoords;

  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE14_QUALITY_OBSERVED_ON,
    accounting: invariant,
    baseline: CALIFORNIA_PHASE14_OBSERVED_COUNTS,
    downloadSha256MatchesBaseline: shaMatches,
    disclosureSample: input.disclosure ?? null,
    statusSample: input.status ?? null,
    verifiedCoverage: {
      phase13BaselineVerifiedCount: phase13Baseline,
      incrementalVerifiedCount: incremental,
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
