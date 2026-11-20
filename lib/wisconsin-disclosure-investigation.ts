/**
 * Wisconsin facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const WISCONSIN_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const WISCONSIN_DISCLOSURE_SOURCES = {
  guide: "https://www.dhs.wisconsin.gov/guide/afh.htm",
  providerSearchGuide: "https://www.dhs.wisconsin.gov/guide/provider-search.htm",
  providerSearchTool:
    "https://www.forwardhealth.wi.gov/WIPortal/subsystem/public/DQAProviderSearch.aspx",
  providerSearchResultsAfh:
    "https://www.forwardhealth.wi.gov/WIPortal/Subsystem/Public/DqaProviderSearchResults.aspx?fac_type=afh",
  excelDirectory: "https://www.dhs.wisconsin.gov/guide/afhdirexcel.xlsx",
  pdfDirectory: "https://www.dhs.wisconsin.gov/guide/afhdir.pdf",
} as const;

export const WISCONSIN_DISCLOSURE_FINDINGS = {
  excelLabelsFacilityStreetAndMailingSeparately: true,
  mailingNotSubstitutedForFacilityStreet: true,
  capacityPresentOnExcel: true,
  capacityValues: [3, 4] as const,
  perRowLicensingStatusColumn: false,
  classIsAmbulatorySubclassNotLicenseStatus: true,
  providerSearchIsSearchToolNotStableDetailPrefix: true,
  guessedDetailUrlFromFacilityId: {
    patternTried: "DqaProviderDetails.aspx?fac_num={FacilityId}",
    httpStatus: 200,
    pageTitle: "Unexpected Error",
    facilityIdPresentInBody: false,
    acceptedAsDisclosurePrefix: false,
  },
  pdfContainsFacilityDisclosureUrls: false,
  gisCoordinatesAreLicensingCoordinates: false,
  sourceAttributionRequired: true,
  unresolvedIneligible: true,
} as const;

export function evaluateWisconsinDisclosureInvestigation(
  findings = WISCONSIN_DISCLOSURE_FINDINGS,
) {
  const disclosurePrefixVerified = findings.guessedDetailUrlFromFacilityId.acceptedAsDisclosurePrefix;
  return {
    observedOn: WISCONSIN_DISCLOSURE_OBSERVED_ON,
    sources: WISCONSIN_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "Facility Street and Mailing Street are labeled separately in Excel/PDF. Provider Search exists but no verified Facility-ID→detail URL prefix was established. Guessed detail URLs returned Unexpected Error without the Facility ID in the body.",
  };
}
