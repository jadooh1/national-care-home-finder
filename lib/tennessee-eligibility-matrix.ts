/**
 * Tennessee offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const TENNESSEE_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const TENNESSEE_ELIGIBILITY_COUNTS = {
  aclfRows: 333,
  licensedRows: 331,
  sampleRows: 32,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const TENNESSEE_PUBLICATION_REQUIREMENTS = [
  {
    id: "licensing-identifier",
    requirement: "Stable unique lic_no on the ACLF Full Bed Report.",
    status: "observed-ok" as const,
    detail: "333 unique lic_no values; duplicate groups 0.",
  },
  {
    id: "physical-address",
    requirement: "Street address present for listing.",
    status: "blocked" as const,
    detail:
      "street present on all 333 rows, but city is blank on 7 rows (city often embedded in street). Do not invent city values. state is blank on some rows where city concatenated “HendersonvilleTN”.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row operating/licensing status domain.",
    status: "observed-ok" as const,
    detail:
      "lic_status observed: Licensed (331), On Probation (1), LLC Licensed (1). Publication still needs an explicit status rule for On Probation and LLC Licensed.",
  },
  {
    id: "capacity",
    requirement: "Licensed bed capacity for Assisted Care Living Facilities.",
    status: "observed-ok" as const,
    detail:
      "total_beds 6–184 with 0 nullish/zero. ACLF_secured and ACLF_adultday present. Capacity ≠ availability.",
  },
  {
    id: "category-mapping",
    requirement: "Keep ACLF separate from RHA, nursing homes, and Washington AFH.",
    status: "blocked" as const,
    detail:
      "ACLF is distinct from Residential Home for the Aged and Nursing Home reports. None is Washington adult family home.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail: "ACLF Full Bed Report has no coordinate columns. Do not invent geocodes.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL from lic_no.",
    status: "blocked" as const,
    detail:
      "FacilityListings search exists but no lic_no → detail URL was verified (agent egress 403; query-string guesses failed).",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail:
      "HFC index labels the latest ACLF report “October 2026”; that month label is not an ISO export date. HTTP Last-Modified unavailable (egress 403). recordedExportDate=null. Undated RHA PDF extract shows footer Generated May 25, 2022 and is not accepted as the October 2026 RHA roster.",
  },
] as const;

export const TENNESSEE_CATEGORY_MAPPING_RISKS = [
  "Tennessee Assisted Care Living Facility is not Washington adult family home.",
  "Residential Home for the Aged is a separate license type and must not be merged into ACLF.",
  "Nursing Home Full Bed Report is a separate type and must not be merged into ACLF.",
  "lic_status “LLC Licensed” is not the same as “Licensed” without a field dictionary.",
  "On Probation is not the same as Licensed for publication rules.",
  "Blank city / concatenated city+state cells must not be silently rewritten.",
] as const;

export function buildTennesseeEligibilityMatrix() {
  const c = TENNESSEE_ELIGIBILITY_COUNTS;
  return {
    observedOn: TENNESSEE_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "assisted-care-living-facility": c.aclfRows,
      licensed: c.licensedRows,
      "sample-rows": c.sampleRows,
      "publication-eligible": c.publicationEligible,
    },
    categoryResidualOk: true,
    requirements: TENNESSEE_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...TENNESSEE_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    mostActionableNextStep:
      "Ask Tennessee Health Facilities Commission for an authoritative ISO export/version stamp for the ACLF Full Bed Report PDF, confirm whether FacilityListings exposes a stable lic_no → facility disclosure URL, and reconcile the undated RHA-Full-Beds-Report.pdf (footer Generated May 25, 2022) to the October 2026 index label.",
  };
}
