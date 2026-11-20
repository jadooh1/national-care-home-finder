/**
 * California Phase 11 — official CDSS FacilityDetail / disclosure URL patterns
 * and a read-only link generator that preserves exact license identifiers
 * (including leading zeros). Does not publish California.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE11_OBSERVED_ON = "2026-11-19";

/** Official Transparency API root used by the CDSS Care Facility Search SPA. */
export const CALIFORNIA_PHASE11_TRANSPARENCY_API_ROOT =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/";

/** Canonical FacilityDetail JSON lookup (SPA facDetailController). */
export const CALIFORNIA_PHASE11_FACILITY_DETAIL_API =
  `${CALIFORNIA_PHASE11_TRANSPARENCY_API_ROOT}FacilityDetail/`;

/**
 * Supporting FacilityReports API used by the FacDetail Inspections/Complaints
 * tabs. Not a substitute for the facility disclosure page URL.
 */
export const CALIFORNIA_PHASE11_FACILITY_REPORTS_API =
  `${CALIFORNIA_PHASE11_TRANSPARENCY_API_ROOT}FacilityReports/`;

/**
 * Canonical public disclosure page prefix used by nationwide onboarding and
 * publication-acceptance. SPA rootController reads `?Rewrite=FacDetail/{id}`.
 */
export const CALIFORNIA_PHASE11_FACILITY_DETAIL_PAGE_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";

/**
 * Alternate SPA rewrite query observed in transparencyApp.js
 * (`FacDetailRewrite={id}` → `#/FacDetail/{id}`). Equivalent target; not the
 * publication-acceptance canonical form.
 */
export const CALIFORNIA_PHASE11_FACILITY_DETAIL_REWRITE_ALT_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?FacDetailRewrite=";

/** Angular ui-router hash route `/FacDetail/{facNumber}`. */
export const CALIFORNIA_PHASE11_FACILITY_DETAIL_HASH_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/#/FacDetail/";

/**
 * Config.js BaseWebUrl casing variant. Same SPA; publication code uses the
 * lowercase `carefacilitysearch` host path.
 */
export const CALIFORNIA_PHASE11_FACILITY_DETAIL_PAGE_PREFIX_ALT_CASE =
  "https://www.ccld.dss.ca.gov/CareFacilitySearch/?Rewrite=FacDetail/";

/** Official CDSS facility numbers are 8–9 digit strings and may keep a leading zero. */
export const CALIFORNIA_PHASE11_FACILITY_NUMBER = /^\d{8,9}$/;

export type CaliforniaPhase11File = "RCFE" | "ARF";

export type CaliforniaPhase11DisclosureLinkKind =
  | "facility-detail-page"
  | "facility-detail-api"
  | "facility-reports-api"
  | "facility-detail-hash"
  | "facility-detail-rewrite-alt";

export type CaliforniaPhase11DisclosureUrlPattern = {
  kind: CaliforniaPhase11DisclosureLinkKind;
  pattern: string;
  canonicalForPublication: boolean;
  notes: string;
};

/**
 * Official URL patterns for RCFE and ARF (same CDSS Care Facility Search app;
 * facility type is not encoded in the path).
 */
export const CALIFORNIA_PHASE11_DISCLOSURE_URL_PATTERNS: readonly CaliforniaPhase11DisclosureUrlPattern[] = [
  {
    kind: "facility-detail-page",
    pattern: `${CALIFORNIA_PHASE11_FACILITY_DETAIL_PAGE_PREFIX}{facilityNumber}`,
    canonicalForPublication: true,
    notes:
      "Canonical public disclosure / FacDetail rewrite used by publication-acceptance and nationwide onboarding. Identical for RCFE and ARF.",
  },
  {
    kind: "facility-detail-api",
    pattern: `${CALIFORNIA_PHASE11_FACILITY_DETAIL_API}{facilityNumber}`,
    canonicalForPublication: false,
    notes:
      "Authoritative per-facility JSON used to prove the disclosure target resolves. SPA always returns 200 shell HTML for the page URL.",
  },
  {
    kind: "facility-reports-api",
    pattern: `${CALIFORNIA_PHASE11_FACILITY_REPORTS_API}{facilityNumber}`,
    canonicalForPublication: false,
    notes:
      "Supporting inspection/complaint report list for the FacDetail tabs; not the facility disclosure link.",
  },
  {
    kind: "facility-detail-hash",
    pattern: `${CALIFORNIA_PHASE11_FACILITY_DETAIL_HASH_PREFIX}{facilityNumber}`,
    canonicalForPublication: false,
    notes: "SPA hash route equivalent; not the accepted publication disclosure form.",
  },
  {
    kind: "facility-detail-rewrite-alt",
    pattern: `${CALIFORNIA_PHASE11_FACILITY_DETAIL_REWRITE_ALT_PREFIX}{facilityNumber}`,
    canonicalForPublication: false,
    notes: "Alternate FacDetailRewrite query; SPA redirects into /FacDetail/{id}.",
  },
] as const;

export type CaliforniaPhase11GeneratedLinks = {
  facilityNumber: string;
  validIdentifier: boolean;
  pageUrl: string | null;
  apiUrl: string | null;
  reportsApiUrl: string | null;
  hashUrl: string | null;
  rewriteAltUrl: string | null;
  preservesLeadingZeros: boolean;
  rejectionReason: string | null;
};

/**
 * Read-only link generator. Preserves the exact license identifier string,
 * including leading zeros. Invalid identifiers yield null URLs (fail-closed).
 */
export function generateCaliforniaPhase11DisclosureLinks(
  facilityNumber: string,
): CaliforniaPhase11GeneratedLinks {
  const id = (facilityNumber ?? "").trim();
  const validIdentifier = CALIFORNIA_PHASE11_FACILITY_NUMBER.test(id);
  if (!validIdentifier) {
    return {
      facilityNumber: id,
      validIdentifier: false,
      pageUrl: null,
      apiUrl: null,
      reportsApiUrl: null,
      hashUrl: null,
      rewriteAltUrl: null,
      preservesLeadingZeros: id.startsWith("0"),
      rejectionReason: id === ""
        ? "empty-facility-number"
        : "facility-number-not-8-or-9-digits",
    };
  }
  return {
    facilityNumber: id,
    validIdentifier: true,
    pageUrl: `${CALIFORNIA_PHASE11_FACILITY_DETAIL_PAGE_PREFIX}${id}`,
    apiUrl: `${CALIFORNIA_PHASE11_FACILITY_DETAIL_API}${id}`,
    reportsApiUrl: `${CALIFORNIA_PHASE11_FACILITY_REPORTS_API}${id}`,
    hashUrl: `${CALIFORNIA_PHASE11_FACILITY_DETAIL_HASH_PREFIX}${id}`,
    rewriteAltUrl: `${CALIFORNIA_PHASE11_FACILITY_DETAIL_REWRITE_ALT_PREFIX}${id}`,
    // Exact trimmed identifier is embedded unchanged (leading zeros kept).
    preservesLeadingZeros: true,
    rejectionReason: null,
  };
}

/**
 * True only when the candidate equals the canonical FacDetail rewrite URL for
 * the exact official identifier (leading zeros required when present).
 */
export function isCaliforniaPhase11CanonicalDisclosureUrl(
  facilityNumber: string,
  candidateUrl: string | null | undefined,
): boolean {
  const generated = generateCaliforniaPhase11DisclosureLinks(facilityNumber);
  if (!generated.validIdentifier || !generated.pageUrl) return false;
  return (candidateUrl ?? "").trim() === generated.pageUrl;
}

export type CaliforniaPhase11LinkValidationClass =
  | "working"
  | "missing"
  | "ambiguous"
  | "invalid";

export type CaliforniaPhase11LinkValidationInput = {
  facilityNumber: string;
  file?: CaliforniaPhase11File;
  stratum?: string;
  downloadStatus?: string;
  downloadType?: string;
  /** HTTP status from FacilityDetail API GET, if attempted. */
  apiHttpStatus?: number | null;
  /** Parsed FACILITYNUMBER from FacilityDetail, if any. */
  liveFacilityNumber?: string | null;
  /** True when FacilityDetail returned a found facility record. */
  apiFound?: boolean | null;
  /** Optional page GET status (SPA shell is typically always 200). */
  pageHttpStatus?: number | null;
  timedOut?: boolean;
};

export type CaliforniaPhase11LinkValidationResult = CaliforniaPhase11LinkValidationInput & {
  generated: CaliforniaPhase11GeneratedLinks;
  classification: CaliforniaPhase11LinkValidationClass;
  identifierRelation: "exact" | "leading-zero-canonicalization" | "mismatch" | "missing" | "not-applicable";
  rationale: string;
  sampleIsStatewideConclusion: false;
};

export function relateCaliforniaPhase11LinkIdentifiers(
  requestedId: string,
  canonicalFacilityNumber: string | null,
): CaliforniaPhase11LinkValidationResult["identifierRelation"] {
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

/**
 * Classify a bounded link probe. Invalid IDs never produce working links.
 * SPA page HTTP 200 alone is insufficient — FacilityDetail API identity is required.
 */
export function classifyCaliforniaPhase11DisclosureLink(
  input: CaliforniaPhase11LinkValidationInput,
): CaliforniaPhase11LinkValidationResult {
  const generated = generateCaliforniaPhase11DisclosureLinks(input.facilityNumber);
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
      classification: "ambiguous",
      identifierRelation: "missing",
      rationale: "FacilityDetail request timed out or failed at the transport layer; link target inconclusive.",
      sampleIsStatewideConclusion: false,
    };
  }
  if (input.apiHttpStatus != null && input.apiHttpStatus !== 200) {
    return {
      ...input,
      generated,
      classification: "ambiguous",
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
  const identifierRelation = relateCaliforniaPhase11LinkIdentifiers(
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

export type CaliforniaPhase11LinkValidationSummary = {
  observedOn: string | null;
  sampleSize: number;
  working: number;
  missing: number;
  ambiguous: number;
  invalid: number;
  byClassification: Record<CaliforniaPhase11LinkValidationClass, number>;
  leadingZeroPreservedWorking: number;
  sampleIsStatewideConclusion: false;
  statewideCoverageClaimed: false;
  publication: "unpublished";
  ownerClaimEligible: false;
  limitations: readonly string[];
  results: CaliforniaPhase11LinkValidationResult[];
};

export function summarizeCaliforniaPhase11DisclosureLinks(
  results: readonly CaliforniaPhase11LinkValidationResult[],
  observedOn: string | null = null,
): CaliforniaPhase11LinkValidationSummary {
  const byClassification: Record<CaliforniaPhase11LinkValidationClass, number> = {
    working: 0,
    missing: 0,
    ambiguous: 0,
    invalid: 0,
  };
  let leadingZeroPreservedWorking = 0;
  for (const row of results) {
    byClassification[row.classification] += 1;
    if (
      row.classification === "working"
      && row.generated.facilityNumber.startsWith("0")
      && row.identifierRelation === "exact"
    ) {
      leadingZeroPreservedWorking += 1;
    }
  }
  return {
    observedOn,
    sampleSize: results.length,
    working: byClassification.working,
    missing: byClassification.missing,
    ambiguous: byClassification.ambiguous,
    invalid: byClassification.invalid,
    byClassification,
    leadingZeroPreservedWorking,
    sampleIsStatewideConclusion: false,
    statewideCoverageClaimed: false,
    publication: "unpublished",
    ownerClaimEligible: false,
    limitations: [
      "Bounded sample only; do not claim statewide disclosure-link coverage.",
      "SPA FacDetail page HTTP 200 returns the application shell for both found and missing IDs; FacilityDetail API identity is required.",
      "FacilityReports is supporting disclosure content, not the canonical facility disclosure URL.",
      "California remains unpublished; owner claims stay ineligible.",
    ],
    results: [...results],
  };
}
