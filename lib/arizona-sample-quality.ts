/**
 * Arizona bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Home and Center FeatureServer queries are bounded category extracts, not a
 * statewide crawl of every ADHS licensed facility type. Do not invent missing
 * values or extrapolate statewide totals from the sample.
 */

export const ARIZONA_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const ARIZONA_SAMPLE_PLAN = {
  intendedSource: "ADHS Assisted Living Home / Center FeatureServers (Feb_2025)",
  intendedCategories: [
    "ASSISTED LIVING HOME",
    "ASSISTED LIVING CENTER",
  ],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
} as const;

export const ARIZONA_POPULATION_QUALITY = {
  observedOn: ARIZONA_SAMPLE_QUALITY_OBSERVED_ON,
  homeRows: 1719,
  centerRows: 328,
  combinedRows: 2047,
  uniqueFacidsHome: 1719,
  uniqueFacidsCenter: 328,
  facidOverlap: 0,
  blankAddressHome: 0,
  blankAddressCenter: 0,
  zeroCapacityHome: 3,
  zeroCapacityCenter: 0,
  homeCapacityMax: 10,
  centerCapacityMin: 13,
  blankNLatLon: 0,
  activeStatusOnly: true,
} as const;

export const ARIZONA_SAMPLE_RESULT = {
  observedOn: ARIZONA_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 27,
  licensingIdentifiersObserved: 27,
  physicalAddressesObserved: 27,
  mailingAddressesObserved: 0,
  capacitiesObserved: 27,
  statusesObserved: 27,
  coordinatesObserved: 27,
  facilitySpecificLinksObserved: 0,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "Stratified sample across Assisted Living Home and Center rows, including zero-capacity home examples. Population metrics use full Home/Center filters.",
} as const;

export function evaluateArizonaSampleQuality(
  result = ARIZONA_SAMPLE_RESULT,
  population = ARIZONA_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 27
    && result.licensingIdentifiersObserved === 27
    && result.facilitySpecificLinksObserved === 0
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.homeRows === 1719
    && population.centerRows === 328
    && population.combinedRows === 2047
    && population.facidOverlap === 0
    && population.homeCapacityMax === 10
    && population.centerCapacityMin === 13
    && ARIZONA_SAMPLE_PLAN.statewideCrawl === false
    && ARIZONA_SAMPLE_PLAN.extrapolateStatewideFromSample === false;
  return {
    observedOn: ARIZONA_SAMPLE_QUALITY_OBSERVED_ON,
    plan: ARIZONA_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
