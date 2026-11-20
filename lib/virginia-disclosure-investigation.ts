/**
 * Virginia facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const VIRGINIA_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const VIRGINIA_DISCLOSURE_SOURCES = {
  alfSearch:
    "https://www.dss.virginia.gov/licensed-care/search-licensing-programs/assisted-living-facility-search/",
  alfProgram:
    "https://www.dss.virginia.gov/licensed-care/assisted-living-facilities-alf/",
  legacyAlfCgi: "https://www.dss.virginia.gov/facility/search/alf.cgi",
} as const;

export const VIRGINIA_DISCLOSURE_FINDINGS = {
  rosterContainsFacilityUrlColumn: false,
  rosterContainsLicenseId: true,
  licenseIdQueryDetail: {
    pattern: "?licenseId={licenseId}&endpoint=alf",
    facilitySpecificPayloadObserved: true,
    capacityPresentOnDetail: true,
    licenseTypePresentOnDetail: true,
    inspectionsListPresentOnDetail: true,
    coordinatesPresentOnDetail: false,
    acceptedAsDisclosurePrefix: true,
    note:
      "GET on Assisted Living Facility Search with licenseId and endpoint=alf returns facilityLicense (licenseType, capacity, expiration) and inspectionsList. Verified on a bounded 32-facility sample.",
  },
  legacyAlfCgiRedirectsAwayFromSearch: true,
  mailingSubstitutionAllowed: false,
  sourceAttributionRequired: true,
  unresolvedIneligible: false,
} as const;

export function evaluateVirginiaDisclosureInvestigation(
  findings = VIRGINIA_DISCLOSURE_FINDINGS,
) {
  return {
    observedOn: VIRGINIA_DISCLOSURE_OBSERVED_ON,
    sources: VIRGINIA_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified:
      findings.licenseIdQueryDetail.acceptedAsDisclosurePrefix,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "licenseId → Assisted Living Facility Search detail query is a verified facility-specific disclosure prefix. List extract still lacks capacity, licenseType, and coordinates.",
  };
}
