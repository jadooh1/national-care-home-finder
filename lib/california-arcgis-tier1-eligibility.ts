/**
 * California CDSS ArcGIS Tier 1 directory-readiness assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Compares the official CDSS ArcGIS CCL point layer against historical CHHS
 * RCFE/ARF licensing CSVs. Does not publish California, flip directoryContract,
 * activate exclusions, enable owner claims, or write Supabase.
 *
 * Verdict: ArcGIS alone is not a Tier 1 directory source. Undocumented STATUS,
 * incomplete exact-ID coverage, integer FAC_NBR truncation, and missing ISO
 * freshness keep public and development-preview Tier 1 STOP.
 *
 * Live observation: 2026-11-21 (full ArcGIS pagination + CHHS CSV download).
 * Not extrapolated from a sample. Tier 2 map is out of scope here.
 */

export const CALIFORNIA_ARCGIS_TIER1_OBSERVED_ON = "2026-11-21";
export const CALIFORNIA_ARCGIS_TIER1_BASE_COMMIT =
  "757dd04cd11e63c61c6bf4c67e58f11bd4b1a09d";

export const CALIFORNIA_ARCGIS_TIER1_SOURCE = {
  geospatialCatalog:
    "https://publish.data.ca.gov/dataset/community-care-licensing-facilities1",
  arcgisFeatureServer:
    "https://services.arcgis.com/XLPEppdz2H9dOiqp/arcgis/rest/services/CDSS_CCL_Facilities/FeatureServer/0",
  layerName: "Master_CCL_County_Intersect_2023",
  chhsPackageUrl: "https://data.chhs.ca.gov/dataset/ccl-facilities",
  chhsPackageId: "46ffcbdf-4874-4cc1-92c2-fb715e3ad014",
  chhsRcfeResourceId: "744d1583-f9eb-45b6-b0f8-b9a9dab936a6",
  chhsArfResourceId: "9f5d1d00-6b24-4f44-a158-9cbe4b43f117",
  /**
   * CHHS resource IDs are stable; download filenames rotate (tmp*.csv).
   * Resolve the current URL via CKAN package_show before each fetch.
   */
  chhsDownloadFilenamesRotate: true as const,
  facilityDetailApiPrefix:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
  facilityDetailPagePattern:
    "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/{id}",
  evaluationScope: "full-dataset" as const,
  datasetLabel:
    "CDSS ArcGIS CCL FeatureServer/0 vs historical CHHS RCFE/ARF CSVs",
  notExtrapolatedFromSample: true as const,
} as const;

/** Explicit Tier 1 rules applied when evaluating ArcGIS as a directory source. */
export const CALIFORNIA_ARCGIS_TIER1_RULES = {
  primaryIdentity: "FAC_NBR" as const,
  requireExactStringLicenseMatch: true as const,
  /** Integer FAC_NBR truncation must not be collapsed into a match. */
  refuseLeadingZeroCollapseAsMatch: true as const,
  requireDocumentedStatusDomain: true as const,
  gisStatusIntegersAccepted: false as const,
  requirePhysicalStreetAndCity: true as const,
  coordinatesRequired: false as const,
  disclosureRequired: false as const,
  /** Layer is a county-intersect GIS product, not a licensing export stamp. */
  treatLayerEditTimestampAsExport: false as const,
  treatCatalogMetadataAsExport: false as const,
  treatChhsFileDateAsExport: false as const,
  categoryEquivalenceToWashingtonAfh: false as const,
  californiaPublicationBlocked: true as const,
  exclusionsRemainInactive: true as const,
} as const;

/**
 * Full-dataset counts from the 2026-11-21 live reconciliation.
 * Prior PR #133 baselines are recorded for delta comparison only.
 */
export const CALIFORNIA_ARCGIS_TIER1_COUNTS = {
  gisTotalRows: 37871,
  gisRcfeLike: 8643,
  gisArfLike: 6805,
  gisInScope: 15448,
  gisDistinctInScopeIds: 15448,
  gisDuplicateInScopeIds: 0,
  gisInvalidInScopeIds: 0,
  gisInScopeBlankStreet: 0,
  gisInScopeBlankCity: 0,
  gisInScopeUsableAddress: 15448,
  gisInScopeCoordMissing: 0,
  gisInScopeCoordInvalid: 0,
  gisAllCoordInvalid: 1,
  gisShortIdsPossiblyTruncated: 1365,
  /** Observed undocumented STATUS integers on RCFE/ARF-like rows only. */
  gisInScopeStatusCounts: {
    "3": 15251,
    "4": 29,
    "5": 60,
    "6": 108,
  } as const,
  chhsRcfeRaw: 12522,
  chhsArfRaw: 10498,
  chhsRcfeEligible: 12521,
  /** Type-eligible ARF rows including the known shifted-field row. */
  chhsArfTypeEligibleIncludingShifted: 8611,
  chhsShiftedRowExcluded: 1,
  chhsArfEligible: 8610,
  chhsCombinedEligible: 21131,
  chhsDistinctEligible: 21131,
  chhsRawFileDate: "05252025",
  exactIdMatches: 12766,
  missingFromGisExact: 8365,
  leadingZeroRepresentationMismatches: 1240,
  trulyMissingEvenIfZerosCollapsed: 7125,
  gisOnlyAllTypes: 25105,
  gisOnlyInScope: 2682,
  duplicateHistorical: 0,
  duplicateGis: 0,
  invalidGisIdentifiers: 0,
  /** Historical LICENSED rows absent as exact GIS strings (includes leading-zero misses). */
  licensedMissingExact: 2370,
  /**
   * Offline Tier 1 candidates if ArcGIS were used as the roster.
   * Remains 0 because STATUS is undocumented — no status gate can pass.
   */
  tier1OfflineEligible: 0,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

/** PR #133 (2026-11-19) baselines retained for drift reporting. */
export const CALIFORNIA_ARCGIS_TIER1_PRIOR_PR133 = {
  observedOn: "2026-11-19",
  gisTotalRows: 37887,
  exactIdMatches: 12771,
  missingFromGisExact: 8360,
  leadingZeroRepresentationMismatches: 1242,
  trulyMissingEvenIfZerosCollapsed: 7118,
  chhsCombinedEligible: 21131,
} as const;

export const CALIFORNIA_ARCGIS_TIER1_EXCLUSIONS = [
  {
    kind: "undocumented-gis-status-domain",
    count: CALIFORNIA_ARCGIS_TIER1_COUNTS.gisInScope,
    note:
      "ArcGIS STATUS is an integer field with null domain. Codes observed on RCFE/ARF-like rows ({3,4,5,6}) are not accepted. No offline Tier 1 candidates can be selected from ArcGIS status.",
  },
  {
    kind: "incomplete-exact-id-coverage",
    count: CALIFORNIA_ARCGIS_TIER1_COUNTS.missingFromGisExact,
    note:
      "8,365 historical eligible licenses are absent as exact FAC_NBR strings. 1,240 of those are leading-zero representation mismatches; 7,125 remain missing even if zeros were collapsed (still refused).",
  },
  {
    kind: "integer-fac-nbr-truncates-leading-zeros",
    count: CALIFORNIA_ARCGIS_TIER1_COUNTS.leadingZeroRepresentationMismatches,
    note:
      "ArcGIS stores FAC_NBR as integer. Historical nine-digit IDs with a leading zero (for example 015601302) appear as truncated forms (15601302). Truncated forms are not stored as the license identity.",
  },
  {
    kind: "chhs-shifted-arf-row",
    facilityNumber: "366401835",
    count: 1,
    note:
      "ADULT RESIDENTIAL row CEDAR WAY HOME has shifted CSV fields (telephone in administrator, street in telephone, city in address, status value 9/2/1997). Excluded from eligible inventory; physical address unusable.",
  },
  {
    kind: "gis-out-of-scope-types",
    count:
      CALIFORNIA_ARCGIS_TIER1_COUNTS.gisTotalRows
      - CALIFORNIA_ARCGIS_TIER1_COUNTS.gisInScope,
    note:
      "Day care, resource family, foster, and other CCL types remain out of RCFE/ARF directory scope.",
  },
] as const;

export const CALIFORNIA_ARCGIS_TIER1_TRANSPARENCY_SAMPLE = [
  {
    requestedId: "100400070",
    role: "exact-match-historical-licensed-rcfe",
    facilityNumber: "100400070",
    officialStatus: "Licensed",
  },
  {
    requestedId: "015601302",
    role: "leading-zero-historical-form",
    facilityNumber: "015601302",
    officialStatus: "Licensed",
  },
  {
    requestedId: "15601302",
    role: "gis-integer-form-same-facility",
    facilityNumber: "015601302",
    officialStatus: "Licensed",
    note: "Canonical FacilityDetail FACILITYNUMBER keeps the leading zero.",
  },
  {
    requestedId: "011400493",
    role: "exact-miss-historical-licensed",
    facilityNumber: "011400493",
    officialStatus: "Closed, Licensee Initiated",
    note: "Live conflict vs historical open-data LICENSED — roster-wide status not verified from ArcGIS.",
  },
] as const;

export const CALIFORNIA_ARCGIS_TIER1_FRESHNESS = {
  recordedExportDate: null,
  chhsFileDateRejectedAsExport: true,
  arcgisEditingInfoRejectedAsExport: true,
  catalogMetadataRejectedAsExport: true,
  layerNameYearRejectedAsExport: true,
  freshnessPolicyDocumented: false,
  freshnessIndependentEvidence: false,
  blocksPublicTier1: true,
  note:
    "No authoritative ISO export/version stamp on ArcGIS FeatureServer/0 or CHHS file_date text (05252025). Catalog and layer edit clocks remain rejected. DownloadStateData remains the separate roster path (Phases 20–26) and is also blocked on ISO freshness.",
} as const;

export const CALIFORNIA_ARCGIS_TIER1_GATE_RESULTS = [
  {
    gate: "identity",
    passed: false,
    reasons: [
      "incomplete-exact-id-coverage",
      "integer-fac-nbr-truncates-leading-zeros",
    ],
  },
  {
    gate: "provenance",
    passed: true,
    reasons: ["official-cdss-arcgis-and-chhs-urls"],
  },
  {
    gate: "category",
    passed: true,
    reasons: ["rcfe-arf-like-prefixes-filter-only"],
    note: "FAC_TYPE_DESC prefixes are descriptive filters, not a published domain.",
  },
  {
    gate: "status",
    passed: false,
    reasons: ["undocumented-gis-status-domain"],
  },
  {
    gate: "physical-address",
    passed: true,
    reasons: ["in-scope-street-and-city-complete"],
  },
  {
    gate: "freshness",
    passed: false,
    reasons: ["missing-official-iso-export-date"],
  },
  {
    gate: "disclosure",
    passed: true,
    reasons: ["facilitydetail-prefix-verified-nonblocking"],
    note: "Disclosure is optional for framework Tier 1; prefix verified on sample only.",
  },
  {
    gate: "coordinates",
    passed: false,
    reasons: ["georeferenced-coordinates-not-licensing"],
    note: "Tier 2 only. Layer name Master_CCL_County_Intersect_2023; not adopted for map pins.",
  },
  {
    gate: "exclusion",
    passed: true,
    reasons: ["exclusions-remain-inactive"],
  },
  {
    gate: "state-authorization",
    passed: false,
    reasons: [
      "state-authorization-unpublished",
      "california-publication-blocked",
    ],
  },
] as const;

export const CALIFORNIA_ARCGIS_TIER1_REMAINING_BLOCKERS = [
  "undocumented-gis-status-domain",
  "incomplete-exact-id-coverage-vs-chhs",
  "integer-fac-nbr-truncates-leading-zeros",
  "no-authoritative-iso-export-date",
  "georeferenced-coords-not-licensing-tier2",
  "california-publication-blocked",
  "state-authorization-unpublished",
  "exclusion-policy-inactive",
  "publication-approval-required",
] as const;

export const CALIFORNIA_ARCGIS_TIER1_RESOLVED_FOR_REPORT = [
  "live-arcgis-full-pagination-complete",
  "chhs-resource-ids-resolved-via-ckan",
  "rcfe-arf-eligible-baselines-rechecked",
  "leading-zero-mismatches-reported-not-matched",
  "duplicate-in-scope-ids-zero",
  "in-scope-address-complete",
  "in-scope-coord-invalid-zero",
  "facilitydetail-sample-canonical-id-preserves-leading-zero",
  "arcgis-rejected-as-tier1-directory-source",
  "wa-or-publication-unchanged",
  "florida-ohio-investigations-not-repeated",
] as const;

export function californiaArcgisTier1DriftFromPr133() {
  const c = CALIFORNIA_ARCGIS_TIER1_COUNTS;
  const p = CALIFORNIA_ARCGIS_TIER1_PRIOR_PR133;
  return {
    gisTotalRowsDelta: c.gisTotalRows - p.gisTotalRows,
    exactIdMatchesDelta: c.exactIdMatches - p.exactIdMatches,
    missingFromGisExactDelta: c.missingFromGisExact - p.missingFromGisExact,
    leadingZeroMismatchesDelta:
      c.leadingZeroRepresentationMismatches
      - p.leadingZeroRepresentationMismatches,
    trulyMissingDelta:
      c.trulyMissingEvenIfZerosCollapsed - p.trulyMissingEvenIfZerosCollapsed,
    chhsCombinedEligibleUnchanged:
      c.chhsCombinedEligible === p.chhsCombinedEligible,
  };
}

export function buildCaliforniaArcgisTier1EligibilityPreview() {
  const c = CALIFORNIA_ARCGIS_TIER1_COUNTS;
  const arithmeticOk =
    c.gisRcfeLike + c.gisArfLike === c.gisInScope
    && c.gisInScopeUsableAddress === c.gisInScope
    && c.missingFromGisExact
      === c.leadingZeroRepresentationMismatches
        + c.trulyMissingEvenIfZerosCollapsed
    && c.chhsRcfeEligible + c.chhsArfEligible === c.chhsCombinedEligible
    && c.chhsArfTypeEligibleIncludingShifted - c.chhsShiftedRowExcluded
      === c.chhsArfEligible
    && c.tier1OfflineEligible === 0
    && c.publicationEligible === 0
    && c.ownerClaimEligible === 0;
  const statusGateFailed = CALIFORNIA_ARCGIS_TIER1_GATE_RESULTS.some(
    (g) => g.gate === "status" && !g.passed,
  );
  const freshnessGateFailed = CALIFORNIA_ARCGIS_TIER1_GATE_RESULTS.some(
    (g) => g.gate === "freshness" && !g.passed,
  );
  return {
    observedOn: CALIFORNIA_ARCGIS_TIER1_OBSERVED_ON,
    baseCommit: CALIFORNIA_ARCGIS_TIER1_BASE_COMMIT,
    source: CALIFORNIA_ARCGIS_TIER1_SOURCE,
    rules: CALIFORNIA_ARCGIS_TIER1_RULES,
    counts: c,
    priorPr133: CALIFORNIA_ARCGIS_TIER1_PRIOR_PR133,
    driftFromPr133: californiaArcgisTier1DriftFromPr133(),
    exclusions: CALIFORNIA_ARCGIS_TIER1_EXCLUSIONS,
    transparencySample: CALIFORNIA_ARCGIS_TIER1_TRANSPARENCY_SAMPLE,
    freshness: CALIFORNIA_ARCGIS_TIER1_FRESHNESS,
    gateResults: CALIFORNIA_ARCGIS_TIER1_GATE_RESULTS,
    resolvedForReport: [...CALIFORNIA_ARCGIS_TIER1_RESOLVED_FOR_REPORT],
    remainingBlockers: [...CALIFORNIA_ARCGIS_TIER1_REMAINING_BLOCKERS],
    arithmeticOk,
    statusGateFailed,
    freshnessGateFailed,
    developmentPreviewOnly: true as const,
    californiaDirectoryReady: false as const,
    allowsPublication: false as const,
    finalPublicVisibility: false as const,
    ownerClaimEligible: false as const,
    exclusionsActivated: false as const,
    washingtonUnchanged: true as const,
    oregonUnchanged: true as const,
    floridaOhioNotRepeated: true as const,
    /** ArcGIS cannot enumerate offline Tier 1 candidates (STATUS undocumented). */
    stopGoPublic: "STOP" as const,
    stopGoDevelopmentPreview: "STOP" as const,
    stopGoTier2Map: "STOP" as const,
    mostActionableNextStep:
      "Do not use ArcGIS FeatureServer/0 as the California directory roster. Continue the DownloadStateData + FacilityDetail path (Phases 20–26) for status/identity; keep ArcGIS as coordinate corroboration only after separate Tier 2 licensing-provenance approval. Resolve CDSS ISO export/version stamp before any Tier 1 public claim.",
  };
}

export function californiaArcgisTier1AllowsPublication(): false {
  return false;
}

export function californiaArcgisTier1DirectoryReady(): false {
  return false;
}

export function californiaArcgisMeetsTier1DirectoryReadiness(): false {
  return false;
}
