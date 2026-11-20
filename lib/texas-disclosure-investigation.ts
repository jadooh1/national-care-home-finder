/**
 * Texas facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const TEXAS_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const TEXAS_DISCLOSURE_SOURCES = {
  workbook: "https://apps.hhs.texas.gov/providers/directories/al.xlsx",
  tulipSearch: "https://tulip.hhs.texas.gov/TULIP/s/ltc-provider-search",
  tulipDetail: "https://tulip.hhs.texas.gov/TULIP/s/ltc-provider-detail",
  closuresPdf: "https://apps.hhs.texas.gov/providers/directories/Closures/alf_closures.pdf",
  alfProviderPage:
    "https://www.hhs.texas.gov/providers/long-term-care-providers/assisted-living-facilities-alf",
} as const;

export const TEXAS_DISCLOSURE_FINDINGS = {
  workbookContainsFacilityUrlColumn: false,
  workbookContainsAccountIdColumn: false,
  tulipSearchIsSalesforceSpa: true,
  guessedDetailFromFacilityIdOrLicense: {
    patternsTried: [
      "ltc-provider-detail?c__accountidparam={Facility ID}",
      "ltc-provider-detail?license={License No}",
      "ltc-provider-detail?facilityId={Facility ID}",
    ],
    facilityPayloadObserved: false,
    acceptedAsDisclosurePrefix: false,
    note:
      "Detail route historically requires a Salesforce account id not present in the workbook. Guessed params did not yield facility payload this run.",
  },
  physicalAddressLabeledSeparatelyFromOwnerMailing: true,
  mailingNotSubstitutedForPhysical: true,
  geoLocationSourceDescribed: false,
  coordinatesAreLicensingCoordinates: false,
  sourceAttributionRequired: true,
  unresolvedIneligible: true,
} as const;

export function evaluateTexasDisclosureInvestigation(
  findings = TEXAS_DISCLOSURE_FINDINGS,
) {
  return {
    observedOn: TEXAS_DISCLOSURE_OBSERVED_ON,
    sources: TEXAS_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified:
      findings.guessedDetailFromFacilityIdOrLicense.acceptedAsDisclosurePrefix,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "TULIP is a Salesforce search SPA. No Facility ID / License No → stable detail URL prefix was verified. Workbook has no account id or facility URL column.",
  };
}
