/**
 * Arizona facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const ARIZONA_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const ARIZONA_DISCLOSURE_SOURCES = {
  azCareCheck: "https://azcarecheck.azdhs.gov/s/",
  legacySearchAl: "https://hsapps.azdhs.gov/ls/sod/SearchProv.aspx?type=AL",
  facilityAspxPattern: "https://hsapps.azdhs.gov/ls/sod/Facility.aspx?id={FACID}",
  residentialLicensing:
    "https://www.azdhs.gov/licensing/residential-facilities/index.php",
  hubHome:
    "https://geodata-adhsgis.hub.arcgis.com/datasets/ADHSGIS::assisted-living-home-feb-2025/about",
  hubCenter:
    "https://geodata-adhsgis.hub.arcgis.com/datasets/ADHSGIS::assisted-living-center-feb-2025/about",
} as const;

export const ARIZONA_DISCLOSURE_FINDINGS = {
  legacySearchRedirectsAwayFromDetailTool: true,
  azCareCheckIsSalesforceSearchSpa: true,
  guessedFacilityAspx: {
    patternTried: "Facility.aspx?id={FACID}",
    httpStatus: 200,
    pageTitle: "Licensing Services Facilities Report",
    facilityNamePresentInBody: false,
    facilityIdPresentInBody: false,
    acceptedAsDisclosurePrefix: false,
    note: "Empty label shell; no facility payload for probed FACIDs.",
  },
  guessedAzCareCheckQueryParams: {
    patternsTried: [
      "?FACID={FACID}",
      "?facilityId={FACID}",
      "?licenseNumber={LICENSE_NUMBER}",
      "/s/facility/{FACID}",
    ],
    facilityPayloadObserved: false,
    acceptedAsDisclosurePrefix: false,
  },
  featureServerContainsDisclosureUrlField: false,
  coordinatesAreAddressGeocodeMatches: true,
  coordinatesAreLicensingCoordinates: false,
  publicReuseNotice: true,
  publicReuseNoticeText:
    "ADHS Hub: as-is / as-available; no warranty; no liability for use or reliance.",
  sourceAttributionRequired: true,
  unresolvedIneligible: true,
} as const;

export function evaluateArizonaDisclosureInvestigation(
  findings = ARIZONA_DISCLOSURE_FINDINGS,
) {
  const disclosurePrefixVerified =
    findings.guessedFacilityAspx.acceptedAsDisclosurePrefix
    || findings.guessedAzCareCheckQueryParams.acceptedAsDisclosurePrefix;
  return {
    observedOn: ARIZONA_DISCLOSURE_OBSERVED_ON,
    sources: ARIZONA_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "AZ Care Check is a Salesforce search SPA. Legacy SearchProv?type=AL redirects away from a usable detail tool. Facility.aspx?id={FACID} returns an empty shell. No verified FACID/LICENSE_NUMBER→stable detail URL prefix.",
  };
}
