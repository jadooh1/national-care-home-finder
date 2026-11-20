/**
 * South Carolina source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const SOUTH_CAROLINA_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const SOUTH_CAROLINA_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "data-last-edit-and-http-last-modified-rejected-as-export",
  "no-verified-license-nbr-disclosure-prefix",
  "find-facility-search-and-csv-export-only",
  "nbr-licensed-vs-crc-max-beds-conflict",
  "act-only-status-closed-presence-unverified",
  "coordinates-undescribed-not-accepted-as-licensing",
  "xy-attribute-mixed-crs-on-17-rows",
  "south-carolina-crcf-not-washington-afh",
  "publication-safeguards-closed",
] as const;

export const SOUTH_CAROLINA_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for the CRCF FeatureServer extract.",
  "Obtain a field dictionary for NBR_LICENSED vs CRC_NBR_TOTAL_BEDS.",
  "Confirm whether closed/non-ACT CRCFs appear on the Health Facilities layer.",
  "Verify a LICENSE_NBR → facility disclosure URL (or accept map+CSV-only attribution).",
  "Confirm whether FeatureServer point geometry may be used as licensing coordinates with provenance.",
  "Separate human approval before South Carolina publication or owner-claim enablement.",
] as const;

export const SOUTH_CAROLINA_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  southCarolinaDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "DPH Health Facilities CRCF filter has 427 unique LICENSE_NBR values with complete streets, ACT operating codes, NBR_LICENSED capacities, and point geometry, but ISO export date, LICENSE_NBR disclosure prefix, capacity-field dictionary, closed-facility status coverage, and licensing-coordinate provenance remain open. STOP.",
  mostActionableNextStep:
    "Ask South Carolina DPH Healthcare Quality for an authoritative ISO export/version stamp for the Health Facilities CRCF layer, a field dictionary distinguishing NBR_LICENSED vs CRC_NBR_TOTAL_BEDS, confirmation whether closed/non-ACT CRCFs appear on the layer, whether FeatureServer coordinates are licensing coordinates, and whether LICENSE_NBR maps to a stable facility disclosure URL.",
} as const;

export function evaluateSouthCarolinaInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: SOUTH_CAROLINA_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    southCarolinaDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...SOUTH_CAROLINA_INVESTIGATION_BLOCKERS],
    futureApprovals: [...SOUTH_CAROLINA_INVESTIGATION_FUTURE_APPROVALS],
    mostActionableNextStep:
      SOUTH_CAROLINA_INVESTIGATION_STOP_GO.mostActionableNextStep,
  };
}

export function southCarolinaInvestigationAllowsPublication(): false {
  return false;
}
