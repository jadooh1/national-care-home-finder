/**
 * Ohio development-only Tier 1 listing eligibility preview.
 * Intentionally free of sibling runtime imports.
 *
 * Uses FACID as the stable primary identity. Coordinates and disclosure links
 * are optional for framework Tier 1. Does not publish Ohio, flip
 * directoryContract, enable owner claims, or write Supabase.
 *
 * Dataset scope: ODH EID Facility Listing CSV, provider type Residential Care
 * or Assisted Living (L12), observed 2026-11-20 — not extrapolated from a sample.
 * Targeted re-probe 2026-11-21 confirmed disclosure remains session-bound and
 * no ISO export stamp appeared.
 */

export const OHIO_TIER1_OBSERVED_ON = "2026-11-21";
export const OHIO_TIER1_BASE_COMMIT =
  "4869fbf3e66e76c1a15a776ca4b048073d8ce8f1";

export const OHIO_TIER1_SOURCE = {
  listingCriteriaUrl:
    "https://publicapps.odh.ohio.gov/EID/reports/EID_Report_Criteria.aspx",
  providerSearchUrl: "https://publicapps.odh.ohio.gov/EID/Provider_Search.aspx",
  detailStateLicenseUrl:
    "https://publicapps.odh.ohio.gov/EID/Detail_StateLicense.aspx",
  facilityType: "Residential Care or Assisted Living (FACTYPE L12)",
  evaluationScope: "full-dataset" as const,
  datasetLabel: "ODH EID Facility Listing CSV (Residential Care / Assisted Living)",
  notExtrapolatedFromSample: true as const,
  captureSha256:
    "34e2c6a45b5470a94b22ad8c52f71931175753291f52b022517d7dea4c823ba9",
} as const;

/** Explicit Tier 1 publication rules for Ohio RCF preview. */
export const OHIO_TIER1_RULES = {
  primaryIdentity: "FACID" as const,
  stateIdIsNotPrimaryKey: true as const,
  allowedStatuses: ["ACTIVE"] as const,
  unsupportedStatusesExcluded: [
    "ACTIVE - PENDING RENEWAL",
    "PENDING",
    "CLOSED-OWNER",
    "CLOSED-OTHER",
    "CLOSED-STATE",
  ] as const,
  excludeFactypeL17Residue: true as const,
  requirePhysicalAddress: true as const,
  coordinatesRequired: false as const,
  disclosureLinkRequired: false as const,
  disclosurePrefixVerified: false as const,
  categoryEquivalenceToWashingtonAfh: false as const,
} as const;

/**
 * Full-roster counts from the 2026-11-20 ODH Facility Listing capture.
 * tier1OfflineEligible = ACTIVE L12 only.
 */
export const OHIO_TIER1_COUNTS = {
  denominatorRowsL12: 1152,
  uniqueFacidL12: 1152,
  uniqueStateidL12: 1149,
  active: 801,
  activePendingRenewal: 16,
  pending: 26,
  closedOwner: 220,
  closedOther: 58,
  closedState: 31,
  l17ClosedResidueExcluded: 5,
  blankAddressL12: 0,
  /** Offline Tier 1 candidates under OHIO_TIER1_RULES (ACTIVE only). */
  tier1OfflineEligible: 801,
  /** Public launch still blocked (freshness + authorization + status freeze). */
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const OHIO_TIER1_EXCLUSIONS = [
  {
    kind: "status-not-active",
    count: 351,
    note:
      "ACTIVE - PENDING RENEWAL (16), PENDING (26), and CLOSED-* (309) are unsupported for Tier 1 listing until a separate human-approved status rule expands the include set.",
  },
  {
    kind: "factype-l17-residue",
    count: 5,
    note:
      "CLOSED CIN-R / FACTYPE L17 rows in the same extract are retained as source values but excluded from RCF Tier 1 inventory.",
  },
] as const;

export const OHIO_TIER1_TARGETED_VERIFICATION = {
  observedOn: OHIO_TIER1_OBSERVED_ON,
  probes: [
    {
      id: "detail-facid-querystring",
      result: "error.aspx",
      acceptedAsDisclosurePrefix: false,
      note: "Detail_StateLicense.aspx?FACID={FACID} still redirects to error without a search session (re-probed 2026-11-21).",
    },
    {
      id: "detail-stateid-querystring",
      result: "error.aspx",
      acceptedAsDisclosurePrefix: false,
      note: "Detail_StateLicense.aspx?StateID={STATEID} still fails closed outside session.",
    },
    {
      id: "iso-export-stamp",
      result: "absent",
      acceptedAsOfficialExport: false,
      note: "No source-issued ISO on Facility Listing; PDF/HTTP clocks, ArcGIS dataLastEditDate, and program-page ~720 remain rejected.",
    },
  ],
} as const;

export const OHIO_TIER1_FRESHNESS = {
  recordedExportDate: null,
  httpLastModifiedRejectedAsExport: true,
  pdfFilenameTimestampRejectedAsExport: true,
  arcgisDataLastEditRejectedAsExport: true,
  programPageApproxCountRejected: true,
  freshnessPolicyDocumented: false,
  freshnessIndependentEvidence: false,
  blocksPublicTier1: true,
  note:
    "No authoritative ISO export/version stamp for the ODH Facility Listing extract. Development preview may enumerate offline ACTIVE Tier 1 candidates, but public Tier 1 / finalPublicVisibility stay blocked until freshness is resolved and publication is separately approved.",
} as const;

export const OHIO_TIER1_REMAINING_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "status-publication-rule-needs-freeze",
  "disclosure-prefix-unverified-session-bound",
  "state-authorization-unpublished",
  "ohio-directory-not-ready",
  "publication-approval-required",
] as const;

export const OHIO_TIER1_RESOLVED_FOR_PREVIEW = [
  "facid-primary-identity-unique",
  "active-only-status-rule",
  "pending-and-closed-excluded",
  "l17-residue-excluded",
  "physical-address-complete-on-l12",
  "coordinates-not-required-for-tier1",
  "disclosure-not-required-for-tier1",
  "rcf-not-washington-afh",
] as const;

export function buildOhioTier1EligibilityPreview() {
  const c = OHIO_TIER1_COUNTS;
  const arithmeticOk =
    c.active === c.tier1OfflineEligible
    && c.active
      + c.activePendingRenewal
      + c.pending
      + c.closedOwner
      + c.closedOther
      + c.closedState
      === c.denominatorRowsL12
    && c.publicationEligible === 0
    && c.ownerClaimEligible === 0
    && c.blankAddressL12 === 0;
  return {
    observedOn: OHIO_TIER1_OBSERVED_ON,
    baseCommit: OHIO_TIER1_BASE_COMMIT,
    source: OHIO_TIER1_SOURCE,
    rules: OHIO_TIER1_RULES,
    counts: c,
    exclusions: OHIO_TIER1_EXCLUSIONS,
    targetedVerification: OHIO_TIER1_TARGETED_VERIFICATION,
    freshness: OHIO_TIER1_FRESHNESS,
    resolvedForPreview: [...OHIO_TIER1_RESOLVED_FOR_PREVIEW],
    remainingBlockers: [...OHIO_TIER1_REMAINING_BLOCKERS],
    arithmeticOk,
    developmentPreviewOnly: true as const,
    ohioDirectoryReady: false as const,
    allowsPublication: false as const,
    finalPublicVisibility: false as const,
    ownerClaimEligible: false as const,
    floridaParallelTrackUnchanged: true as const,
    oregonUnchanged: true as const,
    stopGoPublic: "STOP" as const,
    stopGoDevelopmentPreview: "GO" as const,
    mostActionableNextStep:
      "Obtain an ODH authoritative ISO export/version stamp for the Facility Listing Residential Care extract, freeze ACTIVE-only (or approved expanded) status rules in writing, optionally confirm a stable FACID/STATEID disclosure URL outside session search, then seek separate human approval before any directoryContract publication change.",
  };
}

export function ohioTier1AllowsPublication(): false {
  return false;
}

export function ohioTier1DirectoryReady(): false {
  return false;
}
