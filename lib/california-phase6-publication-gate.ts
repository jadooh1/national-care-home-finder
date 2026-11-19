/**
 * California Phase 6 — deterministic, read-only publication-gate evaluator
 * over official CDSS DownloadStateData records. Does not publish California.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE6_OBSERVED_ON = "2026-11-19";

export const CALIFORNIA_PHASE6_DOWNLOAD_PAGE =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?rewrite=downloaddata";
export const CALIFORNIA_PHASE6_DOWNLOAD_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData";
export const CALIFORNIA_PHASE6_FACILITY_DETAIL_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/";
export const CALIFORNIA_PHASE6_FACILITY_DETAIL_PAGE_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";

export const CALIFORNIA_PHASE6_DOWNLOAD_IDS = {
  rcfe: "ResidentialElderCareFacility",
  arf: "AdultResidentialFacilities",
} as const;

/** Coarse DownloadStateData Facility Status domain. */
export const CALIFORNIA_PHASE6_DOWNLOAD_STATUSES = [
  "LICENSED",
  "CLOSED",
  "PENDING",
  "ON PROBATION",
] as const;

export type CaliforniaPhase6DownloadStatus =
  (typeof CALIFORNIA_PHASE6_DOWNLOAD_STATUSES)[number];

export type CaliforniaPhase6File = "RCFE" | "ARF";

/**
 * Official download Facility Type strings (and short aliases used in planning).
 * RCFE-CCRC → RCFE-CONTINUING CARE RETIREMENT COMMUNITY
 * EBSH-ARF → ENHANCED BEHAVIORAL SUPPORTS HOME - ARF
 * ARFPSHN → ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS
 * CCH-ARF → COMMUNITY CRISIS HOME - ARF
 */
export const CALIFORNIA_PHASE6_RCFE_ELIGIBLE_TYPES = [
  "RESIDENTIAL CARE ELDERLY",
  "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
] as const;

export const CALIFORNIA_PHASE6_RCFE_TYPE_ALIASES = {
  RCFE: "RESIDENTIAL CARE ELDERLY",
  "RCFE-CCRC": "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
} as const;

export const CALIFORNIA_PHASE6_ARF_ELIGIBLE_TYPES = [
  "ADULT RESIDENTIAL",
  "ENHANCED BEHAVIORAL SUPPORTS HOME - ARF",
  "ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS",
  "COMMUNITY CRISIS HOME - ARF",
] as const;

export const CALIFORNIA_PHASE6_ARF_TYPE_ALIASES = {
  ARF: "ADULT RESIDENTIAL",
  "EBSH-ARF": "ENHANCED BEHAVIORAL SUPPORTS HOME - ARF",
  ARFPSHN:
    "ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS",
  "CCH-ARF": "COMMUNITY CRISIS HOME - ARF",
} as const;

export const CALIFORNIA_PHASE6_ARF_OUT_OF_SCOPE_TYPES = {
  "ADULT DAY PROGRAM": {
    reason: "non-residential-day-program",
    official:
      "Less than 24-hour day-care setting; not a 24-hour adult residential facility.",
  },
  "SOCIAL REHABILITATION FACILITY": {
    reason: "specialty-mental-health-residential",
    official:
      "24-hour group setting for adults recovering from mental illness; distinct SRF program.",
  },
  "RESIDENTIAL FACILITY CHRONICALLY ILL": {
    reason: "specialty-rcfci",
    official:
      "RCFCI specialty residential for HIV/AIDS or terminal illness; distinct from ARF.",
  },
  "MEDICAL FOSTER HOMES FOR VETERANS": {
    reason: "specialty-mfhv",
    official:
      "VA-collaborative medical foster home; distinct MFHV program, not ARF-family.",
  },
} as const;

export type CaliforniaPhase6StatusClass =
  | "active-candidate"
  | "restricted-candidate"
  | "pending-ineligible"
  | "closed-ineligible"
  | "withdrawn-ineligible"
  | "unknown-ineligible";

export type CaliforniaPhase6CategoryClass =
  | "eligible-rcfe"
  | "eligible-arf-family"
  | "out-of-scope"
  | "blank-type-ineligible"
  | "unknown-type-ineligible";

export type CaliforniaPhase6ExclusionReason =
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

export type CaliforniaPhase6RowOutcome =
  | "active-candidate"
  | "restricted-candidate"
  | "excluded"
  | "exception";

export type CaliforniaPhase6DownloadRow = {
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
  /** DownloadStateData has no capacity column; optional for alternate sources only. */
  capacity?: string | number | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

export const CALIFORNIA_PHASE6_DOWNLOAD_OBSERVED = {
  rcfe: {
    filename: "ResidentialElderCareFacility11152026.csv",
    rowCount: 13337,
    sha256: "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
    filenameIsoCandidate: "2026-11-15",
  },
  arf: {
    filename: "AdultResidentialFacilities11152026.csv",
    rowCount: 11040,
    sha256: "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
    filenameIsoCandidate: "2026-11-15",
  },
  authoritativeIsoExportDate: null as null,
  freshnessEvidence: {
    contentDispositionFilenameDateOnly: true,
    httpLastModifiedPresent: false,
    csvBodyFileDateColumnPresent: false,
    facilityDetailExportTimestampPresent: false,
    chhsRawFileDateText: "05252025",
    chhsFileDateIsAuthoritativeIso: false,
    filenameIsoIsAuthoritative: false,
  },
} as const;

/**
 * Evidence-based freshness rule: publication requires a verified authoritative
 * ISO export date from CDSS DownloadStateData (or an equally authoritative
 * official timestamp). Filename MMDDYYYY and CHHS file_date text are not enough.
 */
export const CALIFORNIA_PHASE6_FRESHNESS_REQUIREMENT = {
  requiresAuthoritativeIsoExportDate: true,
  acceptsFilenameMmddyyyyAlone: false,
  acceptsChhsFileDateTextAlone: false,
  acceptsHttpLastModifiedAlone: false,
  acceptsGisDataLastEditAlone: false,
  maxAgeDaysWhenAuthoritativeIsoPresent: 90,
  currentAuthoritativeIsoExportDate: null as null,
  gateBlockedReason:
    "No authoritative ISO export date verified on DownloadStateData; publication gate stays blocked.",
} as const;

export const CALIFORNIA_PHASE6_PROVENANCE = {
  downloadPage: CALIFORNIA_PHASE6_DOWNLOAD_PAGE,
  downloadApi: CALIFORNIA_PHASE6_DOWNLOAD_API,
  facilityDetailApi: CALIFORNIA_PHASE6_FACILITY_DETAIL_API,
  facilityDetailPagePrefix: CALIFORNIA_PHASE6_FACILITY_DETAIL_PAGE_PREFIX,
  downloadIds: CALIFORNIA_PHASE6_DOWNLOAD_IDS,
  limitations: [
    "DownloadStateData is the official bulk roster candidate; FacilityDetail remains the live status detail source.",
    "No authoritative ISO export or verified freshness timestamp was found on DownloadStateData.",
    "Download CSV has no capacity or coordinate columns; those fields cannot be verified from this source alone.",
    "CLOSED download rows can be Application Withdrawn on FacilityDetail (mapping-gap).",
    "ARF download includes out-of-scope types (ADP, SRF, RCFCI, MFHV) and blank facility types.",
    "California remains unpublished; owner claims stay ineligible.",
  ],
} as const;

const FACILITY_NUMBER = /^\d{8,9}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function text(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value).trim();
}

function upper(value: string | number | null | undefined): string {
  return text(value).toUpperCase();
}

export function isCaliforniaPhase6FacilityNumber(value: string): boolean {
  return FACILITY_NUMBER.test(text(value));
}

export function normalizeCaliforniaPhase6FacilityType(
  facilityType: string | null | undefined,
): string {
  const raw = text(facilityType);
  if (!raw) return "";
  const alias =
    (CALIFORNIA_PHASE6_RCFE_TYPE_ALIASES as Record<string, string>)[raw]
    ?? (CALIFORNIA_PHASE6_ARF_TYPE_ALIASES as Record<string, string>)[raw];
  return alias ?? raw;
}

export function classifyCaliforniaPhase6DownloadStatus(
  downloadStatus: string,
): CaliforniaPhase6StatusClass {
  const status = upper(downloadStatus);
  if (status === "LICENSED") return "active-candidate";
  if (status === "ON PROBATION") return "restricted-candidate";
  if (status === "PENDING") return "pending-ineligible";
  if (status === "CLOSED") {
    // Coarse CLOSED may include Application Withdrawn; treat as closed-ineligible
    // for publication candidates until FacilityDetail confirms Closed* vs withdrawn.
    return "closed-ineligible";
  }
  return "unknown-ineligible";
}

export function classifyCaliforniaPhase6Category(
  file: CaliforniaPhase6File,
  facilityType: string | null | undefined,
): {
  eligibility: CaliforniaPhase6CategoryClass;
  reason: string;
  normalizedType: string;
} {
  const normalizedType = normalizeCaliforniaPhase6FacilityType(facilityType) || "(blank)";
  if (normalizedType === "(blank)") {
    return {
      eligibility: "blank-type-ineligible",
      reason: "Facility Type blank in download.",
      normalizedType,
    };
  }
  if (file === "RCFE") {
    if ((CALIFORNIA_PHASE6_ARF_ELIGIBLE_TYPES as readonly string[]).includes(normalizedType)
      || normalizedType in CALIFORNIA_PHASE6_ARF_OUT_OF_SCOPE_TYPES) {
      return {
        eligibility: "unknown-type-ineligible",
        reason: "Non-RCFE type found in RCFE download.",
        normalizedType,
      };
    }
    if ((CALIFORNIA_PHASE6_RCFE_ELIGIBLE_TYPES as readonly string[]).includes(normalizedType)) {
      return {
        eligibility: "eligible-rcfe",
        reason: "Official RCFE / RCFE-CCRC residential elderly type.",
        normalizedType,
      };
    }
    return {
      eligibility: "unknown-type-ineligible",
      reason: "Unrecognized RCFE Facility Type.",
      normalizedType,
    };
  }

  if ((CALIFORNIA_PHASE6_ARF_ELIGIBLE_TYPES as readonly string[]).includes(normalizedType)) {
    return {
      eligibility: "eligible-arf-family",
      reason: "Official ARF-family 24-hour residential type.",
      normalizedType,
    };
  }
  if (normalizedType in CALIFORNIA_PHASE6_ARF_OUT_OF_SCOPE_TYPES) {
    const meta = CALIFORNIA_PHASE6_ARF_OUT_OF_SCOPE_TYPES[
      normalizedType as keyof typeof CALIFORNIA_PHASE6_ARF_OUT_OF_SCOPE_TYPES
    ];
    return {
      eligibility: "out-of-scope",
      reason: `${meta.reason}: ${meta.official}`,
      normalizedType,
    };
  }
  return {
    eligibility: "unknown-type-ineligible",
    reason: "Unrecognized ARF-download Facility Type.",
    normalizedType,
  };
}

export function hasCaliforniaPhase6Address(
  row: Pick<
    CaliforniaPhase6DownloadRow,
    "facilityAddress" | "facilityCity" | "facilityState" | "facilityZip"
  >,
): boolean {
  return Boolean(
    text(row.facilityAddress)
    && text(row.facilityCity)
    && text(row.facilityState)
    && text(row.facilityZip),
  );
}

export function hasCaliforniaPhase6Capacity(
  row: Pick<CaliforniaPhase6DownloadRow, "capacity">,
): boolean {
  if (row.capacity === undefined) return false;
  const value = text(row.capacity);
  if (!value) return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}

export function hasCaliforniaPhase6Coordinates(
  row: Pick<CaliforniaPhase6DownloadRow, "latitude" | "longitude">,
): boolean {
  if (row.latitude === undefined && row.longitude === undefined) return false;
  const lat = Number(text(row.latitude));
  const lon = Number(text(row.longitude));
  return Number.isFinite(lat)
    && Number.isFinite(lon)
    && lat >= -90
    && lat <= 90
    && lon >= -180
    && lon <= 180
    && !(lat === 0 && lon === 0);
}

/**
 * Adopt an authoritative ISO export date only when the date is a verified
 * ISO string from an official CDSS export timestamp channel. Filename stamps
 * and CHHS file_date text never qualify.
 */
export function adoptCaliforniaPhase6AuthoritativeExportDate(
  candidate: string | null | undefined,
  options: {
    source?:
      | "download-filename-mmddyyyy"
      | "chhs-file-date-text"
      | "http-last-modified"
      | "gis-data-last-edit"
      | "official-iso-export-timestamp";
  } = {},
): string | null {
  const value = text(candidate);
  if (!value || !ISO_DATE.test(value)) return null;
  if (options.source !== "official-iso-export-timestamp") return null;
  return value;
}

export function californiaPhase6FreshnessSatisfied(input: {
  authoritativeIsoExportDate: string | null;
  observedOn?: string;
  maxAgeDays?: number;
}): {
  satisfied: boolean;
  authoritativeIsoExportDate: string | null;
  ageDays: number | null;
  reason: string;
} {
  const exportDate = adoptCaliforniaPhase6AuthoritativeExportDate(
    input.authoritativeIsoExportDate,
    { source: "official-iso-export-timestamp" },
  );
  if (exportDate == null) {
    return {
      satisfied: false,
      authoritativeIsoExportDate: null,
      ageDays: null,
      reason: CALIFORNIA_PHASE6_FRESHNESS_REQUIREMENT.gateBlockedReason,
    };
  }
  const observedOn = text(input.observedOn) || CALIFORNIA_PHASE6_OBSERVED_ON;
  const maxAge =
    input.maxAgeDays
    ?? CALIFORNIA_PHASE6_FRESHNESS_REQUIREMENT.maxAgeDaysWhenAuthoritativeIsoPresent;
  const exportMs = Date.parse(`${exportDate}T00:00:00Z`);
  const observedMs = Date.parse(`${observedOn}T00:00:00Z`);
  if (!Number.isFinite(exportMs) || !Number.isFinite(observedMs)) {
    return {
      satisfied: false,
      authoritativeIsoExportDate: exportDate,
      ageDays: null,
      reason: "Authoritative ISO export date could not be dated against observedOn.",
    };
  }
  const ageDays = Math.floor((observedMs - exportMs) / 86_400_000);
  if (ageDays < 0) {
    return {
      satisfied: false,
      authoritativeIsoExportDate: exportDate,
      ageDays,
      reason: "Authoritative ISO export date is in the future relative to observedOn.",
    };
  }
  if (ageDays > maxAge) {
    return {
      satisfied: false,
      authoritativeIsoExportDate: exportDate,
      ageDays,
      reason: `Authoritative ISO export date is ${ageDays} days old (max ${maxAge}).`,
    };
  }
  return {
    satisfied: true,
    authoritativeIsoExportDate: exportDate,
    ageDays,
    reason: `Authoritative ISO export date ${exportDate} is within ${maxAge} days.`,
  };
}

export type CaliforniaPhase6RowEvaluation = {
  file: CaliforniaPhase6File;
  facilityNumber: string;
  facilityNumberValid: boolean;
  normalizedType: string;
  category: CaliforniaPhase6CategoryClass;
  status: CaliforniaPhase6StatusClass;
  outcome: CaliforniaPhase6RowOutcome;
  exclusionReasons: CaliforniaPhase6ExclusionReason[];
  exceptionId: string | null;
  missingAddress: boolean;
  capacityPresent: boolean;
  coordinatesPresent: boolean;
  publicationCandidate: false;
};

export type CaliforniaPhase6ExceptionRecord = {
  facilityNumber: string;
  file: CaliforniaPhase6File;
  classification: string;
  downloadStatus: string;
  downloadType: string;
  liveStatus: string | null;
  summary: string;
  gateImpact:
    | "exclude-invalid-id"
    | "exclude-out-of-scope"
    | "exclude-ineligible-status"
    | "document-only-eligible-if-rules-pass"
    | "exclude-withdrawn-mapping-gap";
};

const emptyExclusion = (): Record<CaliforniaPhase6ExclusionReason, number> => ({
  "invalid-identifier": 0,
  "blank-type": 0,
  "unknown-type": 0,
  "out-of-scope-type": 0,
  "pending-status": 0,
  "closed-status": 0,
  "withdrawn-status": 0,
  "unknown-status": 0,
  "duplicate-license": 0,
  "missing-address": 0,
});

export function evaluateCaliforniaPhase6Row(
  file: CaliforniaPhase6File,
  row: CaliforniaPhase6DownloadRow,
  options: {
    duplicateFacilityNumbers?: ReadonlySet<string>;
    exceptionsById?: ReadonlyMap<string, CaliforniaPhase6ExceptionRecord>;
  } = {},
): CaliforniaPhase6RowEvaluation {
  const facilityNumber = text(row.facilityNumber);
  const facilityNumberValid = isCaliforniaPhase6FacilityNumber(facilityNumber);
  const categoryResult = classifyCaliforniaPhase6Category(file, row.facilityType);
  const status = classifyCaliforniaPhase6DownloadStatus(row.facilityStatus);
  const missingAddress = !hasCaliforniaPhase6Address(row);
  const capacityPresent = hasCaliforniaPhase6Capacity(row);
  const coordinatesPresent = hasCaliforniaPhase6Coordinates(row);
  const exclusionReasons: CaliforniaPhase6ExclusionReason[] = [];
  const exception = options.exceptionsById?.get(facilityNumber) ?? null;

  if (!facilityNumberValid) exclusionReasons.push("invalid-identifier");
  if (categoryResult.eligibility === "blank-type-ineligible") {
    exclusionReasons.push("blank-type");
  } else if (categoryResult.eligibility === "out-of-scope") {
    exclusionReasons.push("out-of-scope-type");
  } else if (categoryResult.eligibility === "unknown-type-ineligible") {
    exclusionReasons.push("unknown-type");
  }
  if (status === "pending-ineligible") exclusionReasons.push("pending-status");
  if (status === "closed-ineligible") exclusionReasons.push("closed-status");
  if (status === "withdrawn-ineligible") exclusionReasons.push("withdrawn-status");
  if (status === "unknown-ineligible") exclusionReasons.push("unknown-status");
  if (options.duplicateFacilityNumbers?.has(facilityNumber)) {
    exclusionReasons.push("duplicate-license");
  }
  // Missing address is a quality flag; it excludes candidates that would otherwise pass.
  if (missingAddress) exclusionReasons.push("missing-address");

  const categoryOk = categoryResult.eligibility === "eligible-rcfe"
    || categoryResult.eligibility === "eligible-arf-family";
  const statusOk = status === "active-candidate" || status === "restricted-candidate";
  const hardBlocks = exclusionReasons.some(reason =>
    reason === "invalid-identifier"
    || reason === "blank-type"
    || reason === "unknown-type"
    || reason === "out-of-scope-type"
    || reason === "pending-status"
    || reason === "closed-status"
    || reason === "withdrawn-status"
    || reason === "unknown-status"
    || reason === "duplicate-license"
    || reason === "missing-address"
  );

  let outcome: CaliforniaPhase6RowOutcome = "excluded";
  if (exception && exception.gateImpact !== "document-only-eligible-if-rules-pass") {
    outcome = "exception";
  } else if (facilityNumberValid && categoryOk && statusOk && !hardBlocks) {
    outcome = status === "active-candidate" ? "active-candidate" : "restricted-candidate";
  } else if (exception) {
    outcome = "exception";
  } else {
    outcome = "excluded";
  }

  return {
    file,
    facilityNumber,
    facilityNumberValid,
    normalizedType: categoryResult.normalizedType,
    category: categoryResult.eligibility,
    status,
    outcome,
    exclusionReasons,
    exceptionId: exception?.facilityNumber ?? null,
    missingAddress,
    capacityPresent,
    coordinatesPresent,
    publicationCandidate: false,
  };
}

export type CaliforniaPhase6RosterCounts = {
  file: CaliforniaPhase6File;
  rowCount: number;
  activeCandidates: number;
  restrictedCandidates: number;
  excluded: number;
  exceptions: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  exclusionReasons: Record<CaliforniaPhase6ExclusionReason, number>;
  invalidIdentifiers: string[];
  duplicateFacilityNumbers: string[];
  missingAddressCount: number;
  capacityPresentCount: number;
  capacityMissingCount: number;
  coordinatesPresentCount: number;
  coordinatesMissingCount: number;
};

export type CaliforniaPhase6GateEvaluation = {
  observedOn: string;
  authoritativeIsoExportDate: null;
  freshness: ReturnType<typeof californiaPhase6FreshnessSatisfied>;
  rcfe: CaliforniaPhase6RosterCounts;
  arf: CaliforniaPhase6RosterCounts;
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
    capacityMissingFromDownload: number;
    coordinatesMissingFromDownload: number;
  };
  exceptions: CaliforniaPhase6ExceptionRecord[];
  gate: typeof CALIFORNIA_PHASE6_PUBLICATION_GATE;
  publication: "unpublished";
  ownerClaimEligible: false;
  allowsPublication: false;
};

function findDuplicateFacilityNumbers(
  rows: readonly CaliforniaPhase6DownloadRow[],
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of rows) {
    const id = text(row.facilityNumber);
    if (!id) continue;
    if (seen.has(id)) duplicates.add(id);
    else seen.add(id);
  }
  return [...duplicates].sort();
}

function summarizeFile(
  file: CaliforniaPhase6File,
  rows: readonly CaliforniaPhase6DownloadRow[],
  exceptionsById: ReadonlyMap<string, CaliforniaPhase6ExceptionRecord>,
): CaliforniaPhase6RosterCounts {
  const duplicateFacilityNumbers = findDuplicateFacilityNumbers(rows);
  const duplicateSet = new Set(duplicateFacilityNumbers);
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const exclusionReasons = emptyExclusion();
  const invalidIdentifiers = new Set<string>();
  let activeCandidates = 0;
  let restrictedCandidates = 0;
  let excluded = 0;
  let exceptions = 0;
  let missingAddressCount = 0;
  let capacityPresentCount = 0;
  let capacityMissingCount = 0;
  let coordinatesPresentCount = 0;
  let coordinatesMissingCount = 0;

  for (const row of rows) {
    const evaluation = evaluateCaliforniaPhase6Row(file, row, {
      duplicateFacilityNumbers: duplicateSet,
      exceptionsById,
    });
    const statusKey = upper(row.facilityStatus) || "(blank)";
    byStatus[statusKey] = (byStatus[statusKey] ?? 0) + 1;
    byType[evaluation.normalizedType] = (byType[evaluation.normalizedType] ?? 0) + 1;
    for (const reason of evaluation.exclusionReasons) {
      exclusionReasons[reason] += 1;
    }
    if (!evaluation.facilityNumberValid) {
      invalidIdentifiers.add(evaluation.facilityNumber || "(blank)");
    }
    if (evaluation.missingAddress) missingAddressCount += 1;
    if (evaluation.capacityPresent) capacityPresentCount += 1;
    else capacityMissingCount += 1;
    if (evaluation.coordinatesPresent) coordinatesPresentCount += 1;
    else coordinatesMissingCount += 1;

    if (evaluation.outcome === "active-candidate") activeCandidates += 1;
    else if (evaluation.outcome === "restricted-candidate") restrictedCandidates += 1;
    else if (evaluation.outcome === "exception") exceptions += 1;
    else excluded += 1;
  }

  return {
    file,
    rowCount: rows.length,
    activeCandidates,
    restrictedCandidates,
    excluded,
    exceptions,
    byStatus,
    byType,
    exclusionReasons,
    invalidIdentifiers: [...invalidIdentifiers].sort(),
    duplicateFacilityNumbers,
    missingAddressCount,
    capacityPresentCount,
    capacityMissingCount,
    coordinatesPresentCount,
    coordinatesMissingCount,
  };
}

export const CALIFORNIA_PHASE6_PUBLICATION_BLOCKERS = [
  {
    id: "no-authoritative-iso-export-date",
    severity: "blocking" as const,
    summary:
      "No verified CDSS DownloadStateData ISO export/freshness timestamp; filename MMDDYYYY and CHHS file_date text remain non-authoritative. Gate stays blocked.",
  },
  {
    id: "capacity-and-coordinates-absent-from-download",
    severity: "blocking" as const,
    summary:
      "DownloadStateData has no capacity or coordinate columns; publication-ready roster fields remain incomplete from this source alone.",
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
      "Invalid identifiers (e.g. 95354) and documented exceptional IDs must remain excluded or specially handled.",
  },
  {
    id: "sample-insufficient-for-publication",
    severity: "blocking" as const,
    summary:
      "Bounded FacilityDetail samples and Phase 6 gate evaluation cannot approve California publication.",
  },
] as const;

export const CALIFORNIA_PHASE6_PUBLICATION_GATE = {
  reliableSourceAndDate: false,
  freshnessRequirementSatisfied: false,
  verifiedCurrentStatusRosterWide: false,
  uniqueValidIdentifiers: false,
  correctRcfeArfCategories: true,
  statusClassificationRulesDefined: true,
  capacityAndCoordinatesFromDownload: false,
  closedSubtypeMappingComplete: false,
  verifiedDisclosureLinks: false,
  sampleVerificationSufficient: false,
  publication: "unpublished" as const,
  ownerClaimEligible: false,
  blockers: CALIFORNIA_PHASE6_PUBLICATION_BLOCKERS,
} as const;

export function evaluateCaliforniaPhase6PublicationGate(input: {
  observedOn?: string;
  rcfeRows: readonly CaliforniaPhase6DownloadRow[];
  arfRows: readonly CaliforniaPhase6DownloadRow[];
  exceptions?: readonly CaliforniaPhase6ExceptionRecord[];
  authoritativeIsoExportDate?: string | null;
}): CaliforniaPhase6GateEvaluation {
  const observedOn = input.observedOn ?? CALIFORNIA_PHASE6_OBSERVED_ON;
  const exceptions = [...(input.exceptions ?? [])];
  const exceptionsById = new Map(
    exceptions.map(row => [row.facilityNumber, row] as const),
  );
  // Filename / non-official sources never satisfy adoption; force null unless
  // an official ISO channel is explicitly provided (still expected null today).
  const authoritativeIsoExportDate = adoptCaliforniaPhase6AuthoritativeExportDate(
    input.authoritativeIsoExportDate ?? null,
    { source: "official-iso-export-timestamp" },
  );
  const freshness = californiaPhase6FreshnessSatisfied({
    authoritativeIsoExportDate,
    observedOn,
  });
  const rcfe = summarizeFile("RCFE", input.rcfeRows, exceptionsById);
  const arf = summarizeFile("ARF", input.arfRows, exceptionsById);
  const publicationCandidatesIfGateOpened =
    rcfe.activeCandidates
    + rcfe.restrictedCandidates
    + arf.activeCandidates
    + arf.restrictedCandidates;

  return {
    observedOn,
    authoritativeIsoExportDate: null,
    freshness,
    rcfe,
    arf,
    totals: {
      rowCount: rcfe.rowCount + arf.rowCount,
      activeCandidates: rcfe.activeCandidates + arf.activeCandidates,
      restrictedCandidates: rcfe.restrictedCandidates + arf.restrictedCandidates,
      publicationCandidatesIfGateOpened,
      excluded: rcfe.excluded + arf.excluded,
      exceptions: rcfe.exceptions + arf.exceptions,
      invalidIdentifiers:
        new Set([...rcfe.invalidIdentifiers, ...arf.invalidIdentifiers]).size,
      duplicateLicenseIds:
        rcfe.duplicateFacilityNumbers.length + arf.duplicateFacilityNumbers.length,
      missingAddresses: rcfe.missingAddressCount + arf.missingAddressCount,
      capacityMissingFromDownload:
        rcfe.capacityMissingCount + arf.capacityMissingCount,
      coordinatesMissingFromDownload:
        rcfe.coordinatesMissingCount + arf.coordinatesMissingCount,
    },
    exceptions,
    gate: CALIFORNIA_PHASE6_PUBLICATION_GATE,
    publication: "unpublished",
    ownerClaimEligible: false,
    allowsPublication: false,
  };
}

export function californiaPhase6AllowsPublication(
  evaluation: Pick<
    CaliforniaPhase6GateEvaluation,
    "allowsPublication" | "publication" | "freshness" | "gate"
  >,
): false {
  void evaluation;
  return false;
}

/**
 * Observed Phase 6 live counts for DownloadStateData snapshot
 * ResidentialElderCareFacility11152026.csv + AdultResidentialFacilities11152026.csv
 * (SHA256 matches Phase 3/4/5). Gate remains blocked / unpublished.
 */
export const CALIFORNIA_PHASE6_OBSERVED_COUNTS = {
  rcfeRows: 13337,
  arfRows: 11040,
  activeCandidates: 15413,
  restrictedCandidates: 38,
  publicationCandidatesIfGateOpened: 15451,
  excluded: 8921,
  exceptionOutcomes: 5,
  documentedExceptions: 6,
  invalidIdentifiers: 1,
  duplicateLicenseIds: 0,
  missingAddresses: 38,
  capacityMissingFromDownload: 24377,
  coordinatesMissingFromDownload: 24377,
  rcfe: {
    activeCandidates: 8625,
    restrictedCandidates: 25,
    excluded: 4687,
    exceptions: 0,
  },
  arf: {
    activeCandidates: 6788,
    restrictedCandidates: 13,
    excluded: 4234,
    exceptions: 5,
  },
} as const;
