/**
 * Florida facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const FLORIDA_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const FLORIDA_DISCLOSURE_SOURCES = {
  alfComparison: "https://quality.healthfinder.fl.gov/Facility-Provider/ALF?LS=1&type=1",
  profilePrefix: "https://quality.healthfinder.fl.gov/Facility-Provider/Profile/?LID=",
  inspectionPrefix:
    "https://apps.ahca.myflorida.com/dm_web/facility_inspection_details.aspx?client_code=11&file_number=",
  locateSearch: "https://quality.healthfinder.fl.gov/Facility-Search/FacilityLocateSearch",
  ahcaAlfPage:
    "https://ahca.myflorida.com/health-quality-assurance/bureau-of-health-facility-regulation/assisted-living-unit/assisted-living-facility.html",
} as const;

export const FLORIDA_DISCLOSURE_FINDINGS = {
  listEmbedContainsFacilityUrlColumn: false,
  listEmbedContainsCounty: false,
  listEmbedContainsSpecialtyLicense: false,
  profileLidFromLicenseID: {
    pattern: "/Facility-Provider/Profile/?LID={LicenseID}",
    verifiedLicenseID: "313782",
    facilityNameObservedOnProfile: true,
    specialtyLicenseObservedOnProfile: true,
    acceptedAsDisclosurePrefix: true,
  },
  profileLidFromLinkIdOrFileNumber: {
    patternsTried: [
      "/Facility-Provider/Profile/?LID={LinkId}",
      "/Facility-Provider/Profile/?LID={FileNumber}",
    ],
    facilityNameObserved: false,
    acceptedAsDisclosurePrefix: false,
  },
  inspectionFromFileNumber: {
    pattern:
      "facility_inspection_details.aspx?client_code=11&file_number={FileNumber}",
    verifiedFileNumber: "11968002",
    inspectionTableObserved: true,
    acceptedAsInspectionPrefix: true,
  },
  exportHandlersRequirePostAntiforgery: true,
  stableStaticStatewideAlfFileUrl: false,
  addressTypeOnListIsStreet: true,
  profileAlsoShowsMailingAddressTypeMA: true,
  mailingNotSubstitutedForPhysical: true,
  geoLocationSourceDescribed: false,
  coordinatesAreLicensingCoordinates: false,
  sourceAttributionRequired: true,
  unresolvedIneligible: true,
} as const;

export function evaluateFloridaDisclosureInvestigation(
  findings = FLORIDA_DISCLOSURE_FINDINGS,
) {
  return {
    observedOn: FLORIDA_DISCLOSURE_OBSERVED_ON,
    sources: FLORIDA_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified:
      findings.profileLidFromLicenseID.acceptedAsDisclosurePrefix,
    inspectionPrefixVerified:
      findings.inspectionFromFileNumber.acceptedAsInspectionPrefix,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "LicenseID → Profile/?LID= is verified for facility disclosure. FileNumber → AHCA inspection details is verified for ClientCode 11. List embed still lacks county/specialty and has no ISO export stamp.",
  };
}
