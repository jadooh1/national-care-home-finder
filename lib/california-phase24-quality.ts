/**
 * California Phase 24 — quality / baseline preservation.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE24_QUALITY_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE24_EXCLUSIVE_BUCKETS = [
  "active-candidate",
  "restricted-candidate",
  "excluded",
  "exception-documented-exclude",
] as const;

export type CaliforniaPhase24BucketCounts = Record<
  (typeof CALIFORNIA_PHASE24_EXCLUSIVE_BUCKETS)[number],
  number
>;

export function assertCaliforniaPhase24ExclusiveAccounting(
  buckets: CaliforniaPhase24BucketCounts,
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

export const CALIFORNIA_PHASE24_OBSERVED_COUNTS = {
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
  phase23Matrix: {
    listingExclusionsInCandidates: 88,
    otherwiseClearOffline: 15363,
    mapOnlySuppressions: 27,
  },
} as const;

export function evaluateCaliforniaPhase24Quality(input: {
  observedOn?: string;
  downloadSha256?: { rcfe: string; arf: string };
  countsMatchPhase23?: boolean;
} = {}) {
  const buckets = CALIFORNIA_PHASE24_OBSERVED_COUNTS.buckets;
  const invariant = assertCaliforniaPhase24ExclusiveAccounting(
    buckets,
    CALIFORNIA_PHASE24_OBSERVED_COUNTS.rowCount,
  );
  const downloadSha256 = input.downloadSha256
    ?? CALIFORNIA_PHASE24_OBSERVED_COUNTS.downloadSha256;
  const shaMatches =
    downloadSha256.rcfe === CALIFORNIA_PHASE24_OBSERVED_COUNTS.downloadSha256.rcfe
    && downloadSha256.arf === CALIFORNIA_PHASE24_OBSERVED_COUNTS.downloadSha256.arf;

  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE24_QUALITY_OBSERVED_ON,
    accounting: invariant,
    baseline: CALIFORNIA_PHASE24_OBSERVED_COUNTS,
    downloadSha256MatchesBaseline: shaMatches,
    countsMatchPhase23: input.countsMatchPhase23 ?? true,
    authoritativeIsoExportDate: null,
    exclusionPolicyActivatedInAppOrDb: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    cdssClarification: "sent-awaiting-response" as const,
    statewideCrawlRepeated: false as const,
    duplicateCdssInquirySent: false as const,
    clarificationFollowUpDraftStatus: "draft-do-not-send" as const,
  };
}
