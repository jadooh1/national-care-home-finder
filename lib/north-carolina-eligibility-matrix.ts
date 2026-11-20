/**
 * North Carolina offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const NORTH_CAROLINA_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const NORTH_CAROLINA_ELIGIBILITY_COUNTS = {
  adultHal: 566,
  familyFcl: 520,
  uniqueLicenses: 1086,
  blankRows: 2,
  sampleRows: 32,
  identicalMailing: 189,
  distinctMailing: 897,
  starNotAvailable: 27,
  expiryBeforeObservation: 5,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const NORTH_CAROLINA_PUBLICATION_REQUIREMENTS = [
  {
    id: "licensing-identifier",
    requirement: "Stable unique License # (HAL / FCL).",
    status: "observed-ok" as const,
    detail: "566 unique HAL and 520 unique FCL licenses; overlap 0; blank trailing rows 2.",
  },
  {
    id: "physical-address",
    requirement: "Site address labeled separately from facility/mailing address.",
    status: "observed-ok" as const,
    detail:
      "Site Address/City/State/Zip present on all 1,086 licensed rows (all NC, five-digit ZIPs). Facility Address is correspondence/mailing and includes out-of-state values; do not substitute it for site.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row operating/licensing status domain.",
    status: "blocked" as const,
    detail:
      "No per-row status column. Star Rating and Expiry Date are not licensing status. 5 expiry dates fall before observation (2026-11-20).",
  },
  {
    id: "capacity",
    requirement: "Licensed bed capacity; keep HAL and FCL ranges separate.",
    status: "observed-ok" as const,
    detail: "HAL beds 9–201; FCL beds 2–6 with 0 outside that range. Capacity ≠ availability.",
  },
  {
    id: "category-mapping",
    requirement: "Keep Adult Care Home (HAL) and Family Care Home (FCL) separate from WA AFH.",
    status: "blocked" as const,
    detail:
      "FCL (2–6 residents) is a smaller adult care home type, not automatically Washington AFH. HAL is a larger adult care / home-for-the-aged class. Special Care Units remain a separate workbook.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail: "Neither workbook has coordinate columns. Do not invent geocodes.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL from License #.",
    status: "blocked" as const,
    detail:
      "Star search accepts type/county/city/name only. Guessed License # detail URLs did not yield a facility payload.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail:
      "Listings page 10/28/2026, workbook As of 10/2026, and HTTP Last-Modified rejected. Stale fch.txt (Last-Modified 2021-12-15) rejected as current source. recordedExportDate=null.",
  },
] as const;

export const NORTH_CAROLINA_CATEGORY_MAPPING_RISKS = [
  "Family Care Home (FCL, 2–6 beds) is not Washington adult family home.",
  "Adult Care Home / Home for the Aged (HAL) is a separate larger license class from FCL and from WA AFH.",
  "Star Rating is a quality score, not a licensing or operating status.",
  "Expiry Date is not a closed/active status domain.",
  "Facility Address may be out-of-state mailing/correspondence and must not replace Site Address.",
  "Special Care Units listing is a specialty overlay, not a substitute HAL/FCL roster.",
] as const;

export function buildNorthCarolinaEligibilityMatrix() {
  const c = NORTH_CAROLINA_ELIGIBILITY_COUNTS;
  return {
    observedOn: NORTH_CAROLINA_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "adult-hal": c.adultHal,
      "family-fcl": c.familyFcl,
      "blank-rows": c.blankRows,
      "sample-rows": c.sampleRows,
      "publication-eligible": c.publicationEligible,
    },
    categoryResidualOk: c.adultHal + c.familyFcl === c.uniqueLicenses,
    mailingResidualOk: c.identicalMailing + c.distinctMailing === c.uniqueLicenses,
    requirements: NORTH_CAROLINA_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...NORTH_CAROLINA_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    mostActionableNextStep:
      "Ask NCDHHS DHSR for an authoritative ISO export/version stamp for Ahlist.xlsx and Fchlist.xlsx, and confirm whether a stable License # → facility disclosure URL exists outside the star-rating search.",
  };
}
