/**
 * Florida development-only Tier 1 listing eligibility preview.
 * Intentionally free of sibling runtime imports.
 *
 * Uses LicenseID as the stable primary identity. Coordinates and inspection
 * links are optional for Tier 1. Does not publish Florida, flip
 * directoryContract, enable owner claims, or write Supabase.
 *
 * Dataset scope: full FloridaHealthFinder ALF comparison embed (ClientCode 11),
 * observed 2026-11-21 — not extrapolated from a sample.
 */

export const FLORIDA_TIER1_OBSERVED_ON = "2026-11-21";
export const FLORIDA_TIER1_BASE_COMMIT =
  "4d382d3c978c536035fd99a6ee6bc9d0a62a4666";

export const FLORIDA_TIER1_SOURCE = {
  rosterUrl: "https://quality.healthfinder.fl.gov/Facility-Provider/ALF?LS=1&type=1",
  profilePrefix:
    "https://quality.healthfinder.fl.gov/Facility-Provider/Profile/?LID=",
  inspectionPrefix:
    "https://apps.ahca.myflorida.com/dm_web/facility_inspection_details.aspx?client_code=11&file_number=",
  clientCode: "11",
  facilityType: "Assisted Living Facility",
  evaluationScope: "full-dataset" as const,
  datasetLabel: "FloridaHealthFinder ALF comparison embed (ClientCode 11)",
  notExtrapolatedFromSample: true as const,
} as const;

/** Explicit Tier 1 publication rules for Florida ALF preview. */
export const FLORIDA_TIER1_RULES = {
  primaryIdentity: "LicenseID" as const,
  licenseNumberIsNotPrimaryKey: true as const,
  allowedStatuses: ["LICENSED"] as const,
  unsupportedStatusesExcluded: [
    "IN REVIEW",
    "PROVISIONAL",
    "IN LITIGATION",
    "PROV LITIGATION",
    "INACTIVE",
    "PENDING DENIED RENEWAL",
    "SUSPENDED",
  ] as const,
  excludeDuplicateLicenseNumber: "7622" as const,
  requirePhysicalStreetAndCity: true as const,
  requireNonBlankState: true as const,
  coordinatesRequired: false as const,
  inspectionLinkRequired: false as const,
  disclosurePrefixVerified: true as const,
  afchIncluded: false as const,
  categoryEquivalenceToWashingtonAfh: false as const,
} as const;

/**
 * Full-roster counts from the 2026-11-21 ALF embed capture.
 * tier1OfflineEligible = LICENSED − duplicate LicenseNumber 7622 LICENSED row
 * − blank-state LICENSED row.
 */
export const FLORIDA_TIER1_COUNTS = {
  denominatorRows: 3025,
  uniqueLicenseId: 3025,
  uniqueFileNumber: 3025,
  uniqueLicenseNumber: 3024,
  licensed: 2253,
  inReview: 645,
  provisional: 86,
  inLitigation: 33,
  provLitigation: 4,
  inactive: 2,
  pendingDeniedRenewal: 1,
  suspended: 1,
  duplicateLicenseNumberRows: 2,
  duplicateLicenseNumberLicensedRowsExcluded: 1,
  blankStateLicensedRowsExcluded: 1,
  /** Offline Tier 1 candidates under FLORIDA_TIER1_RULES (full-dataset). */
  tier1OfflineEligible: 2251,
  /** Public launch still blocked (freshness + authorization). */
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const FLORIDA_TIER1_EXCLUSIONS = [
  {
    reason: "duplicate-license-number",
    licenseNumber: "7622",
    rows: [
      {
        name: "ELEVATED ESTATES OF BROOKSVILLE, LLC",
        licenseId: "979",
        fileNumber: "11910431",
        licenseStatus: "LICENSED",
        city: "BROOKSVILLE",
      },
      {
        name: "KIVA AT CANTERBURY",
        licenseId: "1005",
        fileNumber: "11910496",
        licenseStatus: "PROVISIONAL",
        city: "BONITA SPRINGS",
      },
    ],
    note:
      "LicenseNumber 7622 is shared by two distinct LicenseID/FileNumber facilities. Both are excluded from Tier 1 until AHCA clarifies. LicenseID remains unique and is the primary key for survivors.",
  },
  {
    reason: "status-not-licensed",
    statuses: FLORIDA_TIER1_RULES.unsupportedStatusesExcluded,
    rowsExcluded: 772,
    note:
      "IN REVIEW (645) and all non-LICENSED statuses are unsupported for Tier 1 listing. IsClosed=False is ignored as a publication signal.",
  },
  {
    reason: "blank-state",
    rows: [
      {
        name: "HARMONIOUS HOMES RESIDENTIAL ASSISTED LIVING FACILITY LLC",
        licenseId: "524833",
        licenseNumber: "13809",
        licenseStatus: "LICENSED",
        city: "SUNRISE",
        state: "",
        address: "4838 NW 93RD TER",
      },
    ],
    note: "LICENSED row with blank State is excluded as an unusable physical address.",
  },
] as const;

export const FLORIDA_TIER1_FRESHNESS = {
  recordedExportDate: null,
  httpLastModified: null,
  pageDateHeaderRejectedAsExport: true,
  nightlyUpdateClaimRejectedAsExport: true,
  miamiDadeSampleRejectedAsStatewideExport: true,
  dohGis2013Rejected: true,
  freshnessPolicyDocumented: false,
  freshnessIndependentEvidence: false,
  blocksPublicTier1: true,
  note:
    "No authoritative ISO export/version stamp was observed on the ALF embed. Clock proxies remain rejected. Development preview may enumerate offline Tier 1 candidates, but public Tier 1 / finalPublicVisibility stay blocked until freshness is resolved and publication is separately approved.",
} as const;

export const FLORIDA_TIER1_REMAINING_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "freshness-policy-undocumented",
  "state-authorization-unpublished",
  "florida-directory-not-ready",
  "publication-approval-required",
] as const;

export const FLORIDA_TIER1_RESOLVED_FOR_PREVIEW = [
  "licenseid-primary-identity-unique",
  "licensed-only-status-rule",
  "in-review-excluded",
  "duplicate-license-number-7622-excluded",
  "blank-state-row-excluded",
  "profile-lid-disclosure-verified",
  "coordinates-not-required-for-tier1",
  "inspection-link-not-required-for-tier1",
  "afch-not-merged-into-alf",
] as const;

export function buildFloridaTier1EligibilityPreview() {
  const c = FLORIDA_TIER1_COUNTS;
  const arithmeticOk =
    c.licensed
      - c.duplicateLicenseNumberLicensedRowsExcluded
      - c.blankStateLicensedRowsExcluded
      === c.tier1OfflineEligible
    && c.inReview
      + c.provisional
      + c.inLitigation
      + c.provLitigation
      + c.inactive
      + c.pendingDeniedRenewal
      + c.suspended
      === 772
    && c.licensed + 772 === c.denominatorRows
    && c.publicationEligible === 0
    && c.ownerClaimEligible === 0;
  return {
    observedOn: FLORIDA_TIER1_OBSERVED_ON,
    baseCommit: FLORIDA_TIER1_BASE_COMMIT,
    source: FLORIDA_TIER1_SOURCE,
    rules: FLORIDA_TIER1_RULES,
    counts: c,
    exclusions: FLORIDA_TIER1_EXCLUSIONS,
    freshness: FLORIDA_TIER1_FRESHNESS,
    resolvedForPreview: [...FLORIDA_TIER1_RESOLVED_FOR_PREVIEW],
    remainingBlockers: [...FLORIDA_TIER1_REMAINING_BLOCKERS],
    arithmeticOk,
    developmentPreviewOnly: true as const,
    floridaDirectoryReady: false as const,
    allowsPublication: false as const,
    finalPublicVisibility: false as const,
    ownerClaimEligible: false as const,
    oregonUnchanged: true as const,
    stopGoPublic: "STOP" as const,
    stopGoDevelopmentPreview: "GO" as const,
    mostActionableNextStep:
      "Obtain an AHCA authoritative ISO export/version stamp for the statewide ALF roster matching the FloridaHealthFinder embed, then seek separate human approval before any directoryContract publication change.",
  };
}

export function floridaTier1AllowsPublication(): false {
  return false;
}

export function floridaTier1DirectoryReady(): false {
  return false;
}
