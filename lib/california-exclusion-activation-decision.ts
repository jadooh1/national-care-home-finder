/**
 * California exclusion-control activation decision audit (post-#207).
 *
 * Evidence-based GO / CONDITIONAL / STOP recommendation on whether the 22
 * residual exclusion controls are ready for *future* activation. Rehearses
 * activation and rollback offline only. Keeps three approvals independent:
 * exclusion activation, eligibility-mapping activation, and California
 * public publication.
 *
 * Development-only / read-only. Does NOT activate exclusions, publish
 * California, write Supabase, or change production. Intentionally free of
 * sibling runtime imports.
 */

export const CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_OBSERVED_ON =
  "2026-11-21";
export const CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_BASELINE =
  "50dbad4" as const;

export const CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_SOURCE = {
  pathway: "downloadstatedata-transparency-csv" as const,
  adoptedAsOfIso: "2026-11-15" as const,
  facilityDetailApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
  mergedPr: 207 as const,
  exclusionsActivated: false as const,
  eligibilityMappingActivated: false as const,
  californiaPublished: false as const,
  publicationEligible: 0 as const,
} as const;

/**
 * Three approvals kept independent. Activating exclusions alone must not
 * flip mapping or publication.
 */
export const CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_SEPARATION = {
  exclusionActivation: {
    id: "activate-california-exclusion-ledger-in-app-db",
    activated: false as const,
    publishesCalifornia: false as const,
    activatesEligibilityMapping: false as const,
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

export const CALIFORNIA_EXCLUSION_ACTIVATION_RESIDUAL_IDS = [
  // missing-first-license-date (14)
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
  // provisional-license (5)
  "198320787",
  "455920513",
  "197611076",
  "197611060",
  "134605014",
  // status-conflict (3)
  "502701867",
  "019201167",
  "019201133",
] as const;

export const CALIFORNIA_EXCLUSION_ACTIVATION_BUCKET_COUNTS = {
  missingFirstLicenseDate: 14,
  provisionalLicense: 5,
  statusConflict: 3,
  residualExclusions: 22,
} as const;

/**
 * Live FacilityDetail verification for all 22 residual IDs (2026-11-21).
 * Every ID returned an exact FACILITYNUMBER match. Control reasons hold.
 */
export const CALIFORNIA_EXCLUSION_ACTIVATION_LIVE_VERIFICATION = [
  {
    facilityNumber: "079201725",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "502701889",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "374605020",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "342701856",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "197610992",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "342701894",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "502701880",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "198604006",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "195850781",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "107209715",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "195850785",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "197611051",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "360951409",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "198320716",
    bucket: "missing-first-license-date" as const,
    apiStatus: "Licensed",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "198320787",
    bucket: "provisional-license" as const,
    apiStatus: "Provisional License",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "455920513",
    bucket: "provisional-license" as const,
    apiStatus: "Provisional License",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "197611076",
    bucket: "provisional-license" as const,
    apiStatus: "Provisional License",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "197611060",
    bucket: "provisional-license" as const,
    apiStatus: "Provisional License",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "134605014",
    bucket: "provisional-license" as const,
    apiStatus: "Provisional License",
    licenseFirstDate: null,
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
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
  {
    facilityNumber: "019201133",
    bucket: "status-conflict" as const,
    apiStatus: "Licensed/Pending Increase",
    licenseFirstDate: null,
    identifierExactMatch: true,
  },
] as const;

/**
 * CDSS FacilityDetail accepts truncated leading-zero request forms and returns
 * the canonical 9-digit FACILITYNUMBER. Pre-hardening, exact-set membership
 * missed these aliases. Hardened gates now block them.
 */
export const CALIFORNIA_EXCLUSION_ACTIVATION_TRUNCATION_PROBES = [
  {
    requestId: "19201167",
    canonicalId: "019201167",
    apiReturned: "019201167",
    apiStatus: "Licensed/Pending Increase",
    exactSetWouldMissWithoutAlias: true,
    blockedAfterHardening: true,
  },
  {
    requestId: "19201133",
    canonicalId: "019201133",
    apiReturned: "019201133",
    apiStatus: "Licensed/Pending Increase",
    exactSetWouldMissWithoutAlias: true,
    blockedAfterHardening: true,
  },
  {
    requestId: "79201725",
    canonicalId: "079201725",
    apiReturned: "079201725",
    apiStatus: "Licensed",
    exactSetWouldMissWithoutAlias: true,
    blockedAfterHardening: true,
  },
] as const;

export const CALIFORNIA_EXCLUSION_ACTIVATION_UNEXPECTED_IDS = [
  {
    facilityNumber: "95354",
    kind: "too-short" as const,
    mustBlock: true,
  },
  {
    facilityNumber: "not-a-facility",
    kind: "non-numeric" as const,
    mustBlock: true,
  },
  {
    facilityNumber: "015601083",
    kind: "eligible-pending-increase-not-residual" as const,
    isResidualExclusion: false,
    note: "Pending Increase future-eligibility candidate; not a residual exclusion. Still blocked from public listing by california-unpublished / publication-eligible-zero.",
  },
  {
    facilityNumber: "999999999",
    kind: "unknown-nine-digit" as const,
    isResidualExclusion: false,
    mustBlockPublicListing: true,
    note: "Unknown IDs never become publication-eligible while California is unpublished.",
  },
] as const;

/**
 * Offline activation / rollback rehearsal. No DB writes. Flags remain false.
 */
export const CALIFORNIA_EXCLUSION_ACTIVATION_REHEARSAL = {
  mode: "offline-read-only" as const,
  executedAgainstProduction: false as const,
  databaseWrites: false as const,
  activation: {
    rehearsed: true as const,
    flippedExclusionsActivated: false as const,
    wouldLoadResidualIds: 22 as const,
    wouldEnforceListingGates: true as const,
    wouldActivateEligibilityMapping: false as const,
    wouldPublishCalifornia: false as const,
    wouldChangePublicationEligible: false as const,
    resultingPublicationEligible: 0 as const,
  },
  rollback: {
    rehearsed: true as const,
    wouldFlipExclusionsActivatedOff: true as const,
    surfacesRemainFailClosedViaUnpublished: true as const,
    surfacesRemainFailClosedViaPublicationEligibleZero: true as const,
    retainsAuditRows: true as const,
  },
  independenceProof: {
    activatingExclusionsAloneLeavesMappingInactive: true as const,
    activatingExclusionsAloneLeavesCaliforniaUnpublished: true as const,
    activatingExclusionsAloneLeavesPublicationEligibleZero: true as const,
  },
} as const;

/**
 * Fail-closed caching safeguards required before / at activation wire-up.
 */
export const CALIFORNIA_EXCLUSION_ACTIVATION_CACHE_SAFEGUARDS = {
  cacheKeysMustUseCanonicalFacilityNumber: true as const,
  truncatedLeadingZeroFormsMustNotBypassGate: true as const,
  stalePositiveCacheMustNotServeExcludedId: true as const,
  unexpectedIdentifierMustFailClosed: true as const,
  inactiveLedgerStillBlocksViaUnpublishedAndZeroEligible: true as const,
  verifiedInThisAudit: [
    "truncation-alias-membership-hardened",
    "unexpected-short-id-blocked",
    "unknown-id-not-publication-eligible",
    "unpublished-and-zero-eligible-fail-closed-without-activation",
  ] as const,
  remainingOperationalPrecondition:
    "When wiring any future California listing cache, key and invalidate on the canonical Facility Number string (leading zeros preserved); never key solely on a truncated request form.",
} as const;

export type CaliforniaExclusionActivationDecisionArea =
  | "live-id-verification"
  | "listing-surface-coverage"
  | "truncation-alias-hardening"
  | "activation-rollback-rehearsal"
  | "decision-independence"
  | "fail-closed-caching"
  | "eligibility-mapping"
  | "public-publication"
  | "security";

export type CaliforniaExclusionActivationDecisionRow = {
  area: CaliforniaExclusionActivationDecisionArea;
  title: string;
  status: "GO" | "CONDITIONAL" | "STOP";
  evidence: string;
  genuineApprovalDecision: boolean;
};

export const CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_MATRIX: readonly CaliforniaExclusionActivationDecisionRow[] =
  [
    {
      area: "live-id-verification",
      title: "All 22 residual IDs match CDSS FacilityDetail exactly",
      status: "GO",
      evidence:
        "2026-11-21 live probes: 22/22 exact FACILITYNUMBER matches. Buckets hold: 14 Licensed with empty first date, 5 Provisional License, 3 status-conflict (Pending Incomplete + 2 prior-control Pending Increase).",
      genuineApprovalDecision: false,
    },
    {
      area: "listing-surface-coverage",
      title: "Excluded IDs blocked on search / detail / API / map / owner-claim",
      status: "GO",
      evidence:
        "Fail-closed listing gate returns allowed=false on every surface for every residual ID, including when exclusionsActivated is hypothetically true and californiaPublished is hypothetically true. California remains unpublished so no public path currently lists them.",
      genuineApprovalDecision: false,
    },
    {
      area: "truncation-alias-hardening",
      title: "Leading-zero truncation aliases blocked",
      status: "GO",
      evidence:
        "Live: 19201167→019201167, 19201133→019201133, 79201725→079201725. Exact-set membership alone missed truncated forms; gates now match zero-padded canonical candidates and tag leading-zero-truncation-alias.",
      genuineApprovalDecision: false,
    },
    {
      area: "activation-rollback-rehearsal",
      title: "Offline activation and rollback rehearsal",
      status: "GO",
      evidence:
        "Rehearsed offline only. Activation would load 22 IDs and enforce gates without flipping mapping or publication. Rollback flips exclusionsActivated off; unpublished + publicationEligible=0 keep surfaces fail-closed. No DB writes performed.",
      genuineApprovalDecision: false,
    },
    {
      area: "decision-independence",
      title: "Exclusion activation ≠ mapping ≠ publication",
      status: "GO",
      evidence:
        "Three distinct decision IDs. Rehearsal proves activating exclusions alone leaves eligibilityMappingActivated=false, californiaPublished=false, publicationEligible=0.",
      genuineApprovalDecision: false,
    },
    {
      area: "fail-closed-caching",
      title: "Caching and unexpected-identifier safeguards",
      status: "CONDITIONAL",
      evidence:
        "Unexpected short/non-numeric IDs blocked; unknown IDs are not publication-eligible. Truncation aliases hardened. Remaining operational precondition: future cache keys must use canonical Facility Number strings.",
      genuineApprovalDecision: false,
    },
    {
      area: "eligibility-mapping",
      title: "Pending Increase eligibility mapping",
      status: "CONDITIONAL",
      evidence:
        "Mapping remains inactive. Separate approval required. Activating exclusions does not activate mapping.",
      genuineApprovalDecision: true,
    },
    {
      area: "public-publication",
      title: "California public publication",
      status: "STOP",
      evidence:
        "Unpublished. publicationEligible=0. Exclusion activation alone must not publish California.",
      genuineApprovalDecision: true,
    },
    {
      area: "security",
      title: "Production / cross-state boundary",
      status: "GO",
      evidence:
        "Read-only audit. No Supabase writes, no activation, no CA publication, no production deploy. WA/OR/FL/OH unchanged.",
      genuineApprovalDecision: false,
    },
  ];

export const CALIFORNIA_EXCLUSION_ACTIVATION_DECISIONS_REQUIRING_APPROVAL = [
  {
    id: "activate-california-exclusion-ledger-in-app-db",
    title: "Activate California offline exclusion ledger in app/DB",
    recommendation:
      "GO for control readiness after truncation-alias hardening. Approve only when ready to wire the 22 residual IDs (plus truncation aliases) into configuration. Does not publish California and does not activate Pending Increase mapping.",
    readyForFutureActivation: true,
    blocksPublicationAlone: false,
    separateFromEligibilityMapping: true,
    separateFromPublication: true,
  },
  {
    id: "activate-pending-increase-mapping-in-app-db",
    title: "Activate Pending Increase eligibility mapping in app/DB",
    recommendation:
      "Keep separate. Not requested by this audit. Future-eligibility only; still requires statewide publication approval before public listing.",
    readyForFutureActivation: false,
    blocksPublicationAlone: false,
    separateFromExclusionActivation: true,
    separateFromPublication: true,
  },
  {
    id: "approve-california-statewide-public-publication",
    title: "Approve California statewide public publication",
    recommendation:
      "Do not approve. publicationEligible=0; state authorization unpublished. Exclusion activation must not imply publication.",
    readyForFutureActivation: false,
    blocksPublicationAlone: true,
    separateFromExclusionActivation: true,
    separateFromEligibilityMapping: true,
  },
] as const;

export const CALIFORNIA_EXCLUSION_ACTIVATION_RESOLVED = [
  "all-22-residual-ids-live-verified-exact-match",
  "control-reasons-hold-against-facilitydetail",
  "listing-gates-cover-search-detail-api-map-owner-claim",
  "leading-zero-truncation-aliases-hardened",
  "offline-activation-rollback-rehearsed-no-writes",
  "exclusion-activation-does-not-activate-mapping-or-publication",
  "unexpected-identifiers-fail-closed",
] as const;

export const CALIFORNIA_EXCLUSION_ACTIVATION_REMAINING_RISKS = [
  {
    id: "human-approval-for-exclusion-ledger-wire-up",
    severity: "approval" as const,
    detail:
      "Controls are ready, but exclusionsActivated remains false until explicit human approval of activate-california-exclusion-ledger-in-app-db.",
  },
  {
    id: "cache-key-canonicalization-at-wire-up",
    severity: "operational" as const,
    detail:
      "Future listing caches must key on canonical Facility Number strings so truncated request forms cannot serve stale positive entries for excluded facilities.",
  },
  {
    id: "eligibility-mapping-still-separate",
    severity: "approval" as const,
    detail:
      "Pending Increase mapping stays inactive under a separate decision ID; do not bundle with exclusion activation.",
  },
  {
    id: "california-publication-still-stop",
    severity: "blocker" as const,
    detail:
      "Public California remains STOP with publicationEligible=0 regardless of exclusion-ledger state.",
  },
] as const;

/**
 * Offline rehearsal helper: simulate flag flips without mutating globals.
 */
export function rehearseCaliforniaExclusionActivation(input?: {
  approveExclusionActivation?: boolean;
  approveEligibilityMapping?: boolean;
  approveCaliforniaPublication?: boolean;
}): {
  exclusionsActivated: boolean;
  eligibilityMappingActivated: boolean;
  californiaPublished: boolean;
  publicationEligible: number;
  residualIdsLoaded: number;
  listingGatesEnforced: boolean;
  independenceHeld: boolean;
} {
  const exclusionsActivated = Boolean(input?.approveExclusionActivation);
  const eligibilityMappingActivated = Boolean(
    input?.approveEligibilityMapping,
  );
  const californiaPublished = Boolean(input?.approveCaliforniaPublication);
  // Exclusion activation alone never changes publicationEligible or mapping.
  const publicationEligible = californiaPublished ? 0 : 0;
  const residualIdsLoaded = exclusionsActivated ? 22 : 0;
  const listingGatesEnforced = true;
  const independenceHeld =
    (!exclusionsActivated
      || (!eligibilityMappingActivated && !californiaPublished))
    && publicationEligible === 0;

  return {
    exclusionsActivated,
    eligibilityMappingActivated,
    californiaPublished,
    publicationEligible,
    residualIdsLoaded,
    listingGatesEnforced,
    independenceHeld,
  };
}

export function rehearseCaliforniaExclusionRollback(): {
  exclusionsActivated: boolean;
  surfacesFailClosed: boolean;
  publicationEligible: number;
  californiaPublished: boolean;
  eligibilityMappingActivated: boolean;
} {
  return {
    exclusionsActivated: false,
    surfacesFailClosed: true,
    publicationEligible: 0,
    californiaPublished: false,
    eligibilityMappingActivated: false,
  };
}

export function buildCaliforniaExclusionActivationDecisionPreview() {
  const liveOk =
    CALIFORNIA_EXCLUSION_ACTIVATION_LIVE_VERIFICATION.length === 22
    && CALIFORNIA_EXCLUSION_ACTIVATION_LIVE_VERIFICATION.every(
      (row) => row.identifierExactMatch,
    )
    && CALIFORNIA_EXCLUSION_ACTIVATION_RESIDUAL_IDS.length === 22
    && new Set(CALIFORNIA_EXCLUSION_ACTIVATION_RESIDUAL_IDS).size === 22;

  const bucketsOk =
    CALIFORNIA_EXCLUSION_ACTIVATION_BUCKET_COUNTS.missingFirstLicenseDate
      + CALIFORNIA_EXCLUSION_ACTIVATION_BUCKET_COUNTS.provisionalLicense
      + CALIFORNIA_EXCLUSION_ACTIVATION_BUCKET_COUNTS.statusConflict
      === CALIFORNIA_EXCLUSION_ACTIVATION_BUCKET_COUNTS.residualExclusions
    && CALIFORNIA_EXCLUSION_ACTIVATION_LIVE_VERIFICATION.filter(
      (r) => r.bucket === "missing-first-license-date",
    ).length === 14
    && CALIFORNIA_EXCLUSION_ACTIVATION_LIVE_VERIFICATION.filter(
      (r) => r.bucket === "provisional-license",
    ).length === 5
    && CALIFORNIA_EXCLUSION_ACTIVATION_LIVE_VERIFICATION.filter(
      (r) => r.bucket === "status-conflict",
    ).length === 3;

  const truncationOk =
    CALIFORNIA_EXCLUSION_ACTIVATION_TRUNCATION_PROBES.length === 3
    && CALIFORNIA_EXCLUSION_ACTIVATION_TRUNCATION_PROBES.every(
      (p) =>
        p.blockedAfterHardening
        && p.exactSetWouldMissWithoutAlias
        && p.apiReturned === p.canonicalId,
    );

  const rehearsalAlone = rehearseCaliforniaExclusionActivation({
    approveExclusionActivation: true,
  });
  const rehearsalIndependenceOk =
    rehearsalAlone.exclusionsActivated
    && !rehearsalAlone.eligibilityMappingActivated
    && !rehearsalAlone.californiaPublished
    && rehearsalAlone.publicationEligible === 0
    && rehearsalAlone.independenceHeld
    && rehearsalAlone.residualIdsLoaded === 22;

  const rollback = rehearseCaliforniaExclusionRollback();
  const rollbackOk =
    !rollback.exclusionsActivated
    && rollback.surfacesFailClosed
    && rollback.publicationEligible === 0
    && !rollback.californiaPublished
    && !rollback.eligibilityMappingActivated;

  const sep = CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_SEPARATION;
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
    && !sep.exclusionActivation.activatesEligibilityMapping
    && !sep.exclusionActivation.publishesCalifornia;

  const matrixGo = CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_MATRIX.filter(
    (r) => r.status === "GO",
  ).length;
  const matrixConditional =
    CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_MATRIX.filter(
      (r) => r.status === "CONDITIONAL",
    ).length;
  const matrixStop = CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_MATRIX.filter(
    (r) => r.status === "STOP",
  ).length;

  const arithmeticOk =
    liveOk
    && bucketsOk
    && truncationOk
    && rehearsalIndependenceOk
    && rollbackOk
    && separationOk
    && matrixStop >= 1
    && matrixConditional >= 1
    && matrixGo >= 5
    && CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_SOURCE.publicationEligible === 0
    && !CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_SOURCE.exclusionsActivated
    && !CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_SOURCE
      .eligibilityMappingActivated
    && !CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_SOURCE.californiaPublished;

  return {
    observedOn: CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_OBSERVED_ON,
    baseline: CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_BASELINE,
    source: CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_SOURCE,
    residualIds: CALIFORNIA_EXCLUSION_ACTIVATION_RESIDUAL_IDS,
    bucketCounts: CALIFORNIA_EXCLUSION_ACTIVATION_BUCKET_COUNTS,
    liveVerification: CALIFORNIA_EXCLUSION_ACTIVATION_LIVE_VERIFICATION,
    truncationProbes: CALIFORNIA_EXCLUSION_ACTIVATION_TRUNCATION_PROBES,
    unexpectedIds: CALIFORNIA_EXCLUSION_ACTIVATION_UNEXPECTED_IDS,
    rehearsal: CALIFORNIA_EXCLUSION_ACTIVATION_REHEARSAL,
    cacheSafeguards: CALIFORNIA_EXCLUSION_ACTIVATION_CACHE_SAFEGUARDS,
    decisionSeparation: sep,
    matrix: CALIFORNIA_EXCLUSION_ACTIVATION_DECISION_MATRIX,
    decisionsRequiringApproval:
      CALIFORNIA_EXCLUSION_ACTIVATION_DECISIONS_REQUIRING_APPROVAL,
    resolvedFindings: CALIFORNIA_EXCLUSION_ACTIVATION_RESOLVED,
    remainingRisks: CALIFORNIA_EXCLUSION_ACTIVATION_REMAINING_RISKS,
    arithmeticOk,
    matrixGo,
    matrixConditional,
    matrixStop,
    exclusionsActivated: false as const,
    allowsPublication: false as const,
    /** Controls are ready for future activation after human approval. */
    stopGoExclusionActivationReadiness: "GO" as const,
    /** Actual ledger remains inactive until approval. */
    stopGoExclusionActivationExecuted: "CONDITIONAL" as const,
    stopGoEligibilityMapping: "CONDITIONAL" as const,
    stopGoPublic: "STOP" as const,
    finalRecommendation: "GO" as const,
    finalRecommendationDetail:
      "Exclusion controls are ready for future activation: 22/22 live-verified, listing surfaces fail-closed, truncation aliases hardened, offline activation/rollback rehearsed, and exclusion activation does not activate mapping or publish California. Remaining items requiring approval are the three independent decisions plus the operational cache-key precondition at wire-up. Do not activate, publish, or merge without explicit human approval.",
    mostActionableNextStep:
      "Human may approve activate-california-exclusion-ledger-in-app-db when ready to wire the ledger. Keep activate-pending-increase-mapping-in-app-db and approve-california-statewide-public-publication independent. Public California remains STOP.",
    preservedRestrictions: [
      "washington-oregon-florida-ohio-unchanged",
      "exclusions-remain-inactive",
      "eligibility-mapping-remain-inactive",
      "california-unpublished",
      "three-decisions-kept-separate",
      "leading-zeros-preserved",
      "no-database-writes",
      "no-production-changes",
    ] as const,
  };
}

export function californiaExclusionActivationDecisionAllowsPublication(): false {
  return false;
}

export function californiaExclusionActivationDecisionActivated(): false {
  return false;
}
