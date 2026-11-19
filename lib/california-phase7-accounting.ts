/**
 * California Phase 7 — exclusive-bucket accounting over DownloadStateData.
 * Resolves the Phase 6 five-record presentation gap and enforces the invariant
 * that every input row belongs to exactly one mutually exclusive classification
 * bucket. Read-only; does not publish California.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module. Callers that
 * need Phase 6 evaluation import Phase 6 modules directly and pass results in.
 */

export const CALIFORNIA_PHASE7_OBSERVED_ON = "2026-11-19";

/**
 * Mutually exclusive classification buckets. Every DownloadStateData row must
 * land in exactly one of these. Phase 6's `exception` outcome is retained as its
 * own exclusive bucket (not folded into excluded) so the Phase 6 five-record gap
 * is explained by evidence rather than silently re-labeled.
 */
export const CALIFORNIA_PHASE7_EXCLUSIVE_BUCKETS = [
  "active-candidate",
  "restricted-candidate",
  "excluded",
  "exception-documented-exclude",
] as const;

export type CaliforniaPhase7ExclusiveBucket =
  (typeof CALIFORNIA_PHASE7_EXCLUSIVE_BUCKETS)[number];

/**
 * The five ARF facility numbers Phase 6 counted as `exception` outcomes and
 * omitted from the active+restricted+excluded presentation sum
 * (15,413 + 38 + 8,921 = 24,372; +5 = 24,377).
 */
export const CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS = [
  "374604731",
  "198601400",
  "306006749",
  "306006799",
  "95354",
] as const;

export type CaliforniaPhase7Phase6ExceptionOutcomeId =
  (typeof CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS)[number];

export const CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_EVIDENCE = [
  {
    facilityNumber: "374604731",
    file: "ARF" as const,
    phase6Outcome: "exception" as const,
    gateImpact: "exclude-out-of-scope" as const,
    downloadStatus: "LICENSED",
    downloadType: "ADULT DAY PROGRAM",
    primaryExclusionReasons: ["out-of-scope-type"] as const,
    withoutExceptionCatalogWouldBe: "excluded" as const,
    summary:
      "Documented possible-relicense; ADP out of scope. Phase 6 diverted to exception outcome instead of excluded.",
  },
  {
    facilityNumber: "198601400",
    file: "ARF" as const,
    phase6Outcome: "exception" as const,
    gateImpact: "exclude-ineligible-status" as const,
    downloadStatus: "PENDING",
    downloadType: "ADULT RESIDENTIAL",
    primaryExclusionReasons: ["pending-status"] as const,
    withoutExceptionCatalogWouldBe: "excluded" as const,
    summary:
      "Documented unusual LICENSED→PENDING transition; PENDING ineligible. Phase 6 diverted to exception outcome.",
  },
  {
    facilityNumber: "306006749",
    file: "ARF" as const,
    phase6Outcome: "exception" as const,
    gateImpact: "exclude-withdrawn-mapping-gap" as const,
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    primaryExclusionReasons: ["out-of-scope-type", "closed-status"] as const,
    withoutExceptionCatalogWouldBe: "excluded" as const,
    summary:
      "CLOSED↔Application Withdrawn mapping-gap; ADP out of scope. Phase 6 diverted to exception outcome.",
  },
  {
    facilityNumber: "306006799",
    file: "ARF" as const,
    phase6Outcome: "exception" as const,
    gateImpact: "exclude-withdrawn-mapping-gap" as const,
    downloadStatus: "CLOSED",
    downloadType: "ADULT DAY PROGRAM",
    primaryExclusionReasons: ["out-of-scope-type", "closed-status"] as const,
    withoutExceptionCatalogWouldBe: "excluded" as const,
    summary:
      "CLOSED↔Application Withdrawn mapping-gap; ADP out of scope. Phase 6 diverted to exception outcome.",
  },
  {
    facilityNumber: "95354",
    file: "ARF" as const,
    phase6Outcome: "exception" as const,
    gateImpact: "exclude-invalid-id" as const,
    downloadStatus: "PENDING",
    downloadType: "ADULT RESIDENTIAL",
    primaryExclusionReasons: ["invalid-identifier", "pending-status"] as const,
    withoutExceptionCatalogWouldBe: "excluded" as const,
    summary:
      "Corrupt/shifted Facility Number 95354 (ZIP collision). Phase 6 diverted to exception outcome.",
  },
] as const;

/** Structural Phase 6 outcome labels (kept local to avoid sibling imports). */
export type CaliforniaPhase7Phase6Outcome =
  | "active-candidate"
  | "restricted-candidate"
  | "excluded"
  | "exception";

export type CaliforniaPhase7Phase6ExclusionReason =
  | "invalid-identifier"
  | "blank-type"
  | "unknown-type"
  | "out-of-scope-type"
  | "pending-status"
  | "closed-status"
  | "withdrawn-status"
  | "unknown-status"
  | "duplicate-license"
  | "missing-address";

export type CaliforniaPhase7ExceptionGateImpact =
  | "exclude-invalid-id"
  | "exclude-out-of-scope"
  | "exclude-ineligible-status"
  | "document-only-eligible-if-rules-pass"
  | "exclude-withdrawn-mapping-gap";

export type CaliforniaPhase7File = "RCFE" | "ARF";

export type CaliforniaPhase7DownloadRow = {
  facilityType: string;
  facilityNumber: string;
  facilityName: string;
  facilityAddress: string;
  facilityCity: string;
  facilityState: string;
  facilityZip: string;
  facilityStatus: string;
  licenseFirstDate: string;
  closedDate: string;
  lastVisitDate: string;
  capacity?: string | number | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

export type CaliforniaPhase7ExceptionRecord = {
  facilityNumber: string;
  file: CaliforniaPhase7File;
  classification: string;
  downloadStatus: string;
  downloadType: string;
  liveStatus: string | null;
  summary: string;
  gateImpact: CaliforniaPhase7ExceptionGateImpact;
};

export type CaliforniaPhase7Phase6RowEvaluation = {
  file: CaliforniaPhase7File;
  facilityNumber: string;
  facilityNumberValid: boolean;
  normalizedType: string;
  category: string;
  status: string;
  outcome: CaliforniaPhase7Phase6Outcome;
  exclusionReasons: CaliforniaPhase7Phase6ExclusionReason[];
  exceptionId: string | null;
  missingAddress: boolean;
  capacityPresent: boolean;
  coordinatesPresent: boolean;
  publicationCandidate: false;
};

export type CaliforniaPhase7Phase6GateEvaluation = {
  observedOn: string;
  authoritativeIsoExportDate: null;
  freshness: { satisfied: boolean; authoritativeIsoExportDate: string | null; reason: string };
  rcfe: {
    rowCount: number;
    activeCandidates: number;
    restrictedCandidates: number;
    excluded: number;
    exceptions: number;
    invalidIdentifiers: string[];
    missingAddressCount: number;
  };
  arf: {
    rowCount: number;
    activeCandidates: number;
    restrictedCandidates: number;
    excluded: number;
    exceptions: number;
    invalidIdentifiers: string[];
    missingAddressCount: number;
  };
  totals: {
    rowCount: number;
    activeCandidates: number;
    restrictedCandidates: number;
    publicationCandidatesIfGateOpened: number;
    excluded: number;
    exceptions: number;
    invalidIdentifiers: number;
    duplicateLicenseIds: number;
    missingAddresses: number;
  };
  publication: "unpublished";
  ownerClaimEligible: false;
  allowsPublication: false;
};

export function phase6OutcomeToExclusiveBucket(
  outcome: CaliforniaPhase7Phase6Outcome,
): CaliforniaPhase7ExclusiveBucket {
  if (outcome === "active-candidate") return "active-candidate";
  if (outcome === "restricted-candidate") return "restricted-candidate";
  if (outcome === "exception") return "exception-documented-exclude";
  return "excluded";
}

export type CaliforniaPhase7BucketCounts = Record<
  CaliforniaPhase7ExclusiveBucket,
  number
>;

export type CaliforniaPhase7AccountingInvariant = {
  holds: boolean;
  rowCount: number;
  bucketSum: number;
  difference: number;
  buckets: CaliforniaPhase7BucketCounts;
  reason: string;
};

export function emptyPhase7BucketCounts(): CaliforniaPhase7BucketCounts {
  return {
    "active-candidate": 0,
    "restricted-candidate": 0,
    excluded: 0,
    "exception-documented-exclude": 0,
  };
}

export function assertCaliforniaPhase7ExclusiveAccounting(
  buckets: CaliforniaPhase7BucketCounts,
  rowCount: number,
): CaliforniaPhase7AccountingInvariant {
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
 * Phase 6 presentation formula that created the apparent five-record gap:
 * active + restricted + excluded (omitting exception outcomes).
 */
export function phase6ThreeBucketPresentationSum(input: {
  activeCandidates: number;
  restrictedCandidates: number;
  excluded: number;
}): number {
  return input.activeCandidates + input.restrictedCandidates + input.excluded;
}

export function explainPhase6FiveRecordGap(input: {
  rowCount: number;
  activeCandidates: number;
  restrictedCandidates: number;
  excluded: number;
  exceptions: number;
}): {
  threeBucketSum: number;
  fourBucketSum: number;
  apparentDifference: number;
  resolved: boolean;
  exceptionOutcomeIds: readonly CaliforniaPhase7Phase6ExceptionOutcomeId[];
  explanation: string;
} {
  const threeBucketSum = phase6ThreeBucketPresentationSum(input);
  const fourBucketSum = threeBucketSum + input.exceptions;
  const apparentDifference = input.rowCount - threeBucketSum;
  const resolved =
    apparentDifference === input.exceptions
    && fourBucketSum === input.rowCount
    && input.exceptions === CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS.length;
  return {
    threeBucketSum,
    fourBucketSum,
    apparentDifference,
    resolved,
    exceptionOutcomeIds: CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS,
    explanation: resolved
      ? `Phase 6 reported active+restricted+excluded=${threeBucketSum} against ${input.rowCount} rows (gap ${apparentDifference}). The ${input.exceptions} missing rows are the ARF exception-documented-exclude outcomes ${CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS.join(", ")}; including that exclusive bucket yields ${fourBucketSum}.`
      : `Unable to resolve Phase 6 gap: three-bucket sum ${threeBucketSum}, exceptions ${input.exceptions}, rowCount ${input.rowCount}.`,
  };
}

export type CaliforniaPhase7RowClassification = {
  file: CaliforniaPhase7File;
  facilityNumber: string;
  phase6Outcome: CaliforniaPhase7Phase6Outcome;
  exclusiveBucket: CaliforniaPhase7ExclusiveBucket;
  exclusionReasons: CaliforniaPhase7Phase6ExclusionReason[];
  exceptionId: string | null;
  exceptionGateImpact: CaliforniaPhase7ExceptionGateImpact | null;
  publicationCandidate: false;
  bypassesFailClosedGate: false;
};

/**
 * Map a Phase 6 row evaluation into the Phase 7 exclusive bucket.
 * Fail-closed: never a publication candidate while California is unpublished.
 */
export function classifyCaliforniaPhase7FromPhase6Row(
  phase6: CaliforniaPhase7Phase6RowEvaluation,
  exceptionGateImpact: CaliforniaPhase7ExceptionGateImpact | null = null,
): CaliforniaPhase7RowClassification {
  return {
    file: phase6.file,
    facilityNumber: phase6.facilityNumber,
    phase6Outcome: phase6.outcome,
    exclusiveBucket: phase6OutcomeToExclusiveBucket(phase6.outcome),
    exclusionReasons: phase6.exclusionReasons,
    exceptionId: phase6.exceptionId,
    exceptionGateImpact,
    publicationCandidate: false,
    bypassesFailClosedGate: false,
  };
}

export type CaliforniaPhase7FileAccounting = {
  file: CaliforniaPhase7File;
  rowCount: number;
  buckets: CaliforniaPhase7BucketCounts;
  invariant: CaliforniaPhase7AccountingInvariant;
  exceptionDocumentedExcludeIds: string[];
  invalidIdentifiers: string[];
  unknownStatuses: number;
  unknownTypes: number;
  missingAddresses: number;
  unsupportedStatusMappings: number;
};

export function accountCaliforniaPhase7FromPhase6Rows(
  file: CaliforniaPhase7File,
  phase6Rows: readonly CaliforniaPhase7Phase6RowEvaluation[],
  exceptionsById: ReadonlyMap<string, CaliforniaPhase7ExceptionRecord> = new Map(),
): CaliforniaPhase7FileAccounting {
  const buckets = emptyPhase7BucketCounts();
  const exceptionDocumentedExcludeIds: string[] = [];
  const invalidIdentifiers = new Set<string>();
  let unknownStatuses = 0;
  let unknownTypes = 0;
  let missingAddresses = 0;
  let unsupportedStatusMappings = 0;

  for (const phase6 of phase6Rows) {
    const exception = exceptionsById.get(phase6.facilityNumber) ?? null;
    const classified = classifyCaliforniaPhase7FromPhase6Row(
      phase6,
      exception?.gateImpact ?? null,
    );
    buckets[classified.exclusiveBucket] += 1;
    if (classified.exclusiveBucket === "exception-documented-exclude") {
      exceptionDocumentedExcludeIds.push(classified.facilityNumber);
    }
    if (classified.exclusionReasons.includes("invalid-identifier")) {
      invalidIdentifiers.add(classified.facilityNumber || "(blank)");
    }
    if (classified.exclusionReasons.includes("unknown-status")) unknownStatuses += 1;
    if (classified.exclusionReasons.includes("unknown-type")) unknownTypes += 1;
    if (classified.exclusionReasons.includes("missing-address")) missingAddresses += 1;
    if (
      classified.exceptionGateImpact === "exclude-withdrawn-mapping-gap"
      || classified.exclusionReasons.includes("withdrawn-status")
    ) {
      unsupportedStatusMappings += 1;
    }
  }

  exceptionDocumentedExcludeIds.sort();
  return {
    file,
    rowCount: phase6Rows.length,
    buckets,
    invariant: assertCaliforniaPhase7ExclusiveAccounting(buckets, phase6Rows.length),
    exceptionDocumentedExcludeIds,
    invalidIdentifiers: [...invalidIdentifiers].sort(),
    unknownStatuses,
    unknownTypes,
    missingAddresses,
    unsupportedStatusMappings,
  };
}

export type CaliforniaPhase7AccountingEvaluation = {
  observedOn: string;
  phase6: CaliforniaPhase7Phase6GateEvaluation;
  rcfe: CaliforniaPhase7FileAccounting;
  arf: CaliforniaPhase7FileAccounting;
  totals: {
    rowCount: number;
    buckets: CaliforniaPhase7BucketCounts;
    invariant: CaliforniaPhase7AccountingInvariant;
    exceptionDocumentedExcludeIds: string[];
    invalidIdentifiers: number;
    unknownStatuses: number;
    unknownTypes: number;
    missingAddresses: number;
    unsupportedStatusMappings: number;
    publicationCandidatesIfGateOpened: number;
  };
  phase6FiveRecordGap: ReturnType<typeof explainPhase6FiveRecordGap>;
  publication: "unpublished";
  ownerClaimEligible: false;
  allowsPublication: false;
  freshnessSatisfied: false;
  authoritativeIsoExportDate: null;
};

export function evaluateCaliforniaPhase7Accounting(input: {
  observedOn?: string;
  phase6: CaliforniaPhase7Phase6GateEvaluation;
  rcfePhase6Rows: readonly CaliforniaPhase7Phase6RowEvaluation[];
  arfPhase6Rows: readonly CaliforniaPhase7Phase6RowEvaluation[];
  exceptions?: readonly CaliforniaPhase7ExceptionRecord[];
}): CaliforniaPhase7AccountingEvaluation {
  const observedOn = input.observedOn ?? CALIFORNIA_PHASE7_OBSERVED_ON;
  const exceptionsById = new Map(
    (input.exceptions ?? []).map(row => [row.facilityNumber, row] as const),
  );
  const rcfe = accountCaliforniaPhase7FromPhase6Rows(
    "RCFE",
    input.rcfePhase6Rows,
    exceptionsById,
  );
  const arf = accountCaliforniaPhase7FromPhase6Rows(
    "ARF",
    input.arfPhase6Rows,
    exceptionsById,
  );
  const buckets: CaliforniaPhase7BucketCounts = {
    "active-candidate":
      rcfe.buckets["active-candidate"] + arf.buckets["active-candidate"],
    "restricted-candidate":
      rcfe.buckets["restricted-candidate"] + arf.buckets["restricted-candidate"],
    excluded: rcfe.buckets.excluded + arf.buckets.excluded,
    "exception-documented-exclude":
      rcfe.buckets["exception-documented-exclude"]
      + arf.buckets["exception-documented-exclude"],
  };
  const rowCount = rcfe.rowCount + arf.rowCount;
  const invariant = assertCaliforniaPhase7ExclusiveAccounting(buckets, rowCount);
  const exceptionDocumentedExcludeIds = [
    ...rcfe.exceptionDocumentedExcludeIds,
    ...arf.exceptionDocumentedExcludeIds,
  ].sort();
  const phase6FiveRecordGap = explainPhase6FiveRecordGap({
    rowCount,
    activeCandidates: input.phase6.totals.activeCandidates,
    restrictedCandidates: input.phase6.totals.restrictedCandidates,
    excluded: input.phase6.totals.excluded,
    exceptions: input.phase6.totals.exceptions,
  });

  return {
    observedOn,
    phase6: input.phase6,
    rcfe,
    arf,
    totals: {
      rowCount,
      buckets,
      invariant,
      exceptionDocumentedExcludeIds,
      invalidIdentifiers:
        new Set([...rcfe.invalidIdentifiers, ...arf.invalidIdentifiers]).size,
      unknownStatuses: rcfe.unknownStatuses + arf.unknownStatuses,
      unknownTypes: rcfe.unknownTypes + arf.unknownTypes,
      missingAddresses: rcfe.missingAddresses + arf.missingAddresses,
      unsupportedStatusMappings:
        rcfe.unsupportedStatusMappings + arf.unsupportedStatusMappings,
      publicationCandidatesIfGateOpened:
        input.phase6.totals.publicationCandidatesIfGateOpened,
    },
    phase6FiveRecordGap,
    publication: "unpublished",
    ownerClaimEligible: false,
    allowsPublication: false,
    freshnessSatisfied: false,
    authoritativeIsoExportDate: null,
  };
}

export function californiaPhase7AllowsPublication(
  evaluation: Pick<
    CaliforniaPhase7AccountingEvaluation,
    "allowsPublication" | "publication" | "freshnessSatisfied"
  >,
): false {
  void evaluation;
  return false;
}

/** Capacity / coordinate audit against raw DownloadStateData CSV headers + cells. */
export type CaliforniaPhase7SourceFieldAudit = {
  facilityCapacityColumnPresent: boolean;
  latitudeColumnPresent: boolean;
  longitudeColumnPresent: boolean;
  fileDateColumnPresent: boolean;
  capacityNonEmptyCount: number;
  capacityEmptyCount: number;
  rowCount: number;
  /** Phase 6 said the capacity column was absent; Phase 7 corrects that claim. */
  phase6CapacityAbsentClaimCorrected: true;
  coordinatesStillAbsent: boolean;
};

export function auditCaliforniaPhase7DownloadCsvFields(
  csvText: string,
): CaliforniaPhase7SourceFieldAudit {
  const lines = csvText.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.length > 0);
  if (lines.length === 0) {
    return {
      facilityCapacityColumnPresent: false,
      latitudeColumnPresent: false,
      longitudeColumnPresent: false,
      fileDateColumnPresent: false,
      capacityNonEmptyCount: 0,
      capacityEmptyCount: 0,
      rowCount: 0,
      phase6CapacityAbsentClaimCorrected: true,
      coordinatesStillAbsent: true,
    };
  }
  const headers = parseCsvLine(lines[0] ?? "");
  const capacityIdx = headers.findIndex(h => /^facility capacity$/i.test(h));
  const facilityCapacityColumnPresent = capacityIdx >= 0;
  const latitudeColumnPresent = headers.some(h => /latitude/i.test(h));
  const longitudeColumnPresent = headers.some(h => /longitude/i.test(h));
  const fileDateColumnPresent = headers.some(h => /^file_date$/i.test(h));
  let capacityNonEmptyCount = 0;
  let capacityEmptyCount = 0;
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    if (facilityCapacityColumnPresent) {
      const value = String(cells[capacityIdx] ?? "").trim();
      if (value) capacityNonEmptyCount += 1;
      else capacityEmptyCount += 1;
    } else {
      capacityEmptyCount += 1;
    }
  }
  const rowCount = lines.length - 1;
  return {
    facilityCapacityColumnPresent,
    latitudeColumnPresent,
    longitudeColumnPresent,
    fileDateColumnPresent,
    capacityNonEmptyCount,
    capacityEmptyCount,
    rowCount,
    phase6CapacityAbsentClaimCorrected: true,
    coordinatesStillAbsent: !latitudeColumnPresent && !longitudeColumnPresent,
  };
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}

export const CALIFORNIA_PHASE7_PUBLICATION_BLOCKERS = [
  {
    id: "no-authoritative-iso-export-date",
    severity: "blocking" as const,
    summary:
      "No verified CDSS DownloadStateData ISO export/freshness timestamp; filename MMDDYYYY, download timestamp, HTTP Date, CHHS file_date text, and GIS edit clocks remain non-authoritative. Gate stays blocked.",
  },
  {
    id: "coordinates-absent-from-download",
    severity: "blocking" as const,
    summary:
      "DownloadStateData has no latitude/longitude columns; coordinate-ready publication fields remain incomplete from this source alone.",
  },
  {
    id: "capacity-parser-gap-and-empty-cells",
    severity: "blocking" as const,
    summary:
      "Facility Capacity exists in DownloadStateData but the Transparency core parser historically dropped it; empty capacity cells remain on many CLOSED/PENDING rows. Parser mapping and empty-cell policy are still required before publication.",
  },
  {
    id: "closed-application-withdrawn-mapping-gap",
    severity: "blocking" as const,
    summary:
      "Download CLOSED includes FacilityDetail Application Withdrawn; Closed* subtype mapping is still required for withdrawn vs closed.",
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
      "Invalid identifiers (e.g. 95354) and documented exceptional IDs must remain fail-closed excluded or specially handled; none may bypass the publication gate.",
  },
  {
    id: "sample-insufficient-for-publication",
    severity: "blocking" as const,
    summary:
      "Bounded FacilityDetail samples and Phase 7 accounting cannot approve California publication.",
  },
] as const;

export const CALIFORNIA_PHASE7_READINESS_MATRIX = {
  reliableSourceAndDate: false,
  freshnessRequirementSatisfied: false,
  verifiedCurrentStatusRosterWide: false,
  uniqueValidIdentifiers: false,
  correctRcfeArfCategories: true,
  statusClassificationRulesDefined: true,
  exclusiveBucketAccountingInvariant: true,
  phase6FiveRecordGapResolved: true,
  capacityColumnPresentInDownload: true,
  capacityMappedThroughCoreParser: false,
  coordinatesPresentInDownload: false,
  closedSubtypeMappingComplete: false,
  verifiedDisclosureLinks: false,
  sampleVerificationSufficient: false,
  publication: "unpublished" as const,
  ownerClaimEligible: false,
  allowsPublication: false,
  blockers: CALIFORNIA_PHASE7_PUBLICATION_BLOCKERS,
} as const;

/**
 * Observed Phase 7 live accounting for the same DownloadStateData snapshot as
 * Phase 3–6 (sha256 unchanged). Gate remains blocked / unpublished.
 */
export const CALIFORNIA_PHASE7_OBSERVED_COUNTS = {
  rcfeRows: 13337,
  arfRows: 11040,
  rowCount: 24377,
  buckets: {
    "active-candidate": 15413,
    "restricted-candidate": 38,
    excluded: 8921,
    "exception-documented-exclude": 5,
  },
  phase6ThreeBucketSum: 24372,
  phase6ApparentGap: 5,
  exceptionDocumentedExcludeIds: CALIFORNIA_PHASE7_PHASE6_EXCEPTION_OUTCOME_IDS,
  publicationCandidatesIfGateOpened: 15451,
  invalidIdentifiers: 1,
  duplicateLicenseIds: 0,
  missingAddresses: 38,
  downloadSha256: {
    rcfe: "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
    arf: "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
  },
  authoritativeIsoExportDate: null,
} as const;
