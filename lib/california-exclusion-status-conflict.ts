/**
 * California Tier 1 exclusion + status-conflict verification (post-#199).
 *
 * Classifies the 88 offline listing exclusions against authoritative CDSS
 * DownloadStateData / FacilityDetail evidence. Encodes the safeguard that
 * undocumented ArcGIS STATUS integers cannot override official CDSS status.
 *
 * Development-only. Does not activate exclusions, publish California, flip
 * directoryContract, enable owner claims, or write Supabase.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_EXCLUSION_STATUS_CONFLICT_OBSERVED_ON = "2026-11-21";

/** PR #199 merge commit on development (short SHA). */
export const CALIFORNIA_EXCLUSION_STATUS_CONFLICT_BASELINE =
  "41458b8" as const;

export const CALIFORNIA_EXCLUSION_STATUS_CONFLICT_SOURCES = {
  downloadStateData: "downloadstatedata-transparency-csv" as const,
  facilityDetailApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
  arcgisFeatureServer:
    "https://services.arcgis.com/XLPEppdz2H9dOiqp/arcgis/rest/services/CDSS_CCL_Facilities/FeatureServer/0",
  asOfIso: "2026-11-15" as const,
  notArcGisRoster: true as const,
} as const;

/**
 * Phase 23 listing-exclusion ID sets (exact offline 88).
 * Withdrawn controls and invalid 95354 stay outside the 15,451 residual.
 */
export const CALIFORNIA_LISTING_EXCLUSION_PROVISIONAL = [
  "198320787",
  "455920513",
  "197611076",
  "197611060",
  "134605014",
] as const;

export const CALIFORNIA_LISTING_EXCLUSION_PENDING_INCREASE = [
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

export const CALIFORNIA_LISTING_EXCLUSION_PRIOR = [
  "502701867",
  "019201167",
  "019201133",
] as const;

export const CALIFORNIA_LISTING_EXCLUSION_MISSING_DATE = [
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

/** Outside residual 15,451 — documented but not part of the 88. */
export const CALIFORNIA_EXCLUSION_OUTSIDE_RESIDUAL = {
  withdrawn: [
    "306006749",
    "306006799",
    "405802282",
    "374604911",
    "019201529",
  ] as const,
  invalidIdentifier: ["95354"] as const,
} as const;

export type CaliforniaListingExclusionCategory =
  | "provisional-license-conflict"
  | "licensed-pending-increase-overlay"
  | "prior-status-conflict"
  | "missing-license-evidence";

export type CaliforniaCdssEvidenceAuthority =
  | "facility-detail-status"
  | "download-license-first-date"
  | "facility-detail-and-download-conflict"
  | "none-arcgis-only";

export type CaliforniaExclusionRuleSupport = {
  category: CaliforniaListingExclusionCategory;
  phase18RuleId:
    | "unverified-or-conflicting-status"
    | "missing-license-evidence";
  count: number;
  facilityNumbers: readonly string[];
  downloadStatusExpected: "LICENSED";
  facilityDetailStatusPattern: string;
  cdssEvidenceAuthority: CaliforniaCdssEvidenceAuthority;
  supportedByAuthoritativeCdssEvidence: true;
  mappingApprovedForPublication: false;
  reliesOnArcGisStatus: false;
  rationale: string;
  liveReprobeNotes?: readonly string[];
};

/**
 * All 88 listing exclusions are backed by CDSS DownloadStateData and/or
 * FacilityDetail evidence. None rely on ArcGIS STATUS integers.
 */
export const CALIFORNIA_LISTING_EXCLUSION_RULE_SUPPORT: readonly CaliforniaExclusionRuleSupport[] =
  [
    {
      category: "provisional-license-conflict",
      phase18RuleId: "unverified-or-conflicting-status",
      count: 5,
      facilityNumbers: CALIFORNIA_LISTING_EXCLUSION_PROVISIONAL,
      downloadStatusExpected: "LICENSED",
      facilityDetailStatusPattern: "Provisional License",
      cdssEvidenceAuthority: "facility-detail-and-download-conflict",
      supportedByAuthoritativeCdssEvidence: true,
      mappingApprovedForPublication: false,
      reliesOnArcGisStatus: false,
      rationale:
        "Download LICENSED vs FacilityDetail Provisional License is not an approved coarsening. FacilityDetail is authoritative for current licensing status; keep unknown-ineligible.",
      liveReprobeNotes: [
        "2026-11-21: 198320787 and 134605014 still FacilityDetail \"Provisional License\".",
      ],
    },
    {
      category: "licensed-pending-increase-overlay",
      phase18RuleId: "unverified-or-conflicting-status",
      count: 66,
      facilityNumbers: CALIFORNIA_LISTING_EXCLUSION_PENDING_INCREASE,
      downloadStatusExpected: "LICENSED",
      facilityDetailStatusPattern: "Licensed/Pending Increase",
      cdssEvidenceAuthority: "facility-detail-status",
      supportedByAuthoritativeCdssEvidence: true,
      mappingApprovedForPublication: false,
      reliesOnArcGisStatus: false,
      rationale:
        "FacilityDetail \"Licensed/Pending Increase\" is an explainable process overlay on a licensed facility, but no human-approved publication mapping exists. Fail-closed for listing exclusion until mapping is approved.",
      liveReprobeNotes: [
        "2026-11-21: 374604742 and 015601083 still FacilityDetail \"Licensed/Pending Increase\".",
      ],
    },
    {
      category: "prior-status-conflict",
      phase18RuleId: "unverified-or-conflicting-status",
      count: 3,
      facilityNumbers: CALIFORNIA_LISTING_EXCLUSION_PRIOR,
      downloadStatusExpected: "LICENSED",
      facilityDetailStatusPattern:
        "Pending Incomplete Application | Licensed/Pending Increase",
      cdssEvidenceAuthority: "facility-detail-and-download-conflict",
      supportedByAuthoritativeCdssEvidence: true,
      mappingApprovedForPublication: false,
      reliesOnArcGisStatus: false,
      rationale:
        "Prior controls: 502701867 Download LICENSED vs FacilityDetail Pending Incomplete Application remains a genuine unresolved conflict; 019201167/019201133 remain Licensed/Pending Increase (not double-counted in the 66).",
      liveReprobeNotes: [
        "2026-11-21: 502701867 still Pending Incomplete Application; 019201167 still Licensed/Pending Increase.",
      ],
    },
    {
      category: "missing-license-evidence",
      phase18RuleId: "missing-license-evidence",
      count: 14,
      facilityNumbers: CALIFORNIA_LISTING_EXCLUSION_MISSING_DATE,
      downloadStatusExpected: "LICENSED",
      facilityDetailStatusPattern: "Licensed (License First Date empty on download)",
      cdssEvidenceAuthority: "download-license-first-date",
      supportedByAuthoritativeCdssEvidence: true,
      mappingApprovedForPublication: false,
      reliesOnArcGisStatus: false,
      rationale:
        "Download LICENSED with empty License First Date is genuine eligibility risk. FAQ \"No date on file\" does not authorize undated publication. Fail-closed on the download field until an authoritative initial license date appears on a fresh Transparency pull (or human-approved FacilityDetail date adoption).",
      liveReprobeNotes: [
        "2026-11-21: 079201725 still Licensed with null FacilityDetail licenseFirst.",
        "2026-11-21: 502701889 FacilityDetail now shows licenseFirst 9/22/2026 — download missing-date exclusion still applies until a fresh CSV confirms the date; do not invent equivalence from a single live probe.",
      ],
    },
  ];

export type CaliforniaStatusAuthoritySource =
  | "download-state-data"
  | "facility-detail"
  | "arcgis-status-integer";

export type CaliforniaConflictEvaluationInput = {
  facilityNumber: string;
  downloadStatus?: string | null;
  facilityDetailStatus?: string | null;
  downloadLicenseFirstDate?: string | null;
  facilityDetailLicenseFirstDate?: string | null;
  liveFacilityNumber?: string | null;
  /** Undocumented ArcGIS STATUS integer; never authoritative. */
  arcgisStatusInteger?: number | string | null;
  duplicateFacilityNumberCount?: number | null;
  httpStatus?: number | null;
  timedOut?: boolean;
  found?: boolean | null;
};

export type CaliforniaConflictEvaluation = {
  facilityNumber: string;
  listingExclusionCategory: CaliforniaListingExclusionCategory | null;
  offlineListingExcluded: boolean;
  /** Offline Tier 1 candidate (not excluded by listing rule). */
  offlineCandidate: boolean;
  /** Always false while California publication / exclusions remain blocked. */
  publicationApproved: false;
  ownerClaimEligible: false;
  eligibility:
    | "unknown-ineligible"
    | "invalid-id-ineligible"
    | "pending-ineligible"
    | "active-candidate-offline-only";
  cdssConflictPresent: boolean;
  authoritativeSourcesUsed: readonly CaliforniaStatusAuthoritySource[];
  arcgisStatusConsulted: boolean;
  arcgisOverrodeCdss: false;
  arcgisCannotClearCdssConflict: true;
  activatedInApplicationOrDatabase: false;
  altersAuthoritativeGovernmentRecords: false;
  rationale: string;
};

const FACILITY_NUMBER = /^\d{8,9}$/;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function upper(value: unknown): string {
  return text(value).toUpperCase();
}

function isPendingIncrease(live: string): boolean {
  return /^licensed\s*\/\s*pending\s+increase$/i.test(live);
}

function isProvisional(live: string): boolean {
  return /^provisional\s+license$/i.test(live);
}

function isPendingIncomplete(live: string): boolean {
  return /pending\s+incomplete/i.test(live);
}

function isExactLicensed(live: string): boolean {
  return /^licensed$/i.test(live);
}

function isBlankDate(value: unknown): boolean {
  return text(value) === "";
}

const PROVISIONAL_SET = new Set<string>(CALIFORNIA_LISTING_EXCLUSION_PROVISIONAL);
const PENDING_SET = new Set<string>(CALIFORNIA_LISTING_EXCLUSION_PENDING_INCREASE);
const PRIOR_SET = new Set<string>(CALIFORNIA_LISTING_EXCLUSION_PRIOR);
const MISSING_SET = new Set<string>(CALIFORNIA_LISTING_EXCLUSION_MISSING_DATE);

export function californiaListingExclusionCategoryForId(
  facilityNumber: string,
): CaliforniaListingExclusionCategory | null {
  const id = text(facilityNumber);
  if (PROVISIONAL_SET.has(id)) return "provisional-license-conflict";
  if (PENDING_SET.has(id)) return "licensed-pending-increase-overlay";
  if (PRIOR_SET.has(id)) return "prior-status-conflict";
  if (MISSING_SET.has(id)) return "missing-license-evidence";
  return null;
}

export function californiaListingExclusionIds(): readonly string[] {
  return [
    ...CALIFORNIA_LISTING_EXCLUSION_PROVISIONAL,
    ...CALIFORNIA_LISTING_EXCLUSION_PENDING_INCREASE,
    ...CALIFORNIA_LISTING_EXCLUSION_PRIOR,
    ...CALIFORNIA_LISTING_EXCLUSION_MISSING_DATE,
  ];
}

/**
 * Core safeguard: CDSS Download/FacilityDetail decide conflict/exclusion.
 * Undocumented ArcGIS STATUS integers are recorded when present but never
 * upgrade eligibility, never clear a CDSS conflict, and never authorize
 * publication.
 */
export function evaluateCaliforniaStatusConflict(
  input: CaliforniaConflictEvaluationInput,
): CaliforniaConflictEvaluation {
  const facilityNumber = text(input.facilityNumber);
  const downloadStatus = text(input.downloadStatus) || null;
  const facilityDetailStatus = text(input.facilityDetailStatus) || null;
  const arcgisPresent =
    input.arcgisStatusInteger !== null
    && input.arcgisStatusInteger !== undefined
    && text(input.arcgisStatusInteger) !== "";

  const base = {
    facilityNumber,
    publicationApproved: false as const,
    ownerClaimEligible: false as const,
    arcgisStatusConsulted: arcgisPresent,
    arcgisOverrodeCdss: false as const,
    arcgisCannotClearCdssConflict: true as const,
    activatedInApplicationOrDatabase: false as const,
    altersAuthoritativeGovernmentRecords: false as const,
  };

  if (!FACILITY_NUMBER.test(facilityNumber)) {
    return {
      ...base,
      listingExclusionCategory: null,
      offlineListingExcluded: true,
      offlineCandidate: false,
      eligibility: "invalid-id-ineligible",
      cdssConflictPresent: false,
      authoritativeSourcesUsed: ["download-state-data", "facility-detail"],
      rationale:
        "Facility number is not an official 8–9 digit identifier. Fail-closed. ArcGIS STATUS cannot invent a valid ID.",
    };
  }

  if (
    input.liveFacilityNumber
    && text(input.liveFacilityNumber) !== facilityNumber
  ) {
    return {
      ...base,
      listingExclusionCategory: null,
      offlineListingExcluded: true,
      offlineCandidate: false,
      eligibility: "invalid-id-ineligible",
      cdssConflictPresent: true,
      authoritativeSourcesUsed: ["facility-detail"],
      rationale:
        "FacilityDetail FACILITYNUMBER does not exactly match the requested official ID (mismatched identifier). ArcGIS STATUS cannot override the mismatch.",
    };
  }

  if (
    input.duplicateFacilityNumberCount != null
    && input.duplicateFacilityNumberCount > 1
  ) {
    return {
      ...base,
      listingExclusionCategory: null,
      offlineListingExcluded: true,
      offlineCandidate: false,
      eligibility: "unknown-ineligible",
      cdssConflictPresent: true,
      authoritativeSourcesUsed: ["download-state-data"],
      rationale:
        "Duplicate official facility numbers in the roster are fail-closed until reconciled. ArcGIS STATUS cannot pick a winner.",
    };
  }

  if (
    input.timedOut === true
    || input.httpStatus === 0
    || (input.httpStatus != null && input.httpStatus !== 200)
    || input.found === false
  ) {
    return {
      ...base,
      listingExclusionCategory: californiaListingExclusionCategoryForId(facilityNumber),
      offlineListingExcluded: true,
      offlineCandidate: false,
      eligibility: "unknown-ineligible",
      cdssConflictPresent: true,
      authoritativeSourcesUsed: ["facility-detail"],
      rationale:
        "FacilityDetail transport inconclusive. Keep unknown-ineligible; do not invent status from ArcGIS.",
    };
  }

  const knownCategory = californiaListingExclusionCategoryForId(facilityNumber);
  const download = upper(downloadStatus);
  const live = text(facilityDetailStatus);
  const sources: CaliforniaStatusAuthoritySource[] = [];
  if (downloadStatus) sources.push("download-state-data");
  if (facilityDetailStatus) sources.push("facility-detail");
  if (arcgisPresent) {
    // Record consultation only — never as authority.
  }

  // Missing license evidence: Download LICENSED + empty License First Date.
  // Only when the download date field is explicitly supplied (string or null).
  // Omitted (undefined) means "not evaluated in this call," not "missing."
  if (
    download === "LICENSED"
    && input.downloadLicenseFirstDate !== undefined
    && isBlankDate(input.downloadLicenseFirstDate)
  ) {
    return {
      ...base,
      listingExclusionCategory: knownCategory ?? "missing-license-evidence",
      offlineListingExcluded: true,
      offlineCandidate: false,
      eligibility: "unknown-ineligible",
      cdssConflictPresent: true,
      authoritativeSourcesUsed: sources.length
        ? sources
        : ["download-state-data"],
      rationale:
        "Download LICENSED with empty License First Date. Fail-closed. A non-null FacilityDetail date or ArcGIS STATUS does not clear the download missing-date exclusion without a fresh roster pull / human adoption.",
    };
  }

  if (download === "LICENSED" && isProvisional(live)) {
    return {
      ...base,
      listingExclusionCategory: knownCategory ?? "provisional-license-conflict",
      offlineListingExcluded: true,
      offlineCandidate: false,
      eligibility: "unknown-ineligible",
      cdssConflictPresent: true,
      authoritativeSourcesUsed: ["download-state-data", "facility-detail"],
      rationale:
        "CDSS conflict: Download LICENSED vs FacilityDetail Provisional License. ArcGIS STATUS cannot clear this conflict.",
    };
  }

  if (download === "LICENSED" && isPendingIncrease(live)) {
    return {
      ...base,
      listingExclusionCategory:
        knownCategory ?? "licensed-pending-increase-overlay",
      offlineListingExcluded: true,
      offlineCandidate: false,
      eligibility: "unknown-ineligible",
      cdssConflictPresent: true,
      authoritativeSourcesUsed: ["download-state-data", "facility-detail"],
      rationale:
        "CDSS FacilityDetail Licensed/Pending Increase overlay without approved publication mapping. ArcGIS STATUS cannot authorize publication.",
    };
  }

  if (download === "LICENSED" && isPendingIncomplete(live)) {
    return {
      ...base,
      listingExclusionCategory: knownCategory ?? "prior-status-conflict",
      offlineListingExcluded: true,
      offlineCandidate: false,
      eligibility: "pending-ineligible",
      cdssConflictPresent: true,
      authoritativeSourcesUsed: ["download-state-data", "facility-detail"],
      rationale:
        "CDSS conflict: Download LICENSED vs FacilityDetail Pending Incomplete Application. ArcGIS STATUS cannot clear this conflict.",
    };
  }

  // Stale-record signal: download claims closed/pending while FacilityDetail is Licensed
  // (or the reverse substantive mismatch without approved coarsening).
  if (
    downloadStatus
    && facilityDetailStatus
    && download === "LICENSED"
    && !isExactLicensed(live)
    && !isPendingIncrease(live)
    && !isProvisional(live)
  ) {
    return {
      ...base,
      listingExclusionCategory: knownCategory,
      offlineListingExcluded: true,
      offlineCandidate: false,
      eligibility: "unknown-ineligible",
      cdssConflictPresent: true,
      authoritativeSourcesUsed: ["download-state-data", "facility-detail"],
      rationale:
        "Download LICENSED disagrees with FacilityDetail without an approved mapping. Treat as stale/unresolved CDSS conflict; ArcGIS STATUS cannot invent equivalence.",
    };
  }

  if (knownCategory) {
    return {
      ...base,
      listingExclusionCategory: knownCategory,
      offlineListingExcluded: true,
      offlineCandidate: false,
      eligibility: "unknown-ineligible",
      cdssConflictPresent: true,
      authoritativeSourcesUsed: sources.length
        ? sources
        : ["download-state-data", "facility-detail"],
      rationale:
        "Facility is on the offline listing-exclusion ledger. Exclusions remain inactive in app/DB; ArcGIS STATUS cannot reinstate.",
    };
  }

  // Otherwise-clear offline candidate — still not publication-approved.
  if (download === "LICENSED" && isExactLicensed(live)) {
    return {
      ...base,
      listingExclusionCategory: null,
      offlineListingExcluded: false,
      offlineCandidate: true,
      eligibility: "active-candidate-offline-only",
      cdssConflictPresent: false,
      authoritativeSourcesUsed: ["download-state-data", "facility-detail"],
      rationale:
        "CDSS Download and FacilityDetail agree on Licensed. Counts as offline Tier 1 candidate only. publicationApproved remains false while California publication is STOP. ArcGIS STATUS is ignored for eligibility.",
    };
  }

  if (download === "LICENSED" || download === "ON PROBATION") {
    return {
      ...base,
      listingExclusionCategory: null,
      offlineListingExcluded: false,
      offlineCandidate: true,
      eligibility: "active-candidate-offline-only",
      cdssConflictPresent: false,
      authoritativeSourcesUsed: sources.length ? sources : ["download-state-data"],
      rationale:
        "Download status is an allowed offline Tier 1 status. Offline candidate only; not publication-approved. Undocumented ArcGIS STATUS cannot upgrade to publication.",
    };
  }

  return {
    ...base,
    listingExclusionCategory: null,
    offlineListingExcluded: true,
    offlineCandidate: false,
    eligibility: "unknown-ineligible",
    cdssConflictPresent: true,
    authoritativeSourcesUsed: sources.length ? sources : ["download-state-data"],
    rationale:
      "Status not eligible for offline Tier 1. ArcGIS STATUS cannot override CDSS Download/FacilityDetail.",
  };
}

/**
 * Explicit ArcGIS override attempt. Always returns false for override success.
 */
export function tryClearCdssConflictWithArcGisStatus(input: {
  cdssConflictPresent: boolean;
  arcgisStatusInteger: number | string | null | undefined;
}): {
  arcgisStatusPresent: boolean;
  overrideSucceeded: false;
  reason: string;
} {
  const present =
    input.arcgisStatusInteger !== null
    && input.arcgisStatusInteger !== undefined
    && text(input.arcgisStatusInteger) !== "";
  return {
    arcgisStatusPresent: present,
    overrideSucceeded: false,
    reason: input.cdssConflictPresent
      ? "Undocumented ArcGIS STATUS integers cannot clear an authoritative CDSS conflict."
      : "ArcGIS STATUS is non-authoritative even when no CDSS conflict is present; it cannot authorize publication.",
  };
}

export const CALIFORNIA_EXCLUSION_STATUS_CONFLICT_COUNTS = {
  activeRestrictedCandidates: 15451,
  listingExclusionsOffline: 88,
  provisional: 5,
  pendingIncrease: 66,
  prior: 3,
  missingDate: 14,
  otherwiseClearOffline: 15363,
  tier1OfflineEligible: 15363,
  publicationEligible: 0,
  ownerClaimEligible: 0,
  cdssSupportedExclusionRules: 4,
  arcgisSupportedExclusionRules: 0,
  exclusionsActivated: false,
} as const;

export const CALIFORNIA_EXCLUSION_STATUS_CONFLICT_RESOLVED = [
  "listing-exclusions-classified-against-cdss-evidence",
  "arcgis-status-cannot-override-cdss-safeguard-encoded",
  "offline-vs-publication-approved-distinction-preserved",
] as const;

export const CALIFORNIA_EXCLUSION_STATUS_CONFLICT_REMAINING = [
  "california-publication-blocked",
  "state-authorization-unpublished",
  "exclusion-policy-inactive",
  "offline-listing-exclusions-not-activated",
  "pending-increase-mapping-not-approved-for-publication",
  "missing-date-requires-fresh-roster-or-human-adoption",
  "arcgis-rejected-as-tier1-roster",
  "arcgis-status-numeric-domain-undocumented",
  "tier2-licensing-coordinate-approval-separate",
  "publication-approval-required",
] as const;

export function buildCaliforniaExclusionStatusConflictPreview() {
  const ids = californiaListingExclusionIds();
  const unique = new Set(ids);
  const supportCounts = CALIFORNIA_LISTING_EXCLUSION_RULE_SUPPORT.reduce(
    (acc, row) => acc + row.count,
    0,
  );
  const allCdssBacked = CALIFORNIA_LISTING_EXCLUSION_RULE_SUPPORT.every(
    (row) =>
      row.supportedByAuthoritativeCdssEvidence
      && !row.reliesOnArcGisStatus
      && !row.mappingApprovedForPublication,
  );
  const c = CALIFORNIA_EXCLUSION_STATUS_CONFLICT_COUNTS;
  const arithmeticOk =
    c.listingExclusionsOffline
      === c.provisional + c.pendingIncrease + c.prior + c.missingDate
    && c.listingExclusionsOffline === supportCounts
    && unique.size === c.listingExclusionsOffline
    && ids.length === c.listingExclusionsOffline
    && c.activeRestrictedCandidates
      === c.listingExclusionsOffline + c.otherwiseClearOffline
    && c.tier1OfflineEligible === c.otherwiseClearOffline
    && c.publicationEligible === 0
    && c.ownerClaimEligible === 0
    && c.exclusionsActivated === false
    && c.arcgisSupportedExclusionRules === 0
    && allCdssBacked;

  return {
    observedOn: CALIFORNIA_EXCLUSION_STATUS_CONFLICT_OBSERVED_ON,
    baseline: CALIFORNIA_EXCLUSION_STATUS_CONFLICT_BASELINE,
    sources: CALIFORNIA_EXCLUSION_STATUS_CONFLICT_SOURCES,
    counts: c,
    ruleSupport: CALIFORNIA_LISTING_EXCLUSION_RULE_SUPPORT,
    arithmeticOk,
    allEightyEightCdssBacked: allCdssBacked,
    exclusionsActivated: false as const,
    allowsPublication: false as const,
    finalPublicVisibility: false as const,
    stopGoPublic: "STOP" as const,
    stopGoDevelopmentPreview: "GO" as const,
    stopGoArcGisRoster: "STOP" as const,
    resolvedFindings: CALIFORNIA_EXCLUSION_STATUS_CONFLICT_RESOLVED,
    remainingBlockers: CALIFORNIA_EXCLUSION_STATUS_CONFLICT_REMAINING,
    mostActionableNextStep:
      "Keep California unpublished. Decide whether to activate CDSS-backed listing exclusions offline and whether Licensed/Pending Increase receives a human-approved publication mapping — without letting ArcGIS STATUS drive either decision.",
    preservedRestrictions: [
      "washington-production-unchanged",
      "oregon-development-unchanged",
      "florida-ohio-publication-restrictions-unchanged",
      "authentication-billing-design2-unchanged",
      "offline-candidates-are-not-publication-approved",
    ] as const,
  };
}

export function californiaExclusionStatusConflictAllowsPublication(): false {
  return false;
}

export function californiaExclusionStatusConflictDirectoryReady(): false {
  return false;
}
