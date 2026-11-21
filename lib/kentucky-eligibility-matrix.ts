/**
 * Kentucky offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const KENTUCKY_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const KENTUCKY_ELIGIBILITY_COUNTS = {
  directoryTypeRows: 247,
  uniqueLicenseNbr: 244,
  sampleRows: 32,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const KENTUCKY_PUBLICATION_REQUIREMENTS = [
  {
    id: "licensing-identifier",
    requirement: "Stable unique LICENSE # on ALC directory type-rows.",
    status: "blocked" as const,
    detail:
      "247 type-rows; 244 unique LICENSE #; 1 blank (FOREST HILLS COMMON ALC-DC); 2 duplicate LICENSE # groups (101513 on two different facilities; 101294 on ALC and ALC-DC at same campus). Rows are TYPE grains, not distinct campuses.",
  },
  {
    id: "physical-address",
    requirement: "Street, city, ZIP present for listing.",
    status: "observed-ok" as const,
    detail: "ADDRESS / CITY / ZIP / COUNTY present on all 247 rows.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row operating/licensing status domain.",
    status: "blocked" as const,
    detail:
      "LICENSE EXPIRATION holds dates or “Pending Renewal” (75). Expiration is not Active/Closed operating status. No separate status column.",
  },
  {
    id: "capacity",
    requirement: "Licensed unit capacity for Assisted Living Communities.",
    status: "blocked" as const,
    detail:
      "UNITS present on all rows (0–137) with one UNITS=0 row. Values are per TYPE license row; campus totals must not be summed across ALC/ALC-BH/ALC-DC without a dictionary. Capacity ≠ availability.",
  },
  {
    id: "category-mapping",
    requirement: "Keep ALC types separate from PCH, FCH, nursing, and Washington AFH.",
    status: "blocked" as const,
    detail:
      "ALC / ALC-BH / ALC-DC under 902 KAR 20:480 are type-rows. Personal Care Home (47), Family Care Home (24), and Long Term Care (313) are separate OIG directories. None is Washington adult family home.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail: "ALC directory has no coordinate columns. Do not invent geocodes.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL from LICENSE #.",
    status: "blocked" as const,
    detail:
      "OIG directories are PDF/XLSX downloads. LTC inspection pages are nursing-home oriented. LICENSE # query-string guesses failed.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail:
      "Sheet name “November 2026”, HCF claim of beginning-of-month updates, and HTTP Last-Modified Fri, 30 Oct 2026 12:11:40 GMT are rejected as ISO export. recordedExportDate=null.",
  },
] as const;

export const KENTUCKY_CATEGORY_MAPPING_RISKS = [
  "Kentucky Assisted Living Community is not Washington adult family home.",
  "ALC, ALC-BH, and ALC-DC are license type-rows and must not be collapsed into a campus count without rules.",
  "Personal Care Homes and Family Care Homes are separate OIG directories.",
  "Long Term Care / nursing facilities are separate and must not be merged into ALC.",
  "Pending Renewal is not an Active/Closed operating status.",
  "Duplicate LICENSE # values and blank LICENSE # must not be silently repaired.",
] as const;

export function buildKentuckyEligibilityMatrix() {
  const c = KENTUCKY_ELIGIBILITY_COUNTS;
  return {
    observedOn: KENTUCKY_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "directory-type-rows": c.directoryTypeRows,
      "unique-license-nbr": c.uniqueLicenseNbr,
      "sample-rows": c.sampleRows,
      "publication-eligible": c.publicationEligible,
    },
    categoryResidualOk: true,
    requirements: KENTUCKY_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...KENTUCKY_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    mostActionableNextStep:
      "Ask Kentucky CHFS OIG for an authoritative ISO export/version stamp for the Assisted Living Community Directory, a field dictionary for ALC vs ALC-BH vs ALC-DC type-rows (including how duplicate LICENSE # and blank LICENSE # should be treated), confirmation whether Pending Renewal is an operating status, and whether LICENSE # maps to a stable facility disclosure / survey URL.",
  };
}
