/**
 * California Phase 12 — expanded disclosure-link verification helpers.
 * Reuses the same canonical CDSS FacDetail / disclosure URL patterns as
 * Phase 11. Preserves exact license IDs including leading zeros. Does not
 * publish California or claim statewide coverage from a sample.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE12_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE12_TRANSPARENCY_API_ROOT =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/";

export const CALIFORNIA_PHASE12_FACILITY_DETAIL_API =
  `${CALIFORNIA_PHASE12_TRANSPARENCY_API_ROOT}FacilityDetail/`;

export const CALIFORNIA_PHASE12_FACILITY_REPORTS_API =
  `${CALIFORNIA_PHASE12_TRANSPARENCY_API_ROOT}FacilityReports/`;

export const CALIFORNIA_PHASE12_FACILITY_DETAIL_PAGE_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";

export const CALIFORNIA_PHASE12_FACILITY_DETAIL_REWRITE_ALT_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?FacDetailRewrite=";

export const CALIFORNIA_PHASE12_FACILITY_DETAIL_HASH_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/#/FacDetail/";

export const CALIFORNIA_PHASE12_FACILITY_NUMBER = /^\d{8,9}$/;

export type CaliforniaPhase12File = "RCFE" | "ARF";

export type CaliforniaPhase12DisclosureLinkKind =
  | "facility-detail-page"
  | "facility-detail-api"
  | "facility-reports-api"
  | "facility-detail-hash"
  | "facility-detail-rewrite-alt";

export type CaliforniaPhase12DisclosureUrlPattern = {
  kind: CaliforniaPhase12DisclosureLinkKind;
  pattern: string;
  canonicalForPublication: boolean;
  notes: string;
};

export const CALIFORNIA_PHASE12_DISCLOSURE_URL_PATTERNS: readonly CaliforniaPhase12DisclosureUrlPattern[] = [
  {
    kind: "facility-detail-page",
    pattern: `${CALIFORNIA_PHASE12_FACILITY_DETAIL_PAGE_PREFIX}{facilityNumber}`,
    canonicalForPublication: true,
    notes:
      "Canonical public disclosure / FacDetail rewrite. Identical for RCFE and ARF.",
  },
  {
    kind: "facility-detail-api",
    pattern: `${CALIFORNIA_PHASE12_FACILITY_DETAIL_API}{facilityNumber}`,
    canonicalForPublication: false,
    notes:
      "Authoritative per-facility JSON used to prove the disclosure target resolves.",
  },
  {
    kind: "facility-reports-api",
    pattern: `${CALIFORNIA_PHASE12_FACILITY_REPORTS_API}{facilityNumber}`,
    canonicalForPublication: false,
    notes: "Supporting inspection/complaint list; not the facility disclosure link.",
  },
  {
    kind: "facility-detail-hash",
    pattern: `${CALIFORNIA_PHASE12_FACILITY_DETAIL_HASH_PREFIX}{facilityNumber}`,
    canonicalForPublication: false,
    notes: "SPA hash route equivalent; not the accepted publication disclosure form.",
  },
  {
    kind: "facility-detail-rewrite-alt",
    pattern: `${CALIFORNIA_PHASE12_FACILITY_DETAIL_REWRITE_ALT_PREFIX}{facilityNumber}`,
    canonicalForPublication: false,
    notes: "Alternate FacDetailRewrite query; SPA redirects into /FacDetail/{id}.",
  },
] as const;

export type CaliforniaPhase12GeneratedLinks = {
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

export function generateCaliforniaPhase12DisclosureLinks(
  facilityNumber: string,
): CaliforniaPhase12GeneratedLinks {
  const id = (facilityNumber ?? "").trim();
  const validIdentifier = CALIFORNIA_PHASE12_FACILITY_NUMBER.test(id);
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
    pageUrl: `${CALIFORNIA_PHASE12_FACILITY_DETAIL_PAGE_PREFIX}${id}`,
    apiUrl: `${CALIFORNIA_PHASE12_FACILITY_DETAIL_API}${id}`,
    reportsApiUrl: `${CALIFORNIA_PHASE12_FACILITY_REPORTS_API}${id}`,
    hashUrl: `${CALIFORNIA_PHASE12_FACILITY_DETAIL_HASH_PREFIX}${id}`,
    rewriteAltUrl: `${CALIFORNIA_PHASE12_FACILITY_DETAIL_REWRITE_ALT_PREFIX}${id}`,
    preservesLeadingZeros: true,
    rejectionReason: null,
  };
}

export function isCaliforniaPhase12CanonicalDisclosureUrl(
  facilityNumber: string,
  candidateUrl: string | null | undefined,
): boolean {
  const generated = generateCaliforniaPhase12DisclosureLinks(facilityNumber);
  if (!generated.validIdentifier || !generated.pageUrl) return false;
  return (candidateUrl ?? "").trim() === generated.pageUrl;
}

export type CaliforniaPhase12LinkValidationClass =
  | "working"
  | "missing"
  | "ambiguous"
  | "invalid"
  | "inconclusive";

export type CaliforniaPhase12LinkValidationInput = {
  facilityNumber: string;
  file?: CaliforniaPhase12File;
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

export type CaliforniaPhase12LinkValidationResult = CaliforniaPhase12LinkValidationInput & {
  generated: CaliforniaPhase12GeneratedLinks;
  classification: CaliforniaPhase12LinkValidationClass;
  identifierRelation:
    | "exact"
    | "leading-zero-canonicalization"
    | "mismatch"
    | "missing"
    | "not-applicable";
  rationale: string;
  sampleIsStatewideConclusion: false;
};

export function relateCaliforniaPhase12LinkIdentifiers(
  requestedId: string,
  canonicalFacilityNumber: string | null,
): CaliforniaPhase12LinkValidationResult["identifierRelation"] {
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
export function classifyCaliforniaPhase12DisclosureLink(
  input: CaliforniaPhase12LinkValidationInput,
): CaliforniaPhase12LinkValidationResult {
  const generated = generateCaliforniaPhase12DisclosureLinks(input.facilityNumber);
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
  const identifierRelation = relateCaliforniaPhase12LinkIdentifiers(
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

export type CaliforniaPhase12LinkValidationSummary = {
  observedOn: string | null;
  sampleSize: number;
  working: number;
  missing: number;
  ambiguous: number;
  invalid: number;
  inconclusive: number;
  byClassification: Record<CaliforniaPhase12LinkValidationClass, number>;
  leadingZeroPreservedWorking: number;
  sampleIsStatewideConclusion: false;
  statewideCoverageClaimed: false;
  publication: "unpublished";
  ownerClaimEligible: false;
  limitations: readonly string[];
  results: CaliforniaPhase12LinkValidationResult[];
};

export function summarizeCaliforniaPhase12DisclosureLinks(
  results: readonly CaliforniaPhase12LinkValidationResult[],
  observedOn: string | null = null,
): CaliforniaPhase12LinkValidationSummary {
  const byClassification: Record<CaliforniaPhase12LinkValidationClass, number> = {
    working: 0,
    missing: 0,
    ambiguous: 0,
    invalid: 0,
    inconclusive: 0,
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
    inconclusive: byClassification.inconclusive,
    byClassification,
    leadingZeroPreservedWorking,
    sampleIsStatewideConclusion: false,
    statewideCoverageClaimed: false,
    publication: "unpublished",
    ownerClaimEligible: false,
    limitations: [
      "Expanded stratified sample only; do not claim statewide disclosure-link coverage.",
      "SPA FacDetail page HTTP 200 returns the application shell for both found and missing IDs; FacilityDetail API identity is required.",
      "FacilityReports is supporting disclosure content, not the canonical facility disclosure URL.",
      "California remains unpublished; owner claims stay ineligible.",
    ],
    results: [...results],
  };
}
