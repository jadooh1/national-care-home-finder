/**
 * New Jersey offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * ALR, CPCH, and ALP are assessed as separate facility types.
 */

export const NEW_JERSEY_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const NEW_JERSEY_ELIGIBILITY_COUNTS = {
  alrRows: 256,
  cpchRows: 32,
  alpRows: 17,
  combinedRows: 305,
  sampleRows: 32,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const NEW_JERSEY_PUBLICATION_REQUIREMENTS = [
  {
    id: "licensing-identifier",
    requirement: "Stable unique FacID and LIC# on All_LTC.xlsx for ALR, CPCH, and ALP.",
    status: "observed-ok" as const,
    detail:
      "305 unique FacIDs and 305 unique LIC# values across ALR 256 / CPCH 32 / ALP 17. Cross-type FacID and LIC overlap 0.",
  },
  {
    id: "physical-address",
    requirement: "Street address present for listing.",
    status: "observed-ok" as const,
    detail: "ADDRESS and FAC_CITY present on all 305 ALR/CPCH/ALP rows; blank address 0.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row operating/licensing status domain.",
    status: "blocked" as const,
    detail:
      "Lic_Expires is present (license expiration) but is not an Active/Closed/Pending operating-status domain. Membership on the workbook alone is incomplete for publication.",
  },
  {
    id: "capacity-alr",
    requirement: "Licensed capacity for Assisted Living Residences.",
    status: "observed-ok" as const,
    detail: "ALR Lic_Beds_Slots 21–288 with 0 nullish/zero. Capacity ≠ availability.",
  },
  {
    id: "capacity-cpch",
    requirement: "Licensed capacity for Comprehensive Personal Care Homes.",
    status: "observed-ok" as const,
    detail: "CPCH Lic_Beds_Slots 16–308 with 0 nullish/zero. Capacity ≠ availability.",
  },
  {
    id: "capacity-alp",
    requirement: "Licensed capacity for Assisted Living Programs.",
    status: "blocked" as const,
    detail:
      "ALP Lic_Beds_Slots is 0 on all 17 rows. Do not invent ALP capacities. Capacity ≠ availability.",
  },
  {
    id: "category-mapping",
    requirement: "Keep ALR, CPCH, and ALP separate from each other and from Washington AFH.",
    status: "blocked" as const,
    detail:
      "ALR, CPCH, and ALP are distinct FACILITY_TYPE values with zero identifier overlap. Adult Family Care / Alternate Family Care is a separate type. None is Washington adult family home.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail:
      "LAT/LNG columns exist (ALR nonzero 246 / zero 10; CPCH 32/0; ALP 15/2). Coordinate source is undescribed and not accepted as licensing coordinates. Do not invent geocodes for zero cells.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL from FacID.",
    status: "observed-ok" as const,
    detail:
      "fsFacilityDetails.aspx?item={FacID} returns facility-specific license, address, type, expiration, and bed/slot fields for ALR, CPCH, and ALP (verified without a search session).",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail:
      "Workbook RunDate 2026-11-06 and HTTP Last-Modified Fri, 06 Nov 2026 are rejected as ISO export stamps. recordedExportDate=null.",
  },
] as const;

export const NEW_JERSEY_CATEGORY_MAPPING_RISKS = [
  "New Jersey Assisted Living Residence is not Washington adult family home.",
  "Comprehensive Personal Care Home is not Washington adult family home and is not ALR.",
  "Assisted Living Program is not Washington adult family home and is not ALR/CPCH.",
  "Adult Family Care / Alternate Family Care is a separate type and is not Washington AFH.",
  "ALP Lic_Beds_Slots=0 must not be rewritten into invented capacities.",
  "LAT/LNG are not accepted as licensing coordinates without provenance.",
] as const;

export function buildNewJerseyEligibilityMatrix() {
  const c = NEW_JERSEY_ELIGIBILITY_COUNTS;
  return {
    observedOn: NEW_JERSEY_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "assisted-living-residence": c.alrRows,
      "comprehensive-personal-care-home": c.cpchRows,
      "assisted-living-program": c.alpRows,
      "sample-rows": c.sampleRows,
      "publication-eligible": c.publicationEligible,
    },
    categoryResidualOk: true,
    requirements: NEW_JERSEY_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...NEW_JERSEY_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    mostActionableNextStep:
      "Ask New Jersey Department of Health for an authoritative ISO export/version stamp for All_LTC.xlsx, a field dictionary covering Lic_Expires vs operating status and ALP Lic_Beds_Slots=0, and whether LAT/LNG are licensing coordinates or geocodes.",
  };
}
