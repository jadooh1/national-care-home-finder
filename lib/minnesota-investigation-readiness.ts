/**
 * Minnesota source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const MINNESOTA_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const MINNESOTA_INVESTIGATION_BLOCKERS = [
  "mdh-interactive-directory-unavailable-maintenance-window",
  "no-facility-level-roster-obtained",
  "no-facility-level-sample-this-run",
  "physical-vs-mailing-address-unverified-on-rows",
  "documented-address-field-is-mailing-street",
  "no-verified-facility-disclosure-url-prefix",
  "no-authoritative-iso-export-date-for-roster-file",
  "category-mapping-to-washington-afh-refused",
  "dhs-lookup-figures-still-unreconciled",
  "publication-safeguards-closed",
] as const;

export const MINNESOTA_INVESTIGATION_FUTURE_APPROVALS = [
  "Re-check MDH interactive directory / download file after the Nov 20–23 maintenance window.",
  "Verify HFID uniqueness, status, capacity, and address fields on a bounded facility-level sample.",
  "Confirm whether a non-mailing physical address field exists; do not adopt mailing as physical.",
  "Verify facility-specific disclosure/survey URL construction from official identifiers.",
  "Adopt an authoritative ISO export / version stamp for the facility roster file.",
  "Decide which MN license classes (if any) enter the product taxonomy without equating them to WA AFH.",
  "If DHS lookup remains in scope, reconcile profile-link vs rendered summary counts on a stable export.",
  "Separate human approval before Minnesota publication or owner-claim enablement.",
] as const;

export const MINNESOTA_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  minnesotaDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "Minnesota discovery verified MDH annual aggregates and category definitions, but no facility-level roster/sample was available during the interactive-directory maintenance window. STOP.",
} as const;

export function evaluateMinnesotaInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: MINNESOTA_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    minnesotaDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...MINNESOTA_INVESTIGATION_BLOCKERS],
    futureApprovals: [...MINNESOTA_INVESTIGATION_FUTURE_APPROVALS],
  };
}

export function minnesotaInvestigationAllowsPublication(): false {
  return false;
}
