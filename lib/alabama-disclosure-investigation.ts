/**
 * Alabama facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const ALABAMA_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const ALABAMA_DISCLOSURE_SOURCES = {
  landing: "https://www.alabamapublichealth.gov/providerstandards/directory.html",
  directory: "https://dph1.adph.state.al.us/FacilitiesDirectory/",
} as const;

export const ALABAMA_DISCLOSURE_FINDINGS = {
  rosterContainsFacilityUrlColumn: false,
  rosterContainsFacId: true,
  facilitiesDirectory: {
    url: "https://dph1.adph.state.al.us/FacilitiesDirectory/",
    searchByTypeCountyCity: true,
    excelExportAvailable: true,
    facilitySpecificDetailPrefixVerified: false,
    note:
      "Interactive directory supports Directory / Index / Export to Excel. No Fac ID → stable facility disclosure HTML URL was verified (Facility.aspx and query-string guesses failed or returned search shell).",
  },
  guessedDetailFromFacId: {
    patternsTried: [
      "FacilitiesDirectory/Facility.aspx?FacID={Fac ID}",
      "FacilitiesDirectory/default.aspx?FacID={Fac ID}",
      "providerstandards/facility.html?id={Fac ID}",
    ],
    facilitySpecificPayloadObserved: false,
    acceptedAsDisclosurePrefix: false,
  },
  coordinatesOnOfficialExport: false,
  sourceAttributionRequired: true,
  unresolvedIneligible: true,
} as const;

export function evaluateAlabamaDisclosureInvestigation(
  findings = ALABAMA_DISCLOSURE_FINDINGS,
) {
  return {
    observedOn: ALABAMA_DISCLOSURE_OBSERVED_ON,
    sources: ALABAMA_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified:
      findings.guessedDetailFromFacId.acceptedAsDisclosurePrefix,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "Fac ID is stable on ALF/SCALF Excel exports, but no Fac ID → facility disclosure URL prefix was verified.",
  };
}
