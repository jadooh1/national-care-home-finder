/**
 * California exclusion activation necessity and sequencing (post-#208).
 *
 * Answers whether exclusion activation is required *before* continuing
 * California launch preparations. Development-only / read-only. Does NOT
 * activate exclusions, eligibility mapping, publish California, or write
 * Supabase. Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_EXCLUSION_NECESSITY_OBSERVED_ON = "2026-11-21";
export const CALIFORNIA_EXCLUSION_NECESSITY_BASELINE = "54855fd" as const;

export const CALIFORNIA_EXCLUSION_NECESSITY_STATE = {
  offlineTier1Candidates: 15429,
  residualExclusions: 22,
  publicationEligible: 0,
  exclusionsActivated: false as const,
  eligibilityMappingActivated: false as const,
  californiaPublished: false as const,
  californiaDirectoryReady: false as const,
  directoryPublication: "unpublished" as const,
  ownerClaimsEnabledForCalifornia: false as const,
  productionCaliforniaRoutesExist: false as const,
  productionCaliforniaListingQueriesExist: false as const,
  residualGateWiredIntoProductionPaths: false as const,
} as const;

/**
 * Current public-surface blocks that hold regardless of exclusion ledger state.
 */
export const CALIFORNIA_EXCLUSION_NECESSITY_CURRENT_BLOCKS = [
  {
    id: "directory-contract-unpublished",
    surface: "directory" as const,
    evidence:
      "directoryContract(\"California\") falls through to publication=unpublished, directoryPath=null, mapPath=null.",
  },
  {
    id: "california-directory-ready-hard-false",
    surface: "directory" as const,
    evidence: "californiaDirectoryReady() returns false; CALIFORNIA_DIRECTORY_PUBLICATION=unpublished.",
  },
  {
    id: "no-public-california-app-routes",
    surface: "routes" as const,
    evidence:
      "No app/california/**. California UI lives only under app/development/california* (robots noindex).",
  },
  {
    id: "no-california-listing-queries",
    surface: "database" as const,
    evidence:
      "Production client queries use wa_dshs_listed_facilities / wa_afh_map_facilities / or_odhs_listed_afh only. No CA facility table is wired.",
  },
  {
    id: "owner-claims-wa-only",
    surface: "owner-claim" as const,
    evidence: "ENABLED_OWNER_FACILITY_STATES = [\"WA\"]; California ownerClaimsEnabled=false.",
  },
  {
    id: "sitemap-wa-only",
    surface: "sitemap" as const,
    evidence:
      "sitemapUrls / DIRECTORY_VIEW index Washington licenses only; /development is privately disallowed.",
  },
  {
    id: "framework-publication-stop",
    surface: "framework" as const,
    evidence:
      "California publication profile: stateAuthorization unpublished, californiaPublicationBlocked=true, publicationStopGo=STOP, publicationEligible=0.",
  },
  {
    id: "no-app-api-routes",
    surface: "api" as const,
    evidence: "No app/api and no middleware.ts; no public California API surface exists.",
  },
] as const;

export type CaliforniaExclusionNecessityVerdict =
  | "activate-now"
  | "defer-until-prepublication"
  | "never-required";

/**
 * Activate-now vs defer comparison (evidence-based).
 */
export const CALIFORNIA_EXCLUSION_NECESSITY_COMPARISON = {
  activateNow: {
    label: "Activate exclusions now",
    reducesCurrentPublicLeakRisk: false,
    requiredToContinueLaunchPrep: false,
    costs: [
      "Consumes a separate human approval early",
      "Creates an inactive-ledger→active-ledger operational change with no production consumer yet",
      "Risk of treating activation as progress toward publication",
    ],
    benefits: [
      "Ledger exists earlier for offline tooling",
      "Slightly earlier rehearsal of monitoring/alerts",
    ],
  },
  deferUntilPrepublication: {
    label: "Defer until prepublication testing / listing wire-up",
    reducesCurrentPublicLeakRisk: false,
    requiredToContinueLaunchPrep: false,
    costs: [
      "Must not forget the hard precondition before wiring CA listing paths",
    ],
    benefits: [
      "Matches current architecture: residual gate is not on production paths yet",
      "Keeps three approvals independent and sequenced",
      "Avoids activating a ledger with zero runtime consumers",
      "Activation can be verified immediately against the listing wire-up it protects",
    ],
  },
} as const;

export const CALIFORNIA_EXCLUSION_NECESSITY_RECOMMENDATION = {
  verdict: "defer-until-prepublication" as const satisfies CaliforniaExclusionNecessityVerdict,
  activationNecessaryBeforeContinuingLaunchPrep: false as const,
  currentSecurityOrPublicationRiskFromInactiveExclusions: "none" as const,
  rationale:
    "All California public surfaces are blocked structurally (unpublished directory, no CA routes/queries, WA-only owner/sitemap). Residual-22 exclusion activation does not change current leak risk and is not required to continue launch preparations. Activate the ledger as a hard precondition immediately before CA listing wire-up / prepublication testing — not now.",
} as const;

/**
 * Hard sequencing: publication / listing wire-up must not proceed without
 * an activated residual exclusion ledger wired into listing gates.
 */
export function californiaExclusionRequiredBeforePublicationWiring(input: {
  exclusionsActivated: boolean;
  residualGateWiredIntoListingPaths: boolean;
}): {
  allowed: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (!input.exclusionsActivated) {
    reasons.push("exclusion-ledger-not-activated");
  }
  if (!input.residualGateWiredIntoListingPaths) {
    reasons.push("residual-exclusion-gate-not-wired");
  }
  return { allowed: reasons.length === 0, reasons };
}

/**
 * Continuing non-publishing launch prep is allowed while exclusions stay inactive.
 */
export function californiaLaunchPrepAllowedWhileExclusionsInactive(input?: {
  wouldPublishCalifornia?: boolean;
  wouldWirePublicListingPaths?: boolean;
  wouldActivateEligibilityMapping?: boolean;
  wouldWriteSupabase?: boolean;
}): {
  allowed: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (input?.wouldPublishCalifornia) reasons.push("would-publish-california");
  if (input?.wouldWirePublicListingPaths) {
    reasons.push("would-wire-public-listing-paths");
  }
  if (input?.wouldActivateEligibilityMapping) {
    reasons.push("would-activate-eligibility-mapping");
  }
  if (input?.wouldWriteSupabase) reasons.push("would-write-supabase");
  return { allowed: reasons.length === 0, reasons };
}

export const CALIFORNIA_EXCLUSION_ACTIVATION_SEQUENCE = [
  {
    id: "continue-launch-prep",
    phase: "now" as const,
    requiresExclusionActivation: false,
    detail:
      "Continue disclosure, freshness, QA, security, and accounting work with exclusions inactive. California stays unpublished.",
  },
  {
    id: "reconfirm-source-freshness",
    phase: "prepublication" as const,
    requiresExclusionActivation: false,
    detail:
      "Reconfirm DownloadStateData as-of / Content-Disposition (adopted 2026-11-15) before any listing wire-up. Fail closed if stale or ambiguous.",
  },
  {
    id: "approve-and-activate-exclusion-ledger",
    phase: "prepublication" as const,
    requiresExclusionActivation: true,
    detail:
      "Human approval of activate-california-exclusion-ledger-in-app-db only. Load 22 residual IDs + truncation aliases. Does not activate mapping or publish California.",
  },
  {
    id: "wire-residual-gate-into-listing-paths",
    phase: "prepublication" as const,
    requiresExclusionActivation: true,
    detail:
      "Wire californiaExclusionControlListingGate (or equivalent) into every future CA search/detail/API/map/owner path. Cache keys use canonical Facility Numbers.",
  },
  {
    id: "verify-residual-block-and-rollback",
    phase: "prepublication" as const,
    requiresExclusionActivation: true,
    detail:
      "Verify all 22 residuals (+ aliases) blocked on every surface; rehearse rollback (exclusionsActivated→false) while unpublished + publicationEligible=0 keep fail-closed.",
  },
  {
    id: "optional-eligibility-mapping",
    phase: "separate-approval" as const,
    requiresExclusionActivation: false,
    detail:
      "activate-pending-increase-mapping-in-app-db remains a separate decision. Not required for residual exclusion enforcement.",
  },
  {
    id: "statewide-publication",
    phase: "separate-approval" as const,
    requiresExclusionActivation: true,
    detail:
      "approve-california-statewide-public-publication only after exclusions are active, residual gate is wired, publicationEligible is non-zero under approved policy, and prepublication tests pass. Currently STOP.",
  },
] as const;

export const CALIFORNIA_EXCLUSION_NECESSITY_ROLLBACK = {
  flipExclusionsActivatedOff: true as const,
  retainAuditRows: true as const,
  surfacesRemainFailClosedViaUnpublished: true as const,
  surfacesRemainFailClosedViaPublicationEligibleZero: true as const,
  doesNotRequireDatabaseDeletes: true as const,
} as const;

export const CALIFORNIA_EXCLUSION_NECESSITY_VERIFICATION = [
  "residual-22-plus-truncation-aliases-blocked-on-search-detail-api-map-owner",
  "non-residual-candidates-still-subject-to-publicationEligible-and-authorization",
  "cache-keys-canonical-facility-number",
  "rollback-leaves-california-unpublished",
  "washington-oregon-florida-ohio-unaffected",
  "eligibility-mapping-still-inactive-unless-separately-approved",
] as const;

export type CaliforniaExclusionNecessityMatrixArea =
  | "current-public-leak-risk"
  | "activation-needed-for-launch-prep"
  | "activation-needed-before-listing-wire-up"
  | "decision-independence"
  | "public-publication"
  | "security";

export type CaliforniaExclusionNecessityMatrixRow = {
  area: CaliforniaExclusionNecessityMatrixArea;
  title: string;
  status: "GO" | "CONDITIONAL" | "STOP";
  evidence: string;
  genuineApprovalDecision: boolean;
};

export const CALIFORNIA_EXCLUSION_NECESSITY_MATRIX: readonly CaliforniaExclusionNecessityMatrixRow[] =
  [
    {
      area: "current-public-leak-risk",
      title: "Current risk from inactive exclusions",
      status: "GO",
      evidence:
        "None. Structural unpublished blocks, no CA routes/queries, WA-only owner/sitemap. Residual ledger unused by production paths.",
      genuineApprovalDecision: false,
    },
    {
      area: "activation-needed-for-launch-prep",
      title: "Must activate exclusions before continuing launch prep?",
      status: "GO",
      evidence:
        "No. Disclosure/freshness/QA/accounting may continue with exclusionsActivated=false.",
      genuineApprovalDecision: false,
    },
    {
      area: "activation-needed-before-listing-wire-up",
      title: "Must activate exclusions before CA listing wire-up / prepublication?",
      status: "CONDITIONAL",
      evidence:
        "Yes — hard precondition. californiaExclusionRequiredBeforePublicationWiring fails closed unless exclusionsActivated and residual gate are wired.",
      genuineApprovalDecision: true,
    },
    {
      area: "decision-independence",
      title: "Three approvals remain independent",
      status: "GO",
      evidence:
        "Exclusion activation ≠ eligibility mapping ≠ statewide publication. Deferral does not bundle them.",
      genuineApprovalDecision: false,
    },
    {
      area: "public-publication",
      title: "California public publication",
      status: "STOP",
      evidence: "Unpublished. publicationEligible=0. Do not approve.",
      genuineApprovalDecision: true,
    },
    {
      area: "security",
      title: "Production / cross-state boundary",
      status: "GO",
      evidence:
        "Read-only necessity audit. No activation, no Supabase writes, no CA publication, no production deploy. WA/OR/FL/OH unchanged.",
      genuineApprovalDecision: false,
    },
  ];

export const CALIFORNIA_EXCLUSION_NECESSITY_DECISIONS_REQUIRING_APPROVAL = [
  {
    id: "defer-exclusion-activation-until-prepublication",
    title: "Defer exclusion ledger activation until prepublication / listing wire-up",
    recommendation:
      "Accept deferral. Activation is not necessary now and creates no current public risk reduction.",
    genuineApprovalNeededToContinuePrep: false,
  },
  {
    id: "activate-california-exclusion-ledger-in-app-db",
    title: "Activate California offline exclusion ledger in app/DB",
    recommendation:
      "Approve later as a hard precondition immediately before CA listing wire-up / prepublication testing. Not now.",
    genuineApprovalNeededToContinuePrep: false,
  },
  {
    id: "activate-pending-increase-mapping-in-app-db",
    title: "Activate Pending Increase eligibility mapping in app/DB",
    recommendation: "Keep separate. Not required for residual exclusion enforcement.",
    genuineApprovalNeededToContinuePrep: false,
  },
  {
    id: "approve-california-statewide-public-publication",
    title: "Approve California statewide public publication",
    recommendation: "Do not approve. STOP until exclusions are active, gate is wired, and publicationEligible is approved.",
    genuineApprovalNeededToContinuePrep: false,
  },
] as const;

export function buildCaliforniaExclusionActivationNecessityPreview() {
  const prepOk = californiaLaunchPrepAllowedWhileExclusionsInactive();
  const prepBlockedIfPublish = californiaLaunchPrepAllowedWhileExclusionsInactive({
    wouldPublishCalifornia: true,
  });
  const wireBlocked = californiaExclusionRequiredBeforePublicationWiring({
    exclusionsActivated: false,
    residualGateWiredIntoListingPaths: false,
  });
  const wireAllowed = californiaExclusionRequiredBeforePublicationWiring({
    exclusionsActivated: true,
    residualGateWiredIntoListingPaths: true,
  });

  const matrixGo = CALIFORNIA_EXCLUSION_NECESSITY_MATRIX.filter(
    (r) => r.status === "GO",
  ).length;
  const matrixConditional = CALIFORNIA_EXCLUSION_NECESSITY_MATRIX.filter(
    (r) => r.status === "CONDITIONAL",
  ).length;
  const matrixStop = CALIFORNIA_EXCLUSION_NECESSITY_MATRIX.filter(
    (r) => r.status === "STOP",
  ).length;

  const arithmeticOk =
    prepOk.allowed
    && !prepBlockedIfPublish.allowed
    && !wireBlocked.allowed
    && wireAllowed.allowed
    && wireBlocked.reasons.includes("exclusion-ledger-not-activated")
    && wireBlocked.reasons.includes("residual-exclusion-gate-not-wired")
    && CALIFORNIA_EXCLUSION_NECESSITY_STATE.publicationEligible === 0
    && !CALIFORNIA_EXCLUSION_NECESSITY_STATE.exclusionsActivated
    && !CALIFORNIA_EXCLUSION_NECESSITY_STATE.californiaPublished
    && !CALIFORNIA_EXCLUSION_NECESSITY_STATE.productionCaliforniaRoutesExist
    && CALIFORNIA_EXCLUSION_NECESSITY_CURRENT_BLOCKS.length >= 7
    && CALIFORNIA_EXCLUSION_NECESSITY_RECOMMENDATION.verdict
      === "defer-until-prepublication"
    && !CALIFORNIA_EXCLUSION_NECESSITY_RECOMMENDATION
      .activationNecessaryBeforeContinuingLaunchPrep
    && CALIFORNIA_EXCLUSION_NECESSITY_RECOMMENDATION
      .currentSecurityOrPublicationRiskFromInactiveExclusions === "none"
    && matrixStop >= 1
    && matrixConditional >= 1
    && matrixGo >= 3;

  return {
    observedOn: CALIFORNIA_EXCLUSION_NECESSITY_OBSERVED_ON,
    baseline: CALIFORNIA_EXCLUSION_NECESSITY_BASELINE,
    state: CALIFORNIA_EXCLUSION_NECESSITY_STATE,
    currentBlocks: CALIFORNIA_EXCLUSION_NECESSITY_CURRENT_BLOCKS,
    comparison: CALIFORNIA_EXCLUSION_NECESSITY_COMPARISON,
    recommendation: CALIFORNIA_EXCLUSION_NECESSITY_RECOMMENDATION,
    sequence: CALIFORNIA_EXCLUSION_ACTIVATION_SEQUENCE,
    rollback: CALIFORNIA_EXCLUSION_NECESSITY_ROLLBACK,
    verificationRequirements: CALIFORNIA_EXCLUSION_NECESSITY_VERIFICATION,
    matrix: CALIFORNIA_EXCLUSION_NECESSITY_MATRIX,
    decisionsRequiringApproval:
      CALIFORNIA_EXCLUSION_NECESSITY_DECISIONS_REQUIRING_APPROVAL,
    arithmeticOk,
    matrixGo,
    matrixConditional,
    matrixStop,
    stopGoPublic: "STOP" as const,
    finalRecommendation: "DEFER" as const,
    mostActionableNextStep:
      "Continue California launch preparations without activating exclusions. Treat exclusion ledger activation as a hard precondition immediately before listing wire-up / prepublication testing. Keep mapping and statewide publication as separate later approvals. Public California remains STOP.",
    preservedRestrictions: [
      "washington-oregon-florida-ohio-unchanged",
      "exclusions-remain-inactive",
      "eligibility-mapping-remain-inactive",
      "california-unpublished",
      "three-decisions-kept-separate",
      "no-database-writes",
      "no-production-changes",
    ] as const,
  };
}

export function californiaExclusionNecessityAllowsPublication(): false {
  return false;
}

export function californiaExclusionNecessityActivated(): false {
  return false;
}
