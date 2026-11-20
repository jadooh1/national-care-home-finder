/**
 * Virginia source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const VIRGINIA_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const VIRGINIA_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "capacity-absent-from-list-extract",
  "license-type-absent-from-list-extract",
  "license-type-code-domain-unmapped",
  "licensed-boolean-incomplete-status-domain",
  "no-coordinate-columns",
  "duplicate-license-id-row-on-list",
  "virginia-alf-not-washington-afh",
  "publication-safeguards-closed",
] as const;

export const VIRGINIA_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for the ALF Search roster.",
  "Obtain a licenseType code dictionary (1YR/2YR/3YR/COND/…) and closed-facility rules.",
  "Decide whether capacity must be on the list extract or may be joined from detail without statewide crawling.",
  "Decide coordinate policy; never invent geocodes.",
  "Separate human approval before Virginia publication or owner-claim enablement.",
] as const;

export const VIRGINIA_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  virginiaDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "VDSS ALF Search has 575 unique licenseIds with addresses and a verified licenseId disclosure prefix, but ISO export date, list-level capacity/licenseType, status-domain mapping, and coordinates remain open. STOP.",
  mostActionableNextStep:
    "Ask Virginia DSS Division of Licensing Programs for an authoritative ISO export/version stamp for the Assisted Living Facility Search roster, and for a field dictionary covering licenseType codes (1YR/2YR/3YR/COND/…) plus whether capacity can be included on the list extract without statewide detail crawling.",
} as const;

export function evaluateVirginiaInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: VIRGINIA_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    virginiaDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...VIRGINIA_INVESTIGATION_BLOCKERS],
    futureApprovals: [...VIRGINIA_INVESTIGATION_FUTURE_APPROVALS],
    mostActionableNextStep: VIRGINIA_INVESTIGATION_STOP_GO.mostActionableNextStep,
  };
}

export function virginiaInvestigationAllowsPublication(): false {
  return false;
}
