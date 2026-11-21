/**
 * Alabama bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Population metrics use ALF (188) + SCALF (106) = 294 unique Fac IDs.
 * Sample rows are stratified fixtures only. Do not invent missing values,
 * invent geocodes, or extrapolate statewide totals from the sample.
 */

export const ALABAMA_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const ALABAMA_SAMPLE_PLAN = {
  intendedSource: "ADPH FacilitiesDirectory Excel exports (type D ALF + type P SCALF)",
  intendedCategories: [
    "Assisted Living Facility",
    "Assisted Living Facility (Specialty Care)",
  ],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
  automaticGeocoding: false,
} as const;

export const ALABAMA_POPULATION_QUALITY = {
  observedOn: ALABAMA_SAMPLE_QUALITY_OBSERVED_ON,
  alfRows: 188,
  scalfRows: 106,
  combinedRows: 294,
  uniqueFacIdCombined: 294,
  blankStreet: 0,
  blankCity: 0,
  coordinateColumns: false,
  facilitySpecificLinks: 0,
} as const;

export const ALABAMA_SAMPLE_RESULT = {
  observedOn: ALABAMA_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 32,
  alfSampled: 17,
  scalfSampled: 15,
  regularSampled: 31,
  probationalSampled: 1,
  licensingIdentifiersObserved: 32,
  physicalAddressesObserved: 32,
  capacitiesObserved: 32,
  statusesObserved: 32,
  coordinatesObserved: 0,
  facilitySpecificLinksObserved: 0,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "Stratified sample across ALF and SCALF, including Probational and Family Assisted Living Facility class. Population metrics use full ALF+SCALF exports. Do not merge ALF with SCALF or invent geocodes.",
} as const;

export function evaluateAlabamaSampleQuality(
  result = ALABAMA_SAMPLE_RESULT,
  population = ALABAMA_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 32
    && result.alfSampled + result.scalfSampled === 32
    && result.licensingIdentifiersObserved === 32
    && result.facilitySpecificLinksObserved === 0
    && result.coordinatesObserved === 0
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.combinedRows === 294
    && population.uniqueFacIdCombined === 294
    && population.blankStreet === 0
    && population.coordinateColumns === false
    && ALABAMA_SAMPLE_PLAN.statewideCrawl === false
    && ALABAMA_SAMPLE_PLAN.extrapolateStatewideFromSample === false
    && ALABAMA_SAMPLE_PLAN.automaticGeocoding === false;
  return {
    observedOn: ALABAMA_SAMPLE_QUALITY_OBSERVED_ON,
    plan: ALABAMA_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
