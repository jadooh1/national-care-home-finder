/**
 * Georgia facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const GEORGIA_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const GEORGIA_DISCLOSURE_SOURCES = {
  getData: "https://forms.dch.georgia.gov/HFRD/GetFacilitiesData.svc/GetData",
  facilityFinder: "https://forms.dch.georgia.gov/HFRD/GaMap2Care.html",
  verifyLicense: "https://forms.dch.georgia.gov/hfrd/Verify_License.html",
  inspectionSearch:
    "https://weblink.dch.georgia.gov/WebLink/CustomSearch.aspx?SearchName=InspectionReportSearch&repo=WEB",
  facSearchXml: "https://forms.dch.georgia.gov/HFRD/FACSEARCH.aspx",
} as const;

export const GEORGIA_DISCLOSURE_FINDINGS = {
  rosterContainsFacilityUrlColumn: false,
  rosterContainsFacid: true,
  guessedDetailFromFacid: {
    patternsTried: [
      "Verify_License.html?FACID={FACID}",
      "GaMap2Care.html?FACID={FACID}",
      "FACSEARCH.aspx?FACID={FACID}",
      "WebLink InspectionReportSearch&FACID={FACID}",
    ],
    facilitySpecificPayloadObserved: false,
    acceptedAsDisclosurePrefix: false,
    note:
      "Verify_License and GaMap2Care ignore FACID query params. FACSEARCH.aspx returns a multi-facility XML dump, not a single-facility disclosure page. WebLink inspection search is a generic search form.",
  },
  inspectionSearchIsGeneric: true,
  mailingNotSubstitutedForPhysical: true,
  coordinatesGeocodedWithAccuracyField: true,
  coordinatesAreLicensingCoordinates: false,
  sourceAttributionRequired: true,
  unresolvedIneligible: true,
} as const;

export function evaluateGeorgiaDisclosureInvestigation(
  findings = GEORGIA_DISCLOSURE_FINDINGS,
) {
  return {
    observedOn: GEORGIA_DISCLOSURE_OBSERVED_ON,
    sources: GEORGIA_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified:
      findings.guessedDetailFromFacid.acceptedAsDisclosurePrefix,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "FACID is a stable identifier on the HFR GetData roster, but no FACID → stable facility disclosure URL prefix was verified. Inspection access remains a generic WebLink search.",
  };
}
