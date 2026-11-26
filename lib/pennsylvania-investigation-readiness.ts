/**
 * Pennsylvania onboarding-investigation readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const PENNSYLVANIA_INVESTIGATION_OBSERVED_ON = "2026-11-26";

export const PENNSYLVANIA_INVESTIGATION_BLOCKERS = [
  "open-data-object-id-is-not-a-license-number",
  "no-facilities-id",
  "no-per-row-licensing-status",
  "catalog-timestamp-is-not-an-export-date",
  "no-authoritative-iso-export-date",
  "no-per-facility-disclosure-link-is-recorded",
  "thirteen-letter-only-streets-deterministically-excluded",
  "street-additional-information-is-not-copied-into-the-street",
  "georeferenced-coordinates-are-not-licensing-coordinates",
] as const;

export const PENNSYLVANIA_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain license-number / status channel or confirm none exists for open-data rows.",
  "Adopt authoritative ISO export / version stamp (catalog clock moved while CSV sha256 stayed identical — still not an export date).",
  "Verify facility-specific disclosure permalinks before any public listing (Object ID ≠ license number).",
  "Letter-only streets are deterministically excluded; do not invent house numbers.",
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
    "989-row PCH roster re-verified (content unchanged). Thirteen letter-only streets deterministically excluded. License number, status, ISO export date, and facility disclosure remain unresolved. publicationEligible=0. STOP.",
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
