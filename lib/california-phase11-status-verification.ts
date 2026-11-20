/**
 * California Phase 11 — rate-limited stratified FacilityDetail verification of
 * DownloadStateData licensing statuses. Compares download status to live
 * FacilityDetail only; never infers current status from historical CHHS rows
 * and never extrapolates sample results statewide. California stays unpublished.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE11_STATUS_OBSERVED_ON = "2026-11-19";

export const CALIFORNIA_PHASE11_STATUS_FACILITY_DETAIL_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/";

export const CALIFORNIA_PHASE11_DOWNLOAD_STATUSES = [
  "LICENSED",
  "CLOSED",
  "PENDING",
  "ON PROBATION",
] as const;

export type CaliforniaPhase11DownloadStatus =
  (typeof CALIFORNIA_PHASE11_DOWNLOAD_STATUSES)[number];

export type CaliforniaPhase11StatusStratum =
  | "active-licensed"
  | "probationary"
  | "closed"
  | "withdrawn"
  | "pending"
  | "exceptional"
  | "leading-zero-active"
  | "leading-zero-closed"
  | "category-control";

export type CaliforniaPhase11StatusRelation =
  | "match"
  | "mapping-gap"
  | "conflict"
  | "missing"
  | "inconclusive"
  | "invalid-id";

export type CaliforniaPhase11StatusVerificationTarget = {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  downloadStatus: string;
  downloadType: string;
  stratum: CaliforniaPhase11StatusStratum;
  label: string;
};

export type CaliforniaPhase11StatusObservation = CaliforniaPhase11StatusVerificationTarget & {
  httpStatus: number | null;
  attempts: number;
  timedOut: boolean;
  liveFacilityNumber: string | null;
  liveStatus: string | null;
  liveFacilityType: string | null;
  found: boolean;
  identifierMatched: boolean;
  relation: CaliforniaPhase11StatusRelation;
};

const FACILITY_NUMBER = /^\d{8,9}$/;

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function upper(value: string | null | undefined): string {
  return text(value).toUpperCase();
}

export function isCaliforniaPhase11FacilityNumber(value: string): boolean {
  return FACILITY_NUMBER.test(text(value));
}

export function isCaliforniaPhase11ClosedFacilityDetailStatus(liveStatus: string): boolean {
  return /^Closed(?:$|[, ])/i.test(text(liveStatus));
}

export function isCaliforniaPhase11ApplicationWithdrawn(liveStatus: string): boolean {
  return /^application withdrawn$/i.test(text(liveStatus));
}

export function isCaliforniaPhase11ProbationFacilityDetailStatus(liveStatus: string): boolean {
  const live = text(liveStatus).toLowerCase();
  return live === "probation"
    || live === "probationary license"
    || live === "on probation"
    || live.includes("probation");
}

/**
 * Relate DownloadStateData Facility Status to live FacilityDetail STATUS.
 * Application Withdrawn vs CLOSED is a documented mapping-gap, not a Closed* match.
 * Does not consult historical CHHS status.
 */
export function relateCaliforniaPhase11DownloadToFacilityDetail(
  downloadStatus: string,
  liveStatus: string | null,
  options: {
    downloadFacilityNumber?: string;
    identifierMatched?: boolean;
    httpStatus?: number | null;
    timedOut?: boolean;
    found?: boolean;
  } = {},
): CaliforniaPhase11StatusRelation {
  const downloadId = text(options.downloadFacilityNumber);
  if (downloadId && !isCaliforniaPhase11FacilityNumber(downloadId)) {
    return "invalid-id";
  }
  if (options.timedOut === true || options.httpStatus === 0) return "inconclusive";
  if (options.httpStatus != null && options.httpStatus !== 200) return "inconclusive";
  if (options.identifierMatched === false) return "inconclusive";
  if (options.found === false) return "missing";
  if (!liveStatus || text(liveStatus) === "") return "missing";

  const download = upper(downloadStatus);
  const live = text(liveStatus);

  if (download === "LICENSED" && /^licensed$/i.test(live)) return "match";
  if (download === "PENDING" && /^pending$/i.test(live)) return "match";
  if (download === "ON PROBATION" && isCaliforniaPhase11ProbationFacilityDetailStatus(live)) {
    return "match";
  }
  if (download === "CLOSED") {
    if (isCaliforniaPhase11ApplicationWithdrawn(live)) return "mapping-gap";
    if (isCaliforniaPhase11ClosedFacilityDetailStatus(live)) return "match";
    return "conflict";
  }
  return "conflict";
}

export function observeCaliforniaPhase11Status(
  target: CaliforniaPhase11StatusVerificationTarget,
  fetchResult: {
    httpStatus: number | null;
    attempts: number;
    timedOut?: boolean;
    liveFacilityNumber: string | null;
    liveStatus: string | null;
    liveFacilityType: string | null;
    found: boolean;
  },
): CaliforniaPhase11StatusObservation {
  const identifierMatched = fetchResult.found
    && fetchResult.liveFacilityNumber != null
    && fetchResult.liveFacilityNumber === target.facilityNumber.trim();
  const relation = relateCaliforniaPhase11DownloadToFacilityDetail(
    target.downloadStatus,
    fetchResult.liveStatus,
    {
      downloadFacilityNumber: target.facilityNumber,
      identifierMatched,
      httpStatus: fetchResult.httpStatus,
      timedOut: fetchResult.timedOut === true,
      found: fetchResult.found,
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
    found: fetchResult.found,
    identifierMatched,
    relation,
  };
}

export type CaliforniaPhase11StatusVerificationSummary = {
  observedOn: string | null;
  sampleSize: number;
  match: number;
  "mapping-gap": number;
  conflict: number;
  missing: number;
  inconclusive: number;
  "invalid-id": number;
  byRelation: Record<CaliforniaPhase11StatusRelation, number>;
  byStratum: Record<string, number>;
  applicationWithdrawnGaps: number;
  sampleIsStatewideConclusion: false;
  inferredFromHistorical: false;
  publication: "unpublished";
  ownerClaimEligible: false;
  limitations: readonly string[];
  observations: CaliforniaPhase11StatusObservation[];
};

export function summarizeCaliforniaPhase11StatusVerification(
  observations: readonly CaliforniaPhase11StatusObservation[],
  observedOn: string | null = null,
): CaliforniaPhase11StatusVerificationSummary {
  const byRelation: Record<CaliforniaPhase11StatusRelation, number> = {
    match: 0,
    "mapping-gap": 0,
    conflict: 0,
    missing: 0,
    inconclusive: 0,
    "invalid-id": 0,
  };
  const byStratum: Record<string, number> = {};
  let applicationWithdrawnGaps = 0;
  for (const row of observations) {
    byRelation[row.relation] += 1;
    byStratum[row.stratum] = (byStratum[row.stratum] ?? 0) + 1;
    if (row.relation === "mapping-gap" || isCaliforniaPhase11ApplicationWithdrawn(row.liveStatus ?? "")) {
      applicationWithdrawnGaps += 1;
    }
  }
  return {
    observedOn,
    sampleSize: observations.length,
    match: byRelation.match,
    "mapping-gap": byRelation["mapping-gap"],
    conflict: byRelation.conflict,
    missing: byRelation.missing,
    inconclusive: byRelation.inconclusive,
    "invalid-id": byRelation["invalid-id"],
    byRelation,
    byStratum,
    applicationWithdrawnGaps,
    sampleIsStatewideConclusion: false,
    inferredFromHistorical: false,
    publication: "unpublished",
    ownerClaimEligible: false,
    limitations: [
      "Stratified FacilityDetail sample only; not roster-wide status verification.",
      "Current status is taken from FacilityDetail only — never inferred from historical CHHS records.",
      "CLOSED↔Application Withdrawn remains a documented mapping-gap.",
      "Sample results must not be extrapolated statewide.",
      "California remains unpublished; owner claims stay ineligible.",
    ],
    observations: [...observations],
  };
}
