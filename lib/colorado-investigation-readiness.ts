/**
 * Colorado source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const COLORADO_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const COLORADO_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "date-data-updated-and-layer-edit-clocks-rejected",
  "coordinates-are-address-geocode-not-licensing",
  "no-verified-facility-disclosure-url-prefix",
  "find-and-compare-is-search-dashboard-not-detail-prefix",
  "zero-bed-and-pending-hcpf-status-rules-unresolved",
  "category-mapping-to-washington-afh-refused",
  "publication-safeguards-closed",
] as const;

export const COLORADO_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for the CDPHE HFEMS facility roster (do not adopt portal Last-Modified, editingInfo, or uniform Date_Data_Updated).",
  "Decide whether Address_Full is accepted as physical facility street without a separate mailing field.",
  "Define product rules for Pending, HCPF Certified, zero-bed, ALR/ACF, and ALR/BISL rows before any eligibility counts.",
  "Verify a Facility_ID→stable inspection/occurrence detail URL (or accept that Find and Compare remains search-only).",
  "Decide whether geocoded Latitude/Longitude may appear on a map with provenance labeling, without treating them as licensing coordinates.",
  "Keep Nursing Facilities and other Factypes out of the ALR onboarding set unless a separate investigation adopts them.",
  "Separate human approval before Colorado publication or owner-claim enablement.",
] as const;

export const COLORADO_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  coloradoDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "Colorado ALR rows are filterable with strong identifier/address/status/capacity coverage, but ISO export date, licensing coordinates, disclosure prefix, and category-mapping decisions remain open. STOP.",
} as const;

export function evaluateColoradoInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: COLORADO_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    coloradoDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...COLORADO_INVESTIGATION_BLOCKERS],
    futureApprovals: [...COLORADO_INVESTIGATION_FUTURE_APPROVALS],
  };
}

export function coloradoInvestigationAllowsPublication(): false {
  return false;
}
