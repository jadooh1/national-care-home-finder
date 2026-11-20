/**
 * Georgia source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const GEORGIA_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const GEORGIA_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "getdata-missing-last-modified-and-export-stamp",
  "regulated-facilities-pdf-2020-rejected",
  "status-domain-only-active-variants",
  "closed-facilities-presence-unverified",
  "zero-capacity-and-alc-under-25-edge-cases",
  "geocoded-coordinates-not-licensing-coordinates",
  "no-verified-facid-disclosure-prefix",
  "pch-alc-category-mapping-to-washington-afh-refused",
  "publication-safeguards-closed",
] as const;

export const GEORGIA_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for HFR GetFacilitiesData.",
  "Verify a FACID → stable facility disclosure or inspection URL.",
  "Confirm whether closed/inactive facilities appear in GetData and define OPERSTDESC publication rules.",
  "Decide how PCH vs ALC and the 25-bed boundary edge cases enter the product taxonomy without equating them to WA AFH.",
  "Decide whether geocoded coordinates may appear on a map with Accuracy provenance; never invent geocodes.",
  "Separate human approval before Georgia publication or owner-claim enablement.",
] as const;

export const GEORGIA_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  georgiaDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "HFR GetData has strong PCH/ALC FACIDs, addresses, Active status, and geocoded coordinates (1,899 rows), but ISO export date, status completeness, FACID disclosure prefix, licensing-coordinate policy, and PCH/ALC mapping remain open. STOP.",
  mostActionableNextStep:
    "Ask Georgia DCH/HFRD for an authoritative ISO export/version stamp for the GetFacilitiesData roster, and confirm whether a stable FACID → facility disclosure or inspection URL exists outside generic search pages.",
} as const;

export function evaluateGeorgiaInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: GEORGIA_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    georgiaDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...GEORGIA_INVESTIGATION_BLOCKERS],
    futureApprovals: [...GEORGIA_INVESTIGATION_FUTURE_APPROVALS],
    mostActionableNextStep: GEORGIA_INVESTIGATION_STOP_GO.mostActionableNextStep,
  };
}

export function georgiaInvestigationAllowsPublication(): false {
  return false;
}
