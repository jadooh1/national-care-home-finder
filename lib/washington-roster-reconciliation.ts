/**
 * Washington roster reconciliation evidence (development-only documentation module).
 *
 * Human decisions (2026-11-26):
 * - Retain 6,278 as the authoritative published roster.
 * - Exclude the unproven 8,177 figure from launch acceptance (document only;
 *   do not delete database records).
 * - Defer the optional live ArcGIS 6,296 refresh until independently validated.
 *
 * Does not write Supabase, refresh production, activate billing, or change
 * Design 2. Intentionally free of sibling runtime imports.
 */

export const WASHINGTON_ROSTER_RECONCILIATION_OBSERVED_ON = "2026-11-26" as const;

/** Authoritative published catalog (DSHS snapshot retained in-repo). */
export const WASHINGTON_AUTHORITATIVE_ROSTER = {
  baselinePath: "scripts/dshs/baselines/wa_afh_published_20261109.csv" as const,
  retrievedAt: "2026-11-09T05:54:02Z" as const,
  listedHomes: 6278 as const,
  uniqueLicenses: 6278 as const,
  duplicateLicenses: 0 as const,
  licenseStatus: "OP" as const,
  nonOpRows: 0 as const,
  licensedBedsSum: 36521 as const,
  contractConstant: 6278 as const,
  humanRetainedAsAuthoritative: true as const,
} as const;

/**
 * Reported 8,177 figure — documented discrepancy only.
 * Excluded from launch acceptance by human decision 2026-11-26.
 * Database records are not deleted because of this figure.
 */
export const WASHINGTON_REPORTED_EIGHT_ONE_SEVEN_SEVEN = {
  reportedTotal: 8177 as const,
  differenceVsAuthoritative: 1899 as const,
  provenanceFound: false as const,
  treatedAsDuplicates: false as const,
  excludedFromLaunchAcceptance: true as const,
  databaseRecordsDeleted: false as const,
  notes: [
    "8,177 does not appear in WASHINGTON_LISTED_COUNT, DSHS baseline CSV, production wa_dshs_listed_facilities, or development directory UI.",
    "8,177 − 6,278 = 1,899 arithmetically, but 1,899 is also the Georgia PCH+ALC FACID total — do not attribute that residual to Washington without evidence.",
    "Live DSHS ArcGIS AF + GDLArchiveDate IS NULL is 6,296 (2026-11-26), not 8,177.",
    "Human decision 2026-11-26: exclude 8,177 from launch acceptance; retain 6,278; do not delete database records.",
  ] as const,
} as const;

/** Live ArcGIS read-only probe (FacilityType=AF, GDLArchiveDate IS NULL). */
export const WASHINGTON_LIVE_ARCGIS_PROBE = {
  observedOn: WASHINGTON_ROSTER_RECONCILIATION_OBSERVED_ON,
  sourceUrl:
    "https://services2.arcgis.com/WW3T8U6q5EkZ9U3n/arcgis/rest/services/Long_Term_Care_Residential_Care_view/FeatureServer/1" as const,
  where: "FacilityType = 'AF' AND GDLArchiveDate IS NULL" as const,
  rows: 6296 as const,
  uniqueLicenses: 6296 as const,
  facilityStatusOp: 6296 as const,
  facilityStatusNonOp: 0 as const,
  onlyInLiveVsBaseline: 27 as const,
  onlyInBaselineVsLive: 9 as const,
  intersectionWithBaseline: 6269 as const,
  netDeltaVsBaseline: 18 as const,
  archivedAfWithNonNullGdlArchiveDate: 113936 as const,
  archivedNotPublicationEligible: true as const,
  /** Human decision 2026-11-26: defer until independently validated. */
  refreshDeferredUntilIndependentValidation: true as const,
  refreshApplied: false as const,
} as const;

export const WASHINGTON_SURFACE_COUNTS = {
  productionListedView: 6278 as const,
  productionMapView: 6278 as const,
  productionSyntheticFixture: 0 as const,
  developmentListedViewIncludingSynthetic: 6279 as const,
  developmentMapView: 6278 as const,
  developmentSyntheticInListedView: 1 as const,
  uiDirectoryContract: 6278 as const,
  directoryMapConsistentOnProduction: true as const,
} as const;

export const WASHINGTON_PUBLICATION_ELIGIBILITY = {
  stateAuthorization: "public" as const,
  tier3ListedHomes: 6278 as const,
  publicationEligibleHomes: 6278 as const,
  liveCheck: false as const,
  design2Preserved: true as const,
} as const;

export const WASHINGTON_HUMAN_DECISIONS_2026_11_26 = {
  retainAuthoritative6278: true as const,
  excludeUnproven8177FromLaunchAcceptance: true as const,
  documentDiscrepancyWithoutDeletingRecords: true as const,
  deferLive6296RefreshUntilIndependentValidation: true as const,
  authorizeControlledProductionS5S6WithTestAccounts: true as const,
  noProductionDeployOrConfigOrBilling: true as const,
} as const;

/**
 * Remaining agent blockers after the 2026-11-26 human roster decisions.
 * Production S5/S6 still needs NCHF_PROD_* (or equivalent) test-account secrets
 * bound to the agent — NCHF_DEV_* must not be used against production Auth.
 */
export const WASHINGTON_ROSTER_RECONCILIATION_BLOCKERS = [
  "production-authenticated-s5-s6-needs-nchf-prod-test-account-secrets",
] as const;

export type WashingtonRosterReconciliationVerdict = {
  stopGo: "CONDITIONAL";
  authoritativeListedHomes: 6278;
  reported8177ExcludedFromLaunchAcceptance: true;
  reported8177AccountedAsDuplicates: false;
  reported8177ProvenanceFound: false;
  databaseRecordsDeletedFor8177: false;
  live6296RefreshDeferred: true;
  productionDirectoryMapConsistent: true;
  requiresHumanApprovalForRosterRefresh: true;
  blockers: typeof WASHINGTON_ROSTER_RECONCILIATION_BLOCKERS;
};

export function washingtonRosterReconciliationVerdict(): WashingtonRosterReconciliationVerdict {
  return {
    stopGo: "CONDITIONAL",
    authoritativeListedHomes: 6278,
    reported8177ExcludedFromLaunchAcceptance: true,
    reported8177AccountedAsDuplicates: false,
    reported8177ProvenanceFound: false,
    databaseRecordsDeletedFor8177: false,
    live6296RefreshDeferred: true,
    productionDirectoryMapConsistent: true,
    requiresHumanApprovalForRosterRefresh: true,
    blockers: WASHINGTON_ROSTER_RECONCILIATION_BLOCKERS,
  };
}

export function washingtonAuthoritativeListedCount(): 6278 {
  return 6278;
}
