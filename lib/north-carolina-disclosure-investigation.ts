/**
 * North Carolina facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const NORTH_CAROLINA_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const NORTH_CAROLINA_DISCLOSURE_SOURCES = {
  listings: "https://info.ncdhhs.gov/dhsr/reports.htm",
  adultWorkbook: "https://info.ncdhhs.gov/dhsr/data/Ahlist.xlsx",
  familyWorkbook: "https://info.ncdhhs.gov/dhsr/data/Fchlist.xlsx",
  starSearch: "https://info.ncdhhs.gov/dhsr/acls/star/search.asp",
} as const;

export const NORTH_CAROLINA_DISCLOSURE_FINDINGS = {
  workbookContainsFacilityUrlColumn: false,
  workbookContainsCoordinateColumns: false,
  workbookContainsPerRowStatusColumn: false,
  siteAddressLabeledSeparatelyFromFacilityMailing: true,
  facilityMailingMayBeOutsideNorthCarolina: true,
  mailingNotSubstitutedForSite: true,
  starSearchFormFields: ["type", "county", "faccity", "facname"] as const,
  starSearchHasLicenseField: false,
  guessedDetailFromLicense: {
    patternsTried: [
      "star/details.asp?id={License #}",
      "star/facility.asp?license={License #}",
      "star/search.asp?license={License #}",
    ],
    facilityPayloadObserved: false,
    acceptedAsDisclosurePrefix: false,
    note:
      "Star search posts by facility type, county, city, or name. It has no license field. Guessed License # detail URLs did not yield a verified facility disclosure payload.",
  },
  starRatingIsNotLicensingStatus: true,
  expiryDateIsNotLicensingStatus: true,
  sourceAttributionRequired: true,
  unresolvedIneligible: true,
} as const;

export function evaluateNorthCarolinaDisclosureInvestigation(
  findings = NORTH_CAROLINA_DISCLOSURE_FINDINGS,
) {
  return {
    observedOn: NORTH_CAROLINA_DISCLOSURE_OBSERVED_ON,
    sources: NORTH_CAROLINA_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified:
      findings.guessedDetailFromLicense.acceptedAsDisclosurePrefix,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "Star-rating search is a generic search page. No License # → stable facility disclosure URL prefix was verified. Site Address remains the physical column; Facility Address is correspondence/mailing and may be out of state.",
  };
}
