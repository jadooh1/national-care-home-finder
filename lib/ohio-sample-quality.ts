/**
 * Ohio bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Population metrics use the ODH Facility Listing L12 roster (1,152 rows).
 * Sample rows are stratified fixtures only. Do not invent missing values,
 * invent geocodes, or extrapolate statewide totals from the sample.
 */

export const OHIO_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const OHIO_SAMPLE_PLAN = {
  intendedSource: "ODH EID Facility Listing CSV (Residential Care or Assisted Living)",
  intendedCategories: ["L12 / SL-R Residential Care Facility"],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
  automaticGeocoding: false,
} as const;

export const OHIO_POPULATION_QUALITY = {
  observedOn: OHIO_SAMPLE_QUALITY_OBSERVED_ON,
  rows: 1152,
  uniqueFacids: 1152,
  activeRows: 801,
  blankAddress: 0,
  coordinateColumns: false,
  facilitySpecificLinks: 0,
} as const;

export const OHIO_SAMPLE_RESULT = {
  observedOn: OHIO_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 32,
  activeSampled: 20,
  activePendingRenewalSampled: 4,
  pendingSampled: 4,
  closedSampled: 4,
  licensingIdentifiersObserved: 32,
  physicalAddressesObserved: 32,
  capacitiesObserved: 32,
  statusesObserved: 32,
  coordinatesObserved: 0,
  facilitySpecificLinksObserved: 0,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "Stratified sample: 20 ACTIVE + 4 ACTIVE-PENDING RENEWAL + 4 PENDING + 4 CLOSED. Population metrics use the full 1,152-row L12 Facility Listing.",
} as const;

export function evaluateOhioSampleQuality(
  result = OHIO_SAMPLE_RESULT,
  population = OHIO_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 32
    && result.activeSampled
      + result.activePendingRenewalSampled
      + result.pendingSampled
      + result.closedSampled
      === 32
    && result.licensingIdentifiersObserved === 32
    && result.facilitySpecificLinksObserved === 0
    && result.coordinatesObserved === 0
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.rows === 1152
    && population.blankAddress === 0
    && population.coordinateColumns === false
    && OHIO_SAMPLE_PLAN.statewideCrawl === false
    && OHIO_SAMPLE_PLAN.extrapolateStatewideFromSample === false
    && OHIO_SAMPLE_PLAN.automaticGeocoding === false;
  return {
    observedOn: OHIO_SAMPLE_QUALITY_OBSERVED_ON,
    plan: OHIO_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
