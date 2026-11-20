/**
 * Ohio offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const OHIO_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const OHIO_ELIGIBILITY_COUNTS = {
  l12Rows: 1152,
  activeRows: 801,
  sampleRows: 32,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const OHIO_PUBLICATION_REQUIREMENTS = [
  {
    id: "licensing-identifier",
    requirement: "Stable unique FACID (OHL#####) and STATEID (####R).",
    status: "observed-ok" as const,
    detail:
      "1,152 unique L12 FACIDs. STATEID can be reused across closed/active generations (3 reuse groups observed); FACID is the better unique key.",
  },
  {
    id: "physical-address",
    requirement: "Street address present for listing.",
    status: "observed-ok" as const,
    detail: "ADDRESS present on all 1,152 L12 rows; ACTIVE blank address 0.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row operating/licensing status domain.",
    status: "observed-ok" as const,
    detail:
      "OPERSTDESC present with ACTIVE (801), ACTIVE - PENDING RENEWAL (16), PENDING (26), and CLOSED-* (309) with CLOSEDDATE on closed rows. Publication still needs an explicit status rule.",
  },
  {
    id: "capacity",
    requirement: "Licensed bed capacity for Residential Care Facilities.",
    status: "blocked" as const,
    detail:
      "ACTIVE beds 5–508 with 0 nullish/zero. Broader L12 has 139 nullish beds (mostly non-ACTIVE). Capacity ≠ availability.",
  },
  {
    id: "category-mapping",
    requirement: "Keep Ohio RCF separate from Washington AFH; handle L17/CIN-R residue.",
    status: "blocked" as const,
    detail:
      "RCF under ORC 3721 / OAC 3701-16 is not Washington AFH. Five CLOSED FACTYPE L17 / CIN-R rows in the same extract must not silently rewrite category.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail:
      "Facility Listing CSV has no coordinate columns. OEMA ArcGIS OneSource republish has lat/long but is a derivative geocode set, not accepted as licensing coordinates.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL from FACID or STATEID.",
    status: "blocked" as const,
    detail:
      "Detail_StateLicense.aspx is session-bound after search postback. Query-string FACID/STATEID guesses fail. FACID is absent from the detail page.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail:
      "No ISO export date. PDF filename timestamp, HTTP Last-Modified, server deploy 10/4/2026, software release 01/27/2026, ArcGIS dataLastEditDate 2026-10-05, and program-page “approximately 720” are rejected as export stamps.",
  },
] as const;

export const OHIO_CATEGORY_MAPPING_RISKS = [
  "Ohio Residential Care Facility (ORC 3721 / OAC 3701-16) is not Washington adult family home.",
  "FACTYPE L12 / SL-R is the Residential Care listing type; CLOSED L17 / CIN-R residue must stay separate.",
  "STATEID reuse across facility generations must not collapse distinct FACIDs.",
  "ACTIVE - PENDING RENEWAL is not the same as ACTIVE for publication rules.",
  "ArcGIS OneSource lat/long are not licensing coordinates.",
] as const;

export function buildOhioEligibilityMatrix() {
  const c = OHIO_ELIGIBILITY_COUNTS;
  return {
    observedOn: OHIO_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "l12-residential-care": c.l12Rows,
      "active": c.activeRows,
      "sample-rows": c.sampleRows,
      "publication-eligible": c.publicationEligible,
    },
    categoryResidualOk: true,
    requirements: OHIO_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...OHIO_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    mostActionableNextStep:
      "Ask Ohio Department of Health for an authoritative ISO export/version stamp for the EID Facility Listing extract (Residential Care or Assisted Living), and confirm whether a stable STATEID or FACID → Detail_StateLicense (or survey) URL exists outside the session-bound Provider Search path.",
  };
}
