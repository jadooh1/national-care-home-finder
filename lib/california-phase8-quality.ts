/**
 * California Phase 8 — capacity + coordinates + freshness quality report.
 * Preserves the Phase 7 exclusive-bucket accounting invariant (24,377).
 * California remains unpublished; gate stays blocked without authoritative ISO.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module. Callers
 * compute capacity / coordinates / freshness via their own modules and pass
 * results in.
 */

export const CALIFORNIA_PHASE8_OBSERVED_ON = "2026-11-19";

/** Phase 7 exclusive buckets preserved as the accounting invariant. */
export const CALIFORNIA_PHASE8_EXCLUSIVE_BUCKETS = [
  "active-candidate",
  "restricted-candidate",
  "excluded",
  "exception-documented-exclude",
] as const;

export type CaliforniaPhase8ExclusiveBucket =
  (typeof CALIFORNIA_PHASE8_EXCLUSIVE_BUCKETS)[number];

export type CaliforniaPhase8BucketCounts = Record<
  CaliforniaPhase8ExclusiveBucket,
  number
>;

export type CaliforniaPhase8AccountingInvariant = {
  holds: boolean;
  rowCount: number;
  bucketSum: number;
  difference: number;
  buckets: CaliforniaPhase8BucketCounts;
  reason: string;
};

export type CaliforniaPhase8CapacityQualityCounts = {
  missing: number;
  invalid: number;
  zero: number;
  negative: number;
  valid: number;
};

export type CaliforniaPhase8CapacityCrossSource = {
  exactHistoricalCompared: number;
  inconsistentWithHistorical: number;
  historicalMissingForExactId: number;
  exactGisCompared: number;
  inconsistentWithGis: number;
  gisMissingForExactId: number;
  leadingZeroGisCollapsedCompared: number;
  inconsistentWithGisLeadingZeroCollapsed: number;
  officialValuesOverwritten: 0;
};

export type CaliforniaPhase8CoordinateCoverage = {
  candidateCount: number;
  activeCandidateCount: number;
  restrictedCandidateCount: number;
  exactMatchWithValidCoords: number;
  leadingZeroCollapsedUniqueWithValidCoords: number;
  ambiguousRejected: number;
  unmatched: number;
  invalidDownloadIds: number;
  gisCoordsMissingOrInvalid: number;
  exactValidCoverageRate: number;
  usableOfficialCoordsRate: number;
  fabricatedCoordinates: 0;
  unverifiedGeocodingUsed: 0;
};

export type CaliforniaPhase8FreshnessEvaluation = {
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

export function emptyPhase8BucketCounts(): CaliforniaPhase8BucketCounts {
  return {
    "active-candidate": 0,
    "restricted-candidate": 0,
    excluded: 0,
    "exception-documented-exclude": 0,
  };
}

export function assertCaliforniaPhase8ExclusiveAccounting(
  buckets: CaliforniaPhase8BucketCounts,
  rowCount: number,
): CaliforniaPhase8AccountingInvariant {
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

export const CALIFORNIA_PHASE8_PUBLICATION_BLOCKERS = [
  {
    id: "no-authoritative-iso-export-date",
    severity: "blocking" as const,
    summary:
      "No verified CDSS DownloadStateData ISO export/freshness timestamp; filename MMDDYYYY, retrieval timestamp, HTTP clocks, CHHS file_date/metadata, and GIS/portal edit clocks remain non-authoritative. Gate stays blocked.",
  },
  {
    id: "coordinates-require-arcgis-exact-id-match",
    severity: "blocking" as const,
    summary:
      "DownloadStateData has no coordinate columns. Official ArcGIS coordinates require exact licensing-ID matches; leading-zero collapsed matches are reported separately; ambiguous matches are rejected; no fabricated/geocoded coords.",
  },
  {
    id: "capacity-empty-invalid-and-cross-source-gaps",
    severity: "blocking" as const,
    summary:
      "Facility Capacity is now preserved by the Transparency parser, but missing/invalid/zero/negative cells and historical/GIS inconsistencies remain; official download values are never overwritten.",
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
      "Bounded samples and Phase 8 quality accounting cannot approve California publication.",
  },
] as const;

export const CALIFORNIA_PHASE8_READINESS_MATRIX = {
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
  coordinatesPresentInDownload: false,
  coordinatesMatchedViaExactArcgisId: true,
  closedSubtypeMappingComplete: false,
  verifiedDisclosureLinks: false,
  sampleVerificationSufficient: false,
  publication: "unpublished" as const,
  ownerClaimEligible: false,
  allowsPublication: false,
  blockers: CALIFORNIA_PHASE8_PUBLICATION_BLOCKERS,
} as const;

/**
 * Observed Phase 7/8 accounting baseline for the DownloadStateData snapshot
 * (sha256 unchanged through Phase 7). Live Phase 8 runner refreshes capacity /
 * coordinate coverage numbers; accounting invariant remains 24,377.
 */
export const CALIFORNIA_PHASE8_OBSERVED_COUNTS = {
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
  capacityMappedThroughCoreParser: true,
} as const;

export type CaliforniaPhase8QualityEvaluation = {
  observedOn: string;
  accounting: {
    rowCount: number;
    buckets: CaliforniaPhase8BucketCounts;
    invariant: CaliforniaPhase8AccountingInvariant;
    publicationCandidatesIfGateOpened: number;
  };
  capacity: {
    rowCount: number;
    quality: CaliforniaPhase8CapacityQualityCounts;
    qualitySumEqualsRowCount: boolean;
    crossSource: CaliforniaPhase8CapacityCrossSource;
    rcfe: {
      file: "RCFE";
      rowCount: number;
      quality: CaliforniaPhase8CapacityQualityCounts;
      qualitySumEqualsRowCount: boolean;
      crossSource: CaliforniaPhase8CapacityCrossSource;
    };
    arf: {
      file: "ARF";
      rowCount: number;
      quality: CaliforniaPhase8CapacityQualityCounts;
      qualitySumEqualsRowCount: boolean;
      crossSource: CaliforniaPhase8CapacityCrossSource;
    };
  };
  coordinates: {
    allCandidates: CaliforniaPhase8CoordinateCoverage;
    active: CaliforniaPhase8CoordinateCoverage;
    restricted: CaliforniaPhase8CoordinateCoverage;
  };
  freshness: CaliforniaPhase8FreshnessEvaluation;
  publication: "unpublished";
  ownerClaimEligible: false;
  allowsPublication: false;
  freshnessSatisfied: false;
  authoritativeIsoExportDate: null;
  gate: "blocked";
  readiness: typeof CALIFORNIA_PHASE8_READINESS_MATRIX;
};

export function evaluateCaliforniaPhase8Quality(input: {
  observedOn?: string;
  buckets: CaliforniaPhase8BucketCounts;
  rowCount: number;
  publicationCandidatesIfGateOpened: number;
  capacity: CaliforniaPhase8QualityEvaluation["capacity"];
  coordinates: CaliforniaPhase8QualityEvaluation["coordinates"];
  freshness: CaliforniaPhase8FreshnessEvaluation;
}): CaliforniaPhase8QualityEvaluation {
  const observedOn = input.observedOn ?? CALIFORNIA_PHASE8_OBSERVED_ON;
  const invariant = assertCaliforniaPhase8ExclusiveAccounting(
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
    readiness: CALIFORNIA_PHASE8_READINESS_MATRIX,
  };
}

export function californiaPhase8AllowsPublication(
  evaluation: Pick<
    CaliforniaPhase8QualityEvaluation,
    "allowsPublication" | "publication" | "freshnessSatisfied"
  >,
): false {
  void evaluation;
  return false;
}

/** Map Transparency download row → Phase 6 capacity field without dropping official value. */
export function transparencyRowToPhase6CapacityFields(row: {
  facilityCapacity?: string | number | null;
  capacity?: string | number | null;
}): { capacity: string } {
  const fromCapacity = row.facilityCapacity ?? row.capacity ?? "";
  return { capacity: String(fromCapacity ?? "").trim() };
}
