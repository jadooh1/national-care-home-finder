/**
 * Florida source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const FLORIDA_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const FLORIDA_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "nightly-update-claim-and-page-date-rejected",
  "miami-dade-sample-stamp-not-statewide-alf-export",
  "doh-gis-2013-layer-rejected",
  "license-status-publication-mapping-open",
  "isclosed-false-on-inactive-and-suspended",
  "county-and-specialty-absent-from-list-embed",
  "coordinate-source-undescribed",
  "alf-afch-specialty-category-mapping-to-washington-afh-refused",
  "publication-safeguards-closed",
] as const;

export const FLORIDA_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for the statewide ALF roster that matches the FloridaHealthFinder embed.",
  "Define a LicenseStatus → publication rule that does not treat IsClosed=False alone as open.",
  "Decide whether list-embed coordinates may appear on a map with provenance labeling; never invent geocodes.",
  "Decide how ALF specialty licenses (ECC/LMH/LNS) and Adult Family Care Homes enter the product taxonomy without equating them to WA AFH.",
  "Confirm whether county should be joined from profile payloads or another AHCA field before publication.",
  "Separate human approval before Florida publication or owner-claim enablement.",
] as const;

export const FLORIDA_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  floridaDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "FloridaHealthFinder ALF embed has strong identifiers, addresses, capacity, LicenseStatus, and a verified Profile/?LID= disclosure prefix (3,025 rows), but ISO export date, status publication mapping, coordinate provenance, and ALF/AFCH/specialty category mapping remain open. STOP.",
  mostActionableNextStep:
    "Ask AHCA for an authoritative ISO export/version stamp for the statewide Assisted Living Facility roster (or a dated bulk file that matches the FloridaHealthFinder ALF embed), without inventing a date from the nightly-update claim or the Miami-Dade sample stamp.",
} as const;

export function evaluateFloridaInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: FLORIDA_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    floridaDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...FLORIDA_INVESTIGATION_BLOCKERS],
    futureApprovals: [...FLORIDA_INVESTIGATION_FUTURE_APPROVALS],
    mostActionableNextStep: FLORIDA_INVESTIGATION_STOP_GO.mostActionableNextStep,
  };
}

export function floridaInvestigationAllowsPublication(): false {
  return false;
}
