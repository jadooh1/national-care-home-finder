/**
 * Arizona offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const ARIZONA_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const ARIZONA_ELIGIBILITY_COUNTS = {
  assistedLivingHomeRows: 1719,
  assistedLivingCenterRows: 328,
  combinedHomeCenterRows: 2047,
  sampleRows: 27,
  adultFosterCareNotedNotAdopted: 25,
  zeroCapacityHome: 3,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const ARIZONA_PUBLICATION_REQUIREMENTS = [
  {
    id: "home-center-separation",
    requirement: "Keep Assisted Living Home and Center as distinct categories (ARS §36-401).",
    status: "observed-ok" as const,
    detail:
      "Separate FeatureServers: Home 1,719 (capacity ≤10) and Center 328 (capacity ≥13). Zero FACID overlap.",
  },
  {
    id: "licensing-identifier",
    requirement: "Stable unique FACID / LICENSE_NUMBER per row; preserve string IDs.",
    status: "observed-ok" as const,
    detail:
      "FACID and LICENSE_NUMBER unique within each category; FACID==KeyID. ZIP stored as integer (AZ 85xxx range observed; leading-zero ZIP risk not expressed in this sample).",
  },
  {
    id: "physical-address",
    requirement: "Facility street/city/ZIP present; do not invent addresses.",
    status: "observed-ok" as const,
    detail: "ADDRESS/CITY/ZIP present on all Home and Center rows; letter+digit streets observed.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row operating/licensing status.",
    status: "partial" as const,
    detail:
      "OPERATION_STATUS is ACTIVE on all sampled GIS rows. License_Effective and license_expiration are blank on every Home/Center row.",
  },
  {
    id: "capacity",
    requirement: "Capacity present; capacity ≠ availability; home/center capacity rules respected.",
    status: "partial" as const,
    detail:
      "CAPACITY_INT present. Homes 0–10 (3 zero-capacity). Centers 13–259. Zero-capacity homes remain ineligible without a product rule.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail:
      "N_LAT/N_LON present but locator types (CENTRUS-TOMTOM / StreetmapPremium) indicate geocoding. Not accepted as licensing coordinates.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL from FACID/LICENSE_NUMBER.",
    status: "blocked" as const,
    detail:
      "AZ Care Check is a Salesforce search SPA. Facility.aspx?id={FACID} returns an empty shell. No accepted detail prefix.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail:
      "Uniform RUN_DATE 2025-02-03, service name Feb_2025, and dataLastEditDate 2025-02-24 rejected. recordedExportDate=null.",
  },
  {
    id: "category-mapping",
    requirement: "Map AZ Home/Center without equating them to Washington AFH.",
    status: "blocked" as const,
    detail:
      "Home (≤10) and Center (≥11) are distinct from WA AFH. Adult Foster Care and behavioral-health residential types stay separate unless separately approved.",
  },
] as const;

export const ARIZONA_CATEGORY_MAPPING_RISKS = [
  "Assisted Living Home (≤10 residents) is not Washington adult family home.",
  "Assisted Living Center (≥11 residents) is a separate ARS §36-401 class and must not be merged into Home rows.",
  "Directed / Personal / Supervisory subtypes are care-level distinctions within Home and Center — not WA AFH equivalents.",
  "Adult Foster Care appears under the assisted living facility statutory umbrella but is a separate TYPE (25 rows) and was not adopted this run.",
  "Behavioral health residential / therapeutic / respite types are out of assisted-living Home/Center scope for this investigation.",
  "Zero CAPACITY_INT Home rows must not be treated as available capacity.",
] as const;

export function buildArizonaEligibilityMatrix() {
  const c = ARIZONA_ELIGIBILITY_COUNTS;
  return {
    observedOn: ARIZONA_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "assisted-living-home": c.assistedLivingHomeRows,
      "assisted-living-center": c.assistedLivingCenterRows,
      "sample-rows": c.sampleRows,
      "adult-foster-care-not-adopted": c.adultFosterCareNotedNotAdopted,
      "publication-eligible": c.publicationEligible,
    },
    requirements: ARIZONA_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...ARIZONA_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
  };
}
