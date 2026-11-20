/**
 * Massachusetts facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const MASSACHUSETTS_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const MASSACHUSETTS_DISCLOSURE_SOURCES = {
  certifiedList:
    "https://www.mass.gov/doc/list-of-certified-assisted-living-residences-as-of-june-2026/download",
  locationsDirectory: "https://www.mass.gov/assisted-living-residences/locations",
  locationPrefix: "https://www.mass.gov/locations/",
} as const;

export const MASSACHUSETTS_DISCLOSURE_FINDINGS = {
  rosterContainsFacilityUrlColumn: false,
  rosterContainsCertificationNumber: false,
  rosterContainsAlrName: true,
  rosterContainsFederalEin: true,
  federalEinIsFacilityUnique: false,
  nameDerivedLocationSlug: {
    pattern: "https://www.mass.gov/locations/{slug-from-alr-name}",
    facilitySpecificPayloadObserved: true,
    unitsPresentOnDetail: true,
    traditionalAndSpecialCareUnitsPresentOnDetail: true,
    addressPresentOnDetail: true,
    acceptedAsDisclosurePrefix: true,
    note:
      "Bounded location pages (e.g. Adelaide of Newton Centre, All American Assisted Living at Hanson) show address and unit breakdowns matching the certified list. The slug is derived from ALR Name because no certification-number column exists.",
  },
  coordinatesOnOfficialCertifiedList: false,
  massGisCoordinatesRejectedAsLicensing: true,
  sourceAttributionRequired: true,
  unresolvedIneligible: false,
} as const;

export function evaluateMassachusettsDisclosureInvestigation(
  findings = MASSACHUSETTS_DISCLOSURE_FINDINGS,
) {
  return {
    observedOn: MASSACHUSETTS_DISCLOSURE_OBSERVED_ON,
    sources: MASSACHUSETTS_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified:
      findings.nameDerivedLocationSlug.acceptedAsDisclosurePrefix,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "ALR Name → mass.gov/locations/{slug} is a verified facility-specific disclosure path, but it is name-derived rather than a source certification identifier.",
  };
}
