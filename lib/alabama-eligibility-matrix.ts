/**
 * Alabama offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const ALABAMA_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const ALABAMA_ELIGIBILITY_COUNTS = {
  alfRows: 188,
  scalfRows: 106,
  combinedRows: 294,
  sampleRows: 32,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const ALABAMA_PUBLICATION_REQUIREMENTS = [
  {
    id: "licensing-identifier",
    requirement: "Stable unique Fac ID on ALF and SCALF exports.",
    status: "observed-ok" as const,
    detail:
      "ALF 188 unique Fac ID (D####) and SCALF 106 unique Fac ID (P####); overlap 0; duplicate groups 0.",
  },
  {
    id: "physical-address",
    requirement: "Street, city, ZIP present for listing.",
    status: "observed-ok" as const,
    detail: "Address Line 1 / City / ZIP / County present on all 294 ALF+SCALF rows.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row operating/licensing status domain.",
    status: "blocked" as const,
    detail:
      "License Status observed: ALF Regular 188; SCALF Regular 105 / Probational 1. Directory claims currently licensed facilities — closed-facility presence unverified. Probational needs an explicit publication rule.",
  },
  {
    id: "capacity",
    requirement: "Licensed bed capacity for ALF and SCALF.",
    status: "observed-ok" as const,
    detail:
      "Licensed Beds present on all rows (ALF 8–160; SCALF 12–104). Class 1 describes Family/Group/Congregate (and SCALF equivalents). Capacity ≠ availability.",
  },
  {
    id: "category-mapping",
    requirement: "Keep ALF separate from SCALF, nursing homes, and Washington AFH.",
    status: "blocked" as const,
    detail:
      "ALF (420-5-4) and SCALF (420-5-20) are separate license types (45 shared campus addresses observed). Nursing Homes (232) are a separate export. None is Washington adult family home.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail: "Excel exports have no coordinate columns. Do not invent geocodes.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL from Fac ID.",
    status: "blocked" as const,
    detail:
      "FacilitiesDirectory is search + Excel export. Fac ID detail URL patterns were not verified.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail:
      "Landing page “Page last updated: June 23, 2026” and Excel filename generation timestamps (e.g. ReportDirectoryExcelExport-2026-11-20-…) are rejected as ISO export. recordedExportDate=null.",
  },
] as const;

export const ALABAMA_CATEGORY_MAPPING_RISKS = [
  "Alabama Assisted Living Facility is not Washington adult family home.",
  "SCALF is a separate specialty-care license and must not be merged into ALF without rules.",
  "Nursing Homes are a separate FacilitiesDirectory type and must not be merged.",
  "Family / Group / Congregate Class 1 labels are size/class grains within ALF or SCALF.",
  "Probational is not the same as Regular for publication rules.",
  "Shared campus addresses between ALF and SCALF must not collapse Fac IDs.",
] as const;

export function buildAlabamaEligibilityMatrix() {
  const c = ALABAMA_ELIGIBILITY_COUNTS;
  return {
    observedOn: ALABAMA_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "assisted-living-facility": c.alfRows,
      "specialty-care-assisted-living-facility": c.scalfRows,
      combined: c.combinedRows,
      "sample-rows": c.sampleRows,
      "publication-eligible": c.publicationEligible,
    },
    categoryResidualOk: true,
    requirements: ALABAMA_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...ALABAMA_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    mostActionableNextStep:
      "Ask Alabama Department of Public Health Provider Services for an authoritative ISO export/version stamp for the FacilitiesDirectory ALF and SCALF Excel extracts, confirmation whether closed/non-Regular facilities appear in those exports, whether Fac ID maps to a stable facility disclosure / survey URL, and written rules for keeping ALF vs SCALF separate when campuses share an address.",
  };
}
