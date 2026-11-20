/**
 * New Jersey source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const NEW_JERSEY_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const NEW_JERSEY_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "rundate-and-http-last-modified-rejected-as-export",
  "no-per-row-operating-status-domain",
  "lic-expires-is-not-operating-status",
  "alp-lic-beds-slots-all-zero",
  "coordinates-undescribed-not-licensing",
  "zero-coordinate-rows-on-alr-and-alp",
  "alr-cpch-alp-must-stay-separate",
  "new-jersey-types-not-washington-afh",
  "publication-safeguards-closed",
] as const;

export const NEW_JERSEY_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for All_LTC.xlsx.",
  "Obtain a field dictionary for Lic_Expires vs Active/Closed operating status.",
  "Clarify ALP Lic_Beds_Slots=0 (slots elsewhere vs true zero capacity).",
  "Decide whether LAT/LNG may appear on a map with provenance; never invent geocodes.",
  "Keep ALR, CPCH, and ALP as separate categories in any future publication rules.",
  "Separate human approval before New Jersey publication or owner-claim enablement.",
] as const;

export const NEW_JERSEY_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  newJerseyDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "All_LTC.xlsx has strong FacID/LIC#, addresses, ALR/CPCH capacities, and a verified FacID disclosure prefix across ALR/CPCH/ALP (305 rows), but ISO export date, operating-status domain, ALP capacity zeros, and coordinate provenance remain open. STOP.",
  mostActionableNextStep:
    "Ask New Jersey Department of Health for an authoritative ISO export/version stamp for All_LTC.xlsx, a field dictionary covering Lic_Expires vs operating status and ALP Lic_Beds_Slots=0, and whether LAT/LNG are licensing coordinates or geocodes.",
} as const;

export function evaluateNewJerseyInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: NEW_JERSEY_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    newJerseyDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...NEW_JERSEY_INVESTIGATION_BLOCKERS],
    futureApprovals: [...NEW_JERSEY_INVESTIGATION_FUTURE_APPROVALS],
    mostActionableNextStep: NEW_JERSEY_INVESTIGATION_STOP_GO.mostActionableNextStep,
  };
}

export function newJerseyInvestigationAllowsPublication(): false {
  return false;
}
