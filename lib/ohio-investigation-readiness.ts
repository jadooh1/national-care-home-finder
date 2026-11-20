/**
 * Ohio source-discovery readiness (unpublished).
 * Intentionally free of sibling runtime imports.
 */

export const OHIO_INVESTIGATION_OBSERVED_ON = "2026-11-20";

export const OHIO_INVESTIGATION_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "pdf-filename-and-server-dates-rejected-as-export",
  "arcgis-onesource-derivative-rejected-as-export",
  "no-verified-facid-or-stateid-disclosure-prefix",
  "detail-state-license-session-bound",
  "no-coordinate-columns-on-official-listing",
  "l17-cin-r-residue-in-rcf-extract",
  "status-publication-rule-unspecified",
  "ohio-rcf-not-washington-afh",
  "publication-safeguards-closed",
] as const;

export const OHIO_INVESTIGATION_FUTURE_APPROVALS = [
  "Obtain an authoritative ISO export / version stamp for the EID Facility Listing extract.",
  "Verify a STATEID or FACID → stable facility disclosure or survey URL.",
  "Decide ACTIVE vs ACTIVE-PENDING RENEWAL vs PENDING publication rules.",
  "Decide how CLOSED L17 / CIN-R residue is excluded without inventing category mapping.",
  "Decide whether any derivative geocode source may appear on a map with provenance; never invent geocodes.",
  "Separate human approval before Ohio publication or owner-claim enablement.",
] as const;

export const OHIO_INVESTIGATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  ohioDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  gate: "blocked" as const,
  reason:
    "ODH Facility Listing has strong L12 FACID/STATEID, addresses, OPERSTDESC, and ACTIVE capacities (1,152 L12 / 801 ACTIVE), but ISO export date, FACID/STATEID disclosure prefix, official coordinates, and RCF category mapping remain open. STOP.",
  mostActionableNextStep:
    "Ask Ohio Department of Health for an authoritative ISO export/version stamp for the EID Facility Listing extract (Residential Care or Assisted Living), and confirm whether a stable STATEID or FACID → Detail_StateLicense (or survey) URL exists outside the session-bound Provider Search path.",
} as const;

export function evaluateOhioInvestigationReadiness(qualityPass = true) {
  return {
    observedOn: OHIO_INVESTIGATION_OBSERVED_ON,
    qualityPass,
    ohioDirectoryReady: false as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    productionWrites: false as const,
    californiaRecrawl: false as const,
    exclusionActivation: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    blockers: [...OHIO_INVESTIGATION_BLOCKERS],
    futureApprovals: [...OHIO_INVESTIGATION_FUTURE_APPROVALS],
    mostActionableNextStep: OHIO_INVESTIGATION_STOP_GO.mostActionableNextStep,
  };
}

export function ohioInvestigationAllowsPublication(): false {
  return false;
}
