/**
 * Arizona source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const ARIZONA_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const ARIZONA_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "run-date-and-feb-2025-service-stamp-rejected",
  "coordinates-are-geocode-not-licensing",
  "no-verified-facility-disclosure-url-prefix",
  "azcarecheck-is-search-spa-not-detail-prefix",
  "license-effective-expiration-blank-on-gis-rows",
  "zero-capacity-home-rules-unresolved",
  "home-vs-center-and-afh-category-mapping-open",
  "publication-safeguards-closed",
] as const;

export const ARIZONA_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for the ADHS ASPEN→GIS extract (do not adopt RUN_DATE, Feb_2025 service names, or layer editingInfo).",
  "Verify a FACID/LICENSE_NUMBER→stable AZ Care Check (or successor) detail URL, or accept search-only disclosure.",
  "Confirm whether ADDRESS is physical facility street vs any mailing/licensee address field not present in GIS.",
  "Define product rules for zero-capacity Homes and for Directed/Personal/Supervisory subtypes.",
  "Decide whether Adult Foster Care (25) enters a later taxonomy without merging into Home/Center.",
  "Decide whether geocoded N_LAT/N_LON may appear on a map with provenance labeling.",
  "Separate human approval before Arizona publication or owner-claim enablement.",
] as const;

export const ARIZONA_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  arizonaDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "Arizona Assisted Living Home (1,719) and Center (328) GIS rows are filterable with identifiers/addresses/status/capacity, but ISO export date, licensing coordinates, disclosure prefix, and category-mapping decisions remain open. STOP.",
} as const;

export function evaluateArizonaInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: ARIZONA_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    arizonaDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...ARIZONA_INVESTIGATION_BLOCKERS],
    futureApprovals: [...ARIZONA_INVESTIGATION_FUTURE_APPROVALS],
  };
}

export function arizonaInvestigationAllowsPublication(): false {
  return false;
}
