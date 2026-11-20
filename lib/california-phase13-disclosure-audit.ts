/**
 * California Phase 13 — scalable, read-only disclosure-link audit harness.
 * Designed for the 15,451 publication candidates with checkpointing,
 * rate limits, retry/backoff, request caps, and clear stopping conditions.
 * Preserves exact facility identifiers including leading zeros.
 * Sample runs never claim statewide coverage.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE13_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE13_TRANSPARENCY_API_ROOT =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/";

export const CALIFORNIA_PHASE13_FACILITY_DETAIL_API =
  `${CALIFORNIA_PHASE13_TRANSPARENCY_API_ROOT}FacilityDetail/`;

export const CALIFORNIA_PHASE13_FACILITY_REPORTS_API =
  `${CALIFORNIA_PHASE13_TRANSPARENCY_API_ROOT}FacilityReports/`;

export const CALIFORNIA_PHASE13_FACILITY_DETAIL_PAGE_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";

export const CALIFORNIA_PHASE13_FACILITY_NUMBER = /^\d{8,9}$/;

/** Publication-candidate roster size carried from Phase 10–12 baseline. */
export const CALIFORNIA_PHASE13_PUBLICATION_CANDIDATE_ROSTER_SIZE = 15451;

export const CALIFORNIA_PHASE13_AUDIT_DEFAULTS = {
  minIntervalMs: 450,
  maxAttempts: 3,
  retryStatuses: [429, 500, 502, 503, 504] as const,
  backoffMs: [500, 1500, 3000] as const,
  /** Soft cap for a single operator session before an explicit resume. */
  defaultMaxRequests: 200,
  /** Hard stop when elapsed wall time exceeds this (ms). */
  defaultMaxDurationMs: 30 * 60 * 1000,
  /** Persist checkpoint after this many newly completed probes. */
  checkpointEvery: 10,
  /** Consecutive transport failures before stop-for-operator. */
  maxConsecutiveInconclusive: 8,
} as const;

export type CaliforniaPhase13File = "RCFE" | "ARF";

export type CaliforniaPhase13DisclosureLinkKind =
  | "facility-detail-page"
  | "facility-detail-api"
  | "facility-reports-api";

export type CaliforniaPhase13DisclosureUrlPattern = {
  kind: CaliforniaPhase13DisclosureLinkKind;
  pattern: string;
  canonicalForPublication: boolean;
  notes: string;
};

export const CALIFORNIA_PHASE13_DISCLOSURE_URL_PATTERNS: readonly CaliforniaPhase13DisclosureUrlPattern[] = [
  {
    kind: "facility-detail-page",
    pattern: `${CALIFORNIA_PHASE13_FACILITY_DETAIL_PAGE_PREFIX}{facilityNumber}`,
    canonicalForPublication: true,
    notes:
      "Canonical public disclosure / FacDetail rewrite. Identical for RCFE and ARF.",
  },
  {
    kind: "facility-detail-api",
    pattern: `${CALIFORNIA_PHASE13_FACILITY_DETAIL_API}{facilityNumber}`,
    canonicalForPublication: false,
    notes:
      "Authoritative per-facility JSON used to prove the disclosure target resolves.",
  },
  {
    kind: "facility-reports-api",
    pattern: `${CALIFORNIA_PHASE13_FACILITY_REPORTS_API}{facilityNumber}`,
    canonicalForPublication: false,
    notes: "Supporting inspection/complaint list; not the facility disclosure link.",
  },
] as const;

export type CaliforniaPhase13GeneratedLinks = {
  facilityNumber: string;
  validIdentifier: boolean;
  pageUrl: string | null;
  apiUrl: string | null;
  reportsApiUrl: string | null;
  preservesLeadingZeros: boolean;
  rejectionReason: string | null;
};

export function generateCaliforniaPhase13DisclosureLinks(
  facilityNumber: string,
): CaliforniaPhase13GeneratedLinks {
  const id = (facilityNumber ?? "").trim();
  const validIdentifier = CALIFORNIA_PHASE13_FACILITY_NUMBER.test(id);
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
    pageUrl: `${CALIFORNIA_PHASE13_FACILITY_DETAIL_PAGE_PREFIX}${id}`,
    apiUrl: `${CALIFORNIA_PHASE13_FACILITY_DETAIL_API}${id}`,
    reportsApiUrl: `${CALIFORNIA_PHASE13_FACILITY_REPORTS_API}${id}`,
    preservesLeadingZeros: true,
    rejectionReason: null,
  };
}

export type CaliforniaPhase13LinkValidationClass =
  | "working"
  | "missing"
  | "ambiguous"
  | "invalid"
  | "inconclusive";

export type CaliforniaPhase13LinkValidationInput = {
  facilityNumber: string;
  file?: CaliforniaPhase13File;
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

export type CaliforniaPhase13LinkValidationResult = CaliforniaPhase13LinkValidationInput & {
  generated: CaliforniaPhase13GeneratedLinks;
  classification: CaliforniaPhase13LinkValidationClass;
  identifierRelation:
    | "exact"
    | "leading-zero-canonicalization"
    | "mismatch"
    | "missing"
    | "not-applicable";
  rationale: string;
  sampleIsStatewideConclusion: false;
};

export function relateCaliforniaPhase13LinkIdentifiers(
  requestedId: string,
  canonicalFacilityNumber: string | null,
): CaliforniaPhase13LinkValidationResult["identifierRelation"] {
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
 * Classify a disclosure probe. Invalid IDs never produce working links.
 * SPA page HTTP 200 alone is insufficient — FacilityDetail API identity required.
 */
export function classifyCaliforniaPhase13DisclosureLink(
  input: CaliforniaPhase13LinkValidationInput,
): CaliforniaPhase13LinkValidationResult {
  const generated = generateCaliforniaPhase13DisclosureLinks(input.facilityNumber);
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
  const identifierRelation = relateCaliforniaPhase13LinkIdentifiers(
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

export type CaliforniaPhase13LinkValidationSummary = {
  observedOn: string | null;
  sampleSize: number;
  working: number;
  missing: number;
  ambiguous: number;
  invalid: number;
  inconclusive: number;
  byClassification: Record<CaliforniaPhase13LinkValidationClass, number>;
  leadingZeroPreservedWorking: number;
  /** Exact verified coverage against the publication-candidate roster. */
  verifiedCoverage: {
    verifiedCount: number;
    rosterDenominator: number;
    coverageFraction: number;
    coveragePercentRounded: number;
  };
  sampleIsStatewideConclusion: false;
  statewideCoverageClaimed: false;
  publication: "unpublished";
  ownerClaimEligible: false;
  limitations: readonly string[];
  results: CaliforniaPhase13LinkValidationResult[];
};

export function summarizeCaliforniaPhase13DisclosureLinks(
  results: readonly CaliforniaPhase13LinkValidationResult[],
  options: {
    observedOn?: string | null;
    rosterDenominator?: number;
  } = {},
): CaliforniaPhase13LinkValidationSummary {
  const byClassification: Record<CaliforniaPhase13LinkValidationClass, number> = {
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
  const rosterDenominator = options.rosterDenominator
    ?? CALIFORNIA_PHASE13_PUBLICATION_CANDIDATE_ROSTER_SIZE;
  const verifiedCount = results.length;
  const coverageFraction = rosterDenominator > 0 ? verifiedCount / rosterDenominator : 0;
  return {
    observedOn: options.observedOn ?? null,
    sampleSize: results.length,
    working: byClassification.working,
    missing: byClassification.missing,
    ambiguous: byClassification.ambiguous,
    invalid: byClassification.invalid,
    inconclusive: byClassification.inconclusive,
    byClassification,
    leadingZeroPreservedWorking,
    verifiedCoverage: {
      verifiedCount,
      rosterDenominator,
      coverageFraction,
      coveragePercentRounded: Math.round(coverageFraction * 10000) / 100,
    },
    sampleIsStatewideConclusion: false,
    statewideCoverageClaimed: false,
    publication: "unpublished",
    ownerClaimEligible: false,
    limitations: [
      "Stratified or partial sample only; do not claim statewide disclosure-link coverage.",
      `Verified coverage is ${verifiedCount}/${rosterDenominator} publication candidates — never equate a sample to roster-complete verification.`,
      "SPA FacDetail page HTTP 200 returns the application shell for both found and missing IDs; FacilityDetail API identity is required.",
      "FacilityReports is supporting disclosure content, not the canonical facility disclosure URL.",
      "California remains unpublished; owner claims stay ineligible.",
    ],
    results: [...results],
  };
}

export type CaliforniaPhase13AuditStopReason =
  | "queue-exhausted"
  | "max-requests"
  | "max-duration"
  | "consecutive-inconclusive"
  | "operator-abort"
  | "checkpoint-only";

export type CaliforniaPhase13AuditConfig = {
  minIntervalMs: number;
  maxAttempts: number;
  retryStatuses: readonly number[];
  backoffMs: readonly number[];
  maxRequests: number;
  maxDurationMs: number;
  checkpointEvery: number;
  maxConsecutiveInconclusive: number;
  rosterDenominator: number;
};

export function californiaPhase13DefaultAuditConfig(
  overrides: Partial<CaliforniaPhase13AuditConfig> = {},
): CaliforniaPhase13AuditConfig {
  return {
    minIntervalMs: CALIFORNIA_PHASE13_AUDIT_DEFAULTS.minIntervalMs,
    maxAttempts: CALIFORNIA_PHASE13_AUDIT_DEFAULTS.maxAttempts,
    retryStatuses: CALIFORNIA_PHASE13_AUDIT_DEFAULTS.retryStatuses,
    backoffMs: CALIFORNIA_PHASE13_AUDIT_DEFAULTS.backoffMs,
    maxRequests: CALIFORNIA_PHASE13_AUDIT_DEFAULTS.defaultMaxRequests,
    maxDurationMs: CALIFORNIA_PHASE13_AUDIT_DEFAULTS.defaultMaxDurationMs,
    checkpointEvery: CALIFORNIA_PHASE13_AUDIT_DEFAULTS.checkpointEvery,
    maxConsecutiveInconclusive: CALIFORNIA_PHASE13_AUDIT_DEFAULTS.maxConsecutiveInconclusive,
    rosterDenominator: CALIFORNIA_PHASE13_PUBLICATION_CANDIDATE_ROSTER_SIZE,
    ...overrides,
  };
}

export type CaliforniaPhase13AuditQueueItem = {
  facilityNumber: string;
  requestFacilityNumber?: string;
  file: CaliforniaPhase13File;
  downloadStatus: string;
  downloadType: string;
  stratum: string;
  label: string;
  /** True when this ID is among the 15,451 publication candidates. */
  publicationCandidate: boolean;
};

export type CaliforniaPhase13AuditCheckpointResult = CaliforniaPhase13LinkValidationResult & {
  officialFacilityNumber: string;
  requestFacilityNumber: string;
  label: string;
  stratum: string;
  publicationCandidate: boolean;
  liveStatus: string | null;
  attempts: number;
  completedAt: string;
};

export type CaliforniaPhase13AuditCheckpoint = {
  version: 1;
  mode: "stratified-sample" | "roster-resume";
  observedOn: string;
  startedAt: string;
  updatedAt: string;
  config: CaliforniaPhase13AuditConfig;
  queueTotal: number;
  completedKeys: string[];
  results: CaliforniaPhase13AuditCheckpointResult[];
  consecutiveInconclusive: number;
  requestsThisSession: number;
  stopReason: CaliforniaPhase13AuditStopReason | null;
  statewideCoverageClaimed: false;
  sampleIsStatewideConclusion: false;
  publication: "unpublished";
  ownerClaimEligible: false;
  notes: readonly string[];
};

export function californiaPhase13AuditItemKey(item: {
  facilityNumber: string;
  requestFacilityNumber?: string;
  label?: string;
}): string {
  const requestId = (item.requestFacilityNumber ?? item.facilityNumber).trim();
  const label = (item.label ?? "").trim();
  return `${requestId}::${item.facilityNumber.trim()}::${label}`;
}

export function createCaliforniaPhase13AuditCheckpoint(input: {
  mode: CaliforniaPhase13AuditCheckpoint["mode"];
  observedOn: string;
  queue: readonly CaliforniaPhase13AuditQueueItem[];
  config?: Partial<CaliforniaPhase13AuditConfig>;
  startedAt?: string;
}): CaliforniaPhase13AuditCheckpoint {
  const now = input.startedAt ?? new Date().toISOString();
  return {
    version: 1,
    mode: input.mode,
    observedOn: input.observedOn,
    startedAt: now,
    updatedAt: now,
    config: californiaPhase13DefaultAuditConfig(input.config),
    queueTotal: input.queue.length,
    completedKeys: [],
    results: [],
    consecutiveInconclusive: 0,
    requestsThisSession: 0,
    stopReason: null,
    statewideCoverageClaimed: false,
    sampleIsStatewideConclusion: false,
    publication: "unpublished",
    ownerClaimEligible: false,
    notes: [
      "Read-only FacilityDetail probes only; no Supabase / production writes.",
      "Resume by loading this checkpoint and skipping completedKeys.",
      "Never claim statewide verification while verifiedCount < rosterDenominator.",
      "Do not send CDSS clarification email from this harness.",
    ],
  };
}

export function remainingCaliforniaPhase13AuditQueue(
  queue: readonly CaliforniaPhase13AuditQueueItem[],
  checkpoint: CaliforniaPhase13AuditCheckpoint,
): CaliforniaPhase13AuditQueueItem[] {
  const done = new Set(checkpoint.completedKeys);
  return queue.filter(item => !done.has(californiaPhase13AuditItemKey(item)));
}

export type CaliforniaPhase13ShouldStopInput = {
  requestsThisSession: number;
  elapsedMs: number;
  consecutiveInconclusive: number;
  remainingCount: number;
  config: CaliforniaPhase13AuditConfig;
};

export function shouldStopCaliforniaPhase13Audit(
  input: CaliforniaPhase13ShouldStopInput,
): CaliforniaPhase13AuditStopReason | null {
  if (input.remainingCount <= 0) return "queue-exhausted";
  if (input.requestsThisSession >= input.config.maxRequests) return "max-requests";
  if (input.elapsedMs >= input.config.maxDurationMs) return "max-duration";
  if (input.consecutiveInconclusive >= input.config.maxConsecutiveInconclusive) {
    return "consecutive-inconclusive";
  }
  return null;
}

export function appendCaliforniaPhase13AuditResult(
  checkpoint: CaliforniaPhase13AuditCheckpoint,
  item: CaliforniaPhase13AuditQueueItem,
  result: CaliforniaPhase13LinkValidationResult,
  meta: { liveStatus: string | null; attempts: number; completedAt?: string },
): CaliforniaPhase13AuditCheckpoint {
  const key = californiaPhase13AuditItemKey(item);
  const completedAt = meta.completedAt ?? new Date().toISOString();
  const nextResult: CaliforniaPhase13AuditCheckpointResult = {
    ...result,
    officialFacilityNumber: item.facilityNumber,
    requestFacilityNumber: item.requestFacilityNumber ?? item.facilityNumber,
    label: item.label,
    stratum: item.stratum,
    publicationCandidate: item.publicationCandidate,
    liveStatus: meta.liveStatus,
    attempts: meta.attempts,
    completedAt,
  };
  const consecutiveInconclusive = result.classification === "inconclusive"
    ? checkpoint.consecutiveInconclusive + 1
    : 0;
  return {
    ...checkpoint,
    updatedAt: completedAt,
    completedKeys: [...checkpoint.completedKeys, key],
    results: [...checkpoint.results, nextResult],
    consecutiveInconclusive,
    requestsThisSession: checkpoint.requestsThisSession + 1,
    statewideCoverageClaimed: false,
    sampleIsStatewideConclusion: false,
  };
}

export function finalizeCaliforniaPhase13AuditCheckpoint(
  checkpoint: CaliforniaPhase13AuditCheckpoint,
  stopReason: CaliforniaPhase13AuditStopReason,
): CaliforniaPhase13AuditCheckpoint {
  return {
    ...checkpoint,
    stopReason,
    updatedAt: new Date().toISOString(),
    statewideCoverageClaimed: false,
    sampleIsStatewideConclusion: false,
  };
}

/**
 * Deterministic stable hash for stratified sampling (FNV-1a 32-bit).
 * Keeps sample selection reproducible across resumes without randomness.
 */
export function californiaPhase13StableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export type CaliforniaPhase13StratumPlanSpec = {
  stratum: string;
  targetCount: number;
};

/**
 * Deterministically pick up to `targetCount` items per stratum from a pool.
 * Items already present in `seed` are preferred and counted toward the quota.
 */
export function planCaliforniaPhase13StratifiedSample<T extends {
  facilityNumber: string;
  stratum: string;
  label?: string;
}>(
  pool: readonly T[],
  specs: readonly CaliforniaPhase13StratumPlanSpec[],
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
        const ha = californiaPhase13StableHash(`${a.facilityNumber}|${a.stratum}|${a.label ?? ""}`);
        const hb = californiaPhase13StableHash(`${b.facilityNumber}|${b.stratum}|${b.label ?? ""}`);
        return ha - hb || a.facilityNumber.localeCompare(b.facilityNumber);
      });
    for (const row of candidates.slice(0, need)) {
      selected.push(row);
      selectedKeys.add(keyOf(row));
    }
  }
  return selected;
}

export function californiaPhase13ClaimsStatewideCoverage(
  verifiedCount: number,
  rosterDenominator: number = CALIFORNIA_PHASE13_PUBLICATION_CANDIDATE_ROSTER_SIZE,
): boolean {
  // Explicitly false for any partial sample — even if somehow equal, operator
  // must still confirm a dedicated roster-complete run with stopReason queue-exhausted.
  if (verifiedCount < rosterDenominator) return false;
  return false;
}
