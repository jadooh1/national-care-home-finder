/**
 * Kentucky facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const KENTUCKY_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const KENTUCKY_DISCLOSURE_SOURCES = {
  alcXlsx:
    "https://www.chfs.ky.gov/agencies/os/oig/dhc/Documents/Assisted%20Living%20Community%20Directory.xlsx",
  hcfPage: "https://www.chfs.ky.gov/agencies/os/oig/dhc/Pages/hcf.aspx",
  ltcInspections: "https://www.chfs.ky.gov/agencies/os/oig/dhc/Pages/ltcinspections.aspx",
} as const;

export const KENTUCKY_DISCLOSURE_FINDINGS = {
  rosterContainsFacilityUrlColumn: false,
  rosterContainsLicenseNbr: true,
  blankLicenseRows: 1,
  oigDirectories: {
    url: "https://www.chfs.ky.gov/agencies/os/oig/dhc/Pages/hcf.aspx",
    monthlyPdfAndXlsx: true,
    facilitySpecificDetailPrefixVerified: false,
    note:
      "OIG publishes monthly ALC PDF/XLSX directories. No LICENSE # → stable facility disclosure / survey URL was verified for assisted living communities.",
  },
  guessedDetailFromLicenseNbr: {
    patternsTried: [
      "ltcinspections.aspx?license={LICENSE #}",
      "prd.chfs.ky.gov/FacilitySearch?license={LICENSE #}",
    ],
    facilitySpecificPayloadObserved: false,
    acceptedAsDisclosurePrefix: false,
  },
  nursingHomeCompareReferencedForNhOnly: true,
  coordinatesOnOfficialAlcDirectory: false,
  sourceAttributionRequired: true,
  unresolvedIneligible: true,
} as const;

export function evaluateKentuckyDisclosureInvestigation(
  findings = KENTUCKY_DISCLOSURE_FINDINGS,
) {
  return {
    observedOn: KENTUCKY_DISCLOSURE_OBSERVED_ON,
    sources: KENTUCKY_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified:
      findings.guessedDetailFromLicenseNbr.acceptedAsDisclosurePrefix,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "LICENSE # is present on most ALC type-rows, but no LICENSE # → facility disclosure URL prefix was verified.",
  };
}
