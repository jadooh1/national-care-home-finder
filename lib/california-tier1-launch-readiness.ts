/**
 * California Tier 1 launch-readiness validation (post-#202).
 *
 * Records that the conservative Licensed/Pending Increase mapping is
 * human-approved for *future eligibility consideration only*. Validates all
 * 66 Pending Increase IDs and the remaining 22 listing exclusions against
 * live CDSS Download + FacilityDetail. Recalculates offline Tier 1.
 *
 * Does NOT activate exclusions, publish California, write Supabase, or
 * substitute LICENSEEFFECTIVEDATE for License First Date.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_TIER1_LAUNCH_OBSERVED_ON = "2026-11-21";
export const CALIFORNIA_TIER1_LAUNCH_BASELINE = "c9d9f6c" as const;

export const CALIFORNIA_TIER1_LAUNCH_DOWNLOAD = {
  pathway: "downloadstatedata-transparency-csv" as const,
  rcfeContentDisposition:
    "attachment; filename=ResidentialElderCareFacility11152026.csv",
  arfContentDisposition:
    "attachment; filename=AdultResidentialFacilities11152026.csv",
  adoptedAsOfIso: "2026-11-15" as const,
  rcfeSha256:
    "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
  arfSha256:
    "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
  rcfeRows: 13337,
  arfRows: 11040,
  newerDownloadAvailable: false as const,
  unchangedFromPr199: true as const,
  cdssFilenameHeaderIsAsOfConfirmed: true as const,
} as const;

/**
 * Conservative Pending Increase mapping — approved for future eligibility
 * consideration only (human direction after #202).
 */
export const CALIFORNIA_TIER1_PENDING_INCREASE_MAPPING = {
  id: "approve-licensed-pending-increase-future-publication-mapping",
  humanApprovedForFutureEligibilityConsideration: true as const,
  activatedInApplicationOrDatabase: false as const,
  californiaPublicationAllowed: false as const,
  publishApprovedCapacityOnly: true as const,
  neverInventProposedCapacityIncrease: true as const,
  requireCdssSourceAgreement: true as const,
  neverSubstituteEffectiveDateForFirstDate: true as const,
} as const;

export const CALIFORNIA_TIER1_PENDING_INCREASE_IDS = [
  "374604742",
  "045920148",
  "392701057",
  "374604751",
  "392700647",
  "435294286",
  "197606348",
  "552701748",
  "336426330",
  "392701601",
  "306005986",
  "374604986",
  "347000846",
  "015601083",
  "392701730",
  "366425800",
  "335530021",
  "365530102",
  "331881673",
  "107200486",
  "157204130",
  "374604375",
  "079201349",
  "336426289",
  "107209383",
  "374603495",
  "306006109",
  "371881418",
  "107206544",
  "331881036",
  "198603784",
  "374604213",
  "365530299",
  "374601445",
  "342700591",
  "392701427",
  "392701658",
  "107209533",
  "347001484",
  "331880891",
  "336400036",
  "079201384",
  "410508825",
  "342701384",
  "342700984",
  "370808095",
  "107206560",
  "435201626",
  "306004005",
  "374601420",
  "486804268",
  "015601284",
  "347001961",
  "335530026",
  "374604454",
  "300605585",
  "331881303",
  "306000870",
  "374604710",
  "370808447",
  "374600429",
  "195850551",
  "371881438",
  "191603551",
  "342701723",
  "374604532",
] as const;

export const CALIFORNIA_TIER1_MISSING_FIRST_DATE_IDS = [
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

export const CALIFORNIA_TIER1_PROVISIONAL_IDS = [
  "198320787",
  "455920513",
  "197611076",
  "197611060",
  "134605014",
] as const;

export const CALIFORNIA_TIER1_PRIOR_CONFLICT_IDS = [
  "502701867",
  "019201167",
  "019201133",
] as const;

/** Live FacilityDetail validation summary (2026-11-21), all 66 + 22. */
export const CALIFORNIA_TIER1_LIVE_VALIDATION = {
  pendingIncrease: {
    probed: 66,
    facilityNumberExactMatch: 66,
    downloadStatusLicensed: 66,
    facilityDetailLicensedPendingIncrease: 66,
    clearedToExactLicensed: 0,
    downloadLicenseFirstDatePresent: 66,
    facilityDetailLicenseFirstDatePresent: 66,
    downloadCapacityPresent: 66,
    facilityDetailCapacityPresent: 66,
    downloadDetailCapacityAgreement: 66,
    cdssAgreementPass: 66,
    newConflictsDetected: 0,
  },
  missingFirstDate: {
    probed: 14,
    stillEmptyDownloadLicenseFirstDate: 14,
    facilityDetailLicenseFirstDateNull: 14,
    bothDatesEmpty: 5,
    firstEmptyEffectivePresent: 9,
    stillExcluded: 14,
  },
  provisional: {
    probed: 5,
    stillProvisionalLicense: 5,
    stillExcluded: 5,
  },
  priorConflicts: {
    probed: 3,
    /** 502701867 Pending Incomplete; 019201167/019201133 still Pending Increase (kept as prior controls). */
    stillExcluded: 3,
    statuses: {
      "502701867": "Pending Incomplete Application",
      "019201167": "Licensed/Pending Increase",
      "019201133": "Licensed/Pending Increase",
    } as const,
  },
} as const;

/**
 * Offline Tier 1 recalculation under approved future-eligibility mapping.
 * Exclusions remain inactive in app/DB; publicationEligible stays 0.
 */
export const CALIFORNIA_TIER1_OFFLINE_COUNTS = {
  activeRestrictedCandidates: 15451,
  /** Historical Phase 23 listing exclusions before Pending Increase mapping approval. */
  listingExclusionsBeforeMappingApproval: 88,
  pendingIncreaseFutureEligibleUnderApprovedMapping: 66,
  remainingListingExclusions: 22,
  missingFirstDateExcluded: 14,
  provisionalExcluded: 5,
  priorConflictExcluded: 3,
  /** 15,363 otherwise-clear + 66 Pending Increase future-eligible. */
  tier1OfflineEligibleUnderApprovedMapping: 15429,
  /** Pre-approval otherwise-clear (unchanged operational baseline). */
  otherwiseClearOfflinePreApproval: 15363,
  publicationEligible: 0,
  ownerClaimEligible: 0,
  exclusionsActivatedInApplicationOrDatabase: false,
} as const;

export type CaliforniaTier1LaunchArea =
  | "data-integrity"
  | "disclosures"
  | "security"
  | "eligibility-accounting"
  | "publication-gate";

export type CaliforniaTier1LaunchAssessmentRow = {
  area: CaliforniaTier1LaunchArea;
  title: string;
  status: "pass" | "pass-with-residual-exclusions" | "blocked" | "policy-ready-not-activated";
  evidence: string;
  stopGo: "GO" | "STOP" | "CONDITIONAL";
};

export const CALIFORNIA_TIER1_LAUNCH_ASSESSMENT: readonly CaliforniaTier1LaunchAssessmentRow[] =
  [
    {
      area: "data-integrity",
      title: "CDSS Transparency roster freshness + Pending Increase validation",
      status: "pass-with-residual-exclusions",
      evidence:
        "As-of 2026-11-15 unchanged (no newer Download). All 66 Pending Increase IDs: exact Facility Number match, Download LICENSED, FacilityDetail Licensed/Pending Increase, non-empty first dates, capacity agreement 66/66. Remaining 22 exclusions reconfirmed.",
      stopGo: "GO",
    },
    {
      area: "eligibility-accounting",
      title: "Offline Tier 1 under approved future-eligibility mapping",
      status: "policy-ready-not-activated",
      evidence:
        "Mapping approved for future consideration only. Offline Tier 1 future-eligible = 15,429 (15,363 + 66). Remaining listing exclusions = 22. Exclusions not activated in app/DB. publicationEligible = 0.",
      stopGo: "CONDITIONAL",
    },
    {
      area: "disclosures",
      title: "Public disclosure / terms readiness",
      status: "blocked",
      evidence:
        "No California public facility pages. Source-licensing / public disclosure copy and statewide publication authorization remain separate human gates. Development preview pages only.",
      stopGo: "STOP",
    },
    {
      area: "security",
      title: "Security / production boundary",
      status: "pass",
      evidence:
        "No Supabase writes, no exclusion activation, no California publication, no production deploy in this validation. Publishable key only; ArcGIS STATUS cannot override CDSS. WA/OR/FL/OH unchanged.",
      stopGo: "GO",
    },
    {
      area: "publication-gate",
      title: "California public publication",
      status: "blocked",
      evidence:
        "State authorization unpublished. publicationEligible=0. Future eligibility consideration ≠ public launch.",
      stopGo: "STOP",
    },
  ];

/**
 * Decisions that still require human approval after this validation.
 * (Pending Increase future-eligibility mapping is already approved.)
 */
export const CALIFORNIA_TIER1_LAUNCH_DECISIONS_REQUIRING_APPROVAL = [
  {
    id: "activate-california-exclusion-ledger-in-app-db",
    title: "Activate California offline exclusion / eligibility ledger in app/DB",
    decisionText:
      "Approve activating the offline eligibility ledger (15,429 Tier 1 future-eligible under approved Pending Increase mapping; 22 remaining listing exclusions) in application/database configuration — without publishing California publicly.",
    recommendation: "Defer until statewide publication plan is ready; keep inactive.",
    blocksPublicationAlone: false,
  },
  {
    id: "approve-california-statewide-public-publication",
    title: "Approve California statewide public publication",
    decisionText:
      "Approve flipping California from unpublished STOP to public directory publication after disclosure/terms, state authorization, and residual exclusion handling are complete.",
    recommendation: "Do not approve yet — disclosure/authorization gates remain STOP.",
    blocksPublicationAlone: true,
  },
  {
    id: "reclassify-prior-control-pending-increase-ids",
    title: "Reclassify prior-control IDs 019201167 / 019201133 under Pending Increase mapping",
    decisionText:
      "Approve moving prior-control facility numbers 019201167 and 019201133 (FacilityDetail still Licensed/Pending Increase) from the prior-conflict exclusion bucket into the approved Pending Increase future-eligibility mapping (would raise offline Tier 1 by +2 to 15,431).",
    recommendation:
      "Optional. Keep excluded as prior controls unless you explicitly want them under the approved mapping.",
    blocksPublicationAlone: false,
  },
] as const;

export const CALIFORNIA_TIER1_LAUNCH_RESOLVED = [
  "pending-increase-mapping-approved-for-future-eligibility-consideration",
  "all-66-pending-increase-cdss-agreement-validated",
  "remaining-22-exclusions-reconfirmed",
  "transparency-asof-unchanged-2026-11-15-no-newer-download",
  "offline-tier1-recalculated-15429-under-approved-mapping",
  "publication-eligible-remains-zero",
] as const;

export const CALIFORNIA_TIER1_LAUNCH_REMAINING_BLOCKERS = [
  "california-publication-blocked",
  "state-authorization-unpublished",
  "exclusion-policy-inactive-not-activated",
  "disclosure-terms-not-cleared-for-public-launch",
  "missing-first-date-14-remain-excluded",
  "provisional-5-remain-excluded",
  "prior-conflicts-3-remain-excluded",
  "publication-approval-required",
] as const;

export function buildCaliforniaTier1LaunchReadinessPreview() {
  const c = CALIFORNIA_TIER1_OFFLINE_COUNTS;
  const v = CALIFORNIA_TIER1_LIVE_VALIDATION;
  const d = CALIFORNIA_TIER1_LAUNCH_DOWNLOAD;
  const m = CALIFORNIA_TIER1_PENDING_INCREASE_MAPPING;

  const arithmeticOk =
    CALIFORNIA_TIER1_PENDING_INCREASE_IDS.length === 66
    && CALIFORNIA_TIER1_MISSING_FIRST_DATE_IDS.length === 14
    && CALIFORNIA_TIER1_PROVISIONAL_IDS.length === 5
    && CALIFORNIA_TIER1_PRIOR_CONFLICT_IDS.length === 3
    && c.remainingListingExclusions
      === c.missingFirstDateExcluded
        + c.provisionalExcluded
        + c.priorConflictExcluded
    && c.listingExclusionsBeforeMappingApproval
      === c.pendingIncreaseFutureEligibleUnderApprovedMapping
        + c.remainingListingExclusions
    && c.tier1OfflineEligibleUnderApprovedMapping
      === c.otherwiseClearOfflinePreApproval
        + c.pendingIncreaseFutureEligibleUnderApprovedMapping
    && c.activeRestrictedCandidates
      === c.tier1OfflineEligibleUnderApprovedMapping
        + c.remainingListingExclusions
    && c.publicationEligible === 0
    && c.ownerClaimEligible === 0
    && !c.exclusionsActivatedInApplicationOrDatabase
    && v.pendingIncrease.cdssAgreementPass === 66
    && v.pendingIncrease.newConflictsDetected === 0
    && v.missingFirstDate.stillExcluded === 14
    && v.provisional.stillExcluded === 5
    && v.priorConflicts.stillExcluded === 3
    && d.newerDownloadAvailable === false
    && d.adoptedAsOfIso === "2026-11-15"
    && m.humanApprovedForFutureEligibilityConsideration
    && !m.activatedInApplicationOrDatabase
    && !m.californiaPublicationAllowed;

  const assessmentPass = CALIFORNIA_TIER1_LAUNCH_ASSESSMENT.filter(
    (r) => r.stopGo === "GO" || r.stopGo === "CONDITIONAL",
  ).length;
  const assessmentStop = CALIFORNIA_TIER1_LAUNCH_ASSESSMENT.filter(
    (r) => r.stopGo === "STOP",
  ).length;

  return {
    observedOn: CALIFORNIA_TIER1_LAUNCH_OBSERVED_ON,
    baseline: CALIFORNIA_TIER1_LAUNCH_BASELINE,
    download: d,
    mapping: m,
    validation: v,
    counts: c,
    assessment: CALIFORNIA_TIER1_LAUNCH_ASSESSMENT,
    decisionsRequiringApproval:
      CALIFORNIA_TIER1_LAUNCH_DECISIONS_REQUIRING_APPROVAL,
    resolvedFindings: CALIFORNIA_TIER1_LAUNCH_RESOLVED,
    remainingBlockers: CALIFORNIA_TIER1_LAUNCH_REMAINING_BLOCKERS,
    arithmeticOk,
    assessmentPassOrConditional: assessmentPass,
    assessmentStop,
    exclusionsActivated: false as const,
    allowsPublication: false as const,
    finalPublicVisibility: false as const,
    stopGoPublic: "STOP" as const,
    stopGoDevelopmentPreview: "GO" as const,
    stopGoOfflineTier1Accounting: "CONDITIONAL" as const,
    mostActionableNextStep:
      "Public California remains STOP. Optional next human decisions: (1) activate offline eligibility ledger without publishing, (2) statewide publication approval after disclosures/authorization, (3) optionally reclassify prior-control Pending Increase IDs 019201167/019201133.",
    preservedRestrictions: [
      "washington-oregon-florida-ohio-unchanged",
      "exclusions-remain-inactive",
      "pending-increase-future-eligibility-not-publication",
      "missing-first-dates-never-use-effective-date",
      "proposed-capacity-never-invented",
    ] as const,
  };
}

export function californiaTier1LaunchAllowsPublication(): false {
  return false;
}

export function californiaTier1LaunchDirectoryReady(): false {
  return false;
}
