/**
 * Ohio facility disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const OHIO_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const OHIO_DISCLOSURE_SOURCES = {
  facilityListing: "https://publicapps.odh.ohio.gov/EID/reports/EID_Report_Criteria.aspx",
  providerSearch: "https://publicapps.odh.ohio.gov/EID/Provider_Search.aspx",
  searchResults: "https://publicapps.odh.ohio.gov/EID/Search_Results.aspx",
  detailStateLicense: "https://publicapps.odh.ohio.gov/EID/Detail_StateLicense.aspx",
} as const;

export const OHIO_DISCLOSURE_FINDINGS = {
  rosterContainsFacilityUrlColumn: false,
  rosterContainsFacid: true,
  rosterContainsStateId: true,
  guessedDetailFromIdentifier: {
    patternsTried: [
      "Detail_StateLicense.aspx?StateID={STATEID}",
      "Detail_StateLicense.aspx?stateid={STATEID}",
      "Detail_StateLicense.aspx?FACID={FACID}",
    ],
    facilitySpecificPayloadObserved: false,
    acceptedAsDisclosurePrefix: false,
    note:
      "Detail_StateLicense.aspx is session-bound after Provider_Search → Search_Results postback. Query-string FACID/STATEID guesses redirect to error.aspx. FACID (OHL#####) appears on the Facility Listing CSV but not on the State License detail page.",
  },
  stateIdSearchReturnsFacility: true,
  detailShowsLicensedCapacityAndStatus: true,
  mailingShownSeparatelyFromBusinessAddress: true,
  coordinatesOnOfficialListing: false,
  arcgisDerivativeCoordinatesRejectedAsLicensing: true,
  sourceAttributionRequired: true,
  unresolvedIneligible: true,
} as const;

export function evaluateOhioDisclosureInvestigation(
  findings = OHIO_DISCLOSURE_FINDINGS,
) {
  return {
    observedOn: OHIO_DISCLOSURE_OBSERVED_ON,
    sources: OHIO_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified:
      findings.guessedDetailFromIdentifier.acceptedAsDisclosurePrefix,
    mailingSubstitutionAllowed: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "FACID and STATEID are stable on the Facility Listing extract, but no FACID/STATEID → stable facility disclosure URL prefix was verified. Provider search remains a generic interactive path.",
  };
}
