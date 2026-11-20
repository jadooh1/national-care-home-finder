/**
 * Tennessee source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const TENNESSEE_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const TENNESSEE_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "october-2026-report-label-rejected-as-export",
  "http-last-modified-unavailable",
  "no-verified-lic-no-disclosure-prefix",
  "facility-listings-search-only",
  "no-coordinate-columns",
  "blank-city-and-concatenated-city-state-cells",
  "llc-licensed-status-unmapped",
  "rha-undated-pdf-may-2022-footer-vs-october-2026-index",
  "tennessee-aclf-not-washington-afh",
  "publication-safeguards-closed",
] as const;

export const TENNESSEE_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for the ACLF Full Bed Report.",
  "Verify a lic_no → FacilityListings (or survey) disclosure URL.",
  "Decide Licensed vs On Probation vs LLC Licensed publication rules.",
  "Decide how blank city / concatenated city+state cells are handled without inventing values.",
  "Reconcile RHA report currency separately from ACLF; never merge types.",
  "Separate human approval before Tennessee publication or owner-claim enablement.",
] as const;

export const TENNESSEE_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  tennesseeDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "HFC ACLF Full Bed Report has 333 unique lic_no values with streets, lic_status, and beds, but ISO export date, lic_no disclosure prefix, coordinates, and address-field cleanup remain open. STOP.",
  mostActionableNextStep:
    "Ask Tennessee Health Facilities Commission for an authoritative ISO export/version stamp for the ACLF Full Bed Report PDF, confirm whether FacilityListings exposes a stable lic_no → facility disclosure URL, and reconcile the undated RHA-Full-Beds-Report.pdf (footer Generated May 25, 2022) to the October 2026 index label.",
} as const;

export function evaluateTennesseeInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: TENNESSEE_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    tennesseeDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...TENNESSEE_INVESTIGATION_BLOCKERS],
    futureApprovals: [...TENNESSEE_INVESTIGATION_FUTURE_APPROVALS],
    mostActionableNextStep: TENNESSEE_INVESTIGATION_STOP_GO.mostActionableNextStep,
  };
}

export function tennesseeInvestigationAllowsPublication(): false {
  return false;
}
