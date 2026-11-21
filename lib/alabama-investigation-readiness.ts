/**
 * Alabama source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const ALABAMA_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const ALABAMA_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "page-last-updated-and-export-filename-timestamp-rejected",
  "no-verified-fac-id-disclosure-prefix",
  "probational-status-unmapped",
  "closed-facility-presence-unverified",
  "no-coordinate-columns",
  "alf-scalf-campus-overlap-needs-rules",
  "alabama-alf-scalf-not-washington-afh",
  "publication-safeguards-closed",
] as const;

export const ALABAMA_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for ALF and SCALF Excel extracts.",
  "Confirm whether closed/non-Regular facilities appear in FacilitiesDirectory exports.",
  "Verify a Fac ID → facility disclosure / survey URL.",
  "Decide Probational publication rules and ALF vs SCALF campus handling.",
  "Separate human approval before Alabama publication or owner-claim enablement.",
] as const;

export const ALABAMA_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  alabamaDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "ADPH FacilitiesDirectory ALF (188) and SCALF (106) Excel exports have unique Fac IDs, complete addresses, License Status, and Licensed Beds, but ISO export date, Fac ID disclosure prefix, closed-facility coverage, coordinates, and ALF/SCALF campus rules remain open. STOP.",
  mostActionableNextStep:
    "Ask Alabama Department of Public Health Provider Services for an authoritative ISO export/version stamp for the FacilitiesDirectory ALF and SCALF Excel extracts, confirmation whether closed/non-Regular facilities appear in those exports, whether Fac ID maps to a stable facility disclosure / survey URL, and written rules for keeping ALF vs SCALF separate when campuses share an address.",
} as const;

export function evaluateAlabamaInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: ALABAMA_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    alabamaDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...ALABAMA_INVESTIGATION_BLOCKERS],
    futureApprovals: [...ALABAMA_INVESTIGATION_FUTURE_APPROVALS],
    mostActionableNextStep: ALABAMA_INVESTIGATION_STOP_GO.mostActionableNextStep,
  };
}

export function alabamaInvestigationAllowsPublication(): false {
  return false;
}
