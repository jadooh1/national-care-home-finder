/**
 * California Phase 12 — CLOSED vs Application Withdrawn mapping interpretation.
 * Compares DownloadStateData CLOSED rows to live FacilityDetail only. Does not
 * invent Closed* equivalence, does not treat withdrawn rows as licensed, and
 * does not extrapolate sample findings statewide. California stays unpublished.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE12_STATUS_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE12_FACILITY_DETAIL_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/";

export const CALIFORNIA_PHASE12_FACILITY_DETAIL_PAGE_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";

/** Coarse DownloadStateData Facility Status domain (PIN 24-01-CCLD). */
export const CALIFORNIA_PHASE12_DOWNLOAD_STATUSES = [
  "LICENSED",
  "CLOSED",
  "PENDING",
  "ON PROBATION",
] as const;

/**
 * Official evidence supporting the Application Withdrawn interpretation.
 * PIN display domain is coarse; FacilityDetail retains the precise label;
 * Title 22 §80029 defines withdrawal of application as distinct from closure
 * of a previously licensed facility.
 */
export const CALIFORNIA_PHASE12_WITHDRAWN_EVIDENCE = {
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
   * Download-only CLOSED rows with empty License First Date (2026-11-20
   * DownloadStateData). Consistent with withdrawn coarsening but NOT
   * FacilityDetail-verified statewide.
   */
  downloadClosedEmptyLicenseFirstCount: 1241,
  downloadClosedWithLicenseFirstCount: 4868,
  downloadClosedTotal: 6109,
} as const;

export type CaliforniaPhase12StatusStratum =
  | "active-licensed"
  | "probationary"
  | "closed-star"
  | "application-withdrawn"
  | "pending"
  | "exceptional"
  | "leading-zero-active"
  | "leading-zero-closed"
  | "leading-zero-withdrawn";

export type CaliforniaPhase12StatusRelation =
  | "match"
  | "documented-coarsening"
  | "conflict"
  | "missing"
  | "inconclusive"
  | "invalid-id";

/**
 * Verified interpretation for Download CLOSED vs FacilityDetail.
 * application-withdrawn-documented-coarsening is NOT Closed* equivalence.
 */
export type CaliforniaPhase12ClosedInterpretation =
  | "closed-star-formerly-licensed"
  | "application-withdrawn-documented-coarsening"
  | "unresolved-inconsistency"
  | "not-applicable";

export type CaliforniaPhase12Eligibility =
  | "active-candidate"
  | "active-restricted"
  | "pending-ineligible"
  | "closed-ineligible"
  | "withdrawn-ineligible"
  | "invalid-id-ineligible"
  | "unknown-ineligible";

export type CaliforniaPhase12StatusMappingTarget = {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  downloadStatus: string;
  downloadType: string;
  stratum: CaliforniaPhase12StatusStratum;
  label: string;
};

export type CaliforniaPhase12StatusMappingObservation =
  CaliforniaPhase12StatusMappingTarget & {
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
    relation: CaliforniaPhase12StatusRelation;
    closedInterpretation: CaliforniaPhase12ClosedInterpretation;
    eligibility: CaliforniaPhase12Eligibility;
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

export function isCaliforniaPhase12FacilityNumber(value: string): boolean {
  return FACILITY_NUMBER.test(text(value));
}

export function isCaliforniaPhase12ClosedFacilityDetailStatus(liveStatus: string): boolean {
  return /^Closed(?:$|[, ])/i.test(text(liveStatus));
}

export function isCaliforniaPhase12ApplicationWithdrawn(liveStatus: string): boolean {
  return /^application withdrawn$/i.test(text(liveStatus));
}

export function isCaliforniaPhase12ProbationFacilityDetailStatus(liveStatus: string): boolean {
  const live = text(liveStatus).toLowerCase();
  return live === "probation"
    || live === "probationary license"
    || live === "on probation"
    || live.includes("probation");
}

/**
 * Never-licensed withdrawn markers observed on all five Phase 11 gap cases:
 * empty download License First Date and empty FacilityDetail license dates.
 */
export function hasCaliforniaPhase12NeverLicensedMarkers(input: {
  downloadLicenseFirstDate?: string | null;
  liveLicenseFirstDate?: string | null;
  liveLicenseEffectiveDate?: string | null;
}): boolean {
  return isBlankDate(input.downloadLicenseFirstDate)
    && isBlankDate(input.liveLicenseFirstDate)
    && isBlankDate(input.liveLicenseEffectiveDate);
}

export function californiaPhase12ClosedDatesAligned(
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
 * Interpret Download CLOSED against FacilityDetail with official evidence.
 * Application Withdrawn + never-licensed markers → documented coarsening
 * (PIN coarse Closed bucket), not Closed* formerly-licensed closure, and
 * never publication-eligible / never licensed.
 */
export function interpretCaliforniaPhase12ClosedMapping(input: {
  downloadStatus: string;
  liveStatus: string | null;
  downloadLicenseFirstDate?: string | null;
  liveLicenseFirstDate?: string | null;
  liveLicenseEffectiveDate?: string | null;
  downloadClosedDate?: string | null;
  liveDateClosed?: string | null;
}): {
  relation: CaliforniaPhase12StatusRelation;
  closedInterpretation: CaliforniaPhase12ClosedInterpretation;
  eligibility: CaliforniaPhase12Eligibility;
  treatsAsClosedStar: boolean;
  neverLicensedMarkersPresent: boolean;
  closedDatesAligned: boolean | null;
} {
  const neverLicensedMarkersPresent = hasCaliforniaPhase12NeverLicensedMarkers(input);
  const closedDatesAligned = californiaPhase12ClosedDatesAligned(
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
    };
  }

  if (isCaliforniaPhase12ApplicationWithdrawn(live)) {
    if (neverLicensedMarkersPresent) {
      return {
        relation: "documented-coarsening",
        closedInterpretation: "application-withdrawn-documented-coarsening",
        eligibility: "withdrawn-ineligible",
        treatsAsClosedStar: false,
        neverLicensedMarkersPresent,
        closedDatesAligned,
      };
    }
    // Live Application Withdrawn without never-licensed markers stays unresolved.
    return {
      relation: "conflict",
      closedInterpretation: "unresolved-inconsistency",
      eligibility: "withdrawn-ineligible",
      treatsAsClosedStar: false,
      neverLicensedMarkersPresent,
      closedDatesAligned,
    };
  }

  if (isCaliforniaPhase12ClosedFacilityDetailStatus(live)) {
    return {
      relation: "match",
      closedInterpretation: "closed-star-formerly-licensed",
      eligibility: "closed-ineligible",
      treatsAsClosedStar: true,
      neverLicensedMarkersPresent,
      closedDatesAligned,
    };
  }

  return {
    relation: "conflict",
    closedInterpretation: "unresolved-inconsistency",
    eligibility: "unknown-ineligible",
    treatsAsClosedStar: false,
    neverLicensedMarkersPresent,
    closedDatesAligned,
  };
}

export function relateCaliforniaPhase12DownloadToFacilityDetail(
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
  relation: CaliforniaPhase12StatusRelation;
  closedInterpretation: CaliforniaPhase12ClosedInterpretation;
  eligibility: CaliforniaPhase12Eligibility;
  treatsAsClosedStar: boolean;
  neverLicensedMarkersPresent: boolean;
  closedDatesAligned: boolean | null;
} {
  const downloadId = text(options.downloadFacilityNumber);
  if (downloadId && !isCaliforniaPhase12FacilityNumber(downloadId)) {
    return {
      relation: "invalid-id",
      closedInterpretation: "not-applicable",
      eligibility: "invalid-id-ineligible",
      treatsAsClosedStar: false,
      neverLicensedMarkersPresent: false,
      closedDatesAligned: null,
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
    };
  }
  if (download === "ON PROBATION" && isCaliforniaPhase12ProbationFacilityDetailStatus(live)) {
    return {
      relation: "match",
      closedInterpretation: "not-applicable",
      eligibility: "active-restricted",
      treatsAsClosedStar: false,
      neverLicensedMarkersPresent: false,
      closedDatesAligned: null,
    };
  }
  if (download === "CLOSED") {
    return interpretCaliforniaPhase12ClosedMapping({
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
    neverLicensedMarkersPresent: hasCaliforniaPhase12NeverLicensedMarkers(options),
    closedDatesAligned: californiaPhase12ClosedDatesAligned(
      options.downloadClosedDate,
      options.liveDateClosed,
    ),
  };
}

export function observeCaliforniaPhase12StatusMapping(
  target: CaliforniaPhase12StatusMappingTarget,
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
): CaliforniaPhase12StatusMappingObservation {
  const identifierMatched = fetchResult.found
    && fetchResult.liveFacilityNumber != null
    && fetchResult.liveFacilityNumber === target.facilityNumber.trim();
  const mapped = relateCaliforniaPhase12DownloadToFacilityDetail(
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
    treatsAsLicensed: false,
    treatsAsClosedStar: mapped.treatsAsClosedStar,
  };
}

export type CaliforniaPhase12StatusMappingSummary = {
  observedOn: string | null;
  sampleSize: number;
  match: number;
  "documented-coarsening": number;
  conflict: number;
  missing: number;
  inconclusive: number;
  "invalid-id": number;
  byRelation: Record<CaliforniaPhase12StatusRelation, number>;
  byInterpretation: Record<CaliforniaPhase12ClosedInterpretation, number>;
  byEligibility: Record<string, number>;
  applicationWithdrawnDocumented: number;
  closedStarMatches: number;
  phase11GapIdsResolvedAsDocumentedCoarsening: number;
  sampleIsStatewideConclusion: false;
  inferredFromHistorical: false;
  inventedClosedStarEquivalence: false;
  treatsWithdrawnAsLicensed: false;
  publication: "unpublished";
  ownerClaimEligible: false;
  limitations: readonly string[];
  observations: CaliforniaPhase12StatusMappingObservation[];
};

export function summarizeCaliforniaPhase12StatusMapping(
  observations: readonly CaliforniaPhase12StatusMappingObservation[],
  observedOn: string | null = null,
): CaliforniaPhase12StatusMappingSummary {
  const byRelation: Record<CaliforniaPhase12StatusRelation, number> = {
    match: 0,
    "documented-coarsening": 0,
    conflict: 0,
    missing: 0,
    inconclusive: 0,
    "invalid-id": 0,
  };
  const byInterpretation: Record<CaliforniaPhase12ClosedInterpretation, number> = {
    "closed-star-formerly-licensed": 0,
    "application-withdrawn-documented-coarsening": 0,
    "unresolved-inconsistency": 0,
    "not-applicable": 0,
  };
  const byEligibility: Record<string, number> = {};
  let applicationWithdrawnDocumented = 0;
  let closedStarMatches = 0;
  let phase11GapIdsResolvedAsDocumentedCoarsening = 0;
  const gapSet = new Set<string>(CALIFORNIA_PHASE12_WITHDRAWN_EVIDENCE.phase11GapIds);

  for (const row of observations) {
    byRelation[row.relation] += 1;
    byInterpretation[row.closedInterpretation] += 1;
    byEligibility[row.eligibility] = (byEligibility[row.eligibility] ?? 0) + 1;
    if (row.closedInterpretation === "application-withdrawn-documented-coarsening") {
      applicationWithdrawnDocumented += 1;
      if (gapSet.has(row.facilityNumber)) {
        phase11GapIdsResolvedAsDocumentedCoarsening += 1;
      }
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
    applicationWithdrawnDocumented,
    closedStarMatches,
    phase11GapIdsResolvedAsDocumentedCoarsening,
    sampleIsStatewideConclusion: false,
    inferredFromHistorical: false,
    inventedClosedStarEquivalence: false,
    treatsWithdrawnAsLicensed: false,
    publication: "unpublished",
    ownerClaimEligible: false,
    limitations: [
      "Documented coarsening applies only where FacilityDetail = Application Withdrawn with never-licensed markers; it is not Closed* equivalence.",
      "Download CLOSED empty-License-First-Date counts are download-only and are not FacilityDetail-verified statewide.",
      "Sample results must not be extrapolated statewide.",
      "Current status is taken from FacilityDetail only — never inferred from historical CHHS records.",
      "California remains unpublished; owner claims stay ineligible.",
    ],
    observations: [...observations],
  };
}
