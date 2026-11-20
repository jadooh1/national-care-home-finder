/**
 * Maryland source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const MARYLAND_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const MARYLAND_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "sheet-as-of-and-page-updated-rejected-as-export",
  "http-last-modified-rejected-as-export",
  "no-per-row-licensing-status-column",
  "no-verified-license-number-disclosure-prefix",
  "uniform-disclosure-on-request-not-url",
  "no-coordinate-columns-on-ohcq-excel",
  "imap-opr-derivative-rejected-as-licensing-roster-and-coords",
  "level-of-care-and-capacity-band-publication-rules-unspecified",
  "maryland-alp-not-washington-afh",
  "publication-safeguards-closed",
] as const;

export const MARYLAND_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for the OHCQ Assisted Living Excel.",
  "Verify a License Number → stable facility disclosure or survey URL.",
  "Decide Level of Care and capacity ≤16 vs >16 publication rules without inventing small/large labels.",
  "Decide whether any derivative geocode source may appear on a map with provenance; never invent geocodes.",
  "Separate human approval before Maryland publication or owner-claim enablement.",
] as const;

export const MARYLAND_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  marylandDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "OHCQ Assisted Living Excel has 1,675 unique License Numbers with addresses, capacities, and Level of Care, but ISO export date, per-row status, License Number disclosure prefix, and official coordinates remain open. STOP.",
  mostActionableNextStep:
    "Ask Maryland Department of Health OHCQ for an authoritative ISO export/version stamp for the Assisted Living Excel licensee directory, and confirm whether a stable License Number → facility disclosure or survey URL exists (Uniform Disclosure Statement is currently on-request), plus publication rules for Level of Care and observed capacity ≤16 vs >16 bands.",
} as const;

export function evaluateMarylandInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: MARYLAND_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    marylandDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...MARYLAND_INVESTIGATION_BLOCKERS],
    futureApprovals: [...MARYLAND_INVESTIGATION_FUTURE_APPROVALS],
    mostActionableNextStep: MARYLAND_INVESTIGATION_STOP_GO.mostActionableNextStep,
  };
}

export function marylandInvestigationAllowsPublication(): false {
  return false;
}
