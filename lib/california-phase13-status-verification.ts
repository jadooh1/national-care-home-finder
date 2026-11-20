/**
 * California Phase 13 — expanded licensing-status verification helpers.
 * Compares DownloadStateData to live FacilityDetail. Distinguishes verified
 * official FacilityDetail evidence from download-only indicators. Retains the
 * five Phase 11/12 CLOSED→Application Withdrawn cases as regression controls.
 * Withdrawn applications stay ineligible. Never invents Closed* equivalence.
 * Sample results are not statewide.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE13_STATUS_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE13_FACILITY_DETAIL_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/";

export const CALIFORNIA_PHASE13_WITHDRAWN_EVIDENCE = {
  pin2401DisplayDomain: [
    "Licensed",
    "Pending",
    "Closed",
    "On Probation",
  ] as const,
  title22WithdrawalOfApplication: "CCR Title 22 §80029 Withdrawal of Application",
  facilityDetailLabel: "Application Withdrawn",
  downloadCoarseLabel: "CLOSED",
  neverLicensedMarkers: [
    "empty Download License First Date",
    "empty FacilityDetail LICENSEFIRSTDATE",
    "empty FacilityDetail LICENSEEFFECTIVEDATE",
  ] as const,
  closedStarContrastMarkers: [
    "non-empty License First Date on formerly licensed Closed* rows",
    "FacilityDetail STATUS begins with Closed",
  ] as const,
  phase11GapIds: [
    "306006749",
    "306006799",
    "405802282",
    "374604911",
    "019201529",
  ] as const,
  /**
   * Download-only CLOSED rows with empty License First Date (Phase 12 baseline).
   * Consistent with withdrawn coarsening but NOT FacilityDetail-verified statewide.
   */
  downloadClosedEmptyLicenseFirstCount: 1241,
  downloadClosedWithLicenseFirstCount: 4868,
  downloadClosedTotal: 6109,
  evidenceSource: "facility-detail" as const,
  downloadOnlyIndicator: "download-license-first-date-empty" as const,
} as const;

export type CaliforniaPhase13StatusStratum =
  | "active-licensed"
  | "probationary"
  | "closed-star"
  | "application-withdrawn"
  | "pending"
  | "exceptional"
  | "leading-zero-active"
  | "leading-zero-closed"
  | "leading-zero-withdrawn";

export type CaliforniaPhase13StatusRelation =
  | "match"
  | "documented-coarsening"
  | "conflict"
  | "missing"
  | "inconclusive"
  | "invalid-id";

export type CaliforniaPhase13ClosedInterpretation =
  | "closed-star-formerly-licensed"
  | "application-withdrawn-documented-coarsening"
  | "unresolved-inconsistency"
  | "not-applicable";

export type CaliforniaPhase13Eligibility =
  | "active-candidate"
  | "active-restricted"
  | "pending-ineligible"
  | "closed-ineligible"
  | "withdrawn-ineligible"
  | "invalid-id-ineligible"
  | "unknown-ineligible";

export type CaliforniaPhase13EvidenceKind =
  | "facility-detail-verified"
  | "download-only-indicator"
  | "not-applicable";

export type CaliforniaPhase13StatusMappingTarget = {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  downloadStatus: string;
  downloadType: string;
  stratum: CaliforniaPhase13StatusStratum;
  label: string;
  regressionControl?: boolean;
};

export type CaliforniaPhase13StatusMappingObservation =
  CaliforniaPhase13StatusMappingTarget & {
    httpStatus: number | null;
    attempts: number;
    timedOut: boolean;
    liveFacilityNumber: string | null;
    liveStatus: string | null;
    liveFacilityType: string | null;
    liveDateClosed: string | null;
    liveLicenseFirstDate: string | null;
    liveLicenseEffectiveDate: string | null;
    downloadClosedDate: string | null;
    downloadLicenseFirstDate: string | null;
    found: boolean;
    identifierMatched: boolean;
    closedDatesAligned: boolean | null;
    neverLicensedMarkersPresent: boolean;
    relation: CaliforniaPhase13StatusRelation;
    closedInterpretation: CaliforniaPhase13ClosedInterpretation;
    eligibility: CaliforniaPhase13Eligibility;
    evidenceKind: CaliforniaPhase13EvidenceKind;
    treatsAsLicensed: false;
    treatsAsClosedStar: boolean;
  };

const FACILITY_NUMBER = /^\d{8,9}$/;

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function upper(value: string | null | undefined): string {
  return text(value).toUpperCase();
}

function isBlankDate(value: string | null | undefined): boolean {
  return text(value) === "";
}

export function isCaliforniaPhase13FacilityNumber(value: string): boolean {
  return FACILITY_NUMBER.test(text(value));
}

export function isCaliforniaPhase13ClosedFacilityDetailStatus(liveStatus: string): boolean {
  return /^Closed(?:$|[, ])/i.test(text(liveStatus));
}

export function isCaliforniaPhase13ApplicationWithdrawn(liveStatus: string): boolean {
  return /^application withdrawn$/i.test(text(liveStatus));
}

export function isCaliforniaPhase13ProbationFacilityDetailStatus(liveStatus: string): boolean {
  const live = text(liveStatus).toLowerCase();
  return live === "probation"
    || live === "probationary license"
    || live === "on probation"
    || live.includes("probation");
}

export function hasCaliforniaPhase13NeverLicensedMarkers(input: {
  downloadLicenseFirstDate?: string | null;
  liveLicenseFirstDate?: string | null;
  liveLicenseEffectiveDate?: string | null;
}): boolean {
  return isBlankDate(input.downloadLicenseFirstDate)
    && isBlankDate(input.liveLicenseFirstDate)
    && isBlankDate(input.liveLicenseEffectiveDate);
}

export function californiaPhase13ClosedDatesAligned(
  downloadClosedDate: string | null | undefined,
  liveDateClosed: string | null | undefined,
): boolean | null {
  const download = text(downloadClosedDate);
  const live = text(liveDateClosed);
  if (download === "" && live === "") return null;
  if (download === "" || live === "") return false;
  return download === live;
}

/**
 * Download-only CLOSED empty-License-First-Date indicator.
 * Useful for planning / accounting; NOT official FacilityDetail status evidence.
 */
export function isCaliforniaPhase13DownloadOnlyWithdrawnIndicator(input: {
  downloadStatus: string;
  downloadLicenseFirstDate?: string | null;
}): boolean {
  return upper(input.downloadStatus) === "CLOSED"
    && isBlankDate(input.downloadLicenseFirstDate);
}

export function interpretCaliforniaPhase13ClosedMapping(input: {
  downloadStatus: string;
  liveStatus: string | null;
  downloadLicenseFirstDate?: string | null;
  liveLicenseFirstDate?: string | null;
  liveLicenseEffectiveDate?: string | null;
  downloadClosedDate?: string | null;
  liveDateClosed?: string | null;
}): {
  relation: CaliforniaPhase13StatusRelation;
  closedInterpretation: CaliforniaPhase13ClosedInterpretation;
  eligibility: CaliforniaPhase13Eligibility;
  treatsAsClosedStar: boolean;
  neverLicensedMarkersPresent: boolean;
  closedDatesAligned: boolean | null;
  evidenceKind: CaliforniaPhase13EvidenceKind;
} {
  const neverLicensedMarkersPresent = hasCaliforniaPhase13NeverLicensedMarkers(input);
  const closedDatesAligned = californiaPhase13ClosedDatesAligned(
    input.downloadClosedDate,
    input.liveDateClosed,
  );
  const download = upper(input.downloadStatus);
  const live = text(input.liveStatus);

  if (download !== "CLOSED") {
    return {
      relation: "conflict",
      closedInterpretation: "not-applicable",
      eligibility: "unknown-ineligible",
      treatsAsClosedStar: false,
      neverLicensedMarkersPresent,
      closedDatesAligned,
      evidenceKind: "facility-detail-verified",
    };
  }

  if (isCaliforniaPhase13ApplicationWithdrawn(live)) {
    if (neverLicensedMarkersPresent) {
      return {
        relation: "documented-coarsening",
        closedInterpretation: "application-withdrawn-documented-coarsening",
        eligibility: "withdrawn-ineligible",
        treatsAsClosedStar: false,
        neverLicensedMarkersPresent,
        closedDatesAligned,
        evidenceKind: "facility-detail-verified",
      };
    }
    return {
      relation: "conflict",
      closedInterpretation: "unresolved-inconsistency",
      eligibility: "withdrawn-ineligible",
      treatsAsClosedStar: false,
      neverLicensedMarkersPresent,
      closedDatesAligned,
      evidenceKind: "facility-detail-verified",
    };
  }

  if (isCaliforniaPhase13ClosedFacilityDetailStatus(live)) {
    return {
      relation: "match",
      closedInterpretation: "closed-star-formerly-licensed",
      eligibility: "closed-ineligible",
      treatsAsClosedStar: true,
      neverLicensedMarkersPresent,
      closedDatesAligned,
      evidenceKind: "facility-detail-verified",
    };
  }

  return {
    relation: "conflict",
    closedInterpretation: "unresolved-inconsistency",
    eligibility: "unknown-ineligible",
    treatsAsClosedStar: false,
    neverLicensedMarkersPresent,
    closedDatesAligned,
    evidenceKind: "facility-detail-verified",
  };
}

export function relateCaliforniaPhase13DownloadToFacilityDetail(
  downloadStatus: string,
  liveStatus: string | null,
  options: {
    downloadFacilityNumber?: string;
    identifierMatched?: boolean;
    httpStatus?: number | null;
    timedOut?: boolean;
    found?: boolean;
    downloadLicenseFirstDate?: string | null;
    liveLicenseFirstDate?: string | null;
    liveLicenseEffectiveDate?: string | null;
    downloadClosedDate?: string | null;
    liveDateClosed?: string | null;
  } = {},
): {
  relation: CaliforniaPhase13StatusRelation;
  closedInterpretation: CaliforniaPhase13ClosedInterpretation;
  eligibility: CaliforniaPhase13Eligibility;
  treatsAsClosedStar: boolean;
  neverLicensedMarkersPresent: boolean;
  closedDatesAligned: boolean | null;
  evidenceKind: CaliforniaPhase13EvidenceKind;
} {
  const downloadId = text(options.downloadFacilityNumber);
  if (downloadId && !isCaliforniaPhase13FacilityNumber(downloadId)) {
    return {
      relation: "invalid-id",
      closedInterpretation: "not-applicable",
      eligibility: "invalid-id-ineligible",
      treatsAsClosedStar: false,
      neverLicensedMarkersPresent: false,
      closedDatesAligned: null,
      evidenceKind: "not-applicable",
    };
  }
  if (options.timedOut === true || options.httpStatus === 0) {
    return {
      relation: "inconclusive",
      closedInterpretation: "not-applicable",
      eligibility: "unknown-ineligible",
      treatsAsClosedStar: false,
      neverLicensedMarkersPresent: false,
      closedDatesAligned: null,
      evidenceKind: "not-applicable",
    };
  }
  if (options.httpStatus != null && options.httpStatus !== 200) {
    return {
      relation: "inconclusive",
      closedInterpretation: "not-applicable",
      eligibility: "unknown-ineligible",
      treatsAsClosedStar: false,
      neverLicensedMarkersPresent: false,
      closedDatesAligned: null,
      evidenceKind: "not-applicable",
    };
  }
  if (options.identifierMatched === false) {
    return {
      relation: "inconclusive",
      closedInterpretation: "not-applicable",
      eligibility: "unknown-ineligible",
      treatsAsClosedStar: false,
      neverLicensedMarkersPresent: false,
      closedDatesAligned: null,
      evidenceKind: "not-applicable",
    };
  }
  if (options.found === false || !liveStatus || text(liveStatus) === "") {
    return {
      relation: "missing",
      closedInterpretation: "not-applicable",
      eligibility: "unknown-ineligible",
      treatsAsClosedStar: false,
      neverLicensedMarkersPresent: false,
      closedDatesAligned: null,
      evidenceKind: "not-applicable",
    };
  }

  const download = upper(downloadStatus);
  const live = text(liveStatus);

  if (download === "LICENSED" && /^licensed$/i.test(live)) {
    return {
      relation: "match",
      closedInterpretation: "not-applicable",
      eligibility: "active-candidate",
      treatsAsClosedStar: false,
      neverLicensedMarkersPresent: false,
      closedDatesAligned: null,
      evidenceKind: "facility-detail-verified",
    };
  }
  if (download === "PENDING" && /^pending$/i.test(live)) {
    return {
      relation: "match",
      closedInterpretation: "not-applicable",
      eligibility: "pending-ineligible",
      treatsAsClosedStar: false,
      neverLicensedMarkersPresent: false,
      closedDatesAligned: null,
      evidenceKind: "facility-detail-verified",
    };
  }
  if (download === "ON PROBATION" && isCaliforniaPhase13ProbationFacilityDetailStatus(live)) {
    return {
      relation: "match",
      closedInterpretation: "not-applicable",
      eligibility: "active-restricted",
      treatsAsClosedStar: false,
      neverLicensedMarkersPresent: false,
      closedDatesAligned: null,
      evidenceKind: "facility-detail-verified",
    };
  }
  if (download === "CLOSED") {
    return interpretCaliforniaPhase13ClosedMapping({
      downloadStatus,
      liveStatus,
      downloadLicenseFirstDate: options.downloadLicenseFirstDate,
      liveLicenseFirstDate: options.liveLicenseFirstDate,
      liveLicenseEffectiveDate: options.liveLicenseEffectiveDate,
      downloadClosedDate: options.downloadClosedDate,
      liveDateClosed: options.liveDateClosed,
    });
  }

  return {
    relation: "conflict",
    closedInterpretation: "unresolved-inconsistency",
    eligibility: "unknown-ineligible",
    treatsAsClosedStar: false,
    neverLicensedMarkersPresent: hasCaliforniaPhase13NeverLicensedMarkers(options),
    closedDatesAligned: californiaPhase13ClosedDatesAligned(
      options.downloadClosedDate,
      options.liveDateClosed,
    ),
    evidenceKind: "facility-detail-verified",
  };
}

export function observeCaliforniaPhase13StatusMapping(
  target: CaliforniaPhase13StatusMappingTarget,
  fetchResult: {
    httpStatus: number | null;
    attempts: number;
    timedOut?: boolean;
    liveFacilityNumber: string | null;
    liveStatus: string | null;
    liveFacilityType: string | null;
    liveDateClosed?: string | null;
    liveLicenseFirstDate?: string | null;
    liveLicenseEffectiveDate?: string | null;
    downloadClosedDate?: string | null;
    downloadLicenseFirstDate?: string | null;
    found: boolean;
  },
): CaliforniaPhase13StatusMappingObservation {
  const identifierMatched = fetchResult.found
    && fetchResult.liveFacilityNumber != null
    && fetchResult.liveFacilityNumber === target.facilityNumber.trim();
  const mapped = relateCaliforniaPhase13DownloadToFacilityDetail(
    target.downloadStatus,
    fetchResult.liveStatus,
    {
      downloadFacilityNumber: target.facilityNumber,
      identifierMatched,
      httpStatus: fetchResult.httpStatus,
      timedOut: fetchResult.timedOut === true,
      found: fetchResult.found,
      downloadLicenseFirstDate: fetchResult.downloadLicenseFirstDate,
      liveLicenseFirstDate: fetchResult.liveLicenseFirstDate,
      liveLicenseEffectiveDate: fetchResult.liveLicenseEffectiveDate,
      downloadClosedDate: fetchResult.downloadClosedDate,
      liveDateClosed: fetchResult.liveDateClosed,
    },
  );
  return {
    ...target,
    httpStatus: fetchResult.httpStatus,
    attempts: fetchResult.attempts,
    timedOut: fetchResult.timedOut === true,
    liveFacilityNumber: fetchResult.liveFacilityNumber,
    liveStatus: fetchResult.liveStatus,
    liveFacilityType: fetchResult.liveFacilityType,
    liveDateClosed: fetchResult.liveDateClosed ?? null,
    liveLicenseFirstDate: fetchResult.liveLicenseFirstDate ?? null,
    liveLicenseEffectiveDate: fetchResult.liveLicenseEffectiveDate ?? null,
    downloadClosedDate: fetchResult.downloadClosedDate ?? null,
    downloadLicenseFirstDate: fetchResult.downloadLicenseFirstDate ?? null,
    found: fetchResult.found,
    identifierMatched,
    closedDatesAligned: mapped.closedDatesAligned,
    neverLicensedMarkersPresent: mapped.neverLicensedMarkersPresent,
    relation: mapped.relation,
    closedInterpretation: mapped.closedInterpretation,
    eligibility: mapped.eligibility,
    evidenceKind: mapped.evidenceKind,
    treatsAsLicensed: false,
    treatsAsClosedStar: mapped.treatsAsClosedStar,
  };
}

export type CaliforniaPhase13StatusMappingSummary = {
  observedOn: string | null;
  sampleSize: number;
  match: number;
  "documented-coarsening": number;
  conflict: number;
  missing: number;
  inconclusive: number;
  "invalid-id": number;
  byRelation: Record<CaliforniaPhase13StatusRelation, number>;
  byInterpretation: Record<CaliforniaPhase13ClosedInterpretation, number>;
  byEligibility: Record<string, number>;
  byEvidenceKind: Record<CaliforniaPhase13EvidenceKind, number>;
  applicationWithdrawnDocumented: number;
  closedStarMatches: number;
  regressionControlsResolvedAsDocumentedCoarsening: number;
  regressionControlCount: number;
  sampleIsStatewideConclusion: false;
  inferredFromHistorical: false;
  inventedClosedStarEquivalence: false;
  treatsWithdrawnAsLicensed: false;
  publication: "unpublished";
  ownerClaimEligible: false;
  limitations: readonly string[];
  observations: CaliforniaPhase13StatusMappingObservation[];
};

export function summarizeCaliforniaPhase13StatusMapping(
  observations: readonly CaliforniaPhase13StatusMappingObservation[],
  observedOn: string | null = null,
): CaliforniaPhase13StatusMappingSummary {
  const byRelation: Record<CaliforniaPhase13StatusRelation, number> = {
    match: 0,
    "documented-coarsening": 0,
    conflict: 0,
    missing: 0,
    inconclusive: 0,
    "invalid-id": 0,
  };
  const byInterpretation: Record<CaliforniaPhase13ClosedInterpretation, number> = {
    "closed-star-formerly-licensed": 0,
    "application-withdrawn-documented-coarsening": 0,
    "unresolved-inconsistency": 0,
    "not-applicable": 0,
  };
  const byEligibility: Record<string, number> = {};
  const byEvidenceKind: Record<CaliforniaPhase13EvidenceKind, number> = {
    "facility-detail-verified": 0,
    "download-only-indicator": 0,
    "not-applicable": 0,
  };
  let applicationWithdrawnDocumented = 0;
  let closedStarMatches = 0;
  let regressionControlsResolvedAsDocumentedCoarsening = 0;
  let regressionControlCount = 0;
  const gapSet = new Set<string>(CALIFORNIA_PHASE13_WITHDRAWN_EVIDENCE.phase11GapIds);

  for (const row of observations) {
    byRelation[row.relation] += 1;
    byInterpretation[row.closedInterpretation] += 1;
    byEligibility[row.eligibility] = (byEligibility[row.eligibility] ?? 0) + 1;
    byEvidenceKind[row.evidenceKind] += 1;
    const isRegression = row.regressionControl === true || gapSet.has(row.facilityNumber);
    if (isRegression) regressionControlCount += 1;
    if (row.closedInterpretation === "application-withdrawn-documented-coarsening") {
      applicationWithdrawnDocumented += 1;
      if (isRegression) regressionControlsResolvedAsDocumentedCoarsening += 1;
    }
    if (row.closedInterpretation === "closed-star-formerly-licensed") {
      closedStarMatches += 1;
    }
  }

  return {
    observedOn,
    sampleSize: observations.length,
    match: byRelation.match,
    "documented-coarsening": byRelation["documented-coarsening"],
    conflict: byRelation.conflict,
    missing: byRelation.missing,
    inconclusive: byRelation.inconclusive,
    "invalid-id": byRelation["invalid-id"],
    byRelation,
    byInterpretation,
    byEligibility,
    byEvidenceKind,
    applicationWithdrawnDocumented,
    closedStarMatches,
    regressionControlsResolvedAsDocumentedCoarsening,
    regressionControlCount,
    sampleIsStatewideConclusion: false,
    inferredFromHistorical: false,
    inventedClosedStarEquivalence: false,
    treatsWithdrawnAsLicensed: false,
    publication: "unpublished",
    ownerClaimEligible: false,
    limitations: [
      "FacilityDetail-verified evidence is distinct from download-only CLOSED empty-License-First-Date indicators.",
      "Documented coarsening applies only where FacilityDetail = Application Withdrawn with never-licensed markers; it is not Closed* equivalence.",
      "Sample results must not be extrapolated statewide.",
      "Current status is taken from FacilityDetail only — never inferred from historical CHHS records.",
      "California remains unpublished; owner claims stay ineligible.",
    ],
    observations: [...observations],
  };
}
