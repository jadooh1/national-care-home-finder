/**
 * California Phase 15 — cumulative disclosure coverage helpers on top of the
 * Phase 13 read-only rate-limited resumable audit harness.
 * Baseline cumulative coverage enters at Phase 14's 233/15451.
 * Sample runs never claim statewide coverage. California stays unpublished.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE15_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE15_TRANSPARENCY_API_ROOT =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/";

export const CALIFORNIA_PHASE15_FACILITY_DETAIL_API =
  `${CALIFORNIA_PHASE15_TRANSPARENCY_API_ROOT}FacilityDetail/`;

export const CALIFORNIA_PHASE15_FACILITY_REPORTS_API =
  `${CALIFORNIA_PHASE15_TRANSPARENCY_API_ROOT}FacilityReports/`;

export const CALIFORNIA_PHASE15_FACILITY_DETAIL_PAGE_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";

export const CALIFORNIA_PHASE15_FACILITY_NUMBER = /^\d{8,9}$/;

export const CALIFORNIA_PHASE15_PUBLICATION_CANDIDATE_ROSTER_SIZE = 15451;

/** Phase 14 cumulative disclosure probes (fixture-backed; not statewide). */
export const CALIFORNIA_PHASE15_PHASE14_CUMULATIVE_VERIFIED_COUNT = 233;

export const CALIFORNIA_PHASE15_AUDIT_DEFAULTS = {
  minIntervalMs: 450,
  maxAttempts: 3,
  retryStatuses: [429, 500, 502, 503, 504] as const,
  backoffMs: [500, 1500, 3000] as const,
  defaultMaxRequests: 200,
  defaultMaxDurationMs: 30 * 60 * 1000,
  checkpointEvery: 10,
  maxConsecutiveInconclusive: 8,
} as const;

export type CaliforniaPhase15DisclosureUrlPattern = {
  kind: "facility-detail-page" | "facility-detail-api" | "facility-reports-api";
  pattern: string;
  canonicalForPublication: boolean;
  notes: string;
};

export const CALIFORNIA_PHASE15_DISCLOSURE_URL_PATTERNS: readonly CaliforniaPhase15DisclosureUrlPattern[] = [
  {
    kind: "facility-detail-page",
    pattern: `${CALIFORNIA_PHASE15_FACILITY_DETAIL_PAGE_PREFIX}{facilityNumber}`,
    canonicalForPublication: true,
    notes: "Canonical public disclosure / FacDetail rewrite. Identical for RCFE and ARF.",
  },
  {
    kind: "facility-detail-api",
    pattern: `${CALIFORNIA_PHASE15_FACILITY_DETAIL_API}{facilityNumber}`,
    canonicalForPublication: false,
    notes: "Authoritative per-facility JSON used to prove the disclosure target resolves.",
  },
  {
    kind: "facility-reports-api",
    pattern: `${CALIFORNIA_PHASE15_FACILITY_REPORTS_API}{facilityNumber}`,
    canonicalForPublication: false,
    notes: "Supporting inspection/complaint list; not the facility disclosure link.",
  },
] as const;

export type CaliforniaPhase15GeneratedLinks = {
  facilityNumber: string;
  validIdentifier: boolean;
  pageUrl: string | null;
  apiUrl: string | null;
  reportsApiUrl: string | null;
  preservesLeadingZeros: boolean;
  rejectionReason: string | null;
};

export function generateCaliforniaPhase15DisclosureLinks(
  facilityNumber: string,
): CaliforniaPhase15GeneratedLinks {
  const id = (facilityNumber ?? "").trim();
  const validIdentifier = CALIFORNIA_PHASE15_FACILITY_NUMBER.test(id);
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
    pageUrl: `${CALIFORNIA_PHASE15_FACILITY_DETAIL_PAGE_PREFIX}${id}`,
    apiUrl: `${CALIFORNIA_PHASE15_FACILITY_DETAIL_API}${id}`,
    reportsApiUrl: `${CALIFORNIA_PHASE15_FACILITY_REPORTS_API}${id}`,
    preservesLeadingZeros: true,
    rejectionReason: null,
  };
}

export type CaliforniaPhase15LinkValidationClass =
  | "working"
  | "missing"
  | "ambiguous"
  | "invalid"
  | "inconclusive";

export type CaliforniaPhase15LinkValidationInput = {
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

export type CaliforniaPhase15LinkValidationResult = CaliforniaPhase15LinkValidationInput & {
  generated: CaliforniaPhase15GeneratedLinks;
  classification: CaliforniaPhase15LinkValidationClass;
  identifierRelation:
    | "exact"
    | "leading-zero-canonicalization"
    | "mismatch"
    | "missing"
    | "not-applicable";
  rationale: string;
  sampleIsStatewideConclusion: false;
};

export function relateCaliforniaPhase15LinkIdentifiers(
  requestedId: string,
  canonicalFacilityNumber: string | null,
): CaliforniaPhase15LinkValidationResult["identifierRelation"] {
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

export function classifyCaliforniaPhase15DisclosureLink(
  input: CaliforniaPhase15LinkValidationInput,
): CaliforniaPhase15LinkValidationResult {
  const generated = generateCaliforniaPhase15DisclosureLinks(input.facilityNumber);
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
  const identifierRelation = relateCaliforniaPhase15LinkIdentifiers(
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

export type CaliforniaPhase15CoverageRollup = {
  phase14CumulativeVerifiedCount: number;
  incrementalVerifiedCount: number;
  cumulativeVerifiedCount: number;
  rosterDenominator: number;
  incrementalCoverageFraction: number;
  cumulativeCoverageFraction: number;
  incrementalCoveragePercentRounded: number;
  cumulativeCoveragePercentRounded: number;
  statewideCoverageClaimed: false;
  sampleIsStatewideConclusion: false;
  publication: "unpublished";
  ownerClaimEligible: false;
  notes: readonly string[];
};

/**
 * Roll up Phase 14 cumulative + Phase 15 incremental disclosure probes into
 * exact cumulative coverage against the publication-candidate roster.
 * Never claims statewide coverage from a partial sample.
 */
export function summarizeCaliforniaPhase15Coverage(input: {
  phase14CumulativeVerifiedCount?: number;
  incrementalResults: readonly unknown[];
  rosterDenominator?: number;
}): CaliforniaPhase15CoverageRollup {
  const phase14CumulativeVerifiedCount = input.phase14CumulativeVerifiedCount
    ?? CALIFORNIA_PHASE15_PHASE14_CUMULATIVE_VERIFIED_COUNT;
  const incrementalVerifiedCount = input.incrementalResults.length;
  const cumulativeVerifiedCount = phase14CumulativeVerifiedCount + incrementalVerifiedCount;
  const rosterDenominator = input.rosterDenominator
    ?? CALIFORNIA_PHASE15_PUBLICATION_CANDIDATE_ROSTER_SIZE;
  const incrementalCoverageFraction = rosterDenominator > 0
    ? incrementalVerifiedCount / rosterDenominator
    : 0;
  const cumulativeCoverageFraction = rosterDenominator > 0
    ? cumulativeVerifiedCount / rosterDenominator
    : 0;
  return {
    phase14CumulativeVerifiedCount,
    incrementalVerifiedCount,
    cumulativeVerifiedCount,
    rosterDenominator,
    incrementalCoverageFraction,
    cumulativeCoverageFraction,
    incrementalCoveragePercentRounded:
      Math.round(incrementalCoverageFraction * 10000) / 100,
    cumulativeCoveragePercentRounded:
      Math.round(cumulativeCoverageFraction * 10000) / 100,
    statewideCoverageClaimed: false,
    sampleIsStatewideConclusion: false,
    publication: "unpublished",
    ownerClaimEligible: false,
    notes: [
      `Phase 14 cumulative disclosure probes: ${phase14CumulativeVerifiedCount}/${rosterDenominator}.`,
      `Phase 15 incremental disclosure probes: ${incrementalVerifiedCount}/${rosterDenominator}.`,
      `Cumulative verified coverage: ${cumulativeVerifiedCount}/${rosterDenominator} — sample only; statewideCoverageClaimed=false.`,
      "Do not equate a stratified or partial sample with roster-complete verification.",
      "California remains unpublished; owner claims stay ineligible.",
    ],
  };
}

export function californiaPhase15ClaimsStatewideCoverage(
  cumulativeVerifiedCount: number,
  rosterDenominator: number = CALIFORNIA_PHASE15_PUBLICATION_CANDIDATE_ROSTER_SIZE,
): boolean {
  void cumulativeVerifiedCount;
  void rosterDenominator;
  return false;
}

export function californiaPhase15StableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export type CaliforniaPhase15StratumPlanSpec = {
  stratum: string;
  targetCount: number;
};

export function planCaliforniaPhase15StratifiedSample<T extends {
  facilityNumber: string;
  stratum: string;
  label?: string;
}>(
  pool: readonly T[],
  specs: readonly CaliforniaPhase15StratumPlanSpec[],
  seed: readonly T[] = [],
): T[] {
  const selected: T[] = [];
  const selectedKeys = new Set<string>();
  const keyOf = (row: T) =>
    `${row.stratum}::${row.facilityNumber}::${row.label ?? ""}`;

  for (const row of seed) {
    const key = keyOf(row);
    if (!selectedKeys.has(key)) {
      selected.push(row);
      selectedKeys.add(key);
    }
  }

  for (const spec of specs) {
    const already = selected.filter(row => row.stratum === spec.stratum).length;
    const need = Math.max(0, spec.targetCount - already);
    if (need === 0) continue;
    const candidates = pool
      .filter(row => row.stratum === spec.stratum && !selectedKeys.has(keyOf(row)))
      .slice()
      .sort((a, b) => {
        const ha = californiaPhase15StableHash(`${a.facilityNumber}|${a.stratum}|${a.label ?? ""}`);
        const hb = californiaPhase15StableHash(`${b.facilityNumber}|${b.stratum}|${b.label ?? ""}`);
        return ha - hb || a.facilityNumber.localeCompare(b.facilityNumber);
      });
    for (const row of candidates.slice(0, need)) {
      selected.push(row);
      selectedKeys.add(keyOf(row));
    }
  }
  return selected;
}
