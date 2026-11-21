/**
 * California authoritative data verification (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Follow-on to ArcGIS Tier 1 STOP (#197). Investigates three remaining
 * ArcGIS/roster questions without publishing California, altering original
 * license identifiers, activating exclusions, or sending agency email.
 *
 * Observed 2026-11-21. Reuses Phase 5/22–26 and #197 evidence; does not
 * repeat Florida/Ohio investigations.
 */

export const CALIFORNIA_AUTH_VERIFY_OBSERVED_ON = "2026-11-21";
export const CALIFORNIA_AUTH_VERIFY_BASE_COMMIT =
  "8f3945ef954a7f208d43bc2c5baf7c208c8851db";

export const CALIFORNIA_AUTH_VERIFY_SOURCES = {
  arcgisFeatureServer:
    "https://services.arcgis.com/XLPEppdz2H9dOiqp/arcgis/rest/services/CDSS_CCL_Facilities/FeatureServer/0",
  arcgisHubItem:
    "https://gis.data.chhs.ca.gov/datasets/CDSS::community-care-licensing-facilities",
  pin2401Ccld:
    "https://cdss.ca.gov/inforesources/community-care-licensing/policy/provider-information-notices/adult-senior-care",
  pin2401Summary:
    "PIN 24-01-CCLD documents Transparency Site display statuses Licensed, Pending, Closed, or On Probation (text labels). It does not publish ArcGIS integer STATUS codes.",
  transparencyFaq:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FAQ?mode=Public&id=context",
  facilityDetailApiPrefix:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
  chhsPackage: "https://data.chhs.ca.gov/dataset/ccl-facilities",
  publishCatalog:
    "https://publish.data.ca.gov/dataset/community-care-licensing-facilities1",
} as const;

/** 1) ArcGIS numeric STATUS — official documentation hunt. */
export const CALIFORNIA_AUTH_VERIFY_STATUS = {
  layerFieldType: "esriFieldTypeInteger",
  layerDomain: null,
  codedValueDomainPresent: false,
  pin2401DocumentsTextStatusesOnly: true,
  faqDocumentsTextStatusesOnly: true,
  officialNumericDomainFound: false,
  statusCodesAccepted: false as const,
  observedInScopeCodes: [3, 4, 5, 6] as const,
  /**
   * Stratified RCFE-like FacilityDetail sample (2 IDs per STATUS 3/4/5/6).
   * Correlation only — not an accepted domain. All eight sampled facilities
   * returned official STATUS "Licensed", so GIS integers 3–6 are not a
   * 1:1 map to Licensed/Pending/Closed/On Probation.
   */
  stratifiedFacilityDetailSample: [
    { gisStatus: 3, facilityNumber: "197609827", officialStatus: "Licensed" },
    { gisStatus: 3, facilityNumber: "502701895", officialStatus: "Licensed" },
    { gisStatus: 4, facilityNumber: "342700795", officialStatus: "Licensed" },
    { gisStatus: 4, facilityNumber: "198603586", officialStatus: "Licensed" },
    { gisStatus: 5, facilityNumber: "347005512", officialStatus: "Licensed" },
    { gisStatus: 5, facilityNumber: "306002535", officialStatus: "Licensed" },
    { gisStatus: 6, facilityNumber: "198601898", officialStatus: "Licensed" },
    { gisStatus: 6, facilityNumber: "392700368", officialStatus: "Licensed" },
  ] as const,
  sampleShowsOneToOneLicensedMapping: false,
  note:
    "No official CDSS/CCLD data dictionary, PIN, FAQ, or ArcGIS coded-value domain documents numeric STATUS meanings. Observed sample correlations are insufficient and contradictory for acceptance (codes 3–6 all returned Licensed).",
} as const;

/** 2) Leading-zero license-ID discrepancies — originals unaltered. */
export const CALIFORNIA_AUTH_VERIFY_LEADING_ZEROS = {
  representationMismatches: 1240,
  /** Every mismatch is a 9-digit historical ID with exactly one leading zero. */
  allNineDigit: true,
  allSingleLeadingZero: true,
  /** Collapsed GIS integer form is always 8 digits for this set. */
  collapsedGisFormAlwaysEightDigits: true,
  historicalLeadingZeroUniverse: {
    totalEligibleWithLeadingZero: 1810,
    /** ArcGIS integer storage never preserves the leading zero as an exact string. */
    exactGisMatchPreservingZeros: 0,
    representationMismatchOnly: 1240,
    missingEvenIfCollapsed: 570,
  },
  historicalStatusBreakdown: {
    LICENSED: 1147,
    PENDING: 89,
    "ON PROBATION": 4,
  } as const,
  samplePairs: [
    { historicalExact: "011400061", gisIntegerForm: "11400061" },
    { historicalExact: "015601302", gisIntegerForm: "15601302" },
    { historicalExact: "019201167", gisIntegerForm: "19201167" },
  ] as const,
  facilityDetailCanonicalization: {
    truncatedRequest: "15601302",
    canonicalFacilityNumber: "015601302",
    officialStatus: "Licensed",
    note: "FacilityDetail returns the canonical leading-zero FACILITYNUMBER; do not store the truncated request.",
  },
  policy: {
    originalsUnaltered: true as const,
    refuseStoreTruncatedGisIntegerAsLicense: true as const,
    collapseZerosDoesNotCountAsMatch: true as const,
    preferHistoricalOrFacilityDetailCanonicalString: true as const,
  },
  note:
    "The 1,240 discrepancies are representation mismatches caused by ArcGIS FAC_NBR integer typing, not duplicate facilities. Identifiers stay exact-string; collapsing zeros is refused as a match.",
} as const;

/** 3) Authoritative roster export date / version — still absent. */
export const CALIFORNIA_AUTH_VERIFY_FRESHNESS = {
  authoritativeIsoExportDate: null,
  authoritativeDatasetVersion: null,
  rejectedClockProxies: [
    {
      clock: "arcgis-dataLastEditDate",
      observed: "2026-11-20T16:08:37.663Z",
      acceptedAsExport: false,
    },
    {
      clock: "publish.data.ca.gov-dcat_modified",
      observed: "2026-06-23T17:21:51.001Z",
      acceptedAsExport: false,
    },
    {
      clock: "chhs-temporal_coverage",
      observed: "Data as of 05252025",
      acceptedAsExport: false,
    },
    {
      clock: "chhs-file_date-text",
      observed: "05252025",
      acceptedAsExport: false,
    },
    {
      clock: "transparency-faq-weekly-cadence",
      observed: "The data is updated weekly.",
      acceptedAsExport: false,
    },
    {
      clock: "downloadstatedata-filename-mmddyyyy",
      observed: "ResidentialElderCareFacility11152026.csv (Phase 22–26 baseline)",
      acceptedAsExport: false,
    },
  ] as const,
  cdssClarification: {
    status: "sent-awaiting-response" as const,
    mailboxReadableHere: false,
    duplicateInquirySent: false,
    note: "Prior inquiry remains unanswered. No new agency email sent this phase.",
  },
  blocksTier1: true as const,
  note:
    "No source-issued ISO as-of date or authoritative dataset version stamp was found for ArcGIS FeatureServer/0, CHHS CSVs, or DownloadStateData. Prior Phase 22–26 freshness STOP is reconfirmed.",
} as const;

export const CALIFORNIA_AUTH_VERIFY_LAYER_PROVENANCE = {
  layerName: "Master_CCL_County_Intersect_2023",
  hubSnippet:
    "This view layer created based on Master_CCL_County_Intersect AGOL. The View excludes all Children's Residential Program, and Child Care Program: Family Child Care Homes (FCCHs).",
  treatedAsLicensingRoster: false,
  treatedAsGeoreferencedView: true,
  note:
    "Hub item describes a filtered view of a county-intersect layer, not a licensing export with a documented status domain or ISO stamp.",
} as const;

export const CALIFORNIA_AUTH_VERIFY_REMAINING_BLOCKERS = [
  "arcgis-status-numeric-domain-undocumented",
  "arcgis-fac-nbr-integer-truncates-leading-zeros",
  "no-authoritative-iso-export-or-version",
  "cdss-clarification-sent-awaiting-response",
  "california-publication-blocked",
  "exclusion-policy-inactive",
  "tier2-licensing-coordinate-approval-separate",
  "publication-approval-required",
] as const;

export const CALIFORNIA_AUTH_VERIFY_APPROVALS_REQUIRED = [
  {
    id: "accept-arcgis-status-domain",
    needed: "Official CDSS coded-value domain (or equivalent) for ArcGIS STATUS integers",
    agentMayInfer: false,
  },
  {
    id: "mailbox-check-or-followup-send",
    needed: "Human mailbox check for prior CDSS ISO/version reply; optional follow-up send",
    agentMayInfer: false,
  },
  {
    id: "adopt-iso-or-version-channel",
    needed: "Adopt a source-issued ISO as-of / version stamp for the chosen roster",
    agentMayInfer: false,
  },
  {
    id: "exclusion-activation",
    needed: "Separate approval to activate offline exclusion policy in app/DB",
    agentMayInfer: false,
  },
  {
    id: "publication-gate-open",
    needed: "Separate approval before any California public authorization change",
    agentMayInfer: false,
  },
] as const;

export const CALIFORNIA_AUTH_VERIFY_RESOLVED_THIS_PASS = [
  "reconfirmed-arcgis-status-domain-null",
  "pin-24-01-and-faq-are-text-status-only",
  "stratified-sample-rejects-one-to-one-gis-status-map",
  "leading-zero-set-fully-characterized-without-altering-ids",
  "zero-exact-gis-matches-among-leading-zero-historical-ids",
  "freshness-iso-still-absent-clock-proxies-rejected",
  "no-agency-email-sent",
  "california-remains-stop-unpublished",
] as const;

export function buildCaliforniaAuthoritativeDataVerification() {
  const statusSampleAllLicensed =
    CALIFORNIA_AUTH_VERIFY_STATUS.stratifiedFacilityDetailSample.every(
      (row) => row.officialStatus === "Licensed",
    );
  const leadingZeroArithmeticOk =
    CALIFORNIA_AUTH_VERIFY_LEADING_ZEROS.historicalLeadingZeroUniverse
      .exactGisMatchPreservingZeros
      + CALIFORNIA_AUTH_VERIFY_LEADING_ZEROS.historicalLeadingZeroUniverse
        .representationMismatchOnly
      + CALIFORNIA_AUTH_VERIFY_LEADING_ZEROS.historicalLeadingZeroUniverse
        .missingEvenIfCollapsed
      === CALIFORNIA_AUTH_VERIFY_LEADING_ZEROS.historicalLeadingZeroUniverse
        .totalEligibleWithLeadingZero
    && CALIFORNIA_AUTH_VERIFY_LEADING_ZEROS.representationMismatches
      === CALIFORNIA_AUTH_VERIFY_LEADING_ZEROS.historicalLeadingZeroUniverse
        .representationMismatchOnly
    && CALIFORNIA_AUTH_VERIFY_LEADING_ZEROS.historicalStatusBreakdown.LICENSED
      + CALIFORNIA_AUTH_VERIFY_LEADING_ZEROS.historicalStatusBreakdown.PENDING
      + CALIFORNIA_AUTH_VERIFY_LEADING_ZEROS.historicalStatusBreakdown[
        "ON PROBATION"
      ]
      === CALIFORNIA_AUTH_VERIFY_LEADING_ZEROS.representationMismatches;

  return {
    observedOn: CALIFORNIA_AUTH_VERIFY_OBSERVED_ON,
    baseCommit: CALIFORNIA_AUTH_VERIFY_BASE_COMMIT,
    sources: CALIFORNIA_AUTH_VERIFY_SOURCES,
    status: CALIFORNIA_AUTH_VERIFY_STATUS,
    leadingZeros: CALIFORNIA_AUTH_VERIFY_LEADING_ZEROS,
    freshness: CALIFORNIA_AUTH_VERIFY_FRESHNESS,
    layerProvenance: CALIFORNIA_AUTH_VERIFY_LAYER_PROVENANCE,
    resolvedThisPass: [...CALIFORNIA_AUTH_VERIFY_RESOLVED_THIS_PASS],
    remainingBlockers: [...CALIFORNIA_AUTH_VERIFY_REMAINING_BLOCKERS],
    approvalsRequired: [...CALIFORNIA_AUTH_VERIFY_APPROVALS_REQUIRED],
    statusSampleAllLicensed,
    leadingZeroArithmeticOk,
    developmentOnly: true as const,
    californiaDirectoryReady: false as const,
    allowsPublication: false as const,
    finalPublicVisibility: false as const,
    ownerClaimEligible: false as const,
    exclusionsActivated: false as const,
    washingtonProductionUnchanged: true as const,
    oregonDevelopmentUnchanged: true as const,
    floridaOhioRestrictionsUnchanged: true as const,
    agencyEmailSent: false as const,
    stopGo: "STOP" as const,
    mostActionableNextStep:
      "Human mailbox check for the prior CDSS ISO/version clarification. Do not accept ArcGIS STATUS integers or truncated FAC_NBR forms. Keep California unpublished until an authoritative export/version channel exists and separate publication approval is granted.",
  };
}

export function californiaAuthoritativeDataAllowsPublication(): false {
  return false;
}

export function californiaAuthoritativeDataDirectoryReady(): false {
  return false;
}
