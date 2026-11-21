/**
 * California Licensed/Pending Increase publication-policy proposal (post-#201).
 *
 * Development-only proposal + hypothetical impact simulation.
 * Does NOT activate exclusions, publish California, write Supabase, or
 * adopt LICENSEEFFECTIVEDATE as License First Date.
 * Intentionally free of sibling runtime imports.
 *
 * Exact decision requiring human approval is exported as
 * CALIFORNIA_PENDING_INCREASE_POLICY_DECISION_REQUIRING_APPROVAL.
 */

export const CALIFORNIA_PENDING_INCREASE_POLICY_OBSERVED_ON = "2026-11-21";
export const CALIFORNIA_PENDING_INCREASE_POLICY_BASELINE = "41338bb" as const;

export const CALIFORNIA_PENDING_INCREASE_POLICY_STATUS = {
  /**
   * Approved for future eligibility consideration only (human direction
   * after #202 / recorded in Tier 1 launch-readiness). Not activated;
   * does not publish California.
   */
  humanApproved: true as const,
  humanApprovedScope: "future-eligibility-consideration-only" as const,
  activatedInApplicationOrDatabase: false as const,
  californiaPublicationAllowed: false as const,
  altersAuthoritativeGovernmentRecords: false as const,
} as const;

/**
 * Policy decision record. Approved for future eligibility consideration only.
 * Does not activate exclusions or publish California.
 */
export const CALIFORNIA_PENDING_INCREASE_POLICY_DECISION_REQUIRING_APPROVAL = {
  id: "approve-licensed-pending-increase-future-publication-mapping",
  title:
    "Approve Licensed/Pending Increase as a future publication-eligible overlay mapping",
  decisionText:
    "Approve treating CDSS FacilityDetail status \"Licensed/Pending Increase\" (with Download LICENSED) as a recognized existing licensed facility for *future* California publication consideration, publishing only the currently approved capacity when Download Facility Capacity exactly equals FacilityDetail CAPACITY, never inventing or displaying a proposed capacity increase (not published in Transparency APIs), and only after all CDSS source-agreement gates pass — while California statewide publication remains STOP, exclusions remain inactive in app/DB until separately activated, and the 14 missing License First Date facilities plus all other documented conflicts remain excluded.",
  alternatives:
    "Reject and keep all 66 Pending Increase facilities permanently offline listing-excluded until FacilityDetail clears to exact \"Licensed\".",
  scope: "future-eligibility-consideration-only" as const,
  appliesToFacilityCount: 66,
  doesNotActivateExclusions: true as const,
  doesNotPublishCalifornia: true as const,
  requiresSeparateStatewidePublicationApproval: true as const,
  approvalState: "approved-for-future-eligibility-consideration-only" as const,
} as const;

/** Proposed rules (inactive until humanApproved). */
export const CALIFORNIA_PENDING_INCREASE_PROPOSED_RULES = {
  recognizeExistingLicensedStatus: true as const,
  downloadStatusRequired: "LICENSED" as const,
  facilityDetailStatusesAllowedForFutureConsideration: [
    "Licensed/Pending Increase",
    "Licensed",
  ] as const,
  publishApprovedCapacityOnly: true as const,
  requireDownloadAndDetailCapacityAgreement: true as const,
  neverInventProposedCapacityIncrease: true as const,
  proposedCapacityPublishedInTransparencyApis: false as const,
  requireExactFacilityNumberMatch: true as const,
  requireNonEmptyDownloadLicenseFirstDate: true as const,
  neverSubstituteEffectiveDateForFirstDate: true as const,
  continueExcludingMissingFirstLicenseDates: true as const,
  continueExcludingProvisionalConflicts: true as const,
  continueExcludingPriorStatusConflicts: true as const,
  continueExcludingInvalidIdentifiers: true as const,
  arcgisStatusCannotSatisfyAgreement: true as const,
  futureConsiderationIsNotPublicationApproval: true as const,
} as const;

export const CALIFORNIA_PENDING_INCREASE_POLICY_IDS = [
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

export const CALIFORNIA_POLICY_MISSING_FIRST_DATE_IDS = [
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

export const CALIFORNIA_POLICY_PROVISIONAL_IDS = [
  "198320787",
  "455920513",
  "197611076",
  "197611060",
  "134605014",
] as const;

export const CALIFORNIA_POLICY_PRIOR_CONFLICT_IDS = [
  "502701867",
  "019201167",
  "019201133",
] as const;

export type CaliforniaPendingIncreasePolicyGateFailure =
  | "policy-not-human-approved"
  | "invalid-or-mismatched-facility-number"
  | "download-status-not-licensed"
  | "facility-detail-status-not-allowed"
  | "download-license-first-date-missing"
  | "effective-date-substitution-refused"
  | "capacity-missing"
  | "capacity-disagreement"
  | "missing-first-date-facility"
  | "provisional-conflict-facility"
  | "prior-status-conflict-facility"
  | "arcgis-status-rejected-as-agreement"
  | "statewide-publication-still-blocked";

export type CaliforniaPendingIncreasePolicyEvaluation = {
  facilityNumber: string;
  onPendingIncreaseLedger: boolean;
  existingLicenseRecognized: boolean;
  approvedCapacity: string | null;
  proposedCapacityIncrease: null;
  cdssSourcesAgree: boolean;
  /** Hypothetical only — true only if policy approved AND all gates pass. */
  futurePublicationCandidateIfPolicyApproved: boolean;
  /** Always false while California publication / activation remain blocked. */
  publicationApproved: false;
  offlineListingExcludedUnderCurrentRules: boolean;
  gateFailures: CaliforniaPendingIncreasePolicyGateFailure[];
  rationale: string;
};

const FACILITY_NUMBER = /^\d{8,9}$/;
const PENDING_SET = new Set<string>(CALIFORNIA_PENDING_INCREASE_POLICY_IDS);
const MISSING_SET = new Set<string>(CALIFORNIA_POLICY_MISSING_FIRST_DATE_IDS);
const PROVISIONAL_SET = new Set<string>(CALIFORNIA_POLICY_PROVISIONAL_IDS);
const PRIOR_SET = new Set<string>(CALIFORNIA_POLICY_PRIOR_CONFLICT_IDS);

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function upper(value: unknown): string {
  return text(value).toUpperCase();
}

function isPendingIncrease(live: string): boolean {
  return /^licensed\s*\/\s*pending\s+increase$/i.test(live);
}

function isExactLicensed(live: string): boolean {
  return /^licensed$/i.test(live);
}

function isBlank(value: unknown): boolean {
  return text(value) === "";
}

export type CaliforniaPendingIncreasePolicyInput = {
  facilityNumber: string;
  downloadStatus?: string | null;
  facilityDetailStatus?: string | null;
  downloadCapacity?: string | null;
  facilityDetailCapacity?: string | null;
  downloadLicenseFirstDate?: string | null;
  facilityDetailLicenseFirstDate?: string | null;
  /** If present, must never be used as License First Date. */
  facilityDetailLicenseEffectiveDate?: string | null;
  liveFacilityNumber?: string | null;
  /** Undocumented ArcGIS STATUS — never satisfies CDSS agreement. */
  arcgisStatusInteger?: number | string | null;
  /** Simulate as if human already approved the policy (dev simulation only). */
  simulatePolicyApproved?: boolean;
  /** Simulate statewide publication still blocked (default true). */
  statewidePublicationBlocked?: boolean;
};

/**
 * Evaluate one facility under the proposed Pending Increase policy.
 * Fail-closed. Never activates exclusions or clears statewide publication.
 */
export function evaluateCaliforniaPendingIncreasePublicationPolicy(
  input: CaliforniaPendingIncreasePolicyInput,
): CaliforniaPendingIncreasePolicyEvaluation {
  const facilityNumber = text(input.facilityNumber);
  const failures: CaliforniaPendingIncreasePolicyGateFailure[] = [];
  const policyApproved =
    input.simulatePolicyApproved === true
    || CALIFORNIA_PENDING_INCREASE_POLICY_STATUS.humanApproved;
  const statewideBlocked = input.statewidePublicationBlocked !== false;

  if (!policyApproved) {
    failures.push("policy-not-human-approved");
  }
  if (statewideBlocked) {
    failures.push("statewide-publication-still-blocked");
  }

  if (MISSING_SET.has(facilityNumber)) {
    failures.push("missing-first-date-facility");
  }
  if (PROVISIONAL_SET.has(facilityNumber)) {
    failures.push("provisional-conflict-facility");
  }
  if (PRIOR_SET.has(facilityNumber)) {
    failures.push("prior-status-conflict-facility");
  }

  if (
    !FACILITY_NUMBER.test(facilityNumber)
    || (input.liveFacilityNumber
      && text(input.liveFacilityNumber) !== facilityNumber)
  ) {
    failures.push("invalid-or-mismatched-facility-number");
  }

  const download = upper(input.downloadStatus);
  const live = text(input.facilityDetailStatus);
  if (download !== "LICENSED") {
    failures.push("download-status-not-licensed");
  }
  if (!(isPendingIncrease(live) || isExactLicensed(live))) {
    failures.push("facility-detail-status-not-allowed");
  }

  // Never substitute effective date for first date.
  if (
    isBlank(input.downloadLicenseFirstDate)
    && isBlank(input.facilityDetailLicenseFirstDate)
  ) {
    failures.push("download-license-first-date-missing");
    if (!isBlank(input.facilityDetailLicenseEffectiveDate)) {
      failures.push("effective-date-substitution-refused");
    }
  } else if (isBlank(input.downloadLicenseFirstDate)) {
    failures.push("download-license-first-date-missing");
  }

  const downloadCap = text(input.downloadCapacity);
  const detailCap = text(input.facilityDetailCapacity);
  if (!downloadCap || !detailCap) {
    failures.push("capacity-missing");
  } else if (downloadCap !== detailCap) {
    failures.push("capacity-disagreement");
  }

  if (
    input.arcgisStatusInteger !== null
    && input.arcgisStatusInteger !== undefined
    && text(input.arcgisStatusInteger) !== ""
  ) {
    // ArcGIS may be present but never clears a CDSS gate failure by itself.
    // If it is the only "status" evidence (no CDSS live status), already failed above.
    // Explicit rejection marker when someone tries to use it as agreement:
    if (!live) {
      failures.push("arcgis-status-rejected-as-agreement");
    }
  }

  const onLedger = PENDING_SET.has(facilityNumber);
  const existingLicenseRecognized =
    download === "LICENSED"
    && (isPendingIncrease(live) || isExactLicensed(live));
  const approvedCapacity =
    downloadCap && detailCap && downloadCap === detailCap ? downloadCap : null;

  const agreementFailures = failures.filter(
    (f) =>
      f !== "policy-not-human-approved"
      && f !== "statewide-publication-still-blocked",
  );
  const cdssSourcesAgree = agreementFailures.length === 0;

  const futureCandidate =
    policyApproved
    && cdssSourcesAgree
    && onLedger
    && existingLicenseRecognized
    && approvedCapacity != null;

  // Under current (unapproved) rules, pending-increase ledger stays listing-excluded.
  const offlineListingExcludedUnderCurrentRules =
    onLedger
    || MISSING_SET.has(facilityNumber)
    || PROVISIONAL_SET.has(facilityNumber)
    || PRIOR_SET.has(facilityNumber)
    || !cdssSourcesAgree
    || !FACILITY_NUMBER.test(facilityNumber);

  return {
    facilityNumber,
    onPendingIncreaseLedger: onLedger,
    existingLicenseRecognized,
    approvedCapacity,
    proposedCapacityIncrease: null,
    cdssSourcesAgree,
    futurePublicationCandidateIfPolicyApproved: futureCandidate,
    publicationApproved: false,
    offlineListingExcludedUnderCurrentRules,
    gateFailures: [...new Set(failures)],
    rationale: futureCandidate
      ? "Hypothetical future publication candidate under approved Pending Increase mapping with CDSS agreement. publicationApproved remains false while statewide gates are blocked."
      : failures.includes("missing-first-date-facility")
        ? "Missing License First Date facility remains excluded. LICENSEEFFECTIVEDATE is never substituted."
        : failures.includes("policy-not-human-approved")
          && cdssSourcesAgree
          && onLedger
          ? "CDSS sources agree under proposed rules, but policy is not human-approved. Keep listing-excluded; publicationApproved=false."
          : `Fail-closed under proposed Pending Increase policy. Gates: ${
            [...new Set(failures)].join(", ") || "none"
          }.`,
  };
}

export type CaliforniaPendingIncreasePolicySimulation = {
  observedOn: string;
  baseline: string;
  /** Approved for future eligibility consideration only — not activated. */
  policyApproved: true;
  exclusionsActivated: false;
  allowsPublication: false;
  current: {
    listingExclusionsOffline: 88;
    pendingIncreaseExcluded: 66;
    missingFirstDateExcluded: 14;
    provisionalExcluded: 5;
    priorConflictExcluded: 3;
    otherwiseClearOffline: 15363;
    publicationEligible: 0;
  };
  hypotheticalIfPolicyApprovedAndCdssAgree: {
    /** Assumes all 66 meet CDSS agreement (as sampled in #201). */
    pendingIncreaseFutureCandidates: 66;
    listingExclusionsRemaining: 22;
    otherwiseClearOffline: 15429;
    missingFirstDateStillExcluded: 14;
    provisionalStillExcluded: 5;
    priorConflictStillExcluded: 3;
    /** Statewide publication still STOP. */
    publicationEligible: 0;
    note: string;
  };
  decisionRequiringApproval: typeof CALIFORNIA_PENDING_INCREASE_POLICY_DECISION_REQUIRING_APPROVAL;
  proposedRules: typeof CALIFORNIA_PENDING_INCREASE_PROPOSED_RULES;
  remainingBlockers: readonly string[];
};

/**
 * Development-only impact simulation. Does not change live eligibility.
 */
export function simulateCaliforniaPendingIncreasePublicationPolicy(): CaliforniaPendingIncreasePolicySimulation {
  return {
    observedOn: CALIFORNIA_PENDING_INCREASE_POLICY_OBSERVED_ON,
    baseline: CALIFORNIA_PENDING_INCREASE_POLICY_BASELINE,
    policyApproved: true,
    exclusionsActivated: false,
    allowsPublication: false,
    current: {
      listingExclusionsOffline: 88,
      pendingIncreaseExcluded: 66,
      missingFirstDateExcluded: 14,
      provisionalExcluded: 5,
      priorConflictExcluded: 3,
      otherwiseClearOffline: 15363,
      publicationEligible: 0,
    },
    hypotheticalIfPolicyApprovedAndCdssAgree: {
      pendingIncreaseFutureCandidates: 66,
      listingExclusionsRemaining: 22,
      otherwiseClearOffline: 15429,
      missingFirstDateStillExcluded: 14,
      provisionalStillExcluded: 5,
      priorConflictStillExcluded: 3,
      publicationEligible: 0,
      note:
        "Hypothetical only: if Amjad approves the Pending Increase mapping and all 66 continue to satisfy CDSS agreement, offline otherwise-clear would rise 15,363 → 15,429. publicationEligible stays 0 until statewide publication approval. Missing-date (14), provisional (5), and prior conflicts (3) remain excluded.",
    },
    decisionRequiringApproval:
      CALIFORNIA_PENDING_INCREASE_POLICY_DECISION_REQUIRING_APPROVAL,
    proposedRules: CALIFORNIA_PENDING_INCREASE_PROPOSED_RULES,
    remainingBlockers: [
      "pending-increase-mapping-approved-future-eligibility-only-not-activated",
      "california-publication-blocked",
      "state-authorization-unpublished",
      "exclusion-policy-inactive",
      "missing-first-date-facilities-remain-excluded",
      "provisional-and-prior-conflicts-remain-excluded",
      "publication-approval-required",
    ],
  };
}

export function buildCaliforniaPendingIncreasePublicationPolicyPreview() {
  const sim = simulateCaliforniaPendingIncreasePublicationPolicy();
  const arithmeticOk =
    sim.current.listingExclusionsOffline
      === sim.current.pendingIncreaseExcluded
        + sim.current.missingFirstDateExcluded
        + sim.current.provisionalExcluded
        + sim.current.priorConflictExcluded
    && sim.hypotheticalIfPolicyApprovedAndCdssAgree.listingExclusionsRemaining
      === sim.current.missingFirstDateExcluded
        + sim.current.provisionalExcluded
        + sim.current.priorConflictExcluded
    && sim.hypotheticalIfPolicyApprovedAndCdssAgree.otherwiseClearOffline
      === sim.current.otherwiseClearOffline
        + sim.hypotheticalIfPolicyApprovedAndCdssAgree
          .pendingIncreaseFutureCandidates
    && sim.current.publicationEligible === 0
    && sim.hypotheticalIfPolicyApprovedAndCdssAgree.publicationEligible === 0
    && CALIFORNIA_PENDING_INCREASE_POLICY_IDS.length === 66
    && CALIFORNIA_POLICY_MISSING_FIRST_DATE_IDS.length === 14
    && CALIFORNIA_POLICY_PROVISIONAL_IDS.length === 5
    && CALIFORNIA_POLICY_PRIOR_CONFLICT_IDS.length === 3
    && CALIFORNIA_PENDING_INCREASE_POLICY_STATUS.humanApproved
    && CALIFORNIA_PENDING_INCREASE_POLICY_STATUS.humanApprovedScope
      === "future-eligibility-consideration-only"
    && !CALIFORNIA_PENDING_INCREASE_POLICY_STATUS.activatedInApplicationOrDatabase
    && !CALIFORNIA_PENDING_INCREASE_POLICY_STATUS.californiaPublicationAllowed;

  return {
    ...sim,
    arithmeticOk,
    stopGoPublic: "STOP" as const,
    stopGoDevelopmentPreview: "GO" as const,
    mostActionableNextStep:
      CALIFORNIA_PENDING_INCREASE_POLICY_DECISION_REQUIRING_APPROVAL.decisionText,
    preservedRestrictions: [
      "washington-oregon-florida-ohio-unchanged",
      "exclusions-remain-inactive",
      "missing-first-dates-never-use-effective-date",
      "proposed-capacity-never-invented",
      "offline-candidates-not-publication-approved",
    ] as const,
  };
}

export function californiaPendingIncreasePublicationPolicyAllowsPublication(): false {
  return false;
}

export function californiaPendingIncreasePublicationPolicyDirectoryReady(): false {
  return false;
}
