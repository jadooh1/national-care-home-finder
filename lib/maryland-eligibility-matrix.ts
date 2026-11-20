/**
 * Maryland offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const MARYLAND_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const MARYLAND_ELIGIBILITY_COUNTS = {
  excelRows: 1676,
  uniqueLicenseNumber: 1675,
  sampleRows: 32,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const MARYLAND_PUBLICATION_REQUIREMENTS = [
  {
    id: "licensing-identifier",
    requirement: "Stable unique License Number on the OHCQ Assisted Living Excel.",
    status: "observed-ok" as const,
    detail:
      "1,675 unique License Number values across 1,676 rows. One near-duplicate License Number AL-00064 appears twice (same address; minor licensee spelling difference).",
  },
  {
    id: "physical-address",
    requirement: "Street address present for listing.",
    status: "observed-ok" as const,
    detail:
      "Street Address, City, State, Zip Code present on all 1,676 Excel rows; blank Street Address 0.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row operating/licensing status domain.",
    status: "blocked" as const,
    detail:
      "No per-row licensing/operating status column on the OHCQ Assisted Living Excel. Membership on the licensee directory alone is incomplete for publication.",
  },
  {
    id: "capacity",
    requirement: "Licensed capacity for Assisted Living Programs.",
    status: "observed-ok" as const,
    detail:
      "Capacity present on all rows: 2–319 with 0 nullish/zero. Observed ≤16: 1,472; >16: 204. Capacity ≠ availability. Capacity bands are not invented small/large regulatory labels.",
  },
  {
    id: "category-mapping",
    requirement:
      "Keep Maryland ALP / Level of Care separate from Washington AFH; do not invent small/large labels.",
    status: "blocked" as const,
    detail:
      "Level of Care (Level 1/2/3) is present. Observed capacity ≤16 vs >16 bands are reported as source capacity splits only. Maryland ALP is not Washington adult family home.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail:
      "OHCQ Excel has no coordinate columns. IMAP/OP&R FeatureServer (1,568 rows) has X/Y but is rejected as a licensing roster and as licensing coordinates.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL from License Number.",
    status: "blocked" as const,
    detail:
      "No License Number → facility disclosure URL verified. Uniform Disclosure Statement is on-request, not a URL. MHCC SPA guessed detail routes return empty shells.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail:
      "Sheet name “as of 11-05-26”, directories page “Last Updated: November 16, 2026”, and HTTP Last-Modified Fri, 06 Nov 2026 are rejected as ISO export stamps. recordedExportDate=null.",
  },
] as const;

export const MARYLAND_CATEGORY_MAPPING_RISKS = [
  "Maryland Assisted Living Program (MDH OHCQ) is not Washington adult family home.",
  "Level of Care 1/2/3 is not the same axis as observed capacity ≤16 vs >16.",
  "Do not invent regulatory small/large program labels beyond observed Capacity and Level of Care source fields.",
  "IMAP/OP&R geocodes are not licensing coordinates and are not the OHCQ Excel roster.",
  "One blank Level of Care row and one AL-00064 near-duplicate must not silently rewrite identity.",
] as const;

export function buildMarylandEligibilityMatrix() {
  const c = MARYLAND_ELIGIBILITY_COUNTS;
  return {
    observedOn: MARYLAND_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "excel-rows": c.excelRows,
      "unique-license-number": c.uniqueLicenseNumber,
      "sample-rows": c.sampleRows,
      "publication-eligible": c.publicationEligible,
    },
    categoryResidualOk: true,
    requirements: MARYLAND_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...MARYLAND_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    mostActionableNextStep:
      "Ask Maryland Department of Health OHCQ for an authoritative ISO export/version stamp for the Assisted Living Excel licensee directory, and confirm whether a stable License Number → facility disclosure or survey URL exists (Uniform Disclosure Statement is currently on-request), plus publication rules for Level of Care and observed capacity ≤16 vs >16 bands.",
  };
}
