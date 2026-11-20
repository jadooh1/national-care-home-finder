/**
 * Virginia offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const VIRGINIA_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const VIRGINIA_ELIGIBILITY_COUNTS = {
  uniqueLicenseId: 575,
  listTotalReported: 576,
  sampleRows: 32,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const VIRGINIA_PUBLICATION_REQUIREMENTS = [
  {
    id: "licensing-identifier",
    requirement: "Stable unique licenseId on the ALF search roster.",
    status: "observed-ok" as const,
    detail:
      "575 unique licenseId values. One duplicate licenseId (53896) appears twice with the same name/address on the 576-row list response.",
  },
  {
    id: "physical-address",
    requirement: "Street address present for listing.",
    status: "observed-ok" as const,
    detail:
      "streetNumber + addressLine1 compose a non-blank address on all unique list rows; city/state/ZIP/county FIPS present.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row operating/licensing status domain.",
    status: "blocked" as const,
    detail:
      "List exposes licensed=true on all rows. Detail sample shows licenseType codes 1YR/2YR/3YR/COND and expirationDate, but Conditional/Provisional/Regular mapping and closed-facility presence on the list are unverified. licensed boolean alone is incomplete for publication.",
  },
  {
    id: "capacity",
    requirement: "Licensed capacity for Assisted Living Facilities.",
    status: "blocked" as const,
    detail:
      "Capacity is absent from the list extract. Bounded detail sample (n=32) observed capacities 4–225 with 0 nullish/zero — not extrapolated statewide. Capacity ≠ availability.",
  },
  {
    id: "category-mapping",
    requirement: "Keep Virginia ALF separate from Washington AFH.",
    status: "blocked" as const,
    detail:
      "VDSS Assisted Living Facility (four or more adults in congregate residential care) is not Washington adult family home.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail:
      "No coordinate fields on the list extract or on the bounded detail sample. Do not invent geocodes.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL from licenseId.",
    status: "observed-ok" as const,
    detail:
      "?licenseId={licenseId}&endpoint=alf on the Assisted Living Facility Search URL returns facilityLicense and inspectionsList (verified on 32/32 sample details).",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail:
      "No ISO export date on the search response. HTTP Last-Modified absent. Legacy alf.cgi redirects to licensed-care marketing pages. recordedExportDate=null.",
  },
] as const;

export const VIRGINIA_CATEGORY_MAPPING_RISKS = [
  "Virginia Assisted Living Facility (VDSS DOLP) is not Washington adult family home.",
  "licenseType codes 1YR/2YR/3YR/COND observed in sample are not yet mapped to Conditional/Provisional/Regular publication rules.",
  "List licensed=true does not by itself prove a closed/open domain.",
  "Capacity exists on detail pages only; must not invent list capacities from the sample.",
] as const;

export function buildVirginiaEligibilityMatrix() {
  const c = VIRGINIA_ELIGIBILITY_COUNTS;
  return {
    observedOn: VIRGINIA_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "unique-license-id": c.uniqueLicenseId,
      "sample-rows": c.sampleRows,
      "publication-eligible": c.publicationEligible,
    },
    categoryResidualOk: true,
    requirements: VIRGINIA_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...VIRGINIA_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    mostActionableNextStep:
      "Ask Virginia DSS Division of Licensing Programs for an authoritative ISO export/version stamp for the Assisted Living Facility Search roster, and for a field dictionary covering licenseType codes (1YR/2YR/3YR/COND/…) plus whether capacity can be included on the list extract without statewide detail crawling.",
  };
}
