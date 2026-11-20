/**
 * Minnesota bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Interactive MDH directory was unavailable this run (maintenance window).
 * No facility-level sample was taken. Statewide totals are NOT extrapolated
 * from samples. Aggregate PDF counts are recorded separately as aggregates only.
 */

export const MINNESOTA_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const MINNESOTA_SAMPLE_PLAN = {
  intendedSource: "MDH Health Care Provider Directory (interactive / download file)",
  intendedCategories: [
    "Assisted Living Facilities",
    "Assisted Living with Dementia Care Facilities",
    "Provisional Assisted Living (if present in interactive filters)",
    "Boarding Care Homes",
    "Supervised Living Facilities",
    "Board and Lodging Special Services",
  ],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
} as const;

export const MINNESOTA_SAMPLE_RESULT = {
  observedOn: MINNESOTA_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: false,
  reason:
    "MDH interactive provider directory unavailable during official maintenance notice (Nov. 20–23). Field-outline page returned Access Denied / HTTP 403. No facility-level download was obtained.",
  rowsSampled: 0,
  licensingIdentifiersObserved: 0,
  physicalAddressesObserved: 0,
  mailingAddressesObserved: 0,
  capacitiesObserved: 0,
  statusesObserved: 0,
  coordinatesObserved: 0,
  facilitySpecificLinksObserved: 0,
  unresolvedMarkedIneligible: true,
  // Annual PDF aggregates are NOT a facility sample.
  annualPdfAggregatesAreFacilitySample: false,
} as const;

export function evaluateMinnesotaSampleQuality(
  result = MINNESOTA_SAMPLE_RESULT,
) {
  const integrityOk =
    result.sampleExecuted === false
    && result.rowsSampled === 0
    && result.annualPdfAggregatesAreFacilitySample === false
    && result.unresolvedMarkedIneligible === true;
  return {
    observedOn: MINNESOTA_SAMPLE_QUALITY_OBSERVED_ON,
    plan: MINNESOTA_SAMPLE_PLAN,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
