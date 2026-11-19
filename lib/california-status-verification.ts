/**
 * Read-only California CDSS FacilityDetail status verification.
 * Does not persist rows, publish California, or infer GIS STATUS integers.
 *
 * Callers pass `reconcileCaliforniaStatus` from `california-status-reconciliation`
 * so this module stays free of sibling runtime imports (Next build vs Node tests).
 */

export type CaliforniaStatusClassification = "match" | "conflict" | "missing" | "inconclusive";

export type CaliforniaStatusReconciliation = {
  classification: CaliforniaStatusClassification;
  openDataStatus: string;
  liveStatus: string | null;
  currentlyActive: false;
  confirmedClosure: boolean;
};

export type CaliforniaStatusReconciler = (observation: {
  openDataStatus: string;
  httpStatus: number | null;
  liveStatus: string | null;
  identifierMatched: boolean;
}) => CaliforniaStatusReconciliation;

export const CALIFORNIA_TRANSPARENCY_FACILITY_DETAIL_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/";

export const CALIFORNIA_TRANSPARENCY_DETAIL_PAGE_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";

/** Fields used to prove current license status from official FacilityDetail. */
export const CALIFORNIA_TRANSPARENCY_STATUS_PROOF_FIELDS = [
  "FACILITYNUMBER",
  "STATUS",
] as const;

/** Supporting FacilityDetail fields recorded for provenance, not publication. */
export const CALIFORNIA_TRANSPARENCY_SUPPORTING_FIELDS = [
  "FACILITYNAME",
  "FACILITYTYPE",
  "STREETADDRESS",
  "CITY",
  "ZIPCODE",
  "DATECLOSED",
  "LICENSEEFFECTIVEDATE",
  "LICENSEFIRSTDATE",
] as const;

export const CALIFORNIA_TRANSPARENCY_PROVENANCE = {
  endpoint: CALIFORNIA_TRANSPARENCY_FACILITY_DETAIL_API,
  detailPagePattern: `${CALIFORNIA_TRANSPARENCY_DETAIL_PAGE_PREFIX}{facilityNumber}`,
  statusProofFields: CALIFORNIA_TRANSPARENCY_STATUS_PROOF_FIELDS,
  supportingFields: CALIFORNIA_TRANSPARENCY_SUPPORTING_FIELDS,
  limitations: [
    "FacilityDetail is a per-facility lookup used by the CDSS care-facility search application; it is not a bulk roster export.",
    "HTTP 200 can still return Facility Number Not Found with an empty STATUS.",
    "Requesting a leading-zero-stripped ID may return the canonical leading-zero FACILITYNUMBER; do not store the truncated request as the license.",
    "STATUS text is the live label for that request only; historical open-data LICENSED/CLOSED text is never current by itself.",
    "No authoritative ISO export date is provided by FacilityDetail.",
    "GIS STATUS integers remain undocumented and are never accepted here.",
  ],
} as const;

export const CALIFORNIA_STATUS_VERIFICATION_DEFAULTS = {
  minIntervalMs: 400,
  maxAttempts: 3,
  retryStatuses: [429, 500, 502, 503, 504] as const,
  backoffMs: [500, 1500] as const,
} as const;

/** Proposed evidence threshold for roster-wide readiness. Sample runs never satisfy it alone. */
export const CALIFORNIA_PUBLICATION_EVIDENCE_THRESHOLD = {
  requiresAuthoritativeIsoExportDate: true,
  requiresRosterWideCurrentStatusVerification: true,
  requiresNoUnresolvedLicensedConflicts: true,
  requiresExactLicenseIdentifierCoverage: true,
  requiresDocumentedGisStatusDomainOrNonReliance: true,
  sampleVerificationSufficient: false,
  notes: [
    "A risk-focused sample can surface conflicts and leading-zero defects; it cannot prove statewide readiness.",
    "Publication remains blocked until current status is verified for the eligible roster against official FacilityDetail (or an equally authoritative current source), with unresolved LICENSED→non-Licensed conflicts remediated.",
  ],
} as const;

export type CaliforniaGisCohort =
  | "exact-match"
  | "leading-zero"
  | "gis-missing"
  | "leading-zero-truncated-request";

export type CaliforniaFacilityDetailFields = {
  facilityNumber: string | null;
  status: string | null;
  facilityName: string | null;
  facilityType: string | null;
  streetAddress: string | null;
  city: string | null;
  zipCode: string | null;
  dateClosed: string | null;
  licenseEffectiveDate: string | null;
  licenseFirstDate: string | null;
};

export type CaliforniaFacilityDetailParse = CaliforniaFacilityDetailFields & {
  found: boolean;
  wrapper: "facility-detail-object" | "facility-detail-array" | "flat-object" | "empty" | "unrecognized";
};

export type CaliforniaIdentifierRelation =
  | "exact"
  | "leading-zero-canonicalization"
  | "mismatch"
  | "missing";

export type CaliforniaStatusVerificationTarget = {
  requestedId: string;
  historicalStatus: string;
  gisCohort: CaliforniaGisCohort;
  file?: "RCFE" | "ARF";
  label?: string;
};

export type CaliforniaStatusVerificationObservation = CaliforniaStatusVerificationTarget & {
  httpStatus: number | null;
  attempts: number;
  timedOut: boolean;
  parse: CaliforniaFacilityDetailParse | null;
  identifierRelation: CaliforniaIdentifierRelation;
  identifierMatched: boolean;
  reconciliation: CaliforniaStatusReconciliation;
  detailPageUrl: string | null;
};

export type CaliforniaStatusVerificationReport = {
  observedOn: string | null;
  sampleSize: number;
  byClassification: Record<CaliforniaStatusClassification, number>;
  byGisCohort: Record<CaliforniaGisCohort, number>;
  conflicts: CaliforniaStatusVerificationObservation[];
  matches: number;
  missing: number;
  inconclusive: number;
  licensedToClosedConflicts: number;
  leadingZeroCanonicalizations: number;
  currentlyActive: false;
  currentLicenseStatusVerified: false;
  publication: "unpublished";
  ownerClaimEligible: false;
  sampleIsStatewideConclusion: false;
  evidenceThreshold: typeof CALIFORNIA_PUBLICATION_EVIDENCE_THRESHOLD;
  provenance: typeof CALIFORNIA_TRANSPARENCY_PROVENANCE;
  observations: CaliforniaStatusVerificationObservation[];
};

function textOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function detailRecord(payload: unknown): { record: Record<string, unknown> | null; wrapper: CaliforniaFacilityDetailParse["wrapper"] } {
  if (payload == null) return { record: null, wrapper: "empty" };
  if (Array.isArray(payload)) {
    if (payload.length === 0) return { record: null, wrapper: "empty" };
    const first = payload[0];
    if (first && typeof first === "object" && !Array.isArray(first)) {
      return { record: first as Record<string, unknown>, wrapper: "facility-detail-array" };
    }
    return { record: null, wrapper: "unrecognized" };
  }
  if (typeof payload !== "object") return { record: null, wrapper: "unrecognized" };
  const object = payload as Record<string, unknown>;
  if (object.FacilityDetail && typeof object.FacilityDetail === "object" && !Array.isArray(object.FacilityDetail)) {
    return { record: object.FacilityDetail as Record<string, unknown>, wrapper: "facility-detail-object" };
  }
  if ("FACILITYNUMBER" in object || "STATUS" in object) {
    return { record: object, wrapper: "flat-object" };
  }
  return { record: null, wrapper: "unrecognized" };
}

export function parseCaliforniaFacilityDetail(payload: unknown): CaliforniaFacilityDetailParse {
  const { record, wrapper } = detailRecord(payload);
  if (!record) {
    return {
      facilityNumber: null,
      status: null,
      facilityName: null,
      facilityType: null,
      streetAddress: null,
      city: null,
      zipCode: null,
      dateClosed: null,
      licenseEffectiveDate: null,
      licenseFirstDate: null,
      found: false,
      wrapper,
    };
  }
  const facilityNumber = textOrNull(record.FACILITYNUMBER);
  const facilityName = textOrNull(record.FACILITYNAME);
  const notFound = facilityNumber === "Facility Number Not Found"
    || facilityName === "Facility Number Not Found";
  return {
    facilityNumber: notFound ? null : facilityNumber,
    status: notFound ? null : textOrNull(record.STATUS),
    facilityName: notFound ? null : facilityName,
    facilityType: textOrNull(record.FACILITYTYPE),
    streetAddress: textOrNull(record.STREETADDRESS),
    city: textOrNull(record.CITY),
    zipCode: textOrNull(record.ZIPCODE),
    dateClosed: textOrNull(record.DATECLOSED),
    licenseEffectiveDate: textOrNull(record.LICENSEEFFECTIVEDATE),
    licenseFirstDate: textOrNull(record.LICENSEFIRSTDATE),
    found: !notFound && facilityNumber != null,
    wrapper,
  };
}

export function relateCaliforniaFacilityIdentifiers(
  requestedId: string,
  canonicalFacilityNumber: string | null,
): CaliforniaIdentifierRelation {
  const requested = requestedId.trim();
  if (!canonicalFacilityNumber) return "missing";
  if (requested === canonicalFacilityNumber) return "exact";
  const collapsedRequested = requested.replace(/^0+/, "") || "0";
  const collapsedCanonical = canonicalFacilityNumber.replace(/^0+/, "") || "0";
  if (
    collapsedRequested === collapsedCanonical
    && (requested.startsWith("0") || canonicalFacilityNumber.startsWith("0"))
    && requested !== canonicalFacilityNumber
  ) {
    return "leading-zero-canonicalization";
  }
  return "mismatch";
}

export function californiaFacilityDetailUrl(facilityNumber: string): string {
  return `${CALIFORNIA_TRANSPARENCY_FACILITY_DETAIL_API}${facilityNumber.trim()}`;
}

export function californiaFacilityDetailPageUrl(facilityNumber: string | null): string | null {
  if (!facilityNumber || !/^\d{8,9}$/.test(facilityNumber)) return null;
  return `${CALIFORNIA_TRANSPARENCY_DETAIL_PAGE_PREFIX}${facilityNumber}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export type FetchCaliforniaFacilityDetailOptions = {
  fetcher?: typeof fetch;
  minIntervalMs?: number;
  maxAttempts?: number;
  retryStatuses?: readonly number[];
  backoffMs?: readonly number[];
  lastRequestAt?: { value: number };
  now?: () => number;
  sleepFn?: (ms: number) => Promise<void>;
};

/**
 * Rate-limited, retry-bounded FacilityDetail GET. Read-only; never writes facility records.
 */
export async function fetchCaliforniaFacilityDetail(
  facilityNumber: string,
  options: FetchCaliforniaFacilityDetailOptions = {},
): Promise<{ httpStatus: number | null; attempts: number; timedOut: boolean; payload: unknown }> {
  const fetcher = options.fetcher ?? fetch;
  const minIntervalMs = options.minIntervalMs ?? CALIFORNIA_STATUS_VERIFICATION_DEFAULTS.minIntervalMs;
  const maxAttempts = options.maxAttempts ?? CALIFORNIA_STATUS_VERIFICATION_DEFAULTS.maxAttempts;
  const retryStatuses = options.retryStatuses ?? CALIFORNIA_STATUS_VERIFICATION_DEFAULTS.retryStatuses;
  const backoffMs = options.backoffMs ?? CALIFORNIA_STATUS_VERIFICATION_DEFAULTS.backoffMs;
  const lastRequestAt = options.lastRequestAt ?? { value: 0 };
  const now = options.now ?? Date.now;
  const sleepFn = options.sleepFn ?? sleep;

  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error("maxAttempts must be a positive integer");
  }

  let attempts = 0;
  let timedOut = false;
  let httpStatus: number | null = null;
  let payload: unknown = null;

  while (attempts < maxAttempts) {
    const wait = minIntervalMs - (now() - lastRequestAt.value);
    if (wait > 0) await sleepFn(wait);
    attempts += 1;
    lastRequestAt.value = now();
    try {
      const response = await fetcher(californiaFacilityDetailUrl(facilityNumber), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      httpStatus = response.status;
      if (retryStatuses.includes(response.status) && attempts < maxAttempts) {
        const delay = backoffMs[Math.min(attempts - 1, backoffMs.length - 1)] ?? backoffMs[backoffMs.length - 1] ?? 500;
        await sleepFn(delay);
        continue;
      }
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
      return { httpStatus, attempts, timedOut: false, payload };
    } catch {
      timedOut = true;
      httpStatus = 0;
      if (attempts < maxAttempts) {
        const delay = backoffMs[Math.min(attempts - 1, backoffMs.length - 1)] ?? backoffMs[backoffMs.length - 1] ?? 500;
        await sleepFn(delay);
        continue;
      }
      return { httpStatus, attempts, timedOut: true, payload: null };
    }
  }

  return { httpStatus, attempts, timedOut, payload };
}

export function observeCaliforniaStatusVerification(
  target: CaliforniaStatusVerificationTarget,
  fetchResult: {
    httpStatus: number | null;
    attempts: number;
    timedOut?: boolean;
    payload: unknown;
  },
  reconcile: CaliforniaStatusReconciler,
): CaliforniaStatusVerificationObservation {
  const parse = fetchResult.payload == null && fetchResult.httpStatus !== 200
    ? null
    : parseCaliforniaFacilityDetail(fetchResult.payload);
  const canonical = parse?.facilityNumber ?? null;
  const identifierRelation = relateCaliforniaFacilityIdentifiers(target.requestedId, canonical);
  // Exact requested↔canonical match only. Leading-zero canonicalization is recorded separately
  // and must not count as an identifier match for historical/original license equality.
  const identifierMatched = identifierRelation === "exact";
  const reconciliation = reconcile({
    openDataStatus: target.historicalStatus,
    httpStatus: fetchResult.httpStatus,
    liveStatus: parse?.status ?? null,
    identifierMatched,
  });
  return {
    ...target,
    httpStatus: fetchResult.httpStatus,
    attempts: fetchResult.attempts,
    timedOut: fetchResult.timedOut === true,
    parse,
    identifierRelation,
    identifierMatched,
    reconciliation,
    detailPageUrl: californiaFacilityDetailPageUrl(canonical),
  };
}

export async function verifyCaliforniaStatusSample(
  targets: readonly CaliforniaStatusVerificationTarget[],
  options: FetchCaliforniaFacilityDetailOptions & {
    observedOn?: string | null;
    reconcile: CaliforniaStatusReconciler;
  },
): Promise<CaliforniaStatusVerificationReport> {
  const lastRequestAt = options.lastRequestAt ?? { value: 0 };
  const observations: CaliforniaStatusVerificationObservation[] = [];
  for (const target of targets) {
    const fetchResult = await fetchCaliforniaFacilityDetail(target.requestedId, {
      ...options,
      lastRequestAt,
    });
    observations.push(observeCaliforniaStatusVerification(target, fetchResult, options.reconcile));
  }
  return summarizeCaliforniaStatusVerification(observations, options.observedOn ?? null);
}

export function summarizeCaliforniaStatusVerification(
  observations: readonly CaliforniaStatusVerificationObservation[],
  observedOn: string | null = null,
): CaliforniaStatusVerificationReport {
  const byClassification: Record<CaliforniaStatusClassification, number> = {
    match: 0,
    conflict: 0,
    missing: 0,
    inconclusive: 0,
  };
  const byGisCohort: Record<CaliforniaGisCohort, number> = {
    "exact-match": 0,
    "leading-zero": 0,
    "gis-missing": 0,
    "leading-zero-truncated-request": 0,
  };
  const conflicts: CaliforniaStatusVerificationObservation[] = [];
  let licensedToClosedConflicts = 0;
  let leadingZeroCanonicalizations = 0;

  for (const observation of observations) {
    byClassification[observation.reconciliation.classification] += 1;
    byGisCohort[observation.gisCohort] += 1;
    if (observation.reconciliation.classification === "conflict") conflicts.push(observation);
    if (
      observation.historicalStatus === "LICENSED"
      && observation.reconciliation.confirmedClosure
      && observation.reconciliation.classification === "conflict"
    ) {
      licensedToClosedConflicts += 1;
    }
    if (observation.identifierRelation === "leading-zero-canonicalization") {
      leadingZeroCanonicalizations += 1;
    }
  }

  return {
    observedOn,
    sampleSize: observations.length,
    byClassification,
    byGisCohort,
    conflicts,
    matches: byClassification.match,
    missing: byClassification.missing,
    inconclusive: byClassification.inconclusive,
    licensedToClosedConflicts,
    leadingZeroCanonicalizations,
    currentlyActive: false,
    currentLicenseStatusVerified: false,
    publication: "unpublished",
    ownerClaimEligible: false,
    sampleIsStatewideConclusion: false,
    evidenceThreshold: CALIFORNIA_PUBLICATION_EVIDENCE_THRESHOLD,
    provenance: CALIFORNIA_TRANSPARENCY_PROVENANCE,
    observations: [...observations],
  };
}
