/**
 * Texas offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const TEXAS_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const TEXAS_ELIGIBILITY_COUNTS = {
  activeWorkbookRows: 2019,
  typeA: 335,
  typeB: 1676,
  typeC: 8,
  sampleRows: 32,
  geoCommaOnly: 82,
  closureIds: 1515,
  closureActiveOverlap: 0,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const TEXAS_PUBLICATION_REQUIREMENTS = [
  {
    id: "licensing-identifier",
    requirement: "Stable unique Facility ID and License No; preserve leading zeros.",
    status: "observed-ok" as const,
    detail: "2,019 unique Facility ID strings (533 with leading zeros) and 2,019 unique License No values.",
  },
  {
    id: "physical-address",
    requirement: "Physical address labeled separately from owner mailing.",
    status: "observed-ok" as const,
    detail: "Physical Address / CITY / State / Zipcode present on all rows; Owner Mailing1 is a separate column.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row operating/licensing status domain.",
    status: "blocked" as const,
    detail:
      "Facility Licensed=YES on all active-workbook rows is a file membership flag, not closed/expired operating status. Closures PDF has 0 ID overlap with active rows and does not establish active operating status.",
  },
  {
    id: "capacity",
    requirement: "Total licensed capacity present; capacity ≠ availability.",
    status: "observed-ok" as const,
    detail: "Total Licensed Capacity present on all rows; range 4–335; zero-capacity rows = 0.",
  },
  {
    id: "type-a-b-c-mapping",
    requirement: "Keep Type A / B / C separate; do not equate to Washington AFH.",
    status: "blocked" as const,
    detail:
      "26 TAC §553.5 types are evacuation-capability classes. Type C is legacy four-bed AFC (no new licenses). Not WA AFH.",
  },
  {
    id: "coordinates",
    requirement: "Official licensing coordinates only if defined as such.",
    status: "blocked" as const,
    detail:
      "Geo Location has 1,937 pairs and 82 comma-only cells. Source/accuracy not described; pairs not accepted as licensing coordinates. Do not invent geocodes.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified facility-specific disclosure URL from Facility ID or License No.",
    status: "blocked" as const,
    detail:
      "TULIP detail uses account id not in the workbook. Guessed Facility ID/License params did not yield a facility payload.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail:
      "Title as-of 11/19/2026 and HTTP Last-Modified rejected. Rewriting to 2026-11-19 would invent the timestamp. recordedExportDate=null.",
  },
] as const;

export const TEXAS_CATEGORY_MAPPING_RISKS = [
  "Assisted Living Type A (evacuation-capable) is not Washington adult family home.",
  "Assisted Living Type B (may need evacuation assistance) is a separate class from Type A and from WA AFH.",
  "Type C is a legacy four-bed adult foster care license; HHSC no longer issues new Type C licenses.",
  "Small (≤16) vs large (≥17) construction size is orthogonal to Type A/B and must not be treated as a license type.",
  "Facility Licensed=YES means membership in the active-license workbook, not a verified open/closed operating status domain.",
  "Alzheimer certification appears on a subset of rows and is not a separate publication category without an explicit rule.",
] as const;

export function buildTexasEligibilityMatrix() {
  const c = TEXAS_ELIGIBILITY_COUNTS;
  return {
    observedOn: TEXAS_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "type-a": c.typeA,
      "type-b": c.typeB,
      "type-c": c.typeC,
      "sample-rows": c.sampleRows,
      "geo-comma-only": c.geoCommaOnly,
      "publication-eligible": c.publicationEligible,
    },
    typeResidualOk: c.typeA + c.typeB + c.typeC === c.activeWorkbookRows,
    requirements: TEXAS_PUBLICATION_REQUIREMENTS,
    categoryMappingRisks: [...TEXAS_CATEGORY_MAPPING_RISKS],
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
    mostActionableNextStep:
      "Obtain an authoritative ISO export/version stamp for al.xlsx from HHSC, and separately verify whether a stable TULIP detail URL can be built without inventing account ids.",
  };
}
