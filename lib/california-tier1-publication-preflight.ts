/**
 * California Tier 1 eligibility + publication-readiness preflight (post-#205).
 *
 * Read-only development preflight: reconciles offline Tier 1 accounting
 * (15,429 candidates / 22 exclusions / publicationEligible=0), states precisely
 * why eligibility remains CONDITIONAL, and produces a GO/CONDITIONAL/STOP
 * matrix of genuine remaining launch decisions. Fail-closed when source data
 * would be stale, ambiguous, or unverified.
 *
 * Does NOT publish California, activate exclusions, write Supabase, or invent
 * facility records. Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PREFLIGHT_OBSERVED_ON = "2026-11-21";
export const CALIFORNIA_PREFLIGHT_BASELINE = "696da7c" as const;

export const CALIFORNIA_PREFLIGHT_SOURCE = {
  pathway: "downloadstatedata-transparency-csv" as const,
  adoptedAsOfIso: "2026-11-15" as const,
  rcfeContentDisposition:
    "attachment; filename=ResidentialElderCareFacility11152026.csv",
  arfContentDisposition:
    "attachment; filename=AdultResidentialFacilities11152026.csv",
  rcfeSha256:
    "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
  arfSha256:
    "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
  newerDownloadAvailable: false as const,
  /** Reconfirmed 2026-11-21 via DownloadStateData Content-Disposition. */
  contentDispositionRecheckedOn: "2026-11-21" as const,
  contentDispositionUnchangedFromPr205: true as const,
  facilityDetailApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
  facDetailPagePrefix:
    "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/",
} as const;

/**
 * Exact reasons eligibility accounting remains CONDITIONAL (not GO for
 * publication, not STOP for the offline math itself).
 */
export const CALIFORNIA_PREFLIGHT_CONDITIONAL_REASONS = [
  {
    id: "pending-increase-mapping-future-eligibility-only",
    detail:
      "Licensed/Pending Increase mapping is human-approved for future eligibility consideration only; not activated in app/DB; does not authorize publication.",
  },
  {
    id: "exclusion-ledger-inactive",
    detail:
      "The 22 residual listing exclusions (and the broader offline ledger) are documented but not activated in application or database configuration.",
  },
  {
    id: "publication-eligible-remains-zero",
    detail:
      "publicationEligible=0 and ownerClaimEligible=0; offline Tier 1 future-eligible count (15,429) is not a public authorization count.",
  },
  {
    id: "statewide-publication-authorization-absent",
    detail:
      "California state authorization / directory publication remains unpublished STOP; future eligibility ≠ public launch.",
  },
] as const;

/**
 * Reconciled Tier 1 accounting against CDSS evidence from #203–#205.
 * Arithmetic identity: 15,363 + 66 = 15,429; 14 + 5 + 3 = 22;
 * 15,429 + 22 = 15,451 active-restricted parent roster.
 */
export const CALIFORNIA_PREFLIGHT_RECONCILIATION = {
  parentActiveRestrictedRoster: 15451,
  otherwiseClearOfflinePreApproval: 15363,
  pendingIncreaseFutureEligibleUnderApprovedMapping: 66,
  offlineTier1Candidates: 15429,
  remainingListingExclusions: 22,
  exclusionBuckets: {
    missingFirstDate: 14,
    provisional: 5,
    priorConflict: 3,
  },
  publicationEligible: 0,
  ownerClaimEligible: 0,
  exclusionsActivatedInApplicationOrDatabase: false as const,
  pendingIncreaseMappingActivated: false as const,
  evidence: {
    pendingIncreaseCdssAgreementPass: 66,
    pendingIncreaseNewConflicts: 0,
    missingFirstDateStillExcluded: 14,
    provisionalStillExcluded: 5,
    priorConflictStillExcluded: 3,
    disclosureStratifiedSampleWorking: 44,
    disclosureStratifiedSampleFail: 0,
    inheritedPhase2320CumulativeFacDetailVerified: 15451,
    downloadAsOfIso: "2026-11-15",
    newerDownloadAvailable: false,
  },
} as const;

export const CALIFORNIA_PREFLIGHT_EXCLUSION_IDS = {
  missingFirstDate: [
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
  ],
  provisional: [
    "198320787",
    "455920513",
    "197611076",
    "197611060",
    "134605014",
  ],
  priorConflict: ["502701867", "019201167", "019201133"],
} as const;

/** Spot-check FacilityDetail statuses reconfirmed 2026-11-21 (read-only). */
export const CALIFORNIA_PREFLIGHT_LIVE_SPOT_CHECKS = [
  {
    facilityNumber: "015601083",
    role: "pending-increase-leading-zero",
    apiStatus: "Licensed/Pending Increase",
    identifierExactMatch: true,
  },
  {
    facilityNumber: "502701867",
    role: "prior-conflict-pending-incomplete",
    apiStatus: "Pending Incomplete Application",
    identifierExactMatch: true,
  },
  {
    facilityNumber: "198320787",
    role: "provisional",
    apiStatus: "Provisional License",
    identifierExactMatch: true,
  },
] as const;

export const CALIFORNIA_PREFLIGHT_DISCLOSURE_POLICY = {
  facilitySpecificFacDetailApproved: true as const,
  generalSearchLinksSupplementalOnly: true as const,
  reportPageFakeoutNeverPublish: true as const,
  preserveLeadingZeros: true as const,
  publicationAcceptanceRequiresFacilitySpecificFacDetail: true as const,
  offlineTier1DisclosureRequired: false as const,
} as const;

export const CALIFORNIA_PREFLIGHT_STATUS_MAPPING = {
  offlineTier1AllowedDownloadStatuses: ["LICENSED", "ON PROBATION"] as const,
  pendingIncreaseFacilityDetailStatus: "Licensed/Pending Increase" as const,
  pendingIncreaseMappingScope: "future-eligibility-consideration-only" as const,
  pendingIncreaseMappingHumanApproved: true as const,
  pendingIncreaseMappingActivated: false as const,
  neverSubstituteEffectiveDateForFirstDate: true as const,
  publishApprovedCapacityOnly: true as const,
  neverInventProposedCapacityIncrease: true as const,
} as const;

const FACILITY_NUMBER = /^\d{8,9}$/;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

export function isCaliforniaPreflightFacilityNumber(
  facilityNumber: string,
): boolean {
  return FACILITY_NUMBER.test(text(facilityNumber));
}

export function californiaPreflightFacDetailUrl(
  facilityNumber: string,
): string | null {
  const id = text(facilityNumber);
  if (!FACILITY_NUMBER.test(id)) return null;
  return `${CALIFORNIA_PREFLIGHT_SOURCE.facDetailPagePrefix}${id}`;
}

/**
 * Fail-closed publication gate for a single candidate. Read-only; never
 * returns accepted=true while California publication remains blocked.
 */
export function californiaPublicationPreflightEvaluate(input: {
  facilityNumber: string;
  downloadStatus?: string | null;
  facilityDetailStatus?: string | null;
  identifierExactMatch?: boolean;
  disclosureUrl?: string | null;
  sourceAsOfIso?: string | null;
  newerDownloadAvailable?: boolean;
  sourceAmbiguousOrUnverified?: boolean;
  isDocumentedExclusion?: boolean;
}): {
  accepted: false;
  blockers: string[];
  canonicalDisclosureUrl: string | null;
} {
  const blockers: string[] = [];
  const id = text(input.facilityNumber);
  const canonical = californiaPreflightFacDetailUrl(id);

  if (!canonical) blockers.push("invalid-facility-number");
  if (input.identifierExactMatch === false) {
    blockers.push("identifier-mismatch");
  }
  if (input.isDocumentedExclusion) blockers.push("documented-listing-exclusion");

  const asOf = text(input.sourceAsOfIso);
  if (!asOf) blockers.push("missing-source-asof");
  if (asOf && asOf !== CALIFORNIA_PREFLIGHT_SOURCE.adoptedAsOfIso) {
    blockers.push("source-asof-mismatch");
  }
  if (input.newerDownloadAvailable) blockers.push("stale-source-newer-download");
  if (input.sourceAmbiguousOrUnverified) {
    blockers.push("source-ambiguous-or-unverified");
  }

  const candidate = text(input.disclosureUrl);
  if (!canonical) {
    /* already invalid-facility-number */
  } else if (!candidate) {
    blockers.push("missing-facility-specific-disclosure");
  } else if (candidate !== canonical) {
    blockers.push("non-canonical-disclosure-url");
  }

  // Statewide publication remains blocked regardless of per-facility readiness.
  blockers.push("california-publication-blocked");
  blockers.push("publication-eligible-zero");

  return {
    accepted: false,
    blockers: [...new Set(blockers)],
    canonicalDisclosureUrl: canonical,
  };
}

export type CaliforniaPreflightMatrixArea =
  | "eligibility-accounting"
  | "source-freshness"
  | "identifier-integrity"
  | "status-mapping"
  | "exclusion-handling"
  | "disclosure-policy"
  | "fail-closed-gates"
  | "publication-authorization"
  | "security";

export type CaliforniaPreflightMatrixRow = {
  area: CaliforniaPreflightMatrixArea;
  title: string;
  status: "GO" | "CONDITIONAL" | "STOP";
  evidence: string;
  genuineLaunchDecision: boolean;
};

/**
 * Final GO / CONDITIONAL / STOP matrix. Only genuine remaining launch
 * decisions are flagged; completed investigations are not re-litigated.
 */
export const CALIFORNIA_PREFLIGHT_MATRIX: readonly CaliforniaPreflightMatrixRow[] =
  [
    {
      area: "source-freshness",
      title: "CDSS Transparency Download as-of freshness",
      status: "GO",
      evidence:
        "Content-Disposition still ResidentialElderCareFacility11152026.csv / AdultResidentialFacilities11152026.csv (as-of 2026-11-15). newerDownloadAvailable=false. Reconfirmed 2026-11-21.",
      genuineLaunchDecision: false,
    },
    {
      area: "identifier-integrity",
      title: "Exact license IDs including leading zeros",
      status: "GO",
      evidence:
        "Official 8–9 digit Facility Numbers preserved. Spot-checks 015601083 / 502701867 / 198320787 exact-match on FacilityDetail. Invalid IDs yield null FacDetail URLs.",
      genuineLaunchDecision: false,
    },
    {
      area: "status-mapping",
      title: "Approved Pending Increase status mapping",
      status: "CONDITIONAL",
      evidence:
        "Mapping approved for future eligibility consideration only (66 IDs; CDSS agreement 66/66). Not activated in app/DB. Exact Licensed remains the publication-acceptance live-status rule until activation + statewide publication.",
      genuineLaunchDecision: true,
    },
    {
      area: "exclusion-handling",
      title: "22 residual listing exclusions",
      status: "CONDITIONAL",
      evidence:
        "14 missing License First Date + 5 Provisional + 3 prior-conflict (502701867 Pending Incomplete; 019201167/019201133 prior-control Pending Increase). Documented and live-reconfirmed; ledger inactive.",
      genuineLaunchDecision: true,
    },
    {
      area: "disclosure-policy",
      title: "Facility-specific FacDetail disclosure policy",
      status: "GO",
      evidence:
        "FacDetail rewrite approved as publication-grade link; Search/Download supplemental only; fakeout REPORTPAGE refused. Offline Tier 1 disclosureRequired=false; publication acceptance still requires exact FacDetail.",
      genuineLaunchDecision: false,
    },
    {
      area: "eligibility-accounting",
      title: "Offline Tier 1 eligibility accounting (15,429 / 22)",
      status: "CONDITIONAL",
      evidence:
        "Reconciled: 15,363 + 66 = 15,429; exclusions 14+5+3=22; parent roster 15,451. CONDITIONAL because mapping/exclusions are inactive and publicationEligible=0 — not because the arithmetic is disputed.",
      genuineLaunchDecision: true,
    },
    {
      area: "fail-closed-gates",
      title: "Fail-closed on stale / ambiguous / unverified source",
      status: "GO",
      evidence:
        "Preflight evaluate() refuses missing/mismatched as-of, newer downloads, ambiguous/unverified source flags, non-canonical disclosure URLs, invalid IDs, and documented exclusions. Always appends california-publication-blocked.",
      genuineLaunchDecision: false,
    },
    {
      area: "publication-authorization",
      title: "California statewide public publication",
      status: "STOP",
      evidence:
        "State authorization unpublished. publicationEligible=0. No facilities authorized for public listing.",
      genuineLaunchDecision: true,
    },
    {
      area: "security",
      title: "Production / Supabase / cross-state boundary",
      status: "GO",
      evidence:
        "Read-only preflight. No Supabase writes, no exclusion activation, no California publication, no production deploy. WA/OR/FL/OH unchanged.",
      genuineLaunchDecision: false,
    },
  ];

export const CALIFORNIA_PREFLIGHT_DECISIONS_REQUIRING_APPROVAL = [
  {
    id: "activate-california-exclusion-ledger-in-app-db",
    title: "Activate California offline exclusion / eligibility ledger in app/DB",
    recommendation:
      "Defer until statewide publication plan is ready; keep inactive. Activating alone does not publish California.",
    blocksPublicationAlone: false,
  },
  {
    id: "activate-pending-increase-mapping-in-app-db",
    title:
      "Activate approved Pending Increase future-eligibility mapping in app/DB",
    recommendation:
      "Optional after ledger plan. Still requires separate statewide publication approval before any public listing.",
    blocksPublicationAlone: false,
  },
  {
    id: "approve-california-statewide-public-publication",
    title: "Approve California statewide public publication",
    recommendation:
      "Do not approve yet — authorization/disclosure-terms and publicationEligible remain STOP.",
    blocksPublicationAlone: true,
  },
  {
    id: "reclassify-prior-control-pending-increase-ids",
    title:
      "Reclassify prior-control IDs 019201167 / 019201133 under Pending Increase mapping",
    recommendation:
      "Optional. Keep excluded as prior controls unless explicitly wanted under the mapping (+2 → 15,431).",
    blocksPublicationAlone: false,
  },
] as const;

export const CALIFORNIA_PREFLIGHT_RESOLVED = [
  "offline-tier1-15429-reconciled-against-cdss-evidence",
  "residual-exclusions-22-reconciled-14-5-3",
  "conditional-reasons-stated-precisely-inactive-ledger-and-mapping",
  "download-asof-2026-11-15-reconfirmed-no-newer",
  "disclosure-policy-facility-specific-facdetail-approved",
  "fail-closed-preflight-blocks-stale-ambiguous-unverified",
  "publication-eligible-remains-zero",
] as const;

export const CALIFORNIA_PREFLIGHT_REMAINING_BLOCKERS = [
  "california-publication-blocked",
  "state-authorization-unpublished",
  "exclusion-policy-inactive-not-activated",
  "pending-increase-mapping-inactive-future-eligibility-only",
  "publication-eligible-zero",
  "missing-first-date-14-remain-excluded",
  "provisional-5-remain-excluded",
  "prior-conflicts-3-remain-excluded",
  "publication-approval-required",
] as const;

export function buildCaliforniaTier1PublicationPreflightPreview() {
  const r = CALIFORNIA_PREFLIGHT_RECONCILIATION;
  const s = CALIFORNIA_PREFLIGHT_SOURCE;
  const m = CALIFORNIA_PREFLIGHT_STATUS_MAPPING;
  const d = CALIFORNIA_PREFLIGHT_DISCLOSURE_POLICY;
  const ex = CALIFORNIA_PREFLIGHT_EXCLUSION_IDS;

  const reconciliationOk =
    r.offlineTier1Candidates
      === r.otherwiseClearOfflinePreApproval
        + r.pendingIncreaseFutureEligibleUnderApprovedMapping
    && r.remainingListingExclusions
      === r.exclusionBuckets.missingFirstDate
        + r.exclusionBuckets.provisional
        + r.exclusionBuckets.priorConflict
    && r.parentActiveRestrictedRoster
      === r.offlineTier1Candidates + r.remainingListingExclusions
    && r.publicationEligible === 0
    && r.ownerClaimEligible === 0
    && !r.exclusionsActivatedInApplicationOrDatabase
    && !r.pendingIncreaseMappingActivated
    && ex.missingFirstDate.length === 14
    && ex.provisional.length === 5
    && ex.priorConflict.length === 3
    && CALIFORNIA_PREFLIGHT_CONDITIONAL_REASONS.length === 4;

  const freshnessOk =
    s.adoptedAsOfIso === "2026-11-15"
    && !s.newerDownloadAvailable
    && s.contentDispositionUnchangedFromPr205
    && s.rcfeContentDisposition.includes("11152026")
    && s.arfContentDisposition.includes("11152026");

  const policyOk =
    m.pendingIncreaseMappingHumanApproved
    && !m.pendingIncreaseMappingActivated
    && m.neverSubstituteEffectiveDateForFirstDate
    && d.facilitySpecificFacDetailApproved
    && d.generalSearchLinksSupplementalOnly
    && d.reportPageFakeoutNeverPublish
    && californiaPreflightFacDetailUrl("015601083")
      === `${s.facDetailPagePrefix}015601083`
    && californiaPreflightFacDetailUrl("95354") === null;

  const failClosedOk =
    californiaPublicationPreflightEvaluate({
      facilityNumber: "015601083",
      identifierExactMatch: true,
      disclosureUrl: californiaPreflightFacDetailUrl("015601083"),
      sourceAsOfIso: "2026-11-15",
      newerDownloadAvailable: false,
    }).accepted === false
    && californiaPublicationPreflightEvaluate({
      facilityNumber: "015601083",
      identifierExactMatch: true,
      disclosureUrl: californiaPreflightFacDetailUrl("015601083"),
      sourceAsOfIso: "2026-11-15",
      newerDownloadAvailable: true,
    }).blockers.includes("stale-source-newer-download")
    && californiaPublicationPreflightEvaluate({
      facilityNumber: "015601083",
      identifierExactMatch: true,
      disclosureUrl: californiaPreflightFacDetailUrl("015601083"),
      sourceAsOfIso: "2026-11-15",
      sourceAmbiguousOrUnverified: true,
    }).blockers.includes("source-ambiguous-or-unverified")
    && californiaPublicationPreflightEvaluate({
      facilityNumber: "95354",
      sourceAsOfIso: "2026-11-15",
    }).blockers.includes("invalid-facility-number")
    && californiaPublicationPreflightEvaluate({
      facilityNumber: "079201725",
      identifierExactMatch: true,
      disclosureUrl: californiaPreflightFacDetailUrl("079201725"),
      sourceAsOfIso: "2026-11-15",
      isDocumentedExclusion: true,
    }).blockers.includes("documented-listing-exclusion");

  const matrixGo = CALIFORNIA_PREFLIGHT_MATRIX.filter((row) => row.status === "GO")
    .length;
  const matrixConditional = CALIFORNIA_PREFLIGHT_MATRIX.filter(
    (row) => row.status === "CONDITIONAL",
  ).length;
  const matrixStop = CALIFORNIA_PREFLIGHT_MATRIX.filter(
    (row) => row.status === "STOP",
  ).length;
  const genuineDecisions = CALIFORNIA_PREFLIGHT_MATRIX.filter(
    (row) => row.genuineLaunchDecision,
  ).length;

  const arithmeticOk =
    reconciliationOk
    && freshnessOk
    && policyOk
    && failClosedOk
    && matrixStop >= 1
    && matrixConditional >= 3
    && genuineDecisions >= 4
    && CALIFORNIA_PREFLIGHT_LIVE_SPOT_CHECKS.every(
      (c) => c.identifierExactMatch,
    );

  return {
    observedOn: CALIFORNIA_PREFLIGHT_OBSERVED_ON,
    baseline: CALIFORNIA_PREFLIGHT_BASELINE,
    source: s,
    conditionalReasons: CALIFORNIA_PREFLIGHT_CONDITIONAL_REASONS,
    reconciliation: r,
    exclusionIds: ex,
    liveSpotChecks: CALIFORNIA_PREFLIGHT_LIVE_SPOT_CHECKS,
    disclosurePolicy: d,
    statusMapping: m,
    matrix: CALIFORNIA_PREFLIGHT_MATRIX,
    decisionsRequiringApproval:
      CALIFORNIA_PREFLIGHT_DECISIONS_REQUIRING_APPROVAL,
    resolvedFindings: CALIFORNIA_PREFLIGHT_RESOLVED,
    remainingBlockers: CALIFORNIA_PREFLIGHT_REMAINING_BLOCKERS,
    arithmeticOk,
    matrixGo,
    matrixConditional,
    matrixStop,
    genuineLaunchDecisions: genuineDecisions,
    exclusionsActivated: false as const,
    allowsPublication: false as const,
    finalPublicVisibility: false as const,
    stopGoPublic: "STOP" as const,
    stopGoDevelopmentPreview: "GO" as const,
    stopGoEligibilityAccounting: "CONDITIONAL" as const,
    mostActionableNextStep:
      "Public California remains STOP. Eligibility accounting is CONDITIONAL solely because the approved Pending Increase mapping and exclusion ledger are inactive and publicationEligible=0 — not because 15,429/22 arithmetic is unverified. Genuine launch decisions: activate ledger/mapping (non-publishing), statewide publication approval, optional prior-control reclassify.",
    preservedRestrictions: [
      "washington-oregon-florida-ohio-unchanged",
      "exclusions-remain-inactive",
      "california-unpublished",
      "pending-increase-future-eligibility-not-publication",
      "fail-closed-on-stale-ambiguous-unverified",
      "leading-zeros-preserved",
    ] as const,
  };
}

export function californiaTier1PublicationPreflightAllowsPublication(): false {
  return false;
}

export function californiaTier1PublicationPreflightDirectoryReady(): false {
  return false;
}
