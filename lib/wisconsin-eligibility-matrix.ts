/**
 * Wisconsin offline eligibility / readiness matrix (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const WISCONSIN_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const WISCONSIN_ELIGIBILITY_COUNTS = {
  excelRows: 2479,
  gisFeatures: 2203,
  matchedUnique: 1914,
  matchedAmbiguous: 2,
  excelOnly: 563,
  gisOnlyWithLicense: 276,
  gisBlankLicense: 9,
  publicationEligible: 0,
  ownerClaimEligible: 0,
} as const;

export const WISCONSIN_PUBLICATION_REQUIREMENTS = [
  {
    id: "physical-address",
    requirement: "Authoritative facility street (Excel Street / PDF facility address), not mailing.",
    status: "observed-ok" as const,
    detail: "Excel: 0 blank Street; Street and Mailing Street labeled separately; mailing not substituted.",
  },
  {
    id: "licensing-identifier-reconciliation",
    requirement: "Licensing Facility ID reconciled to GIS without inventing identifiers.",
    status: "blocked" as const,
    detail: "1914 unique matches; 2 ambiguous; 563 Excel-only; 276 GIS-only; 9 GIS blank WI_LICENSE_NUM. GIS is not the accepted directory.",
  },
  {
    id: "licensing-status",
    requirement: "Per-row licensing status (active/closed/etc.).",
    status: "blocked" as const,
    detail: "Excel Class is AMBULATORY / AFH / NONAMBULATORY — not a license-status domain.",
  },
  {
    id: "capacity",
    requirement: "Capacity present for DQA 3–4 bed AFHs.",
    status: "observed-ok" as const,
    detail: "437 capacity-3 + 2042 capacity-4 = 2479. Capacity ≠ availability. 1–2 bed homes are county-regulated and outside this state directory.",
  },
  {
    id: "zip-code",
    requirement: "Usable 5-digit ZIP.",
    status: "observed-ok" as const,
    detail: "Excel blankZip5 = 0 after normalizing Zip Code cells.",
  },
  {
    id: "disclosure-link",
    requirement: "Verified per-facility disclosure URL from Facility ID.",
    status: "blocked" as const,
    detail: "Provider Search is a search tool. Guessed detail URLs returned Unexpected Error; no accepted prefix.",
  },
  {
    id: "freshness",
    requirement: "Authoritative ISO export / version stamp.",
    status: "blocked" as const,
    detail: "PDF Directory Updated 11/04/2026 and HTTP Last-Modified rejected; recordedExportDate=null. GIS has no editingInfo.",
  },
] as const;

export function buildWisconsinEligibilityMatrix() {
  const c = WISCONSIN_ELIGIBILITY_COUNTS;
  return {
    observedOn: WISCONSIN_ELIGIBILITY_OBSERVED_ON,
    counts: c,
    exclusiveBuckets: {
      "matched-unique": c.matchedUnique,
      "matched-ambiguous": c.matchedAmbiguous,
      "excel-only-unmatched": c.excelOnly,
      "gis-only-with-license": c.gisOnlyWithLicense,
      "gis-blank-license": c.gisBlankLicense,
      "publication-eligible": c.publicationEligible,
    },
    excelResidualOk: c.matchedUnique + c.matchedAmbiguous + c.excelOnly === c.excelRows,
    gisResidualOk:
      c.matchedUnique + 4 + c.gisOnlyWithLicense + c.gisBlankLicense === c.gisFeatures,
    requirements: WISCONSIN_PUBLICATION_REQUIREMENTS,
    ownerClaimEligible: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
  };
}
