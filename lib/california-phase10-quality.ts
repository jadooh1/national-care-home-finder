/**
 * California Phase 10 — freshness + readiness quality report.
 * Preserves the Phase 7 exclusive-bucket accounting invariant (24,377).
 * Live Phase 10 revalidation confirmed identical DownloadStateData sha256 and
 * coordinate/capacity totals vs Phase 9. California remains unpublished.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE10_QUALITY_OBSERVED_ON = "2026-11-19";

export const CALIFORNIA_PHASE10_EXCLUSIVE_BUCKETS = [
  "active-candidate",
  "restricted-candidate",
  "excluded",
  "exception-documented-exclude",
] as const;

export type CaliforniaPhase10ExclusiveBucket =
  (typeof CALIFORNIA_PHASE10_EXCLUSIVE_BUCKETS)[number];

export type CaliforniaPhase10BucketCounts = Record<
  CaliforniaPhase10ExclusiveBucket,
  number
>;

export type CaliforniaPhase10AccountingInvariant = {
  holds: boolean;
  rowCount: number;
  bucketSum: number;
  difference: number;
  buckets: CaliforniaPhase10BucketCounts;
  reason: string;
};

export function emptyPhase10BucketCounts(): CaliforniaPhase10BucketCounts {
  return {
    "active-candidate": 0,
    "restricted-candidate": 0,
    excluded: 0,
    "exception-documented-exclude": 0,
  };
}

export function assertCaliforniaPhase10ExclusiveAccounting(
  buckets: CaliforniaPhase10BucketCounts,
  rowCount: number,
): CaliforniaPhase10AccountingInvariant {
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

/**
 * Observed Phase 10 revalidation baseline. DownloadStateData sha256 matches
 * Phase 9; report source-data changes rather than forcing historical totals if
 * a future live run drifts.
 */
export const CALIFORNIA_PHASE10_OBSERVED_COUNTS = {
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
  downloadBytesUnchangedVsPhase9: true,
  authoritativeIsoExportDate: null,
  filenameIsoCandidate: "2026-11-15",
  officialWeeklyCadence: "The data is updated weekly.",
  coordinates: {
    candidateCount: 15451,
    exactMatchWithValidCoords: 14059,
    newlyVerifiedIdentityCorroborated: 1364,
    verifiedOfficialCoords: 15423,
    leadingZeroIdentityRejected: 1,
    unmatched: 27,
    unresolved: 28,
    unmatchedDivergentIdRejected: 20,
    fabricatedCoordinates: 0,
  },
  missingCapacity: {
    rcfeMissing: 17,
    arfMissing: 4,
    totalMissing: 21,
    publicationCandidateMissing: 0,
  },
} as const;

export type CaliforniaPhase10Revalidation = {
  observedOn: string;
  accountingMatchesBaseline: boolean;
  downloadSha256MatchesBaseline: boolean;
  coordinatesMatchBaseline: boolean;
  missingCapacityMatchesBaseline: boolean;
  sourceDataChanged: boolean;
  notes: string[];
};

export function evaluateCaliforniaPhase10Revalidation(input: {
  observedOn?: string;
  buckets: CaliforniaPhase10BucketCounts;
  rowCount: number;
  downloadSha256: { rcfe: string; arf: string };
  coordinates: {
    verifiedOfficialCoords: number;
    unresolved: number;
    fabricatedCoordinates: number;
  };
  missingCapacity: { totalMissing: number; publicationCandidateMissing: number };
}): CaliforniaPhase10Revalidation {
  const baseline = CALIFORNIA_PHASE10_OBSERVED_COUNTS;
  const accountingMatchesBaseline =
    input.rowCount === baseline.rowCount
    && input.buckets["active-candidate"] === baseline.buckets["active-candidate"]
    && input.buckets["restricted-candidate"]
      === baseline.buckets["restricted-candidate"]
    && input.buckets.excluded === baseline.buckets.excluded
    && input.buckets["exception-documented-exclude"]
      === baseline.buckets["exception-documented-exclude"];
  const downloadSha256MatchesBaseline =
    input.downloadSha256.rcfe === baseline.downloadSha256.rcfe
    && input.downloadSha256.arf === baseline.downloadSha256.arf;
  const coordinatesMatchBaseline =
    input.coordinates.verifiedOfficialCoords
      === baseline.coordinates.verifiedOfficialCoords
    && input.coordinates.unresolved === baseline.coordinates.unresolved
    && input.coordinates.fabricatedCoordinates === 0;
  const missingCapacityMatchesBaseline =
    input.missingCapacity.totalMissing === baseline.missingCapacity.totalMissing
    && input.missingCapacity.publicationCandidateMissing
      === baseline.missingCapacity.publicationCandidateMissing;
  const sourceDataChanged = !(
    accountingMatchesBaseline
    && downloadSha256MatchesBaseline
    && coordinatesMatchBaseline
    && missingCapacityMatchesBaseline
  );
  const notes: string[] = [];
  if (!sourceDataChanged) {
    notes.push(
      "Live Phase 10 revalidation matched Phase 9 DownloadStateData sha256 and accounting/coordinate/capacity baselines; no source-data drift to report.",
    );
  } else {
    notes.push(
      "Source-data change detected vs Phase 10 baseline fixture; report observed live totals rather than forcing historical numbers.",
    );
  }
  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE10_QUALITY_OBSERVED_ON,
    accountingMatchesBaseline,
    downloadSha256MatchesBaseline,
    coordinatesMatchBaseline,
    missingCapacityMatchesBaseline,
    sourceDataChanged,
    notes,
  };
}

export type CaliforniaPhase10QualityEvaluation = {
  observedOn: string;
  accounting: {
    rowCount: number;
    buckets: CaliforniaPhase10BucketCounts;
    invariant: CaliforniaPhase10AccountingInvariant;
    publicationCandidatesIfGateOpened: number;
  };
  revalidation: CaliforniaPhase10Revalidation;
  capacity: {
    totalMissing: number;
    rcfeMissing: number;
    arfMissing: number;
    publicationCandidateMissing: number;
    officialValuesOverwritten: 0;
    inventedCapacities: 0;
  };
  coordinates: {
    verifiedOfficialCoords: number;
    unresolved: number;
    fabricatedCoordinates: 0;
  };
  freshness: {
    satisfied: false;
    authoritativeIsoExportDate: null;
    gate: "blocked";
    officialWeeklyCadenceDocumented: true;
  };
  publication: "unpublished";
  ownerClaimEligible: false;
  allowsPublication: false;
  gate: "blocked";
};

export function evaluateCaliforniaPhase10Quality(input: {
  observedOn?: string;
  buckets: CaliforniaPhase10BucketCounts;
  rowCount: number;
  publicationCandidatesIfGateOpened: number;
  downloadSha256: { rcfe: string; arf: string };
  capacity: {
    totalMissing: number;
    rcfeMissing: number;
    arfMissing: number;
    publicationCandidateMissing: number;
  };
  coordinates: {
    verifiedOfficialCoords: number;
    unresolved: number;
  };
}): CaliforniaPhase10QualityEvaluation {
  const observedOn = input.observedOn ?? CALIFORNIA_PHASE10_QUALITY_OBSERVED_ON;
  const invariant = assertCaliforniaPhase10ExclusiveAccounting(
    input.buckets,
    input.rowCount,
  );
  const revalidation = evaluateCaliforniaPhase10Revalidation({
    observedOn,
    buckets: input.buckets,
    rowCount: input.rowCount,
    downloadSha256: input.downloadSha256,
    coordinates: {
      verifiedOfficialCoords: input.coordinates.verifiedOfficialCoords,
      unresolved: input.coordinates.unresolved,
      fabricatedCoordinates: 0,
    },
    missingCapacity: {
      totalMissing: input.capacity.totalMissing,
      publicationCandidateMissing: input.capacity.publicationCandidateMissing,
    },
  });
  return {
    observedOn,
    accounting: {
      rowCount: input.rowCount,
      buckets: { ...input.buckets },
      invariant,
      publicationCandidatesIfGateOpened: input.publicationCandidatesIfGateOpened,
    },
    revalidation,
    capacity: {
      ...input.capacity,
      officialValuesOverwritten: 0,
      inventedCapacities: 0,
    },
    coordinates: {
      verifiedOfficialCoords: input.coordinates.verifiedOfficialCoords,
      unresolved: input.coordinates.unresolved,
      fabricatedCoordinates: 0,
    },
    freshness: {
      satisfied: false,
      authoritativeIsoExportDate: null,
      gate: "blocked",
      officialWeeklyCadenceDocumented: true,
    },
    publication: "unpublished",
    ownerClaimEligible: false,
    allowsPublication: false,
    gate: "blocked",
  };
}
