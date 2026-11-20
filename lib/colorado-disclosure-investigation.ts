/**
 * Colorado facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const COLORADO_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const COLORADO_DISCLOSURE_SOURCES = {
  findAndCompare:
    "https://cdphe.colorado.gov/health-facilities/find-and-compare-facilities",
  findAndCompareTableau:
    "https://cohealthviz.dphe.state.co.us/t/HealthFacilitiesPublic/views/HealthFacilitySearchSite/1_HealthFacilitySearchSite",
  alrConsumerResources:
    "https://cdphe.colorado.gov/assisted-living-residence-consumer-resources",
  alrPage: "https://cdphe.colorado.gov/assisted-living-residences",
  hubAbout:
    "https://data-cdphe.opendata.arcgis.com/datasets/CDPHE::cdphe-health-facilities/about",
  socrataMirror: "https://data.colorado.gov/Health/Health-Facilities/98pp-s4r4",
} as const;

export const COLORADO_DISCLOSURE_FINDINGS = {
  findAndComparePageHttpStatus: 200,
  findAndCompareIsSearchDashboard: true,
  tableauSearchViewObserved: true,
  guessedDetailUrlFromFacilityId: {
    patternTried:
      "https://cdphe.colorado.gov/health-facilities/find-and-compare-facilities?Facility_ID={Facility_ID}",
    httpStatus: 200,
    facilityIdAppearsOnlyInDrupalCurrentQuery: true,
    facilityDetailPayloadObserved: false,
    acceptedAsDisclosurePrefix: false,
  },
  featureServerContainsDisclosureUrlField: false,
  coordinatesAreAddressGeocodeMatches: true,
  coordinatesAreLicensingCoordinates: false,
  publicReuseNotice: true,
  publicReuseNoticeText:
    "Hub/Socrata: informational; no restrictions stated. Completeness/correctness/fitness disclaimer. Some addresses may not match exact coordinate locations.",
  sourceAttributionRequired: true,
  unresolvedIneligible: true,
} as const;

export function evaluateColoradoDisclosureInvestigation(
  findings = COLORADO_DISCLOSURE_FINDINGS,
) {
  const disclosurePrefixVerified =
    findings.guessedDetailUrlFromFacilityId.acceptedAsDisclosurePrefix;
  return {
    observedOn: COLORADO_DISCLOSURE_OBSERVED_ON,
    sources: COLORADO_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "Find and Compare is a Tableau search dashboard for inspections/occurrences (prior 3 years). No verified Facility_ID→stable detail URL prefix was established. FeatureServer rows have no disclosure URL field.",
  };
}
