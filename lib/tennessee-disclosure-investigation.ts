/**
 * Tennessee facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const TENNESSEE_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const TENNESSEE_DISCLOSURE_SOURCES = {
  aclfFullBeds:
    "https://www.tn.gov/content/dam/tn/health/healthprofboards/hcf/ACLF-Full-Beds-Report.pdf",
  facilityListings: "https://internet.health.tn.gov/FacilityListings/",
  hfcReports: "https://www.tn.gov/hfc/publication-and-reports/licensure-reports.html",
} as const;

export const TENNESSEE_DISCLOSURE_FINDINGS = {
  rosterContainsFacilityUrlColumn: false,
  rosterContainsLicNo: true,
  facilityListingsSearch: {
    url: "https://internet.health.tn.gov/FacilityListings/",
    includesAssistedCareLivingFacilityType: true,
    facilitySpecificDetailPrefixVerified: false,
    egress403FromAgentEnvironment: true,
    note:
      "FacilityListings is an interactive search by facility type and county. Agent environment received HTTP 403; no lic_no → stable detail URL was verified.",
  },
  guessedDetailFromLicNo: {
    patternsTried: [
      "FacilityListings/Facility.aspx?LicNo={lic_no}",
      "FacilityListings/Details.aspx?lic_no={lic_no}",
    ],
    facilitySpecificPayloadObserved: false,
    acceptedAsDisclosurePrefix: false,
  },
  coordinatesOnOfficialAclfReport: false,
  sourceAttributionRequired: true,
  unresolvedIneligible: true,
} as const;

export function evaluateTennesseeDisclosureInvestigation(
  findings = TENNESSEE_DISCLOSURE_FINDINGS,
) {
  return {
    observedOn: TENNESSEE_DISCLOSURE_OBSERVED_ON,
    sources: TENNESSEE_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified:
      findings.guessedDetailFromLicNo.acceptedAsDisclosurePrefix,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "lic_no is stable on the ACLF Full Bed Report, but no lic_no → facility disclosure URL prefix was verified.",
  };
}
