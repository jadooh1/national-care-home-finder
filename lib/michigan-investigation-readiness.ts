/**
 * Michigan onboarding-investigation readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const MICHIGAN_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const MICHIGAN_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "file-server-last-modified-is-not-an-export-date",
  "blank-street-physical-address-unresolved",
  "supplemental-address-is-not-defined-as-a-physical-or-mailing-address",
  "xh-type-undescribed-and-exempt-ineligible",
  "publication-safeguards-closed",
] as const;

export const MICHIGAN_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain authoritative physical-address field definition (or Street population policy).",
  "Obtain authoritative XH / EXEMPT definition before any inclusion decision.",
  "Adopt ISO export / version stamp for afc_sw.txt.",
  "Separate human approval before Michigan publication or owner-claim enablement.",
] as const;

export const MICHIGAN_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  michiganDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "Michigan investigation confirmed blank-street and XH/EXEMPT blockers without authorizing publication. STOP.",
} as const;

export function evaluateMichiganInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: MICHIGAN_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    michiganDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...MICHIGAN_INVESTIGATION_BLOCKERS],
    futureApprovals: [...MICHIGAN_INVESTIGATION_FUTURE_APPROVALS],
  };
}

export function michiganInvestigationAllowsPublication(): false {
  return false;
}
