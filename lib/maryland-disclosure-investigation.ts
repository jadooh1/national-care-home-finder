/**
 * Maryland facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const MARYLAND_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const MARYLAND_DISCLOSURE_SOURCES = {
  ohcqDirectories:
    "https://health.maryland.gov/ohcq/Pages/OHCQ-Licensee-Directories.aspx",
  alpExcel:
    "https://health.maryland.gov/ohcq/docs/Provider-Listings/Excel/Assisted-Living-Excel.xlsx",
  mhccConsumerGuide:
    "https://healthcarequality.mhcc.maryland.gov/AssistedLiving/Suggestion",
} as const;

export const MARYLAND_DISCLOSURE_FINDINGS = {
  rosterContainsFacilityUrlColumn: false,
  rosterContainsLicenseNumber: true,
  guessedMhccDetailFromLicense: {
    patternsTried: [
      "AssistedLiving/Facility?license={License Number}",
      "AssistedLiving/Facility/{License Number}",
      "AssistedLiving?LicenseNumber={License Number}",
      "OHCQ Facility.aspx?License={License Number}",
    ],
    facilitySpecificPayloadObserved: false,
    acceptedAsDisclosurePrefix: false,
    note:
      "MHCC consumer guide SPA returns a shell without facility-specific payload for License Number query guesses. OHCQ Facility.aspx?License= returns 404. No verified License Number → facility disclosure URL.",
  },
  uniformDisclosureStatementIsOnRequestNotUrl: true,
  mhccSurveySurfaceIsPartialAndTenPlusBeds: true,
  coordinatesOnOfficialExcel: false,
  openDataImapCoordinatesRejectedAsLicensing: true,
  sourceAttributionRequired: true,
  unresolvedIneligible: true,
} as const;

export function evaluateMarylandDisclosureInvestigation(
  findings = MARYLAND_DISCLOSURE_FINDINGS,
) {
  return {
    observedOn: MARYLAND_DISCLOSURE_OBSERVED_ON,
    sources: MARYLAND_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified:
      findings.guessedMhccDetailFromLicense.acceptedAsDisclosurePrefix,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "License Number is stable on the OHCQ Excel roster, but no License Number → stable facility disclosure URL was verified. Uniform Disclosure Statement is on-request, not a URL.",
  };
}
