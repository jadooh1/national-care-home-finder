/**
 * Massachusetts source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const MASSACHUSETTS_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const MASSACHUSETTS_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "title-as-of-and-http-last-modified-rejected-as-export",
  "no-certification-identifier-column",
  "federal-ein-not-facility-certification-id",
  "name-derived-disclosure-slug-fragile",
  "no-coordinate-columns-on-certified-list",
  "massgis-ltc-derivative-rejected-as-roster-and-coords",
  "status-anomaly-row-whitney-suites",
  "massachusetts-alr-not-dph-license-or-washington-afh",
  "publication-safeguards-closed",
] as const;

export const MASSACHUSETTS_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for the certified ALR Excel list.",
  "Obtain a stable certification/facility identifier distinct from ALR Name and Federal EIN.",
  "Decide whether name-derived mass.gov/locations slugs are acceptable disclosure keys.",
  "Decide whether MassGIS points may appear on a map with provenance; never invent geocodes.",
  "Keep ALR certification separate from DPH nursing/rest homes and MassHealth AFC.",
  "Separate human approval before Massachusetts publication or owner-claim enablement.",
] as const;

export const MASSACHUSETTS_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  massachusettsDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "EOEA certified ALR list has 271 Certified residences with addresses, unit counts (including SCR), status, and name-derived location disclosure pages, but ISO export date, stable certification identifier, and official coordinates remain open. STOP.",
  mostActionableNextStep:
    "Ask Massachusetts Executive Office of Aging & Independence for an authoritative ISO export/version stamp for the certified ALR list, and for a stable certification/facility identifier column (not ALR Name or shared Federal EIN), plus whether MassGIS coordinates may be used with explicit provenance.",
} as const;

export function evaluateMassachusettsInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: MASSACHUSETTS_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    massachusettsDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...MASSACHUSETTS_INVESTIGATION_BLOCKERS],
    futureApprovals: [...MASSACHUSETTS_INVESTIGATION_FUTURE_APPROVALS],
    mostActionableNextStep: MASSACHUSETTS_INVESTIGATION_STOP_GO.mostActionableNextStep,
  };
}

export function massachusettsInvestigationAllowsPublication(): false {
  return false;
}
