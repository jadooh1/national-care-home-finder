/**
 * Maryland bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Population metrics use the OHCQ Assisted Living Excel unique License Number
 * count (1,675). Sample rows are stratified fixtures only. Do not invent
 * missing values, invent geocodes, or extrapolate statewide totals from the
 * sample.
 */

export const MARYLAND_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const MARYLAND_SAMPLE_PLAN = {
  intendedSource: "MDH OHCQ Assisted Living Excel licensee directory",
  intendedCategories: ["Assisted Living Program"],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
  automaticGeocoding: false,
} as const;

export const MARYLAND_POPULATION_QUALITY = {
  observedOn: MARYLAND_SAMPLE_QUALITY_OBSERVED_ON,
  rows: 1676,
  uniqueLicenseNumbers: 1675,
  blankStreetAddress: 0,
  coordinateColumns: false,
  perRowStatusColumn: false,
  facilitySpecificLinks: 0,
} as const;

export const MARYLAND_SAMPLE_RESULT = {
  observedOn: MARYLAND_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 32,
  level2Sampled: 4,
  specialCareSampled: 8,
  capacityLe16Sampled: 21,
  capacityGt16Sampled: 11,
  licensingIdentifiersObserved: 32,
  physicalAddressesObserved: 32,
  capacitiesObserved: 32,
  levelOfCareObserved: 32,
  capacityMin: 3,
  capacityMax: 151,
  coordinatesObserved: 0,
  facilitySpecificLinksObserved: 0,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "Stratified sample: Level 2, special-care, capacity ≤16, and capacity >16 bands. Population metrics use the full 1,676-row Excel (1,675 unique License Numbers). Sample capacities are not extrapolated statewide.",
} as const;

export function evaluateMarylandSampleQuality(
  result = MARYLAND_SAMPLE_RESULT,
  population = MARYLAND_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 32
    && result.capacityLe16Sampled + result.capacityGt16Sampled === 32
    && result.licensingIdentifiersObserved === 32
    && result.facilitySpecificLinksObserved === 0
    && result.coordinatesObserved === 0
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.rows === 1676
    && population.uniqueLicenseNumbers === 1675
    && population.blankStreetAddress === 0
    && population.coordinateColumns === false
    && MARYLAND_SAMPLE_PLAN.statewideCrawl === false
    && MARYLAND_SAMPLE_PLAN.extrapolateStatewideFromSample === false
    && MARYLAND_SAMPLE_PLAN.automaticGeocoding === false;
  return {
    observedOn: MARYLAND_SAMPLE_QUALITY_OBSERVED_ON,
    plan: MARYLAND_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
