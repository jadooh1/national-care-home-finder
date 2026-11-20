/**
 * California Phase 21 — quality / baseline preservation helpers.
 * Gate stays blocked. Exclusion offline-only.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE21_QUALITY_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE21_EXCLUSIVE_BUCKETS = [
  "active-candidate",
  "restricted-candidate",
  "excluded",
  "exception-documented-exclude",
] as const;

export type CaliforniaPhase21ExclusiveBucket =
  (typeof CALIFORNIA_PHASE21_EXCLUSIVE_BUCKETS)[number];

export type CaliforniaPhase21BucketCounts = Record<
  CaliforniaPhase21ExclusiveBucket,
  number
>;

export function assertCaliforniaPhase21ExclusiveAccounting(
  buckets: CaliforniaPhase21BucketCounts,
  rowCount: number,
) {
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
      : `Exclusive-bucket sum ${bucketSum} does not equal rowCount ${rowCount}.`,
  };
}

export const CALIFORNIA_PHASE21_OBSERVED_COUNTS = {
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
  downloadSha256: {
    rcfe: "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
    arf: "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
  },
  authoritativeIsoExportDate: null,
  coordinates: {
    verifiedOfficialCoords: 15423,
    unresolved: 28,
    fabricatedCoordinates: 0,
  },
  disclosureCumulative: 15451,
  phase20Conflicts: 71,
  phase20Inconclusive: 2,
  statewideLicensedMissingDate: 14,
} as const;

export function evaluateCaliforniaPhase21Quality(input: {
  observedOn?: string;
  downloadSha256?: { rcfe: string; arf: string };
  discrepancySummary?: Record<string, number>;
  inconclusiveResolved?: number;
  inconclusiveStillOpen?: number;
} = {}) {
  const buckets = CALIFORNIA_PHASE21_OBSERVED_COUNTS.buckets;
  const invariant = assertCaliforniaPhase21ExclusiveAccounting(
    buckets,
    CALIFORNIA_PHASE21_OBSERVED_COUNTS.rowCount,
  );
  const downloadSha256 = input.downloadSha256
    ?? CALIFORNIA_PHASE21_OBSERVED_COUNTS.downloadSha256;
  const shaMatches =
    downloadSha256.rcfe === CALIFORNIA_PHASE21_OBSERVED_COUNTS.downloadSha256.rcfe
    && downloadSha256.arf === CALIFORNIA_PHASE21_OBSERVED_COUNTS.downloadSha256.arf;

  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE21_QUALITY_OBSERVED_ON,
    accounting: invariant,
    baseline: CALIFORNIA_PHASE21_OBSERVED_COUNTS,
    downloadSha256MatchesBaseline: shaMatches,
    discrepancySummary: input.discrepancySummary ?? null,
    inconclusiveResolved: input.inconclusiveResolved ?? 0,
    inconclusiveStillOpen: input.inconclusiveStillOpen ?? 2,
    verifiedCoverage: {
      cumulativeVerifiedCount: 15451,
      rosterDenominator: 15451,
      statewideRosterVerificationComplete: true as const,
      statewideCoverageClaimed: true as const,
    },
    coordinates: CALIFORNIA_PHASE21_OBSERVED_COUNTS.coordinates,
    authoritativeIsoExportDate: null,
    exclusionPolicyActivatedInAppOrDb: false as const,
    exclusionOfflineClassificationAdopted: true as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    cdssClarification: "sent-awaiting-response" as const,
    statewideCrawlRepeated: false as const,
  };
}
