/**
 * Colorado care-home source discovery (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Colorado Assisted Living Residences (6 CCR 1011-1 Chapters 2 & 7) are NOT
 * assumed equivalent to Washington adult family homes.
 */

export const COLORADO_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const COLORADO_CDPHE_HEALTH_FACILITIES_FEATURE_SERVER =
  "https://services3.arcgis.com/66aUo8zsujfVXRIT/arcgis/rest/services/CDPHE_Health_Facilities/FeatureServer";
export const COLORADO_CDPHE_HEALTH_FACILITIES_LAYER_0 =
  `${COLORADO_CDPHE_HEALTH_FACILITIES_FEATURE_SERVER}/0`;
export const COLORADO_CDPHE_HUB_ABOUT_URL =
  "https://data-cdphe.opendata.arcgis.com/datasets/CDPHE::cdphe-health-facilities/about";
export const COLORADO_SOCRATA_MIRROR_URL =
  "https://data.colorado.gov/Health/Health-Facilities/98pp-s4r4";
export const COLORADO_ALR_PAGE_URL =
  "https://cdphe.colorado.gov/assisted-living-residences";
export const COLORADO_FIND_AND_COMPARE_URL =
  "https://cdphe.colorado.gov/health-facilities/find-and-compare-facilities";
export const COLORADO_CHAPTER_7_RULE_URL =
  "https://www.sos.state.co.us/CCR/DisplayRule.do?action=ruleinfo&ruleId=3036&deptID=16&agencyID=144";
export const COLORADO_CHAPTER_2_RULE_URL =
  "https://www.sos.state.co.us/CCR/DisplayRule.do?action=ruleinfo&ruleId=3031&deptID=16&agencyID=144";

/** Prior next-state note (mixed layer; no ALR-only count adopted). */
export const COLORADO_PRIOR_MIXED_LAYER_BASELINE = {
  source: "Colorado mixed health-facility open data",
  assistedLivingOnlyCountAdopted: false,
  selected: false,
  recordedExportDate: null,
} as const;

/**
 * Current read-only capture from the official CDPHE ArcGIS FeatureServer.
 * HTTP Last-Modified / layer editingInfo / uniform Date_Data_Updated are
 * rejected as authoritative ISO export dates.
 */
export const COLORADO_CURRENT_CAPTURE = {
  observedOn: COLORADO_SOURCE_VERIFICATION_OBSERVED_ON,
  socrataMirror: {
    sourceUrl: COLORADO_SOCRATA_MIRROR_URL,
    viewType: "href",
    columns: 0,
    tabularRowAccess: false,
    note:
      "data.colorado.gov mirror is a non-tabular href view (no row/column access). Authoritative rows come from the ArcGIS FeatureServer.",
  },
  featureServer: {
    sourceUrl: COLORADO_CDPHE_HEALTH_FACILITIES_LAYER_0,
    hubAboutUrl: COLORADO_CDPHE_HUB_ABOUT_URL,
    httpStatus: 200,
    lastModified: "Fri, 16 Oct 2026 18:57:42 GMT",
    lastModifiedIsExportDate: false,
    layerLastEditDateIsoUtc: "2026-10-16T18:57:42.430Z",
    layerLastEditRejectedAsExportDate: true,
    totalLayerRows: 5091,
    maxRecordCount: 2000,
    facilityTypeCounts: {
      "All Other Factypes": 1984,
      "Home Care Agency": 1569,
      "Assisted Living Residence": 685,
      "Home Health Agency": 479,
      "Nursing Facilities": 214,
      Hospital: 127,
      "Community Clinic": 33,
    },
    fieldsObserved: [
      "Facility_ID",
      "Facility_Name",
      "Facility_Type_Code",
      "Facility_Type",
      "Facility_Type_Detail",
      "Facility_Type_Abbreviation",
      "Licensed_Beds_Total",
      "Telephone",
      "County",
      "Address_Full",
      "Latitude",
      "Longitude",
      "CDPHE_HFEMS_Licensed",
      "Operating_Status",
      "Date_Data_Updated",
      "Source",
    ] as const,
    sourceAttribution:
      "CDPHE Health Facilities and Emergency Medical Services Division",
    reuse:
      "Informational; no restrictions stated on Hub/Socrata. Completeness/correctness/fitness disclaimer applies. Coordinates are address-geocode matches.",
    coordinatesGeocodedFromAddress: true,
    coordinatesAreLicensingCoordinates: false,
    recordedExportDate: null,
  },
  assistedLivingResidence: {
    filter: "Facility_Type='Assisted Living Residence'",
    rows: 685,
    uniqueFacilityIds: 685,
    duplicateFacilityIds: 0,
    blankFacilityId: 0,
    blankName: 0,
    blankAddress: 0,
    addressCoZipPattern: 685,
    blankCounty: 0,
    blankBeds: 0,
    zeroBeds: 27,
    bedsMin: 0,
    bedsMax: 274,
    blankLatLon: 0,
    operatingStatus: { Active: 670, Pending: 15 },
    licensedFlag: { Licensed: 659, "HCPF Certified": 26 },
    typeDetail: { "ALR ONLY": 358, "ALR/ACF": 285, "ALR/BISL": 42 },
    dateDataUpdatedUniqueIsoUtc: ["2026-09-29"],
    dateDataUpdatedRejectedAsExportDate: true,
    activeLicensedBedsGt0: 646,
    alrIdSetSha256:
      "3e4fa60a3245a7961c98c2c124d4287b29dc6e8f8b364f7045ff88cddc5fde56",
    regulatoryChapters: ["6 CCR 1011-1 Chapter 2", "6 CCR 1011-1 Chapter 7"],
  },
  relatedResidentialNotedNotAdopted: {
    note:
      "Other Factypes include RCF-DD (80), ICF/IID (21), convalescent (14), PRTF (5), ATU (1). Not adopted as Colorado ALR onboarding rows this run.",
    nursingFacilitiesInLayer: 214,
  },
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateColoradoSourceVerification(
  current = COLORADO_CURRENT_CAPTURE,
) {
  const alr = current.assistedLivingResidence;
  const fs = current.featureServer;
  const integrityOk =
    alr.rows === 685
    && alr.uniqueFacilityIds === 685
    && alr.duplicateFacilityIds === 0
    && alr.blankFacilityId === 0
    && alr.blankAddress === 0
    && alr.addressCoZipPattern === 685
    && alr.blankLatLon === 0
    && alr.zeroBeds === 27
    && alr.activeLicensedBedsGt0 === 646
    && fs.totalLayerRows === 5091
    && fs.facilityTypeCounts["Assisted Living Residence"] === 685
    && fs.recordedExportDate === null
    && fs.layerLastEditRejectedAsExportDate === true
    && alr.dateDataUpdatedRejectedAsExportDate === true
    && fs.coordinatesAreLicensingCoordinates === false
    && current.socrataMirror.tabularRowAccess === false
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: COLORADO_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: COLORADO_PRIOR_MIXED_LAYER_BASELINE,
    current,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function coloradoDirectoryReady(): false {
  return false;
}
