/**
 * North Carolina source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const NORTH_CAROLINA_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const NORTH_CAROLINA_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "listings-page-date-rejected",
  "workbook-as-of-label-rejected",
  "file-server-clock-rejected",
  "stale-fch-txt-rejected",
  "no-per-row-licensing-status",
  "star-rating-is-not-licensing-status",
  "expiry-date-is-not-licensing-status",
  "no-coordinate-columns",
  "no-verified-license-disclosure-prefix",
  "hal-fcl-category-mapping-to-washington-afh-refused",
  "publication-safeguards-closed",
] as const;

export const NORTH_CAROLINA_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for Ahlist.xlsx and Fchlist.xlsx.",
  "Verify a License # → stable facility disclosure URL, or accept search-only disclosure.",
  "Define a licensing/operating status rule that does not treat Star Rating or Expiry Date as status.",
  "Decide how HAL and FCL enter the product taxonomy without equating FCL to WA AFH.",
  "Decide whether official geocodes will be supplied; never invent coordinates.",
  "Separate human approval before North Carolina publication or owner-claim enablement.",
] as const;

export const NORTH_CAROLINA_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  northCarolinaDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "DHSR HAL/FCL workbooks have strong unique licenses and NC site addresses (1,086 rows), but ISO export date, per-row status, License # disclosure prefix, coordinates, and HAL/FCL mapping remain open. STOP.",
  mostActionableNextStep:
    "Ask NCDHHS DHSR for an authoritative ISO export/version stamp for Ahlist.xlsx and Fchlist.xlsx, and confirm whether a stable License # → facility disclosure URL exists outside the star-rating search.",
} as const;

export function evaluateNorthCarolinaInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: NORTH_CAROLINA_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    northCarolinaDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...NORTH_CAROLINA_INVESTIGATION_BLOCKERS],
    futureApprovals: [...NORTH_CAROLINA_INVESTIGATION_FUTURE_APPROVALS],
    mostActionableNextStep: NORTH_CAROLINA_INVESTIGATION_STOP_GO.mostActionableNextStep,
  };
}

export function northCarolinaInvestigationAllowsPublication(): false {
  return false;
}
