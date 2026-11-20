/**
 * South Carolina offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const SOUTH_CAROLINA_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const SOUTH_CAROLINA_ELIGIBILITY_COUNTS = {
  crcfRows: 427,
  actRows: 427,
  sampleRows: 32,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const SOUTH_CAROLINA_PUBLICATION_REQUIREMENTS = [
  {
    id: "licensing-identifier",
    requirement: "Stable unique LICENSE_NBR on the CRCF FeatureServer filter.",
    status: "observed-ok" as const,
    detail: "427 unique LICENSE_NBR (CRC-####) and 427 unique PERMIT_EID; duplicate groups 0.",
  },
  {
    id: "physical-address",
    requirement: "Street, city, ZIP present for listing.",
    status: "observed-ok" as const,
    detail:
      "LF_STREET_ADDR1 / LF_STREET_CITY / LF_STREET_ZIP / LF_STREET_COUNTY present on all 427 rows.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row operating/licensing status domain.",
    status: "blocked" as const,
    detail:
      "PERMIT_OPERATING_CODE is ACT on all 427 CRCF rows. Expiration dates exist but are not operating status. Closed/non-ACT CRCF presence on the layer is unverified — treat as active-membership roster until a status dictionary is confirmed.",
  },
  {
    id: "capacity",
    requirement: "Licensed bed capacity for Community Residential Care Facilities.",
    status: "blocked" as const,
    detail:
      "NBR_LICENSED present on all rows (5–193). CRC_NBR_TOTAL_BEDS (alias Max # of Beds) is null on 272 and conflicts with NBR_LICENSED on 54 of 155 present rows. Do not invent or silently prefer one field without a field dictionary.",
  },
  {
    id: "category-mapping",
    requirement: "Keep CRCF separate from nursing homes, ICFs, and Washington AFH.",
    status: "blocked" as const,
    detail:
      "CRCF (HLRESIDENTIALCARE) is distinct from Nursing Homes (HLNURSINGCARE, 192) and ICF layers (HLHABITATIONR15/16). None is Washington adult family home. “Assisted living” marketing language must map to CRCF only when licensed as such.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail:
      "Point geometry present on all 427 rows (queried outSR=4326). Attribute X/Y are WGS84-like on 410 rows and non-WGS84 on 17. Coordinate source/accuracy undescribed — not accepted as licensing coordinates.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL from LICENSE_NBR.",
    status: "blocked" as const,
    detail:
      "Find a Facility / Experience Builder is map+CSV export. LICENSE_NBR query-string guesses return SPA shells without a verified facility-specific payload.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail:
      "FeatureServer editingInfo dataLastEditDate 2026-11-20T12:04:49Z and HTTP Last-Modified Fri, 20 Nov 2026 12:04:58 GMT are rejected as ISO export. CRCF program page “Updated: Nov. 17, 2026” is content freshness, not a roster export stamp. recordedExportDate=null.",
  },
] as const;

export const SOUTH_CAROLINA_CATEGORY_MAPPING_RISKS = [
  "South Carolina Community Residential Care Facility is not Washington adult family home.",
  "Nursing Homes (HLNURSINGCARE) must not be merged into CRCF.",
  "Intermediate Care Facilities (HLHABITATIONR15 / HLHABITATIONR16) must not be merged into CRCF.",
  "Marketing “assisted living” is not a separate license type — only CRCF-licensed facilities qualify.",
  "NBR_LICENSED and CRC_NBR_TOTAL_BEDS are not interchangeable without a field dictionary.",
  "ACT-only roster does not prove closed CRCFs are absent from licensing.",
] as const;

export function buildSouthCarolinaEligibilityMatrix() {
  const c = SOUTH_CAROLINA_ELIGIBILITY_COUNTS;
  return {
    observedOn: SOUTH_CAROLINA_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "community-residential-care-facility": c.crcfRows,
      ACT: c.actRows,
      "sample-rows": c.sampleRows,
      "publication-eligible": c.publicationEligible,
    },
    categoryResidualOk: true,
    requirements: SOUTH_CAROLINA_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...SOUTH_CAROLINA_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    mostActionableNextStep:
      "Ask South Carolina DPH Healthcare Quality for an authoritative ISO export/version stamp for the Health Facilities CRCF layer, a field dictionary distinguishing NBR_LICENSED vs CRC_NBR_TOTAL_BEDS, confirmation whether closed/non-ACT CRCFs appear on the layer, whether FeatureServer coordinates are licensing coordinates, and whether LICENSE_NBR maps to a stable facility disclosure URL.",
  };
}
