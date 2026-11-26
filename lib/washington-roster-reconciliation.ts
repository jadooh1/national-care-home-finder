/**
 * Washington roster reconciliation evidence (development-only documentation module).
 *
 * Reconciles claimed totals against the authoritative published AFH roster without
 * inventing duplicates. Does not write Supabase, refresh production, activate
 * billing, or change Design 2. Intentionally free of sibling runtime imports.
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
} as const;

/**
 * Reported 8,177 figure from the launch-completion ask.
 * No repository, ArcGIS, production, or development evidence supports it.
 */
export const WASHINGTON_REPORTED_EIGHT_ONE_SEVEN_SEVEN = {
  reportedTotal: 8177 as const,
  differenceVsAuthoritative: 1899 as const,
  provenanceFound: false as const,
  treatedAsDuplicates: false as const,
  notes: [
    "8,177 does not appear in WASHINGTON_LISTED_COUNT, DSHS baseline CSV, production wa_dshs_listed_facilities, or development directory UI.",
    "8,177 − 6,278 = 1,899 arithmetically, but 1,899 is also the Georgia PCH+ALC FACID total — do not attribute that residual to Washington without evidence.",
    "Live DSHS ArcGIS AF + GDLArchiveDate IS NULL is 6,296 (2026-11-26), not 8,177.",
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

export const WASHINGTON_ROSTER_RECONCILIATION_BLOCKERS = [
  "reported-8177-total-has-no-authoritative-provenance",
  "live-arcgis-6296-diverges-from-published-6278-pending-approved-refresh",
  "production-authenticated-owner-admin-acceptance-still-needs-prod-credentials-or-waiver",
] as const;

export type WashingtonRosterReconciliationVerdict = {
  stopGo: "CONDITIONAL";
  authoritativeListedHomes: 6278;
  reported8177AccountedAsDuplicates: false;
  reported8177ProvenanceFound: false;
  productionDirectoryMapConsistent: true;
  requiresHumanApprovalForRosterRefresh: true;
  blockers: typeof WASHINGTON_ROSTER_RECONCILIATION_BLOCKERS;
};

export function washingtonRosterReconciliationVerdict(): WashingtonRosterReconciliationVerdict {
  return {
    stopGo: "CONDITIONAL",
    authoritativeListedHomes: 6278,
    reported8177AccountedAsDuplicates: false,
    reported8177ProvenanceFound: false,
    productionDirectoryMapConsistent: true,
    requiresHumanApprovalForRosterRefresh: true,
    blockers: WASHINGTON_ROSTER_RECONCILIATION_BLOCKERS,
  };
}

export function washingtonAuthoritativeListedCount(): 6278 {
  return 6278;
}
