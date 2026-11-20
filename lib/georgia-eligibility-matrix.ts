/**
 * Georgia offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const GEORGIA_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const GEORGIA_ELIGIBILITY_COUNTS = {
  personalCareHome: 1573,
  assistedLivingCommunity: 326,
  rows: 1899,
  sampleRows: 32,
  zeroBeds: 67,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const GEORGIA_PUBLICATION_REQUIREMENTS = [
  {
    id: "licensing-identifier",
    requirement: "Stable unique FACID (PCH###### / ALC######).",
    status: "observed-ok" as const,
    detail: "1,573 unique PCH and 326 unique ALC FACIDs; overlap 0.",
  },
  {
    id: "physical-address",
    requirement: "Street address present for listing.",
    status: "observed-ok" as const,
    detail:
      "ADDRESS present on all 1,899 PCH/ALC rows. FAC_ST has blank/Georgia/Ga variants (PCH blank 67) that need normalization before publication.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row operating/licensing status domain.",
    status: "blocked" as const,
    detail:
      "OPERSTDESC is present but only Active/ACTIVE on these rows; CLOSEDDATE is absent. It is unverified whether closed facilities are excluded from GetData, so the status domain is incomplete for publication.",
  },
  {
    id: "capacity",
    requirement: "Licensed bed capacity; keep PCH and ALC separate.",
    status: "blocked" as const,
    detail:
      "Beds present with PCH 0–200 (63 zeros; 147 rows ≥25) and ALC 0–307 (4 zeros; 5 rows <25 including a Test facility). Zero-capacity and ALC<25 edge cases need a publication rule. Capacity ≠ availability.",
  },
  {
    id: "category-mapping",
    requirement: "Keep PCH and ALC separate; do not equate to Washington AFH.",
    status: "blocked" as const,
    detail:
      "ALC is defined as a PCH serving 25+ residents licensed for assisted living care (Ch. 111-8-63). PCH is Ch. 111-8-62. Neither is Washington AFH. Observed bed overlap across the 25-bed boundary remains open.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail:
      "Latitude/Longitude present on all PCH/ALC rows with Google Accuracy labels (mostly ROOFTOP). Geocoded coordinates are not accepted as licensing coordinates.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL from FACID.",
    status: "blocked" as const,
    detail:
      "No FACID → stable disclosure prefix verified. Verify_License/GaMap2Care ignore FACID params; WebLink inspection is a generic search.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail:
      "GetData has no HTTP Last-Modified and no export stamp in the payload. List_Of_Regulated_Facilities.pdf Last-Modified 2020-03-10 is rejected as current. recordedExportDate=null.",
  },
] as const;

export const GEORGIA_CATEGORY_MAPPING_RISKS = [
  "Personal Care Home (Ch. 111-8-62) is not Washington adult family home.",
  "Assisted Living Community (Ch. 111-8-63) is a licensed ALC on top of the PCH framework for 25+ residents, not WA AFH.",
  "Observed PCH rows with beds ≥25 and ALC rows with beds <25/zero must not silently rewrite category.",
  "OPERSTDESC Active/ACTIVE case variants are not a closed/open domain by themselves.",
  "Geocoded Latitude/Longitude with Accuracy labels are not licensing coordinates.",
] as const;

export function buildGeorgiaEligibilityMatrix() {
  const c = GEORGIA_ELIGIBILITY_COUNTS;
  return {
    observedOn: GEORGIA_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "personal-care-home": c.personalCareHome,
      "assisted-living-community": c.assistedLivingCommunity,
      "sample-rows": c.sampleRows,
      "publication-eligible": c.publicationEligible,
    },
    categoryResidualOk: c.personalCareHome + c.assistedLivingCommunity === c.rows,
    requirements: GEORGIA_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...GEORGIA_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    mostActionableNextStep:
      "Ask Georgia DCH/HFRD for an authoritative ISO export/version stamp for the GetFacilitiesData roster, and confirm whether a stable FACID → facility disclosure or inspection URL exists outside generic search pages.",
  };
}
