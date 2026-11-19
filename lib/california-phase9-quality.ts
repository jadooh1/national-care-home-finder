/**
 * California Phase 9 — coordinate + capacity + freshness quality report.
 * Preserves the Phase 7 exclusive-bucket accounting invariant (24,377).
 * California remains unpublished; gate stays blocked without authoritative ISO.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE9_OBSERVED_ON = "2026-11-19";

export const CALIFORNIA_PHASE9_EXCLUSIVE_BUCKETS = [
  "active-candidate",
  "restricted-candidate",
  "excluded",
  "exception-documented-exclude",
] as const;

export type CaliforniaPhase9ExclusiveBucket =
  (typeof CALIFORNIA_PHASE9_EXCLUSIVE_BUCKETS)[number];

export type CaliforniaPhase9BucketCounts = Record<
  CaliforniaPhase9ExclusiveBucket,
  number
>;

export type CaliforniaPhase9AccountingInvariant = {
  holds: boolean;
  rowCount: number;
  bucketSum: number;
  difference: number;
  buckets: CaliforniaPhase9BucketCounts;
  reason: string;
};

export type CaliforniaPhase9CoordinateCoverage = {
  candidateCount: number;
  activeCandidateCount: number;
  restrictedCandidateCount: number;
  exactMatchWithValidCoords: number;
  leadingZeroCollapsedUniqueWithValidCoords: number;
  newlyVerifiedIdentityCorroborated: number;
  leadingZeroIdentityRejected: number;
  ambiguousRejected: number;
  unmatched: number;
  unmatchedDivergentIdRejected: number;
  invalidDownloadIds: number;
  gisCoordsMissingOrInvalid: number;
  exactValidCoverageRate: number;
  newlyVerifiedCoverageRate: number;
  verifiedOfficialCoordsRate: number;
  phase8UsableOfficialCoordsRate: number;
  fabricatedCoordinates: 0;
  unverifiedGeocodingUsed: 0;
};

export type CaliforniaPhase9MissingCapacityAudit = {
  totalMissing: number;
  rcfeMissing: number;
  arfMissing: number;
  publicationCandidateMissing: number;
  excludedMissing: number;
  allMissingAreNonCandidates: boolean;
  officialValuesOverwritten: 0;
  inventedCapacities: 0;
};

export type CaliforniaPhase9FreshnessEvaluation = {
  observedOn: string;
  authoritativeIsoExportDate: null;
  satisfied: false;
  acceptedChannels: number;
  rejectedChannels: number;
  absentChannels: number;
  reason: string;
  gate: "blocked";
  distinguishesFilenameFromExportDate: true;
  distinguishesRetrievalTimestampFromExportDate: true;
};

export function emptyPhase9BucketCounts(): CaliforniaPhase9BucketCounts {
  return {
    "active-candidate": 0,
    "restricted-candidate": 0,
    excluded: 0,
    "exception-documented-exclude": 0,
  };
}

export function assertCaliforniaPhase9ExclusiveAccounting(
  buckets: CaliforniaPhase9BucketCounts,
  rowCount: number,
): CaliforniaPhase9AccountingInvariant {
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

export const CALIFORNIA_PHASE9_PUBLICATION_BLOCKERS = [
  {
    id: "no-authoritative-iso-export-date",
    severity: "blocking" as const,
    summary:
      "No verified CDSS DownloadStateData ISO export/freshness timestamp; filename MMDDYYYY, retrieval timestamp, HTTP clocks, CHHS/DCAT metadata, GIS/portal edit clocks, annual CCLD PDFs, and FacilityDetail dates remain non-authoritative. Gate stays blocked.",
  },
  {
    id: "coordinates-require-verified-official-match",
    severity: "blocking" as const,
    summary:
      "DownloadStateData has no coordinate columns. Exact ArcGIS licensing-ID matches are usable; leading-zero collapses require independent identity corroboration; unmatched and divergent-ID address/name hits stay rejected; no fabricated/geocoded coords.",
  },
  {
    id: "capacity-empty-cells-documented",
    severity: "blocking" as const,
    summary:
      "21 official Facility Capacity cells remain blank (17 RCFE + 4 ARF), all PENDING/excluded non-candidates; official blanks are preserved and never invented.",
  },
  {
    id: "closed-application-withdrawn-mapping-gap",
    severity: "blocking" as const,
    summary:
      "Download CLOSED includes FacilityDetail Application Withdrawn; Closed* subtype mapping is still required.",
  },
  {
    id: "roster-wide-current-status-unverified",
    severity: "blocking" as const,
    summary:
      "FacilityDetail verification remains sample-bounded; roster-wide current status is not verified.",
  },
  {
    id: "invalid-and-exceptional-identifiers",
    severity: "blocking" as const,
    summary:
      "Invalid identifiers and documented exceptional IDs must remain fail-closed; none may bypass the publication gate.",
  },
  {
    id: "sample-insufficient-for-publication",
    severity: "blocking" as const,
    summary:
      "Bounded samples and Phase 9 quality accounting cannot approve California publication.",
  },
] as const;

export const CALIFORNIA_PHASE9_READINESS_MATRIX = {
  reliableSourceAndDate: false,
  freshnessRequirementSatisfied: false,
  verifiedCurrentStatusRosterWide: false,
  uniqueValidIdentifiers: false,
  correctRcfeArfCategories: true,
  statusClassificationRulesDefined: true,
  exclusiveBucketAccountingInvariant: true,
  phase6FiveRecordGapResolved: true,
  capacityColumnPresentInDownload: true,
  capacityMappedThroughCoreParser: true,
  capacityQualityQuantified: true,
  missingCapacityAudited: true,
  coordinatesPresentInDownload: false,
  coordinatesMatchedViaExactArcgisId: true,
  leadingZeroIdentityCorroborationApplied: true,
  closedSubtypeMappingComplete: false,
  verifiedDisclosureLinks: false,
  sampleVerificationSufficient: false,
  publication: "unpublished" as const,
  ownerClaimEligible: false,
  allowsPublication: false,
  blockers: CALIFORNIA_PHASE9_PUBLICATION_BLOCKERS,
} as const;

/**
 * Observed Phase 9 accounting + coverage baseline for the DownloadStateData
 * snapshot (sha256 unchanged through Phase 8/9). Live runner refreshes
 * coordinate verification counts; accounting invariant remains 24,377.
 */
export const CALIFORNIA_PHASE9_OBSERVED_COUNTS = {
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
  coordinates: {
    candidateCount: 15451,
    exactMatchWithValidCoords: 14059,
    leadingZeroCollapsedUniqueWithValidCoords: 1365,
    newlyVerifiedIdentityCorroborated: 1364,
    leadingZeroIdentityRejected: 1,
    unmatched: 27,
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

export type CaliforniaPhase9QualityEvaluation = {
  observedOn: string;
  accounting: {
    rowCount: number;
    buckets: CaliforniaPhase9BucketCounts;
    invariant: CaliforniaPhase9AccountingInvariant;
    publicationCandidatesIfGateOpened: number;
  };
  capacity: CaliforniaPhase9MissingCapacityAudit;
  coordinates: {
    allCandidates: CaliforniaPhase9CoordinateCoverage;
    active: CaliforniaPhase9CoordinateCoverage;
    restricted: CaliforniaPhase9CoordinateCoverage;
  };
  freshness: CaliforniaPhase9FreshnessEvaluation;
  publication: "unpublished";
  ownerClaimEligible: false;
  allowsPublication: false;
  freshnessSatisfied: false;
  authoritativeIsoExportDate: null;
  gate: "blocked";
  readiness: typeof CALIFORNIA_PHASE9_READINESS_MATRIX;
};

export function evaluateCaliforniaPhase9Quality(input: {
  observedOn?: string;
  buckets: CaliforniaPhase9BucketCounts;
  rowCount: number;
  publicationCandidatesIfGateOpened: number;
  capacity: CaliforniaPhase9MissingCapacityAudit;
  coordinates: CaliforniaPhase9QualityEvaluation["coordinates"];
  freshness: CaliforniaPhase9FreshnessEvaluation;
}): CaliforniaPhase9QualityEvaluation {
  const observedOn = input.observedOn ?? CALIFORNIA_PHASE9_OBSERVED_ON;
  const invariant = assertCaliforniaPhase9ExclusiveAccounting(
    input.buckets,
    input.rowCount,
  );
  return {
    observedOn,
    accounting: {
      rowCount: input.rowCount,
      buckets: { ...input.buckets },
      invariant,
      publicationCandidatesIfGateOpened: input.publicationCandidatesIfGateOpened,
    },
    capacity: input.capacity,
    coordinates: input.coordinates,
    freshness: input.freshness,
    publication: "unpublished",
    ownerClaimEligible: false,
    allowsPublication: false,
    freshnessSatisfied: false,
    authoritativeIsoExportDate: null,
    gate: "blocked",
    readiness: CALIFORNIA_PHASE9_READINESS_MATRIX,
  };
}

export function californiaPhase9AllowsPublication(
  evaluation: Pick<
    CaliforniaPhase9QualityEvaluation,
    "allowsPublication" | "publication" | "freshnessSatisfied"
  >,
): false {
  void evaluation;
  return false;
}
