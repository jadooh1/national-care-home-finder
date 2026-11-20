/**
 * California Phase 23 — quality / baseline preservation.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE23_QUALITY_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE23_EXCLUSIVE_BUCKETS = [
  "active-candidate",
  "restricted-candidate",
  "excluded",
  "exception-documented-exclude",
] as const;

export type CaliforniaPhase23BucketCounts = Record<
  (typeof CALIFORNIA_PHASE23_EXCLUSIVE_BUCKETS)[number],
  number
>;

export function assertCaliforniaPhase23ExclusiveAccounting(
  buckets: CaliforniaPhase23BucketCounts,
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

export const CALIFORNIA_PHASE23_OBSERVED_COUNTS = {
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
  provisionalConflicts: 5,
  pendingIncreaseOverlays: 66,
  missingLicenseEvidence: 14,
} as const;

export function evaluateCaliforniaPhase23Quality(input: {
  observedOn?: string;
  downloadSha256?: { rcfe: string; arf: string };
  listingExcludedInCandidates?: number;
  otherwiseClearOfflineEstimate?: number;
} = {}) {
  const buckets = CALIFORNIA_PHASE23_OBSERVED_COUNTS.buckets;
  const invariant = assertCaliforniaPhase23ExclusiveAccounting(
    buckets,
    CALIFORNIA_PHASE23_OBSERVED_COUNTS.rowCount,
  );
  const downloadSha256 = input.downloadSha256
    ?? CALIFORNIA_PHASE23_OBSERVED_COUNTS.downloadSha256;
  const shaMatches =
    downloadSha256.rcfe === CALIFORNIA_PHASE23_OBSERVED_COUNTS.downloadSha256.rcfe
    && downloadSha256.arf === CALIFORNIA_PHASE23_OBSERVED_COUNTS.downloadSha256.arf;

  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE23_QUALITY_OBSERVED_ON,
    accounting: invariant,
    baseline: CALIFORNIA_PHASE23_OBSERVED_COUNTS,
    downloadSha256MatchesBaseline: shaMatches,
    listingExcludedInCandidates: input.listingExcludedInCandidates ?? null,
    otherwiseClearOfflineEstimate: input.otherwiseClearOfflineEstimate ?? null,
    coordinates: CALIFORNIA_PHASE23_OBSERVED_COUNTS.coordinates,
    authoritativeIsoExportDate: null,
    exclusionPolicyActivatedInAppOrDb: false as const,
    exclusionOfflineClassificationAdopted: true as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    cdssClarification: "sent-awaiting-response" as const,
    statewideCrawlRepeated: false as const,
    duplicateCdssInquirySent: false as const,
  };
}
