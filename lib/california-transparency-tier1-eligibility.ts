/**
 * California Transparency CSV (DownloadStateData) Tier 1 reassessment.
 * Intentionally free of sibling runtime imports.
 *
 * Uses the CDSS-confirmed filename/header as-of date on the official
 * Transparency pathway — not the rejected ArcGIS roster pathway.
 * Preserves unresolved identity/status/exclusion/publication restrictions.
 *
 * Development-only. Does not publish California, activate exclusions,
 * flip directoryContract, enable owner claims, or write Supabase.
 */

export const CALIFORNIA_TRANSPARENCY_TIER1_OBSERVED_ON = "2026-11-21";
export const CALIFORNIA_TRANSPARENCY_TIER1_BASE_COMMIT =
  "d10b287605c2a91116feea3c2aaa4c8b5981d755";

export const CALIFORNIA_TRANSPARENCY_TIER1_SOURCE = {
  pathway: "downloadstatedata-transparency-csv" as const,
  notArcGisRoster: true as const,
  evaluationScope: "full-dataset" as const,
  datasetLabel:
    "CDSS Transparency DownloadStateData RCFE + ARF CSVs (Phase 23 matrix denominator)",
  notExtrapolatedFromSample: true as const,
  disclosurePrefix:
    "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/",
  facilityDetailApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
  asOfConfirmation:
    "CDSS confirmed Transparency CSV Content-Disposition filename/header date is the dataset as-of date.",
} as const;

/**
 * Independently validated live dual-file as-of (2026-11-21).
 * Strict calendar + prefix + concordance checks live in
 * california-cdss-authoritative-date.ts.
 */
export const CALIFORNIA_TRANSPARENCY_TIER1_ASOF = {
  cdssFilenameHeaderIsAsOfConfirmed: true as const,
  rcfeContentDisposition:
    "attachment; filename=ResidentialElderCareFacility11152026.csv",
  arfContentDisposition:
    "attachment; filename=AdultResidentialFacilities11152026.csv",
  adoptedAsOfIso: "2026-11-15" as const,
  rcfeSha256:
    "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
  arfSha256:
    "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
  freshnessBlockerResolvedForTransparencyPathway: true as const,
  arcgisFreshnessStillRejected: true as const,
} as const;

/**
 * Offline Phase 23 accounting preserved. Listing exclusions remain inactive
 * in app/DB; publicationEligible stays 0.
 */
export const CALIFORNIA_TRANSPARENCY_TIER1_COUNTS = {
  activeRestrictedCandidates: 15451,
  listingExclusionsOffline: 88,
  otherwiseClearOffline: 15363,
  unresolvedCoordinatesMapOnly: 27,
  /** Framework Tier 1 offline candidates after freshness resolution. */
  tier1OfflineEligible: 15363,
  publicationEligible: 0,
  ownerClaimEligible: 0,
  asOfIso: "2026-11-15",
} as const;

export const CALIFORNIA_TRANSPARENCY_TIER1_RULES = {
  primaryIdentity: "Facility Number" as const,
  preserveLeadingZeros: true as const,
  refuseArcGisIntegerTruncationAsIdentity: true as const,
  allowedDownloadStatusesForOfflineTier1: ["LICENSED", "ON PROBATION"] as const,
  statusDomainKnownForDownloadStateData: true as const,
  coordinatesRequired: false as const,
  disclosureRequired: false as const,
  disclosurePrefixVerified: true as const,
  californiaPublicationBlocked: true as const,
  exclusionsRemainInactive: true as const,
  arcgisRejectedAsRoster: true as const,
} as const;

export const CALIFORNIA_TRANSPARENCY_TIER1_RESOLVED_BLOCKERS = [
  "transparency-csv-missing-authoritative-asof-date",
  "filename-header-mmddyyyy-rejected-without-cdss-confirmation",
] as const;

export const CALIFORNIA_TRANSPARENCY_TIER1_REMAINING_BLOCKERS = [
  "california-publication-blocked",
  "state-authorization-unpublished",
  "exclusion-policy-inactive",
  "offline-listing-exclusions-not-activated",
  "status-conflict-overlays-unresolved-for-launch",
  "arcgis-rejected-as-tier1-roster",
  "arcgis-status-numeric-domain-undocumented",
  "tier2-licensing-coordinate-approval-separate",
  "publication-approval-required",
] as const;

export const CALIFORNIA_TRANSPARENCY_TIER1_PRESERVED_RESTRICTIONS = [
  "leading-zero-facility-numbers-unaltered",
  "invalid-id-95354-excluded",
  "provisional-and-pending-increase-conflicts-unknown-ineligible",
  "owner-claims-disabled",
  "washington-production-unchanged",
  "oregon-development-unchanged",
  "florida-ohio-publication-restrictions-unchanged",
] as const;

export function buildCaliforniaTransparencyTier1EligibilityPreview() {
  const c = CALIFORNIA_TRANSPARENCY_TIER1_COUNTS;
  const asOf = CALIFORNIA_TRANSPARENCY_TIER1_ASOF;
  const arithmeticOk =
    c.activeRestrictedCandidates
      === c.listingExclusionsOffline + c.otherwiseClearOffline
    && c.tier1OfflineEligible === c.otherwiseClearOffline
    && c.publicationEligible === 0
    && c.ownerClaimEligible === 0
    && asOf.adoptedAsOfIso === c.asOfIso
    && asOf.freshnessBlockerResolvedForTransparencyPathway
    && asOf.cdssFilenameHeaderIsAsOfConfirmed;

  return {
    observedOn: CALIFORNIA_TRANSPARENCY_TIER1_OBSERVED_ON,
    baseCommit: CALIFORNIA_TRANSPARENCY_TIER1_BASE_COMMIT,
    source: CALIFORNIA_TRANSPARENCY_TIER1_SOURCE,
    rules: CALIFORNIA_TRANSPARENCY_TIER1_RULES,
    counts: c,
    asOf,
    resolvedBlockers: [...CALIFORNIA_TRANSPARENCY_TIER1_RESOLVED_BLOCKERS],
    remainingBlockers: [...CALIFORNIA_TRANSPARENCY_TIER1_REMAINING_BLOCKERS],
    preservedRestrictions: [...CALIFORNIA_TRANSPARENCY_TIER1_PRESERVED_RESTRICTIONS],
    arithmeticOk,
    developmentPreviewOnly: true as const,
    californiaDirectoryReady: false as const,
    allowsPublication: false as const,
    finalPublicVisibility: false as const,
    ownerClaimEligible: false as const,
    exclusionsActivated: false as const,
    stopGoPublic: "STOP" as const,
    stopGoDevelopmentPreview: "GO" as const,
    stopGoArcGisRoster: "STOP" as const,
    mostActionableNextStep:
      "Keep California unpublished. Optionally activate offline listing exclusions under separate approval, then seek explicit publication authorization. Do not use ArcGIS as the roster; retain Transparency CSV as-of 2026-11-15 under CDSS confirmation.",
  };
}

export function californiaTransparencyTier1AllowsPublication(): false {
  return false;
}

export function californiaTransparencyTier1DirectoryReady(): false {
  return false;
}
