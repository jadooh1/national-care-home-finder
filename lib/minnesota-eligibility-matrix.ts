/**
 * Minnesota offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const MINNESOTA_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const MINNESOTA_ELIGIBILITY_COUNTS = {
  annualPdfAssistedLivingFacilityClasses:
    1083 + 566 + 310 + 6,
  facilityLevelRosterRowsObtained: 0,
  sampleRows: 0,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const MINNESOTA_PUBLICATION_REQUIREMENTS = [
  {
    id: "authoritative-facility-roster",
    requirement: "Obtain facility-level MDH roster (interactive recovery or documented download).",
    status: "blocked" as const,
    detail: "Interactive directory unavailable Nov 20–23 maintenance; no facility-level file obtained.",
  },
  {
    id: "physical-address",
    requirement: "Authoritative physical street, not mailing-only.",
    status: "blocked" as const,
    detail: "Published field outline labels ADDRESS as mailing street; physical field not verified this run.",
  },
  {
    id: "licensing-identifier",
    requirement: "Stable unique facility/license identifier (HFID or license number) per row.",
    status: "partial" as const,
    detail: "HFID documented as unique in field outline; not observed on facility rows this run.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row licensing status including provisional vs full AL classes.",
    status: "blocked" as const,
    detail: "Aggregate provisional counts exist in annual PDF; row-level status not sampled.",
  },
  {
    id: "capacity",
    requirement: "Per-facility capacity for selected categories.",
    status: "partial" as const,
    detail: "Annual PDF reports bed totals by class; ALL_CAPACITY documented but not sampled row-wise.",
  },
  {
    id: "coordinates",
    requirement: "Official coordinates only if present and defined as licensing coordinates.",
    status: "blocked" as const,
    detail: "Coordinate fields not verified this run; none invented.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure / survey URL construction.",
    status: "blocked" as const,
    detail: "Findings/survey pages exist; Facility-ID detail prefix not verified while interactive tools were offline.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp for the facility roster file.",
    status: "blocked" as const,
    detail: "Daily-update copy and PDF as-of 2026-03-13 are not an ISO export date for a downloadable roster. recordedExportDate=null.",
  },
  {
    id: "category-mapping",
    requirement: "Map MN classes without equating them to Washington AFH.",
    status: "blocked" as const,
    detail: "AL / AL Dementia / Provisional / Boarding Care / SLF / DHS programs are distinct. WA AFH equivalence refused.",
  },
] as const;

export const MINNESOTA_CATEGORY_MAPPING_RISKS = [
  "Assisted Living (144G) is not Washington adult family home.",
  "Assisted Living with Dementia Care is a separate license class.",
  "Provisional Assisted Living licenses are time-limited and survey-gated.",
  "Boarding Care Homes and Supervised Living Facilities are separate MDH classifications.",
  "DHS Licensing Information Lookup covers different residential/HCBS programs and must not be merged without an explicit crosswalk.",
  "Board and Lodging Special Services appears in the interactive directory type list; annual PDF Table 1 does not list a standalone facility count for that class.",
] as const;

export function buildMinnesotaEligibilityMatrix() {
  const c = MINNESOTA_ELIGIBILITY_COUNTS;
  return {
    observedOn: MINNESOTA_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "facility-roster-unavailable": true,
      "sample-rows": c.sampleRows,
      "publication-eligible": c.publicationEligible,
    },
    requirements: MINNESOTA_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...MINNESOTA_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
  };
}
