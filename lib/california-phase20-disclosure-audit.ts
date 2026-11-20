/**
 * California Phase 20 — cumulative disclosure coverage helpers on top of the
 * Phase 13 read-only rate-limited resumable audit harness.
 * Baseline cumulative coverage enters at 707 (462 Phase 16 + 245 Phase 19).
 * Roster-complete claim only when authorized remaining queue is exhausted and
 * cumulative verified reaches the publication-candidate denominator.
 * California stays unpublished.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE20_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE20_TRANSPARENCY_API_ROOT =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/";

export const CALIFORNIA_PHASE20_FACILITY_DETAIL_API =
  `${CALIFORNIA_PHASE20_TRANSPARENCY_API_ROOT}FacilityDetail/`;

export const CALIFORNIA_PHASE20_FACILITY_REPORTS_API =
  `${CALIFORNIA_PHASE20_TRANSPARENCY_API_ROOT}FacilityReports/`;

export const CALIFORNIA_PHASE20_FACILITY_DETAIL_PAGE_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";

export const CALIFORNIA_PHASE20_FACILITY_NUMBER = /^\d{8,9}$/;

export const CALIFORNIA_PHASE20_PUBLICATION_CANDIDATE_ROSTER_SIZE = 15451;

/** Cumulative disclosure probes entering Phase 20 (462 + 245). */
export const CALIFORNIA_PHASE20_COVERAGE_BASELINE = 707;

export const CALIFORNIA_PHASE20_AUDIT_DEFAULTS = {
  minIntervalMs: 450,
  maxAttempts: 3,
  retryStatuses: [429, 500, 502, 503, 504] as const,
  backoffMs: [500, 1500, 3000] as const,
  defaultMaxRequests: 250,
  defaultMaxDurationMs: 8 * 60 * 60 * 1000,
  checkpointEvery: 10,
  maxConsecutiveInconclusive: 8,
  batchFacilityCap: 250,
  authorizedAdditional: 14744,
} as const;

export type CaliforniaPhase20DisclosureUrlPattern = {
  kind: "facility-detail-page" | "facility-detail-api" | "facility-reports-api";
  pattern: string;
  canonicalForPublication: boolean;
  notes: string;
};

export const CALIFORNIA_PHASE20_DISCLOSURE_URL_PATTERNS: readonly CaliforniaPhase20DisclosureUrlPattern[] = [
  {
    kind: "facility-detail-page",
    pattern: `${CALIFORNIA_PHASE20_FACILITY_DETAIL_PAGE_PREFIX}{facilityNumber}`,
    canonicalForPublication: true,
    notes: "Canonical public disclosure / FacDetail rewrite. Identical for RCFE and ARF.",
  },
  {
    kind: "facility-detail-api",
    pattern: `${CALIFORNIA_PHASE20_FACILITY_DETAIL_API}{facilityNumber}`,
    canonicalForPublication: false,
    notes: "Authoritative per-facility JSON used to prove the disclosure target resolves.",
  },
  {
    kind: "facility-reports-api",
    pattern: `${CALIFORNIA_PHASE20_FACILITY_REPORTS_API}{facilityNumber}`,
    canonicalForPublication: false,
    notes: "Supporting inspection/complaint list; not the facility disclosure link.",
  },
] as const;

export type CaliforniaPhase20GeneratedLinks = {
  facilityNumber: string;
  validIdentifier: boolean;
  pageUrl: string | null;
  apiUrl: string | null;
  reportsApiUrl: string | null;
  preservesLeadingZeros: boolean;
  rejectionReason: string | null;
};

export function generateCaliforniaPhase20DisclosureLinks(
  facilityNumber: string,
): CaliforniaPhase20GeneratedLinks {
  const id = (facilityNumber ?? "").trim();
  const validIdentifier = CALIFORNIA_PHASE20_FACILITY_NUMBER.test(id);
  if (!validIdentifier) {
    return {
      facilityNumber: id,
      validIdentifier: false,
      pageUrl: null,
      apiUrl: null,
      reportsApiUrl: null,
      preservesLeadingZeros: id.startsWith("0"),
      rejectionReason: id === ""
        ? "empty-facility-number"
        : "facility-number-not-8-or-9-digits",
    };
  }
  return {
    facilityNumber: id,
    validIdentifier: true,
    pageUrl: `${CALIFORNIA_PHASE20_FACILITY_DETAIL_PAGE_PREFIX}${id}`,
    apiUrl: `${CALIFORNIA_PHASE20_FACILITY_DETAIL_API}${id}`,
    reportsApiUrl: `${CALIFORNIA_PHASE20_FACILITY_REPORTS_API}${id}`,
    preservesLeadingZeros: true,
    rejectionReason: null,
  };
}

export type CaliforniaPhase20LinkValidationClass =
  | "working"
  | "missing"
  | "ambiguous"
  | "invalid"
  | "inconclusive";

export type CaliforniaPhase20LinkValidationInput = {
  facilityNumber: string;
  file?: "RCFE" | "ARF";
  stratum?: string;
  downloadStatus?: string;
  downloadType?: string;
  apiHttpStatus?: number | null;
  liveFacilityNumber?: string | null;
  apiFound?: boolean | null;
  pageHttpStatus?: number | null;
  pageFinalUrl?: string | null;
  timedOut?: boolean;
};

export type CaliforniaPhase20LinkValidationResult = CaliforniaPhase20LinkValidationInput & {
  generated: CaliforniaPhase20GeneratedLinks;
  classification: CaliforniaPhase20LinkValidationClass;
  identifierRelation:
    | "exact"
    | "leading-zero-canonicalization"
    | "mismatch"
    | "missing"
    | "not-applicable";
  rationale: string;
  sampleIsStatewideConclusion: false;
};

export function relateCaliforniaPhase20LinkIdentifiers(
  requestedId: string,
  canonicalFacilityNumber: string | null,
): CaliforniaPhase20LinkValidationResult["identifierRelation"] {
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

export function classifyCaliforniaPhase20DisclosureLink(
  input: CaliforniaPhase20LinkValidationInput,
): CaliforniaPhase20LinkValidationResult {
  const generated = generateCaliforniaPhase20DisclosureLinks(input.facilityNumber);
  if (!generated.validIdentifier) {
    return {
      ...input,
      generated,
      classification: "invalid",
      identifierRelation: "not-applicable",
      rationale:
        "Facility number is not an official 8–9 digit CDSS identifier; generator refuses URLs (fail-closed).",
      sampleIsStatewideConclusion: false,
    };
  }
  if (input.timedOut === true || input.apiHttpStatus === 0) {
    return {
      ...input,
      generated,
      classification: "inconclusive",
      identifierRelation: "missing",
      rationale: "FacilityDetail request timed out or failed at the transport layer; link target inconclusive.",
      sampleIsStatewideConclusion: false,
    };
  }
  if (input.apiHttpStatus != null && input.apiHttpStatus !== 200) {
    return {
      ...input,
      generated,
      classification: "inconclusive",
      identifierRelation: "missing",
      rationale: `FacilityDetail HTTP ${input.apiHttpStatus}; cannot confirm disclosure target.`,
      sampleIsStatewideConclusion: false,
    };
  }
  if (input.apiFound === false || input.liveFacilityNumber == null || input.liveFacilityNumber === "") {
    return {
      ...input,
      generated,
      classification: "missing",
      identifierRelation: "missing",
      rationale:
        "FacilityDetail returned Facility Number Not Found (or empty). Page URL pattern is well-formed but target record is missing.",
      sampleIsStatewideConclusion: false,
    };
  }
  const identifierRelation = relateCaliforniaPhase20LinkIdentifiers(
    generated.facilityNumber,
    input.liveFacilityNumber,
  );
  if (identifierRelation === "exact") {
    return {
      ...input,
      generated,
      classification: "working",
      identifierRelation,
      rationale:
        "Canonical FacDetail page/API URLs preserve the exact license ID; FacilityDetail FACILITYNUMBER matches exactly.",
      sampleIsStatewideConclusion: false,
    };
  }
  if (identifierRelation === "leading-zero-canonicalization") {
    return {
      ...input,
      generated,
      classification: "ambiguous",
      identifierRelation,
      rationale:
        "FacilityDetail canonicalized a leading-zero difference; truncated or padded request is not an exact disclosure-identifier match.",
      sampleIsStatewideConclusion: false,
    };
  }
  return {
    ...input,
    generated,
    classification: "ambiguous",
    identifierRelation,
    rationale: "FacilityDetail FACILITYNUMBER does not match the requested license identifier.",
    sampleIsStatewideConclusion: false,
  };
}

export type CaliforniaPhase20CoverageRollup = {
  coverageBaseline: number;
  incrementalVerifiedCount: number;
  cumulativeVerifiedCount: number;
  rosterDenominator: number;
  remainingApprox: number;
  incrementalCoverageFraction: number;
  cumulativeCoverageFraction: number;
  incrementalCoveragePercentRounded: number;
  cumulativeCoveragePercentRounded: number;
  authorizedAdditional: number;
  statewideRosterVerificationComplete: boolean;
  statewideCoverageClaimed: boolean;
  sampleIsStatewideConclusion: false;
  publication: "unpublished";
  ownerClaimEligible: false;
  notes: readonly string[];
};

/**
 * Roll up coverage baseline 707 + Phase 20 incremental disclosure probes.
 * statewideCoverageClaimed is true only when the authorized remaining roster
 * is fully verified (cumulative >= denominator and incremental exhausted authorization or queue).
 */
export function summarizeCaliforniaPhase20Coverage(input: {
  coverageBaseline?: number;
  incrementalResults: readonly unknown[];
  rosterDenominator?: number;
  authorizedAdditional?: number;
  queueExhausted?: boolean;
}): CaliforniaPhase20CoverageRollup {
  const coverageBaseline = input.coverageBaseline ?? CALIFORNIA_PHASE20_COVERAGE_BASELINE;
  const incrementalVerifiedCount = input.incrementalResults.length;
  const cumulativeVerifiedCount = coverageBaseline + incrementalVerifiedCount;
  const rosterDenominator = input.rosterDenominator
    ?? CALIFORNIA_PHASE20_PUBLICATION_CANDIDATE_ROSTER_SIZE;
  const authorizedAdditional = input.authorizedAdditional
    ?? CALIFORNIA_PHASE20_AUDIT_DEFAULTS.authorizedAdditional;
  const remainingApprox = Math.max(0, rosterDenominator - cumulativeVerifiedCount);
  const incrementalCoverageFraction = rosterDenominator > 0
    ? incrementalVerifiedCount / rosterDenominator
    : 0;
  const cumulativeCoverageFraction = rosterDenominator > 0
    ? cumulativeVerifiedCount / rosterDenominator
    : 0;
  const statewideRosterVerificationComplete =
    input.queueExhausted === true
    && cumulativeVerifiedCount >= rosterDenominator;
  const statewideCoverageClaimed = statewideRosterVerificationComplete;

  return {
    coverageBaseline,
    incrementalVerifiedCount,
    cumulativeVerifiedCount,
    rosterDenominator,
    remainingApprox,
    incrementalCoverageFraction,
    cumulativeCoverageFraction,
    incrementalCoveragePercentRounded:
      Math.round(incrementalCoverageFraction * 10000) / 100,
    cumulativeCoveragePercentRounded:
      Math.round(cumulativeCoverageFraction * 10000) / 100,
    authorizedAdditional,
    statewideRosterVerificationComplete,
    statewideCoverageClaimed,
    sampleIsStatewideConclusion: false,
    publication: "unpublished",
    ownerClaimEligible: false,
    notes: [
      `Coverage baseline entering Phase 20: ${coverageBaseline}/${rosterDenominator}.`,
      `Phase 20 incremental disclosure probes: ${incrementalVerifiedCount} (authorized ≤${authorizedAdditional}).`,
      `Cumulative verified coverage: ${cumulativeVerifiedCount}/${rosterDenominator}.`,
      statewideCoverageClaimed
        ? "Authorized remaining roster verification complete under Phase 20 authorization."
        : "Do not claim statewide roster completion until authorized remaining queue is exhausted.",
      "California remains unpublished; owner claims stay ineligible; gate BLOCKED.",
    ],
  };
}

export function californiaPhase20ClaimsStatewideCoverage(
  cumulativeVerifiedCount: number,
  rosterDenominator: number = CALIFORNIA_PHASE20_PUBLICATION_CANDIDATE_ROSTER_SIZE,
  queueExhausted: boolean = false,
): boolean {
  return queueExhausted && cumulativeVerifiedCount >= rosterDenominator;
}
