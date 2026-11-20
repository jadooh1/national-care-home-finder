/**
 * Texas source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const TEXAS_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const TEXAS_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "as-of-label-and-file-clock-rejected",
  "facility-licensed-yes-not-operating-status",
  "closures-pdf-zero-overlap-does-not-set-active-status",
  "no-verified-tulip-disclosure-url-prefix",
  "workbook-missing-account-id",
  "geo-comma-cells-and-undescribed-coordinate-source",
  "type-a-b-c-category-mapping-to-washington-afh-refused",
  "publication-safeguards-closed",
] as const;

export const TEXAS_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for the HHSC active ALF workbook (do not rewrite 11/19/2026 to 2026-11-19).",
  "Verify a Facility ID or License No → stable TULIP detail URL, or accept search-only disclosure.",
  "Define an operating-status rule that does not treat Facility Licensed=YES alone as open/closed.",
  "Decide how Type A / B / C and Alzheimer-certified subsets enter the product taxonomy without equating them to WA AFH.",
  "Decide whether Geo Location pairs may appear on a map with provenance labeling; never invent geocodes for comma-only cells.",
  "Separate human approval before Texas publication or owner-claim enablement.",
] as const;

export const TEXAS_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  texasDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "Texas active ALF workbook has strong identifier/address/capacity coverage (2,019 rows), but ISO export date, operating-status semantics, TULIP disclosure prefix, and Type A/B/C mapping remain open. STOP.",
  mostActionableNextStep:
    "Ask HHSC for an authoritative ISO export/version stamp for al.xlsx, and confirm whether TULIP detail URLs can be formed without workbook account ids.",
} as const;

export function evaluateTexasInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: TEXAS_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    texasDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...TEXAS_INVESTIGATION_BLOCKERS],
    futureApprovals: [...TEXAS_INVESTIGATION_FUTURE_APPROVALS],
    mostActionableNextStep: TEXAS_INVESTIGATION_STOP_GO.mostActionableNextStep,
  };
}

export function texasInvestigationAllowsPublication(): false {
  return false;
}
