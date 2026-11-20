/**
 * South Carolina facility disclosure / attribution investigation
 * (development-only). Intentionally free of sibling runtime imports.
 */

export const SOUTH_CAROLINA_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const SOUTH_CAROLINA_DISCLOSURE_SOURCES = {
  findFacility: "https://dph.sc.gov/professionals/healthcare-quality/find-facility",
  dataviz: "https://dataviz.dph.sc.gov/Health_Facility/",
  experience:
    "https://experience.arcgis.com/experience/fd09063e5e034b329f97c43ea8e8c4c2",
  featureServer:
    "https://services5.arcgis.com/G4BLIH7rTQoIjCFv/arcgis/rest/services/Health_Facilities/FeatureServer/0",
} as const;

export const SOUTH_CAROLINA_DISCLOSURE_FINDINGS = {
  rosterContainsFacilityUrlColumn: false,
  rosterContainsLicenseNbr: true,
  findFacilityMap: {
    url: "https://dph.sc.gov/professionals/healthcare-quality/find-facility",
    includesCommunityResidentialCareTab: true,
    csvExportDocumentedOnPage: true,
    facilitySpecificDetailPrefixVerified: false,
    note:
      "Find a Facility is an interactive Experience Builder map. The page documents Options → Export All to CSV. No LICENSE_NBR → stable HTML detail URL was verified.",
  },
  guessedDetailFromLicenseNbr: {
    patternsTried: [
      "experience/.../fd09063e...?data_filter=LICENSE_NBR:{LICENSE_NBR}",
      "find-facility?license={LICENSE_NBR}",
    ],
    facilitySpecificPayloadObserved: false,
    acceptedAsDisclosurePrefix: false,
  },
  coordinatesOnOfficialCrcfLayer: true,
  coordinatesAcceptedAsLicensingCoordinates: false,
  sourceAttributionRequired: true,
  unresolvedIneligible: true,
} as const;

export function evaluateSouthCarolinaDisclosureInvestigation(
  findings = SOUTH_CAROLINA_DISCLOSURE_FINDINGS,
) {
  return {
    observedOn: SOUTH_CAROLINA_DISCLOSURE_OBSERVED_ON,
    sources: SOUTH_CAROLINA_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified:
      findings.guessedDetailFromLicenseNbr.acceptedAsDisclosurePrefix,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "LICENSE_NBR is stable on the CRCF layer, but no LICENSE_NBR → facility disclosure URL prefix was verified.",
  };
}
