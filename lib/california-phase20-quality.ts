/**
 * California Phase 20 — quality / baseline preservation helpers.
 * Carries forward Phase 10–19 observed counts. Gate stays blocked.
 * Cumulative disclosure baseline enters at 707.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE20_QUALITY_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE20_EXCLUSIVE_BUCKETS = [
  "active-candidate",
  "restricted-candidate",
  "excluded",
  "exception-documented-exclude",
] as const;

export type CaliforniaPhase20ExclusiveBucket =
  (typeof CALIFORNIA_PHASE20_EXCLUSIVE_BUCKETS)[number];

export type CaliforniaPhase20BucketCounts = Record<
  CaliforniaPhase20ExclusiveBucket,
  number
>;

export type CaliforniaPhase20AccountingInvariant = {
  holds: boolean;
  rowCount: number;
  bucketSum: number;
  difference: number;
  buckets: CaliforniaPhase20BucketCounts;
  reason: string;
};

export function emptyPhase20BucketCounts(): CaliforniaPhase20BucketCounts {
  return {
    "active-candidate": 0,
    "restricted-candidate": 0,
    excluded: 0,
    "exception-documented-exclude": 0,
  };
}

export function assertCaliforniaPhase20ExclusiveAccounting(
  buckets: CaliforniaPhase20BucketCounts,
  rowCount: number,
): CaliforniaPhase20AccountingInvariant {
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

/** Phase 10–19 baseline — preserved unless a live revalidation reports drift. */
export const CALIFORNIA_PHASE20_OBSERVED_COUNTS = {
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
  disclosureCumulativeBaseline: 707,
  statewideLicensedMissingDate: 14,
  statusConflictFacilityNumbers: [
    "502701867",
    "019201167",
    "019201133",
  ] as const,
} as const;

export function evaluateCaliforniaPhase20Quality(input: {
  observedOn?: string;
  buckets?: CaliforniaPhase20BucketCounts;
  rowCount?: number;
  downloadSha256?: { rcfe: string; arf: string };
  unresolvedCoords?: number;
  verifiedCoords?: number;
  disclosure?: {
    sampleSize?: number;
    working?: number;
    missing?: number;
    ambiguous?: number;
    invalid?: number;
    inconclusive?: number;
    verifiedCount?: number;
    rosterDenominator?: number;
    coverageBaseline?: number;
    incrementalVerifiedCount?: number;
    cumulativeVerifiedCount?: number;
    statewideCoverageClaimed?: boolean;
  };
  status?: {
    sampleSize?: number;
    match?: number;
    documentedCoarsening?: number;
    conflict?: number;
    missing?: number;
    inconclusive?: number;
    invalidId?: number;
    regressionControlsResolved?: number;
  };
}) {
  const buckets = input.buckets ?? CALIFORNIA_PHASE20_OBSERVED_COUNTS.buckets;
  const rowCount = input.rowCount ?? CALIFORNIA_PHASE20_OBSERVED_COUNTS.rowCount;
  const accounting = assertCaliforniaPhase20ExclusiveAccounting(buckets, rowCount);
  const sha = input.downloadSha256 ?? CALIFORNIA_PHASE20_OBSERVED_COUNTS.downloadSha256;
  const shaMatches =
    sha.rcfe === CALIFORNIA_PHASE20_OBSERVED_COUNTS.downloadSha256.rcfe
    && sha.arf === CALIFORNIA_PHASE20_OBSERVED_COUNTS.downloadSha256.arf;

  const coverageBaseline = input.disclosure?.coverageBaseline ?? 707;
  const incremental = input.disclosure?.incrementalVerifiedCount ?? 0;
  const cumulative = input.disclosure?.cumulativeVerifiedCount
    ?? (coverageBaseline + incremental);
  const roster = input.disclosure?.rosterDenominator ?? 15451;

  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE20_QUALITY_OBSERVED_ON,
    accounting,
    downloadSha256MatchesBaseline: shaMatches,
    downloadSha256: sha,
    coordinates: {
      verifiedOfficialCoords:
        input.verifiedCoords ?? CALIFORNIA_PHASE20_OBSERVED_COUNTS.coordinates.verifiedOfficialCoords,
      unresolved:
        input.unresolvedCoords ?? CALIFORNIA_PHASE20_OBSERVED_COUNTS.coordinates.unresolved,
      fabricatedCoordinates: 0,
    },
    disclosure: input.disclosure ?? null,
    status: input.status ?? null,
    verifiedCoverage: {
      coverageBaseline,
      incrementalVerifiedCount: incremental,
      cumulativeVerifiedCount: cumulative,
      rosterDenominator: roster,
      statewideCoverageClaimed: input.disclosure?.statewideCoverageClaimed === true,
    },
    allowsPublication: false as const,
    gate: "blocked" as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    baselinePreserved: accounting.holds && shaMatches,
  };
}
