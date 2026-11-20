/**
 * Pennsylvania onboarding-investigation readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const PENNSYLVANIA_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const PENNSYLVANIA_INVESTIGATION_BLOCKERS = [
  "open-data-object-id-is-not-a-license-number",
  "no-facilities-id",
  "no-per-row-licensing-status",
  "catalog-timestamp-is-not-an-export-date",
  "no-authoritative-iso-export-date",
  "no-per-facility-disclosure-link-is-recorded",
  "letter-only-street-values-are-not-corrected",
  "street-additional-information-is-not-copied-into-the-street",
  "georeferenced-coordinates-are-not-licensing-coordinates",
] as const;

export const PENNSYLVANIA_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain license-number / status channel or confirm none exists for open-data rows.",
  "Adopt authoritative ISO export / version stamp (catalog timestamp is insufficient).",
  "Verify facility-specific disclosure permalinks before any public listing.",
  "Decide remediation policy for letter-only streets (do not invent numbers).",
  "Separate human approval before Pennsylvania publication or owner-claim enablement.",
] as const;

export const PENNSYLVANIA_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  pennsylvaniaDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "Pennsylvania onboarding investigation advanced offline evidence only. License number, status, export date, and facility disclosure remain unresolved. STOP.",
} as const;

export function evaluatePennsylvaniaInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: PENNSYLVANIA_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    pennsylvaniaDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    cdssFollowUpSent: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...PENNSYLVANIA_INVESTIGATION_BLOCKERS],
    futureApprovals: [...PENNSYLVANIA_INVESTIGATION_FUTURE_APPROVALS],
  };
}

export function pennsylvaniaInvestigationAllowsPublication(): false {
  return false;
}
