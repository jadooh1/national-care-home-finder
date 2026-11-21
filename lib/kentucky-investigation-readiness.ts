/**
 * Kentucky source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const KENTUCKY_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const KENTUCKY_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "november-2026-sheet-label-rejected-as-export",
  "http-last-modified-rejected-as-export",
  "no-verified-license-nbr-disclosure-prefix",
  "no-per-row-operating-status",
  "pending-renewal-is-not-status",
  "type-row-grain-not-campus",
  "blank-and-duplicate-license-numbers",
  "units-zero-row-and-no-campus-sum-rule",
  "no-coordinate-columns",
  "kentucky-alc-not-washington-afh",
  "publication-safeguards-closed",
] as const;

export const KENTUCKY_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for the ALC directory.",
  "Obtain a field dictionary for ALC / ALC-BH / ALC-DC type-rows and LICENSE # uniqueness rules.",
  "Decide how Pending Renewal and blank/duplicate LICENSE # rows are handled.",
  "Verify a LICENSE # → facility disclosure / survey URL for assisted living.",
  "Keep Personal Care Home, Family Care Home, and Long Term Care directories separate.",
  "Separate human approval before Kentucky publication or owner-claim enablement.",
] as const;

export const KENTUCKY_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  kentuckyDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "OIG Assisted Living Community Directory has 247 TYPE rows with addresses and UNITS, but ISO export date, LICENSE # uniqueness, operating status, disclosure prefix, and coordinates remain open. STOP.",
  mostActionableNextStep:
    "Ask Kentucky CHFS OIG for an authoritative ISO export/version stamp for the Assisted Living Community Directory, a field dictionary for ALC vs ALC-BH vs ALC-DC type-rows (including how duplicate LICENSE # and blank LICENSE # should be treated), confirmation whether Pending Renewal is an operating status, and whether LICENSE # maps to a stable facility disclosure / survey URL.",
} as const;

export function evaluateKentuckyInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: KENTUCKY_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    kentuckyDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...KENTUCKY_INVESTIGATION_BLOCKERS],
    futureApprovals: [...KENTUCKY_INVESTIGATION_FUTURE_APPROVALS],
    mostActionableNextStep: KENTUCKY_INVESTIGATION_STOP_GO.mostActionableNextStep,
  };
}

export function kentuckyInvestigationAllowsPublication(): false {
  return false;
}
