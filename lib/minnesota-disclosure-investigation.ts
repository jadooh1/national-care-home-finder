/**
 * Minnesota disclosure / attribution investigation (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const MINNESOTA_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const MINNESOTA_DISCLOSURE_SOURCES = {
  mdhProviderSelect: "https://www.health.mn.gov/facilities/regulation/directory/providerselect.html",
  mdhProviderFindings: "https://www.health.mn.gov/facilities/regulation/directory/providerfindings.html",
  mdhAssistedLiving: "https://www.health.mn.gov/facilities/regulation/assistedliving/index.html",
  mdhAssistedLivingSurvey: "https://www.health.mn.gov/facilities/regulation/assistedliving/survey.html",
  dhsLicensingLookup: "https://licensinglookup.dhs.state.mn.us/Search.aspx",
  dhsAssistedLivingReportCard:
    "https://mn.gov/dhs/partners-and-providers/news-initiatives-reports-workgroups/aging/assisted-living-report-card/assisted-living-reports.jsp",
} as const;

export const MINNESOTA_DISCLOSURE_FINDINGS = {
  interactiveProviderDirectoryAvailableThisRun: false,
  facilitySpecificDetailPrefixVerifiedThisRun: false,
  providerFindingsPageReachable: true,
  surveyPagesExistForAssistedLiving: true,
  dhsLookupProfilePrefixFromPriorReview: "Details.aspx (prior next-state review; not re-verified this run)",
  dhsLookupReachableWithoutBotChallengeThisRun: false,
  annualPdfContainsFacilityDisclosureUrls: false,
  publicReuseNoticeOnProviderLookupPages: true,
  publicReuseNoticeText:
    "MDH Healthcare Provider Lookup states information is classified public and can be freely printed and distributed (page copy; interactive lookup unavailable this run).",
  sourceAttributionRequired: true,
  unresolvedIneligible: true,
} as const;

export function evaluateMinnesotaDisclosureInvestigation(
  findings = MINNESOTA_DISCLOSURE_FINDINGS,
) {
  return {
    observedOn: MINNESOTA_DISCLOSURE_OBSERVED_ON,
    sources: MINNESOTA_DISCLOSURE_SOURCES,
    findings,
    disclosurePrefixVerified: findings.facilitySpecificDetailPrefixVerifiedThisRun,
    allowsPublication: false as const,
    gate: "blocked" as const,
    note:
      "Survey/findings landing pages exist, but no Facility-ID→detail URL was verified while the interactive directory was offline. Prior DHS Details.aspx profile links remain unreconciliation-bound.",
  };
}
