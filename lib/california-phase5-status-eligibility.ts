/**
 * California Phase 5 — licensing-status discrepancies and RCFE/ARF eligibility
 * rules (read-only). Does not publish California.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE5_OBSERVED_ON = "2026-11-19";

export const CALIFORNIA_PHASE5_DOWNLOAD_PAGE =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?rewrite=downloaddata";
export const CALIFORNIA_PHASE5_DOWNLOAD_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData";
export const CALIFORNIA_PHASE5_FACILITY_DETAIL_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/";
export const CALIFORNIA_PHASE5_FACILITY_DETAIL_PAGE_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";

export const CALIFORNIA_PHASE5_OFFICIAL_STATUS_SOURCES = {
  pin2401Ccld:
    "https://clearpolappstorage.blob.core.windows.net/media/docs/user_1/document_25381/PIN%2024-01-CCLD.pdf",
  transparencyFaqLabels: [
    "Pending",
    "Revocation Action Pending",
    "License Suspended",
    "Probation",
  ] as const,
  adultFacilityTypes:
    "https://cdss.ca.gov/inforesources/adult-care-licensing/resources-for-residents-and-families",
  title22WithdrawalOfApplication: "CCR Title 22 §80029 Withdrawal of Application",
} as const;

/** Coarse DownloadStateData Facility Status domain (Phase 3/4 confirmed). */
export const CALIFORNIA_PHASE5_DOWNLOAD_STATUSES = [
  "LICENSED",
  "CLOSED",
  "PENDING",
  "ON PROBATION",
] as const;

export type CaliforniaPhase5DownloadStatus =
  (typeof CALIFORNIA_PHASE5_DOWNLOAD_STATUSES)[number];

/**
 * Official / observed FacilityDetail status labels.
 * PIN 24-01-CCLD states the Transparency Site displays Licensed, Pending,
 * Closed, or On Probation; FacilityDetail returns finer Closed* subtypes and
 * Application Withdrawn. FAQ text defines Pending, Probation, License Suspended,
 * and Revocation Action Pending.
 */
export const CALIFORNIA_PHASE5_FACILITY_DETAIL_STATUS_DEFINITIONS = {
  Licensed: {
    source: "PIN 24-01-CCLD display domain + FacilityDetail observation",
    meaning: "Facility holds a current license authorizing operation.",
    operating: true,
  },
  Pending: {
    source: "CDSS Transparency FAQ",
    meaning:
      "The State is processing an application for licensure, but the facility is not yet licensed.",
    operating: false,
  },
  "On Probation": {
    source: "PIN 24-01-CCLD display domain",
    meaning: "Facility may operate under probation terms (see Probation FAQ).",
    operating: true,
  },
  Probation: {
    source: "CDSS Transparency FAQ",
    meaning:
      "Period during which a facility must comply with specific terms and conditions to prevent license revocation.",
    operating: true,
  },
  "Probationary License": {
    source: "FacilityDetail observation (maps from download ON PROBATION)",
    meaning:
      "Live FacilityDetail label corresponding to DownloadStateData ON PROBATION in Phase 5 samples.",
    operating: true,
  },
  Closed: {
    source: "PIN 24-01-CCLD display domain",
    meaning: "Facility is no longer operating under the prior license record.",
    operating: false,
  },
  "Closed, Licensee Initiated": {
    source: "FacilityDetail observation",
    meaning: "Closed subtype; licensee initiated closure.",
    operating: false,
  },
  "Closed, Change of Ownership": {
    source: "FacilityDetail observation",
    meaning: "Closed subtype; ownership change.",
    operating: false,
  },
  "Closed, Change of Location": {
    source: "FacilityDetail observation",
    meaning: "Closed subtype; location change.",
    operating: false,
  },
  "Closed, Agency Initiated": {
    source: "FacilityDetail observation",
    meaning: "Closed subtype; agency initiated closure.",
    operating: false,
  },
  "Application Withdrawn": {
    source:
      "FacilityDetail observation + CCR Title 22 §80029 Withdrawal of Application",
    meaning:
      "Applicant withdrew the licensing application. Not a Closed* licensed-facility closure; DownloadStateData still labels these rows CLOSED.",
    operating: false,
  },
  "License Suspended": {
    source: "CDSS Transparency FAQ",
    meaning:
      "The State has closed the facility due to an imminent risk of harm; remains closed pending final decision.",
    operating: false,
  },
  "Revocation Action Pending": {
    source: "CDSS Transparency FAQ",
    meaning:
      "The State has filed a legal action to revoke the license; facility may remain open during the process.",
    operating: true,
  },
} as const;

export const CALIFORNIA_PHASE5_RCFE_ELIGIBLE_TYPES = [
  "RESIDENTIAL CARE ELDERLY",
  "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
] as const;

/** ARF-family 24-hour residential types in scope for a residential care-home roster. */
export const CALIFORNIA_PHASE5_ARF_ELIGIBLE_TYPES = [
  "ADULT RESIDENTIAL",
  "ENHANCED BEHAVIORAL SUPPORTS HOME - ARF",
  "ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS",
  "COMMUNITY CRISIS HOME - ARF",
] as const;

/**
 * Distinct CDSS adult/senior types that appear inside the AdultResidentialFacilities
 * download but are outside the ARF-family residential care-home product scope.
 * Definitions: CDSS Adult Care Licensing resources for residents and families.
 */
export const CALIFORNIA_PHASE5_ARF_OUT_OF_SCOPE_TYPES = {
  "ADULT DAY PROGRAM": {
    reason: "non-residential-day-program",
    official:
      "Less than 24-hour day-care setting; not a 24-hour adult residential facility.",
  },
  "SOCIAL REHABILITATION FACILITY": {
    reason: "specialty-mental-health-residential",
    official:
      "24-hour group setting for adults recovering from mental illness; distinct SRF program (DHCS certification).",
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

export const CALIFORNIA_PHASE5_DOWNLOAD_OBSERVED = {
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
  authoritativeIsoExportDate: null,
  freshnessEvidence: {
    contentDispositionFilenameDateOnly: true,
    httpLastModifiedPresent: false,
    csvBodyFileDateColumnPresent: false,
    facilityDetailExportTimestampPresent: false,
    chhsRawFileDateText: "05252025",
    chhsFileDateIsAuthoritativeIso: false,
  },
} as const;

export const CALIFORNIA_PHASE5_CONFLICT_OBSERVED = {
  totalExactIdStatusConflicts: 2520,
  rcfe: 1520,
  arf: 1000,
  historicalFileDateText: "05252025",
  downloadFilenameIsoCandidate: "2026-11-15",
} as const;

export const CALIFORNIA_PHASE5_PROVENANCE = {
  downloadPage: CALIFORNIA_PHASE5_DOWNLOAD_PAGE,
  downloadApi: CALIFORNIA_PHASE5_DOWNLOAD_API,
  facilityDetailApi: CALIFORNIA_PHASE5_FACILITY_DETAIL_API,
  facilityDetailPagePrefix: CALIFORNIA_PHASE5_FACILITY_DETAIL_PAGE_PREFIX,
  officialStatusSources: CALIFORNIA_PHASE5_OFFICIAL_STATUS_SOURCES,
  limitations: [
    "DownloadStateData uses a four-value coarse status domain; FacilityDetail exposes Closed* subtypes and Application Withdrawn.",
    "No authoritative ISO export or verified freshness timestamp was found on DownloadStateData, FacilityDetail, or CHHS file_date text.",
    "Historical-versus-download status conflicts are dominated by expected time drift between CHHS 05252025 and download 11152026 candidate.",
    "CLOSED download rows can be Application Withdrawn on FacilityDetail and must not be treated as Closed* licensed-facility closures.",
    "ARF download includes out-of-scope types (ADP, SRF, RCFCI, MFHV) and blank facility types.",
    "Sample FacilityDetail verification cannot approve roster-wide publication.",
    "California remains unpublished; owner claims stay ineligible.",
  ],
} as const;

export type CaliforniaPhase5File = "RCFE" | "ARF";

export type CaliforniaPhase5HistoricalConflictClass =
  | "expected-time-drift"
  | "historical-data-defect"
  | "possible-relicense"
  | "unusual-transition"
  | "unknown";

export type CaliforniaPhase5DownloadVsFacilityDetailRelation =
  | "match"
  | "mapping-gap"
  | "conflict"
  | "missing-live"
  | "invalid-download-id";

export type CaliforniaPhase5StatusEligibility =
  | "active-candidate"
  | "active-restricted"
  | "pending-ineligible"
  | "closed-ineligible"
  | "withdrawn-ineligible"
  | "suspended-ineligible"
  | "unknown-ineligible";

export type CaliforniaPhase5CategoryEligibility =
  | "eligible-rcfe"
  | "eligible-arf-family"
  | "out-of-scope"
  | "blank-type-ineligible"
  | "unknown-type-ineligible";

export type CaliforniaPhase5RowEligibility =
  | "eligible-active-candidate"
  | "eligible-active-restricted"
  | "ineligible";

const FACILITY_NUMBER = /^\d{8,9}$/;
const LOOKS_LIKE_DATE_STATUS = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function upper(value: string | null | undefined): string {
  return text(value).toUpperCase();
}

export function isCaliforniaPhase5FacilityNumber(value: string): boolean {
  return FACILITY_NUMBER.test(text(value));
}

export function isCaliforniaPhase5ClosedFacilityDetailStatus(liveStatus: string): boolean {
  return /^Closed(?:$|[, ])/i.test(text(liveStatus));
}

export function isCaliforniaPhase5ApplicationWithdrawn(liveStatus: string): boolean {
  return /^application withdrawn$/i.test(text(liveStatus));
}

export function isCaliforniaPhase5ProbationFacilityDetailStatus(liveStatus: string): boolean {
  const live = text(liveStatus).toLowerCase();
  return live === "probation"
    || live === "probationary license"
    || live === "on probation"
    || live.includes("probation");
}

/**
 * Classify a historical CHHS vs DownloadStateData status pair on an exact ID match.
 * Does not call FacilityDetail; used to separate expected drift from defects.
 */
export function classifyCaliforniaPhase5HistoricalStatusConflict(
  historicalStatus: string,
  downloadStatus: string,
  options: {
    historicalClosedDate?: string | null;
    downloadLicenseFirstDate?: string | null;
  } = {},
): CaliforniaPhase5HistoricalConflictClass {
  const hist = upper(historicalStatus);
  const download = upper(downloadStatus);
  if (!hist || !download || hist === download) return "unknown";
  if (LOOKS_LIKE_DATE_STATUS.test(hist) || !CALIFORNIA_PHASE5_DOWNLOAD_STATUSES.includes(
    hist as CaliforniaPhase5DownloadStatus,
  )) {
    return "historical-data-defect";
  }
  if (!CALIFORNIA_PHASE5_DOWNLOAD_STATUSES.includes(download as CaliforniaPhase5DownloadStatus)) {
    return "unknown";
  }

  const expectedDrift = new Set([
    "LICENSED -> CLOSED",
    "LICENSED -> ON PROBATION",
    "PENDING -> LICENSED",
    "PENDING -> CLOSED",
    "PENDING -> ON PROBATION",
    "ON PROBATION -> LICENSED",
    "ON PROBATION -> CLOSED",
  ]);
  const key = `${hist} -> ${download}`;
  if (expectedDrift.has(key)) return "expected-time-drift";

  if (hist === "CLOSED" && download === "LICENSED") {
    const closed = text(options.historicalClosedDate);
    const first = text(options.downloadLicenseFirstDate);
    if (closed && first) return "possible-relicense";
    return "unusual-transition";
  }
  if (hist === "LICENSED" && download === "PENDING") return "unusual-transition";
  if (hist === "CLOSED" && (download === "PENDING" || download === "ON PROBATION")) {
    return "unusual-transition";
  }
  return "unknown";
}

export function summarizeCaliforniaPhase5HistoricalConflicts(
  conflicts: readonly {
    historicalStatus: string;
    downloadStatus: string;
    historicalClosedDate?: string | null;
    downloadLicenseFirstDate?: string | null;
  }[],
): Record<CaliforniaPhase5HistoricalConflictClass, number> & { total: number } {
  const counts: Record<CaliforniaPhase5HistoricalConflictClass, number> = {
    "expected-time-drift": 0,
    "historical-data-defect": 0,
    "possible-relicense": 0,
    "unusual-transition": 0,
    unknown: 0,
  };
  for (const row of conflicts) {
    const classification = classifyCaliforniaPhase5HistoricalStatusConflict(
      row.historicalStatus,
      row.downloadStatus,
      {
        historicalClosedDate: row.historicalClosedDate,
        downloadLicenseFirstDate: row.downloadLicenseFirstDate,
      },
    );
    counts[classification] += 1;
  }
  return { ...counts, total: conflicts.length };
}

/**
 * Relate coarse DownloadStateData status to live FacilityDetail STATUS.
 * Application Withdrawn is a mapping-gap against CLOSED, not a Closed* match.
 */
export function relateCaliforniaPhase5DownloadToFacilityDetail(
  downloadStatus: string,
  liveStatus: string | null,
  options: { downloadFacilityNumber?: string } = {},
): CaliforniaPhase5DownloadVsFacilityDetailRelation {
  const downloadId = text(options.downloadFacilityNumber);
  if (downloadId && !isCaliforniaPhase5FacilityNumber(downloadId)) {
    return "invalid-download-id";
  }
  if (!liveStatus || text(liveStatus) === "") return "missing-live";

  const download = upper(downloadStatus);
  const live = text(liveStatus);

  if (download === "LICENSED" && /^licensed$/i.test(live)) return "match";
  if (download === "PENDING" && /^pending$/i.test(live)) return "match";
  if (download === "ON PROBATION" && isCaliforniaPhase5ProbationFacilityDetailStatus(live)) {
    return "match";
  }
  if (download === "CLOSED") {
    if (isCaliforniaPhase5ApplicationWithdrawn(live)) return "mapping-gap";
    if (isCaliforniaPhase5ClosedFacilityDetailStatus(live)) return "match";
    return "conflict";
  }
  return "conflict";
}

export function classifyCaliforniaPhase5FacilityDetailStatus(
  liveStatus: string | null,
): CaliforniaPhase5StatusEligibility {
  if (!liveStatus || text(liveStatus) === "") return "unknown-ineligible";
  const live = text(liveStatus);
  if (/^licensed$/i.test(live)) return "active-candidate";
  if (isCaliforniaPhase5ProbationFacilityDetailStatus(live)) return "active-restricted";
  if (/^revocation action pending$/i.test(live)) return "active-restricted";
  if (/^pending$/i.test(live)) return "pending-ineligible";
  if (isCaliforniaPhase5ApplicationWithdrawn(live)) return "withdrawn-ineligible";
  if (/^license suspended$/i.test(live) || /suspended/i.test(live)) {
    return "suspended-ineligible";
  }
  if (isCaliforniaPhase5ClosedFacilityDetailStatus(live)) return "closed-ineligible";
  return "unknown-ineligible";
}

export function classifyCaliforniaPhase5DownloadStatus(
  downloadStatus: string,
): CaliforniaPhase5StatusEligibility {
  const status = upper(downloadStatus);
  if (status === "LICENSED") return "active-candidate";
  if (status === "ON PROBATION") return "active-restricted";
  if (status === "PENDING") return "pending-ineligible";
  if (status === "CLOSED") {
    // CLOSED is coarse; may include Application Withdrawn. Treat as closed-ineligible
    // until FacilityDetail confirms Closed* vs withdrawn.
    return "closed-ineligible";
  }
  return "unknown-ineligible";
}

export function classifyCaliforniaPhase5Category(
  file: CaliforniaPhase5File,
  facilityType: string | null | undefined,
): {
  eligibility: CaliforniaPhase5CategoryEligibility;
  reason: string;
  normalizedType: string;
} {
  const normalizedType = text(facilityType) || "(blank)";
  if (normalizedType === "(blank)") {
    return {
      eligibility: "blank-type-ineligible",
      reason: "Facility Type blank in download; FacilityDetail sample also blank.",
      normalizedType,
    };
  }
  if (file === "RCFE") {
    if ((CALIFORNIA_PHASE5_ARF_ELIGIBLE_TYPES as readonly string[]).includes(normalizedType)
      || normalizedType in CALIFORNIA_PHASE5_ARF_OUT_OF_SCOPE_TYPES) {
      return {
        eligibility: "unknown-type-ineligible",
        reason: "Non-RCFE type found in RCFE download.",
        normalizedType,
      };
    }
    if ((CALIFORNIA_PHASE5_RCFE_ELIGIBLE_TYPES as readonly string[]).includes(normalizedType)) {
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

  if ((CALIFORNIA_PHASE5_ARF_ELIGIBLE_TYPES as readonly string[]).includes(normalizedType)) {
    return {
      eligibility: "eligible-arf-family",
      reason: "Official ARF-family 24-hour residential type.",
      normalizedType,
    };
  }
  if (normalizedType in CALIFORNIA_PHASE5_ARF_OUT_OF_SCOPE_TYPES) {
    const meta = CALIFORNIA_PHASE5_ARF_OUT_OF_SCOPE_TYPES[
      normalizedType as keyof typeof CALIFORNIA_PHASE5_ARF_OUT_OF_SCOPE_TYPES
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

export function evaluateCaliforniaPhase5RowEligibility(input: {
  file: CaliforniaPhase5File;
  facilityNumber: string;
  facilityType: string | null | undefined;
  downloadStatus: string;
  liveStatus?: string | null;
}): {
  facilityNumberValid: boolean;
  category: ReturnType<typeof classifyCaliforniaPhase5Category>;
  status: CaliforniaPhase5StatusEligibility;
  downloadVsLive: CaliforniaPhase5DownloadVsFacilityDetailRelation | null;
  rowEligibility: CaliforniaPhase5RowEligibility;
  publicationCandidate: false;
} {
  const facilityNumberValid = isCaliforniaPhase5FacilityNumber(input.facilityNumber);
  const category = classifyCaliforniaPhase5Category(input.file, input.facilityType);
  const hasLive = input.liveStatus !== undefined;
  const status = hasLive
    ? classifyCaliforniaPhase5FacilityDetailStatus(input.liveStatus ?? null)
    : classifyCaliforniaPhase5DownloadStatus(input.downloadStatus);
  const downloadVsLive = hasLive
    ? relateCaliforniaPhase5DownloadToFacilityDetail(
      input.downloadStatus,
      input.liveStatus ?? null,
      { downloadFacilityNumber: input.facilityNumber },
    )
    : null;

  const categoryOk = category.eligibility === "eligible-rcfe"
    || category.eligibility === "eligible-arf-family";
  const statusOk = status === "active-candidate" || status === "active-restricted";
  // Live mapping-gap / withdrawn / invalid ID / missing live always ineligible.
  const liveBlocksEligibility = downloadVsLive === "mapping-gap"
    || downloadVsLive === "invalid-download-id"
    || downloadVsLive === "missing-live"
    || status === "withdrawn-ineligible";

  let rowEligibility: CaliforniaPhase5RowEligibility = "ineligible";
  if (facilityNumberValid && categoryOk && statusOk && !liveBlocksEligibility) {
    rowEligibility = status === "active-candidate"
      ? "eligible-active-candidate"
      : "eligible-active-restricted";
  }

  return {
    facilityNumberValid,
    category,
    status,
    downloadVsLive,
    rowEligibility,
    publicationCandidate: false,
  };
}

export type CaliforniaPhase5FacilityDetailSampleRow = {
  facilityNumber: string;
  file: CaliforniaPhase5File;
  downloadStatus: string;
  downloadType?: string | null;
  liveStatus?: string | null;
  liveFacilityType?: string | null;
  relation?: CaliforniaPhase5DownloadVsFacilityDetailRelation;
  stratum?: string;
};

export type CaliforniaPhase5FacilityDetailSampleSummary = {
  sampleSize: number;
  match: number;
  "mapping-gap": number;
  conflict: number;
  "missing-live": number;
  "invalid-download-id": number;
  applicationWithdrawnGaps: number;
  sampleIsStatewideConclusion: false;
  publication: "unpublished";
  ownerClaimEligible: false;
};

export function summarizeCaliforniaPhase5FacilityDetailSample(
  rows: readonly CaliforniaPhase5FacilityDetailSampleRow[],
): CaliforniaPhase5FacilityDetailSampleSummary {
  const counts = {
    match: 0,
    "mapping-gap": 0,
    conflict: 0,
    "missing-live": 0,
    "invalid-download-id": 0,
  };
  let applicationWithdrawnGaps = 0;
  for (const row of rows) {
    const relation = row.relation
      ?? relateCaliforniaPhase5DownloadToFacilityDetail(
        row.downloadStatus,
        row.liveStatus ?? null,
        { downloadFacilityNumber: row.facilityNumber },
      );
    counts[relation] += 1;
    if (relation === "mapping-gap"
      || isCaliforniaPhase5ApplicationWithdrawn(row.liveStatus ?? "")) {
      applicationWithdrawnGaps += 1;
    }
  }
  return {
    sampleSize: rows.length,
    ...counts,
    applicationWithdrawnGaps,
    sampleIsStatewideConclusion: false,
    publication: "unpublished",
    ownerClaimEligible: false,
  };
}

export type CaliforniaPhase5CategorySummary = {
  file: CaliforniaPhase5File;
  rowCount: number;
  eligibleTypeRows: number;
  outOfScopeRows: number;
  blankTypeRows: number;
  unknownTypeRows: number;
  outOfScopeCounts: Record<string, number>;
};

export function summarizeCaliforniaPhase5Categories(
  file: CaliforniaPhase5File,
  rows: readonly { facilityType: string }[],
): CaliforniaPhase5CategorySummary {
  const outOfScopeCounts: Record<string, number> = {};
  let eligibleTypeRows = 0;
  let outOfScopeRows = 0;
  let blankTypeRows = 0;
  let unknownTypeRows = 0;
  for (const row of rows) {
    const result = classifyCaliforniaPhase5Category(file, row.facilityType);
    if (result.eligibility === "eligible-rcfe" || result.eligibility === "eligible-arf-family") {
      eligibleTypeRows += 1;
    } else if (result.eligibility === "blank-type-ineligible") {
      blankTypeRows += 1;
    } else if (result.eligibility === "out-of-scope") {
      outOfScopeRows += 1;
      outOfScopeCounts[result.normalizedType] =
        (outOfScopeCounts[result.normalizedType] ?? 0) + 1;
    } else {
      unknownTypeRows += 1;
      outOfScopeCounts[result.normalizedType] =
        (outOfScopeCounts[result.normalizedType] ?? 0) + 1;
    }
  }
  return {
    file,
    rowCount: rows.length,
    eligibleTypeRows,
    outOfScopeRows,
    blankTypeRows,
    unknownTypeRows,
    outOfScopeCounts,
  };
}

export const CALIFORNIA_PHASE5_PUBLICATION_BLOCKERS = [
  {
    id: "no-authoritative-iso-export-date",
    severity: "blocking" as const,
    summary:
      "No verified CDSS export/freshness ISO timestamp; filename MMDDYYYY and CHHS file_date text remain non-authoritative.",
  },
  {
    id: "roster-wide-current-status-unverified",
    severity: "blocking" as const,
    summary:
      "FacilityDetail verification remains sample-bounded; roster-wide current status is not verified.",
  },
  {
    id: "closed-application-withdrawn-mapping-gap",
    severity: "blocking" as const,
    summary:
      "Download CLOSED includes FacilityDetail Application Withdrawn; Closed* subtype mapping is required before treating CLOSED as licensed-facility closure.",
  },
  {
    id: "arf-category-gating-required",
    severity: "blocking" as const,
    summary:
      "ARF download includes ADP/SRF/RCFCI/MFHV and blank types outside ARF-family residential eligibility.",
  },
  {
    id: "invalid-identifier-rejection",
    severity: "blocking" as const,
    summary: "Invalid facility numbers such as 95354 must be rejected.",
  },
  {
    id: "sample-insufficient-for-publication",
    severity: "blocking" as const,
    summary: "Phase 5 stratified FacilityDetail samples cannot approve California publication.",
  },
] as const;

export const CALIFORNIA_PHASE5_PUBLICATION_GATE = {
  reliableSourceAndDate: false,
  verifiedCurrentStatusRosterWide: false,
  uniqueValidIdentifiers: false,
  correctRcfeArfCategories: false,
  closedSubtypeMappingComplete: false,
  verifiedDisclosureLinks: false,
  sampleVerificationSufficient: false,
  publication: "unpublished" as const,
  ownerClaimEligible: false,
  blockers: CALIFORNIA_PHASE5_PUBLICATION_BLOCKERS,
} as const;

export type CaliforniaPhase5Evidence = {
  observedOn: string;
  provenance: typeof CALIFORNIA_PHASE5_PROVENANCE;
  downloadObserved: typeof CALIFORNIA_PHASE5_DOWNLOAD_OBSERVED;
  conflictObserved: typeof CALIFORNIA_PHASE5_CONFLICT_OBSERVED;
  historicalConflictSummary: ReturnType<typeof summarizeCaliforniaPhase5HistoricalConflicts>;
  rcfeCategories: CaliforniaPhase5CategorySummary;
  arfCategories: CaliforniaPhase5CategorySummary;
  facilityDetailSample: CaliforniaPhase5FacilityDetailSampleSummary;
  statusDefinitions: typeof CALIFORNIA_PHASE5_FACILITY_DETAIL_STATUS_DEFINITIONS;
  eligibleTypes: {
    rcfe: typeof CALIFORNIA_PHASE5_RCFE_ELIGIBLE_TYPES;
    arf: typeof CALIFORNIA_PHASE5_ARF_ELIGIBLE_TYPES;
    arfOutOfScope: typeof CALIFORNIA_PHASE5_ARF_OUT_OF_SCOPE_TYPES;
  };
  gate: typeof CALIFORNIA_PHASE5_PUBLICATION_GATE;
  publication: "unpublished";
  ownerClaimEligible: false;
};

export function buildCaliforniaPhase5Evidence(input: {
  observedOn?: string;
  historicalConflicts: readonly {
    historicalStatus: string;
    downloadStatus: string;
    historicalClosedDate?: string | null;
    downloadLicenseFirstDate?: string | null;
  }[];
  rcfeRows: readonly { facilityType: string }[];
  arfRows: readonly { facilityType: string }[];
  facilityDetailSample: readonly CaliforniaPhase5FacilityDetailSampleRow[];
}): CaliforniaPhase5Evidence {
  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE5_OBSERVED_ON,
    provenance: CALIFORNIA_PHASE5_PROVENANCE,
    downloadObserved: CALIFORNIA_PHASE5_DOWNLOAD_OBSERVED,
    conflictObserved: CALIFORNIA_PHASE5_CONFLICT_OBSERVED,
    historicalConflictSummary: summarizeCaliforniaPhase5HistoricalConflicts(
      input.historicalConflicts,
    ),
    rcfeCategories: summarizeCaliforniaPhase5Categories("RCFE", input.rcfeRows),
    arfCategories: summarizeCaliforniaPhase5Categories("ARF", input.arfRows),
    facilityDetailSample: summarizeCaliforniaPhase5FacilityDetailSample(
      input.facilityDetailSample,
    ),
    statusDefinitions: CALIFORNIA_PHASE5_FACILITY_DETAIL_STATUS_DEFINITIONS,
    eligibleTypes: {
      rcfe: CALIFORNIA_PHASE5_RCFE_ELIGIBLE_TYPES,
      arf: CALIFORNIA_PHASE5_ARF_ELIGIBLE_TYPES,
      arfOutOfScope: CALIFORNIA_PHASE5_ARF_OUT_OF_SCOPE_TYPES,
    },
    gate: CALIFORNIA_PHASE5_PUBLICATION_GATE,
    publication: "unpublished",
    ownerClaimEligible: false,
  };
}

export function californiaPhase5AllowsPublication(
  evidence: Pick<CaliforniaPhase5Evidence, "gate" | "facilityDetailSample" | "publication">,
): false {
  void evidence;
  return false;
}
