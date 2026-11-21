/**
 * California Tier 1 exclusion-control readiness (post-#206).
 *
 * Deterministic specification for the 22 residual listing exclusions, fail-
 * closed listing-surface gates (search / detail / API), and a reversible
 * activation plan. Keeps three decisions separate: exclusion activation,
 * eligibility-mapping activation, and California public publication.
 *
 * Development-only / read-only. Does NOT activate exclusions, publish
 * California, or write Supabase. Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_EXCLUSION_CONTROL_OBSERVED_ON = "2026-11-21";
export const CALIFORNIA_EXCLUSION_CONTROL_BASELINE = "2a1e2c7" as const;

export const CALIFORNIA_EXCLUSION_CONTROL_SOURCE = {
  pathway: "downloadstatedata-transparency-csv" as const,
  adoptedAsOfIso: "2026-11-15" as const,
  facilityDetailApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
  newerDownloadAvailable: false as const,
} as const;

/**
 * Three decisions kept separate. None are activated by this module.
 */
export const CALIFORNIA_EXCLUSION_CONTROL_DECISION_SEPARATION = {
  exclusionActivation: {
    id: "activate-california-exclusion-ledger-in-app-db",
    activated: false as const,
    publishesCalifornia: false as const,
    requiresSeparateApproval: true as const,
  },
  eligibilityMappingActivation: {
    id: "activate-pending-increase-mapping-in-app-db",
    activated: false as const,
    publishesCalifornia: false as const,
    requiresSeparateApproval: true as const,
    scope: "future-eligibility-consideration-only" as const,
  },
  californiaPublicPublication: {
    id: "approve-california-statewide-public-publication",
    activated: false as const,
    publishesCalifornia: true as const,
    requiresSeparateApproval: true as const,
  },
} as const;

export type CaliforniaExclusionControlBucket =
  | "missing-first-license-date"
  | "provisional-license"
  | "status-conflict";

export type CaliforniaExclusionControlCase = {
  facilityNumber: string;
  bucket: CaliforniaExclusionControlBucket;
  controlReason: string;
  listingEligibleIfActivated: false;
  publicationEligible: false;
  ownerClaimEligible: false;
  reinstatementRequires: string;
};

/**
 * Deterministic exclusion-control specification for the 22 residual cases.
 * Exact IDs; leading zeros preserved. Not activated.
 */
export const CALIFORNIA_EXCLUSION_CONTROL_MISSING_FIRST_DATE_IDS = [
  "079201725",
  "502701889",
  "374605020",
  "342701856",
  "197610992",
  "342701894",
  "502701880",
  "198604006",
  "195850781",
  "107209715",
  "195850785",
  "197611051",
  "360951409",
  "198320716",
] as const;

export const CALIFORNIA_EXCLUSION_CONTROL_PROVISIONAL_IDS = [
  "198320787",
  "455920513",
  "197611076",
  "197611060",
  "134605014",
] as const;

export const CALIFORNIA_EXCLUSION_CONTROL_STATUS_CONFLICT_IDS = [
  "502701867",
  "019201167",
  "019201133",
] as const;

function casesFor(
  ids: readonly string[],
  bucket: CaliforniaExclusionControlBucket,
  controlReason: string,
  reinstatementRequires: string,
): CaliforniaExclusionControlCase[] {
  return ids.map((facilityNumber) => ({
    facilityNumber,
    bucket,
    controlReason,
    listingEligibleIfActivated: false as const,
    publicationEligible: false as const,
    ownerClaimEligible: false as const,
    reinstatementRequires,
  }));
}

export const CALIFORNIA_EXCLUSION_CONTROL_CASES: readonly CaliforniaExclusionControlCase[] =
  [
    ...casesFor(
      CALIFORNIA_EXCLUSION_CONTROL_MISSING_FIRST_DATE_IDS,
      "missing-first-license-date",
      "Download License First Date empty; never substitute LICENSEEFFECTIVEDATE.",
      "Non-empty authoritative License First Date on both Download and FacilityDetail, with exact Facility Number match.",
    ),
    ...casesFor(
      CALIFORNIA_EXCLUSION_CONTROL_PROVISIONAL_IDS,
      "provisional-license",
      "FacilityDetail STATUS is Provisional License (not a clear licensed listing).",
      "FacilityDetail clears to Licensed (or approved mapped status) with Download agreement and exact Facility Number match.",
    ),
    ...casesFor(
      CALIFORNIA_EXCLUSION_CONTROL_STATUS_CONFLICT_IDS,
      "status-conflict",
      "Documented status conflict / prior-control: 502701867 Pending Incomplete Application; 019201167 and 019201133 retained as prior-control Pending Increase until optional reclassify.",
      "Human-approved reclassification or FacilityDetail clear Licensed with Download agreement; prior-control IDs need explicit reclassify decision.",
    ),
  ];

export const CALIFORNIA_EXCLUSION_CONTROL_COUNTS = {
  residualExclusions: 22,
  missingFirstLicenseDate: 14,
  provisionalLicense: 5,
  statusConflict: 3,
  offlineTier1Candidates: 15429,
  publicationEligible: 0,
  exclusionsActivated: false as const,
  eligibilityMappingActivated: false as const,
  californiaPublished: false as const,
} as const;

/** Live FacilityDetail spot-checks (2026-11-21) for residual exclusion controls. */
export const CALIFORNIA_EXCLUSION_CONTROL_LIVE_SPOT_CHECKS = [
  {
    facilityNumber: "079201725",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "198320787",
    bucket: "provisional-license" as const,
    apiStatus: "Provisional License",
    licenseFirstDate: "8/12/2026",
    identifierExactMatch: true,
  },
  {
    facilityNumber: "502701867",
    bucket: "status-conflict" as const,
    apiStatus: "Pending Incomplete Application",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "019201167",
    bucket: "status-conflict" as const,
    apiStatus: "Licensed/Pending Increase",
    licenseFirstDate: "8/1/2022",
    identifierExactMatch: true,
  },
  {
    facilityNumber: "019201133",
    bucket: "status-conflict" as const,
    apiStatus: "Licensed/Pending Increase",
    licenseFirstDate: "3/11/2022",
    identifierExactMatch: true,
  },
] as const;

const FACILITY_NUMBER = /^\d{8,9}$/;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

const EXCLUSION_ID_SET: ReadonlySet<string> = new Set(
  CALIFORNIA_EXCLUSION_CONTROL_CASES.map((c) => c.facilityNumber),
);

/**
 * CDSS FacilityDetail accepts truncated leading-zero forms (e.g. `19201167`
 * resolves to canonical `019201167`). Exclusion membership must therefore
 * match both the exact residual ID and its 9-digit zero-padded canonical form
 * when the residual ID itself is 9 digits starting with `0`.
 */
export function californiaExclusionIdCandidates(
  facilityNumber: string,
): string[] {
  const id = text(facilityNumber);
  const out = new Set<string>();
  if (!id) return [];
  out.add(id);
  if (/^\d{8}$/.test(id)) out.add(`0${id}`);
  if (/^\d{9}$/.test(id) && id.startsWith("0")) out.add(id.slice(1));
  return [...out];
}

export function isCaliforniaExclusionControlFacilityNumber(
  facilityNumber: string,
): boolean {
  return FACILITY_NUMBER.test(text(facilityNumber));
}

export function californiaIsResidualListingExclusion(
  facilityNumber: string,
): boolean {
  return californiaExclusionIdCandidates(facilityNumber).some((c) =>
    EXCLUSION_ID_SET.has(c),
  );
}

export function californiaExclusionControlCaseFor(
  facilityNumber: string,
): CaliforniaExclusionControlCase | null {
  for (const candidate of californiaExclusionIdCandidates(facilityNumber)) {
    const found = CALIFORNIA_EXCLUSION_CONTROL_CASES.find(
      (c) => c.facilityNumber === candidate,
    );
    if (found) return found;
  }
  return null;
}

export type CaliforniaListingSurface =
  | "search"
  | "detail-page"
  | "api"
  | "map"
  | "owner-claim";

/**
 * Fail-closed gate: excluded or ambiguous facilities must not enter future
 * public listings through search, detail pages, or APIs. Always blocked while
 * California publication remains unpublished / publicationEligible=0.
 */
export function californiaExclusionControlListingGate(input: {
  facilityNumber: string;
  surface: CaliforniaListingSurface;
  californiaPublished?: boolean;
  publicationEligibleCount?: number;
  exclusionsActivated?: boolean;
  sourceAmbiguousOrUnverified?: boolean;
}): {
  allowed: false;
  reasons: string[];
  exclusionCase: CaliforniaExclusionControlCase | null;
} {
  const reasons: string[] = [];
  const id = text(input.facilityNumber);
  const exclusionCase = californiaExclusionControlCaseFor(id);
  const matchedViaTruncationAlias =
    exclusionCase != null && exclusionCase.facilityNumber !== id;

  if (!FACILITY_NUMBER.test(id)) reasons.push("invalid-facility-number");
  if (exclusionCase) reasons.push(`residual-exclusion:${exclusionCase.bucket}`);
  if (matchedViaTruncationAlias) {
    reasons.push("leading-zero-truncation-alias");
  }
  if (input.sourceAmbiguousOrUnverified) {
    reasons.push("source-ambiguous-or-unverified");
  }
  if (input.californiaPublished) {
    /* still fail-closed for residual exclusions even if hypothetically published */
  } else {
    reasons.push("california-unpublished");
  }
  if ((input.publicationEligibleCount ?? 0) === 0) {
    reasons.push("publication-eligible-zero");
  }
  if (!input.exclusionsActivated) {
    reasons.push("exclusion-ledger-inactive-fail-closed");
  }

  // Surface-specific markers for audit/regression clarity.
  if (input.surface === "search") reasons.push("blocked-from-search");
  if (input.surface === "detail-page") reasons.push("blocked-from-detail-page");
  if (input.surface === "api") reasons.push("blocked-from-api");
  if (input.surface === "map") reasons.push("blocked-from-map");
  if (input.surface === "owner-claim") reasons.push("blocked-from-owner-claim");

  return {
    allowed: false,
    reasons: [...new Set(reasons)],
    exclusionCase,
  };
}

/**
 * Reversible activation plan — specification only. activated=false.
 */
export const CALIFORNIA_EXCLUSION_CONTROL_ACTIVATION_PLAN = {
  activated: false as const,
  reversible: true as const,
  doesNotPublishCalifornia: true as const,
  doesNotActivateEligibilityMapping: true as const,
  steps: [
    {
      id: "record-approval",
      title: "Record human approval for exclusion-ledger activation only",
      detail:
        "Approve activate-california-exclusion-ledger-in-app-db without approving statewide publication or Pending Increase mapping activation.",
    },
    {
      id: "load-ledger",
      title: "Load the 22 residual exclusion IDs into the offline ledger",
      detail:
        "Exact Facility Number strings (leading zeros preserved). Buckets: 14 missing-first-date, 5 provisional, 3 status-conflict. Also block truncated leading-zero aliases that CDSS FacilityDetail canonicalizes.",
    },
    {
      id: "enforce-listing-gates",
      title: "Enforce fail-closed listing gates on search / detail / API",
      detail:
        "californiaExclusionControlListingGate must return allowed=false for every residual exclusion ID and truncation alias on every public surface. Cache keys must use canonical Facility Number strings.",
    },
    {
      id: "audit-record",
      title: "Write immutable audit record",
      detail:
        "Capture approver, timestamp, as-of 2026-11-15 source SHA/disposition, exact ID list hash, and decision separation (exclusion ≠ mapping ≠ publication).",
    },
    {
      id: "monitoring",
      title: "Enable monitoring",
      detail:
        "Alert if a residual exclusion ID appears in any public listing query, sitemap, or API response; alert if ledger activation flips without matching audit record.",
    },
    {
      id: "regression-tests",
      title: "Run regression suite",
      detail:
        "CI tests: 22 IDs blocked on search/detail/API; WA/OR/FL/OH unchanged; publicationEligible remains 0 unless separate publication approval.",
    },
  ],
  rollback: [
    {
      id: "disable-ledger-flag",
      title: "Flip exclusionsActivated → false",
      detail:
        "Immediate fail-closed: listing gates continue to block via california-unpublished / publication-eligible-zero even with ledger off.",
    },
    {
      id: "retain-audit",
      title: "Retain activation and rollback audit rows",
      detail:
        "Do not delete historical audit; append rollback reason, actor, and timestamp.",
    },
    {
      id: "verify-surfaces",
      title: "Verify search / detail / API still return no California public facilities",
      detail:
        "publicationEligible must remain 0; directoryContract California stays unpublished.",
    },
  ],
  auditRecordFields: [
    "decisionId",
    "approver",
    "approvedAtIso",
    "sourceAsOfIso",
    "exclusionIdCount",
    "exclusionIdListHash",
    "eligibilityMappingActivated",
    "californiaPublished",
    "rollbackOfActivationId",
  ] as const,
  monitoringChecks: [
    "residual-exclusion-id-absent-from-public-search",
    "residual-exclusion-id-absent-from-public-detail",
    "residual-exclusion-id-absent-from-public-api",
    "activation-flag-matches-audit",
    "washington-oregon-florida-ohio-unaffected",
  ] as const,
  regressionTests: [
    "counts-22-equals-14-plus-5-plus-3",
    "each-residual-id-blocked-on-search-detail-api",
    "invalid-id-blocked",
    "ambiguous-source-blocked",
    "three-decisions-remain-separate",
    "activation-plan-not-activated",
    "publication-eligible-zero",
  ] as const,
} as const;

export const CALIFORNIA_EXCLUSION_CONTROL_DECISIONS_REQUIRING_APPROVAL = [
  {
    id: "activate-california-exclusion-ledger-in-app-db",
    title: "Activate California offline exclusion ledger in app/DB",
    recommendation:
      "Approve only when ready to enforce the 22 residual IDs in configuration. Does not publish California and does not activate Pending Increase mapping.",
    blocksPublicationAlone: false,
    separateFromEligibilityMapping: true,
    separateFromPublication: true,
  },
  {
    id: "activate-pending-increase-mapping-in-app-db",
    title: "Activate Pending Increase eligibility mapping in app/DB",
    recommendation:
      "Keep separate from exclusion activation. Future-eligibility only; still requires statewide publication approval before public listing.",
    blocksPublicationAlone: false,
    separateFromExclusionActivation: true,
    separateFromPublication: true,
  },
  {
    id: "approve-california-statewide-public-publication",
    title: "Approve California statewide public publication",
    recommendation: "Do not approve yet. publicationEligible=0; state authorization unpublished.",
    blocksPublicationAlone: true,
    separateFromExclusionActivation: true,
    separateFromEligibilityMapping: true,
  },
  {
    id: "reclassify-prior-control-pending-increase-ids",
    title:
      "Reclassify prior-control IDs 019201167 / 019201133 under Pending Increase mapping",
    recommendation:
      "Optional. Keep as status-conflict exclusions unless explicitly reclassified (+2 offline Tier 1).",
    blocksPublicationAlone: false,
    separateFromExclusionActivation: true,
    separateFromPublication: true,
  },
] as const;

export type CaliforniaExclusionControlMatrixArea =
  | "exclusion-spec"
  | "listing-surface-gates"
  | "activation-plan"
  | "decision-separation"
  | "eligibility-accounting"
  | "publication-authorization"
  | "security";

export type CaliforniaExclusionControlMatrixRow = {
  area: CaliforniaExclusionControlMatrixArea;
  title: string;
  status: "GO" | "CONDITIONAL" | "STOP";
  evidence: string;
  genuineApprovalDecision: boolean;
};

export const CALIFORNIA_EXCLUSION_CONTROL_MATRIX: readonly CaliforniaExclusionControlMatrixRow[] =
  [
    {
      area: "exclusion-spec",
      title: "Deterministic 22-case exclusion-control specification",
      status: "GO",
      evidence:
        "Exact IDs: 14 missing-first-date + 5 provisional + 3 status-conflict. Live FacilityDetail spot-checks reconfirm control reasons. Leading zeros preserved.",
      genuineApprovalDecision: false,
    },
    {
      area: "listing-surface-gates",
      title: "Fail-closed search / detail / API gates for excluded IDs",
      status: "GO",
      evidence:
        "californiaExclusionControlListingGate returns allowed=false for every residual exclusion on search, detail-page, and api surfaces; also blocks invalid and ambiguous sources. Truncated leading-zero aliases (e.g. 19201167 → 019201167) match residual membership and add leading-zero-truncation-alias.",
      genuineApprovalDecision: false,
    },
    {
      area: "activation-plan",
      title: "Reversible activation plan (not executed)",
      status: "CONDITIONAL",
      evidence:
        "Plan includes approval record, ledger load, gate enforcement, audit, monitoring, regression tests, and rollback. activated=false until human approval.",
      genuineApprovalDecision: true,
    },
    {
      area: "decision-separation",
      title: "Exclusion vs mapping vs publication decisions separated",
      status: "GO",
      evidence:
        "Three distinct decision IDs; activating exclusions does not activate mapping or publish California.",
      genuineApprovalDecision: false,
    },
    {
      area: "eligibility-accounting",
      title: "Offline Tier 1 accounting under inactive ledger",
      status: "CONDITIONAL",
      evidence:
        "15,429 offline Tier 1 / 22 residual exclusions / publicationEligible=0. Ledger inactive.",
      genuineApprovalDecision: true,
    },
    {
      area: "publication-authorization",
      title: "California public publication",
      status: "STOP",
      evidence: "Unpublished. Zero facilities authorized for public listing.",
      genuineApprovalDecision: true,
    },
    {
      area: "security",
      title: "Production / cross-state boundary",
      status: "GO",
      evidence:
        "Read-only readiness. No Supabase writes, no activation, no CA publication, no production deploy. WA/OR/FL/OH unchanged.",
      genuineApprovalDecision: false,
    },
  ];

export const CALIFORNIA_EXCLUSION_CONTROL_RESOLVED = [
  "residual-22-deterministic-spec-complete",
  "missing-first-date-14-provisional-5-status-conflict-3",
  "listing-gates-fail-closed-search-detail-api",
  "leading-zero-truncation-aliases-blocked",
  "activation-plan-reversible-not-executed",
  "three-decisions-kept-separate",
  "live-spot-checks-reconfirmed-2026-11-21",
] as const;

export const CALIFORNIA_EXCLUSION_CONTROL_REMAINING_BLOCKERS = [
  "exclusion-ledger-inactive-awaiting-approval",
  "eligibility-mapping-inactive-separate-decision",
  "california-publication-blocked",
  "publication-eligible-zero",
  "prior-control-reclassify-optional",
] as const;

export function buildCaliforniaExclusionControlReadinessPreview() {
  const c = CALIFORNIA_EXCLUSION_CONTROL_COUNTS;
  const plan = CALIFORNIA_EXCLUSION_CONTROL_ACTIVATION_PLAN;
  const sep = CALIFORNIA_EXCLUSION_CONTROL_DECISION_SEPARATION;

  const countsOk =
    c.residualExclusions
      === c.missingFirstLicenseDate
        + c.provisionalLicense
        + c.statusConflict
    && CALIFORNIA_EXCLUSION_CONTROL_CASES.length === 22
    && CALIFORNIA_EXCLUSION_CONTROL_MISSING_FIRST_DATE_IDS.length === 14
    && CALIFORNIA_EXCLUSION_CONTROL_PROVISIONAL_IDS.length === 5
    && CALIFORNIA_EXCLUSION_CONTROL_STATUS_CONFLICT_IDS.length === 3
    && c.publicationEligible === 0
    && !c.exclusionsActivated
    && !c.eligibilityMappingActivated
    && !c.californiaPublished;

  const uniqueIds = new Set(
    CALIFORNIA_EXCLUSION_CONTROL_CASES.map((row) => row.facilityNumber),
  );
  const uniquenessOk = uniqueIds.size === 22;

  const gatesOk =
    californiaExclusionControlListingGate({
      facilityNumber: "079201725",
      surface: "search",
    }).allowed === false
    && californiaExclusionControlListingGate({
      facilityNumber: "198320787",
      surface: "detail-page",
    }).reasons.some((r) => r.startsWith("residual-exclusion:"))
    && californiaExclusionControlListingGate({
      facilityNumber: "502701867",
      surface: "api",
    }).reasons.includes("blocked-from-api")
    && californiaExclusionControlListingGate({
      facilityNumber: "019201167",
      surface: "search",
      sourceAmbiguousOrUnverified: true,
    }).reasons.includes("source-ambiguous-or-unverified")
    && californiaExclusionControlListingGate({
      facilityNumber: "95354",
      surface: "api",
    }).reasons.includes("invalid-facility-number")
    && !californiaIsResidualListingExclusion("015601083")
    && californiaIsResidualListingExclusion("019201133")
    && californiaIsResidualListingExclusion("19201167")
    && californiaIsResidualListingExclusion("19201133")
    && californiaIsResidualListingExclusion("79201725")
    && californiaExclusionControlListingGate({
      facilityNumber: "19201167",
      surface: "detail-page",
    }).reasons.includes("leading-zero-truncation-alias");

  const separationOk =
    !sep.exclusionActivation.activated
    && !sep.eligibilityMappingActivation.activated
    && !sep.californiaPublicPublication.activated
    && sep.exclusionActivation.id
      === "activate-california-exclusion-ledger-in-app-db"
    && sep.eligibilityMappingActivation.id
      === "activate-pending-increase-mapping-in-app-db"
    && sep.californiaPublicPublication.id
      === "approve-california-statewide-public-publication"
    && !plan.activated
    && plan.reversible
    && plan.doesNotPublishCalifornia
    && plan.doesNotActivateEligibilityMapping;

  const matrixGo = CALIFORNIA_EXCLUSION_CONTROL_MATRIX.filter(
    (r) => r.status === "GO",
  ).length;
  const matrixConditional = CALIFORNIA_EXCLUSION_CONTROL_MATRIX.filter(
    (r) => r.status === "CONDITIONAL",
  ).length;
  const matrixStop = CALIFORNIA_EXCLUSION_CONTROL_MATRIX.filter(
    (r) => r.status === "STOP",
  ).length;

  const arithmeticOk =
    countsOk
    && uniquenessOk
    && gatesOk
    && separationOk
    && matrixStop >= 1
    && matrixConditional >= 2
    && CALIFORNIA_EXCLUSION_CONTROL_LIVE_SPOT_CHECKS.every(
      (s) => s.identifierExactMatch,
    )
    && CALIFORNIA_EXCLUSION_CONTROL_SOURCE.adoptedAsOfIso === "2026-11-15";

  return {
    observedOn: CALIFORNIA_EXCLUSION_CONTROL_OBSERVED_ON,
    baseline: CALIFORNIA_EXCLUSION_CONTROL_BASELINE,
    source: CALIFORNIA_EXCLUSION_CONTROL_SOURCE,
    counts: c,
    cases: CALIFORNIA_EXCLUSION_CONTROL_CASES,
    liveSpotChecks: CALIFORNIA_EXCLUSION_CONTROL_LIVE_SPOT_CHECKS,
    decisionSeparation: sep,
    activationPlan: plan,
    matrix: CALIFORNIA_EXCLUSION_CONTROL_MATRIX,
    decisionsRequiringApproval:
      CALIFORNIA_EXCLUSION_CONTROL_DECISIONS_REQUIRING_APPROVAL,
    resolvedFindings: CALIFORNIA_EXCLUSION_CONTROL_RESOLVED,
    remainingBlockers: CALIFORNIA_EXCLUSION_CONTROL_REMAINING_BLOCKERS,
    arithmeticOk,
    matrixGo,
    matrixConditional,
    matrixStop,
    exclusionsActivated: false as const,
    allowsPublication: false as const,
    finalPublicVisibility: false as const,
    stopGoPublic: "STOP" as const,
    stopGoDevelopmentPreview: "GO" as const,
    stopGoExclusionActivation: "CONDITIONAL" as const,
    mostActionableNextStep:
      "Public California remains STOP. Exclusion-control specification is ready for human approval of ledger activation only — separate from Pending Increase mapping activation and separate from statewide publication. Do not activate without explicit approval.",
    preservedRestrictions: [
      "washington-oregon-florida-ohio-unchanged",
      "exclusions-remain-inactive",
      "eligibility-mapping-remain-inactive",
      "california-unpublished",
      "three-decisions-kept-separate",
      "leading-zeros-preserved",
    ] as const,
  };
}

export function californiaExclusionControlAllowsPublication(): false {
  return false;
}

export function californiaExclusionControlActivated(): false {
  return false;
}
