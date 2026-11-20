/**
 * Wisconsin AFH source-reconciliation readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const WISCONSIN_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const WISCONSIN_INVESTIGATION_BLOCKERS = [
  "excel-gis-identifier-reconciliation-incomplete",
  "gis-layer-is-not-the-accepted-directory",
  "ambiguous-duplicate-gis-wi-license-num",
  "gis-blank-wi-license-num",
  "no-per-row-licensing-status-column",
  "no-verified-facility-disclosure-url-prefix",
  "no-authoritative-iso-export-date",
  "http-last-modified-and-directory-updated-stamp-are-not-export-dates",
  "publication-safeguards-closed",
] as const;

export const WISCONSIN_INVESTIGATION_FUTURE_APPROVALS = [
  "Reconcile or authoritatively explain Excel-only and GIS-only identifier residuals.",
  "Resolve the two duplicate WI_LICENSE_NUM GIS keys and nine blank-license GIS features.",
  "Obtain a verified Facility-ID→disclosure URL construction (or accept Provider Search as search-only).",
  "Obtain an authoritative ISO export / version stamp for the AFH directory file.",
  "Map or document per-row licensing status independently of Class (AMBULATORY/AFH/NONAMBULATORY).",
  "Separate human approval before Wisconsin publication or owner-claim enablement.",
] as const;

export const WISCONSIN_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  wisconsinDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "Wisconsin Excel↔GIS reconciliation remains incomplete; disclosure prefix and ISO export date are absent. GIS is not the accepted directory. STOP.",
} as const;

export function evaluateWisconsinInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: WISCONSIN_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    wisconsinDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...WISCONSIN_INVESTIGATION_BLOCKERS],
    futureApprovals: [...WISCONSIN_INVESTIGATION_FUTURE_APPROVALS],
  };
}

export function wisconsinInvestigationAllowsPublication(): false {
  return false;
}
