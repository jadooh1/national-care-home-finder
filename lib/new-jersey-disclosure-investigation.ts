/**
 * New Jersey facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const NEW_JERSEY_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const NEW_JERSEY_DISCLOSURE_SOURCES = {
  allLtcWorkbook: "https://healthapps.nj.gov/facilities/documents2/All_LTC.xlsx",
  ltcSearch: "https://healthapps.nj.gov/facilities/fsSearch.aspx",
  countySearch: "https://healthapps.nj.gov/facilities/fsSetSearch.aspx?by=county",
  facilityDetailsPrefix:
    "https://healthapps.nj.gov/facilities/fsFacilityDetails.aspx?item=",
} as const;

export const NEW_JERSEY_DISCLOSURE_FINDINGS = {
  rosterContainsFacilityUrlColumn: false,
  rosterContainsFacID: true,
  rosterContainsLicNumber: true,
  facIdDetail: {
    pattern: "fsFacilityDetails.aspx?item={FacID}",
    facilitySpecificPayloadObserved: true,
    worksWithoutSearchSession: true,
    licenseNumberPresentOnDetail: true,
    licenseExpiresPresentOnDetail: true,
    bedSlotInformationPresentOnDetail: true,
    facilityTypePresentOnDetail: true,
    verifiedOnAlr: true,
    verifiedOnCpch: true,
    verifiedOnAlp: true,
    acceptedAsDisclosurePrefix: true,
    note:
      "GET fsFacilityDetails.aspx?item={FacID} returns Licensed Name, Address, Facility Type, License Number, License Expires, and Bed/Slot Information for ALR, CPCH, and ALP. FacID matches the All_LTC.xlsx FacID column (often NJ-prefixed).",
  },
  countySearchListUsesSameItemParam: true,
  coordinatesOnOfficialWorkbook: true,
  coordinatesAreLicensingCoordinates: false,
  sourceAttributionRequired: true,
  unresolvedIneligible: false,
} as const;

export function evaluateNewJerseyDisclosureInvestigation(
  findings = NEW_JERSEY_DISCLOSURE_FINDINGS,
) {
  return {
    observedOn: NEW_JERSEY_DISCLOSURE_OBSERVED_ON,
    sources: NEW_JERSEY_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified: findings.facIdDetail.acceptedAsDisclosurePrefix,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "FacID → fsFacilityDetails.aspx?item={FacID} is a verified facility-specific disclosure prefix for ALR, CPCH, and ALP.",
  };
}
