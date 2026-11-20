/**
 * Massachusetts offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const MASSACHUSETTS_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const MASSACHUSETTS_ELIGIBILITY_COUNTS = {
  certifiedUsableRows: 271,
  statusAnomalyRows: 1,
  sampleRows: 32,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const MASSACHUSETTS_PUBLICATION_REQUIREMENTS = [
  {
    id: "certification-identifier",
    requirement: "Stable unique certification / facility identifier.",
    status: "blocked" as const,
    detail:
      "No certification-number column on the EOEA list. ALR Name is unique among 271 Certified rows but is not a regulatory id. Federal ID # is an EIN and is shared across residences (14 shared-EIN groups).",
  },
  {
    id: "physical-address",
    requirement: "Street address present for listing.",
    status: "observed-ok" as const,
    detail: "Address and City present on all 271 Certified usable rows.",
  },
  {
    id: "certification-status",
    requirement: "Per-row certification / operating status domain.",
    status: "observed-ok" as const,
    detail:
      "Status=Certified on 271 usable rows. One anomaly row (Whitney Suites at Westborough) has Status shifted to a date and is excluded from the usable count. Closed/suspended presence on the list is unverified beyond this capture.",
  },
  {
    id: "capacity-units",
    requirement: "Certified unit counts (not beds).",
    status: "observed-ok" as const,
    detail:
      "Total # of Units 8–173 on Certified rows; Traditional + SCR sum equals Total on all Certified rows. Units ≠ beds and ≠ availability.",
  },
  {
    id: "special-care",
    requirement: "Preserve special-care unit designation from source.",
    status: "observed-ok" as const,
    detail:
      "# SCR Units present (204 Certified with SCR>0; 67 with SCR=0). Do not invent a separate license type from SCR counts.",
  },
  {
    id: "category-mapping",
    requirement: "Keep EOEA ALR certification separate from DPH licenses and WA AFH.",
    status: "blocked" as const,
    detail:
      "EOEA/AGE ALR certification is not a DPH nursing-home or rest-home license, not MassHealth adult foster care, and not Washington adult family home.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail:
      "Certified Excel list has no coordinate columns. MassGIS Long-Term Care Residences (March 2024 / Oct–Nov 2023 listings) mixes NH/RH/ALR and is rejected as licensing coordinates.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL.",
    status: "observed-ok" as const,
    detail:
      "https://www.mass.gov/locations/{slug-from-alr-name} returns facility-specific address and unit fields (verified on bounded samples). Slug is name-derived because no certification id exists.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail:
      "Title “as of June 25, 2026”, HTTP Last-Modified Tue, 14 Jul 2026, and per-row Date of Last Update are rejected as ISO export stamps. April 2025 doc URL redirects to the June 2026 file. recordedExportDate=null.",
  },
] as const;

export const MASSACHUSETTS_CATEGORY_MAPPING_RISKS = [
  "Massachusetts EOEA/AGE Assisted Living Residence certification is not Washington adult family home.",
  "ALR certification is not a DPH nursing-home or rest-home license.",
  "MassHealth adult foster care is a different program and is not this ALR roster.",
  "Federal EIN is not a facility certification identifier.",
  "SCR unit counts are not a separate license category.",
  "MassGIS LTC points mix NH/RH/ALR and are stale relative to the June 2026 list.",
] as const;

export function buildMassachusettsEligibilityMatrix() {
  const c = MASSACHUSETTS_ELIGIBILITY_COUNTS;
  return {
    observedOn: MASSACHUSETTS_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "certified-usable": c.certifiedUsableRows,
      "status-anomaly": c.statusAnomalyRows,
      "sample-rows": c.sampleRows,
      "publication-eligible": c.publicationEligible,
    },
    categoryResidualOk: true,
    requirements: MASSACHUSETTS_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...MASSACHUSETTS_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    mostActionableNextStep:
      "Ask Massachusetts Executive Office of Aging & Independence for an authoritative ISO export/version stamp for the certified ALR list, and for a stable certification/facility identifier column (not ALR Name or shared Federal EIN), plus whether MassGIS coordinates may be used with explicit provenance.",
  };
}
