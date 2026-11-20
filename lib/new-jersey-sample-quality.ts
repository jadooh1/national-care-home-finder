/**
 * New Jersey bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Population metrics use All_LTC.xlsx ALR+CPCH+ALP unique FacID count (305).
 * Sample rows are stratified fixtures only. Do not invent missing values,
 * invent geocodes, or extrapolate statewide totals from the sample.
 */

export const NEW_JERSEY_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const NEW_JERSEY_SAMPLE_PLAN = {
  intendedSource: "NJDOH All_LTC.xlsx (ALR, CPCH, ALP filters)",
  intendedCategories: [
    "ASSISTED LIVING RESIDENCE",
    "COMPREHENSIVE PERSONAL CARE HOME",
    "ASSISTED LIVING PROGRAM",
  ],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
  automaticGeocoding: false,
} as const;

export const NEW_JERSEY_POPULATION_QUALITY = {
  observedOn: NEW_JERSEY_SAMPLE_QUALITY_OBSERVED_ON,
  rows: 305,
  uniqueFacID: 305,
  alrRows: 256,
  cpchRows: 32,
  alpRows: 17,
  blankAddress: 0,
  coordinateColumns: true,
  facilitySpecificDisclosurePrefix: true,
} as const;

export const NEW_JERSEY_SAMPLE_RESULT = {
  observedOn: NEW_JERSEY_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 32,
  alrSampled: 20,
  cpchSampled: 6,
  alpSampled: 6,
  licensingIdentifiersObserved: 32,
  physicalAddressesObserved: 32,
  capacitiesObserved: 32,
  alpZeroBedsInSample: 6,
  zeroCoordRowsInSample: 6,
  facilitySpecificLinksObserved: 32,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "Stratified sample across ALR/CPCH/ALP including zero-bed ALP and zero-coordinate rows. Population metrics use the full 305-row ALR+CPCH+ALP extract. Sample capacities are not extrapolated statewide.",
} as const;

export function evaluateNewJerseySampleQuality(
  result = NEW_JERSEY_SAMPLE_RESULT,
  population = NEW_JERSEY_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 32
    && result.alrSampled + result.cpchSampled + result.alpSampled === 32
    && result.licensingIdentifiersObserved === 32
    && result.facilitySpecificLinksObserved === 32
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.rows === 305
    && population.uniqueFacID === 305
    && population.blankAddress === 0
    && NEW_JERSEY_SAMPLE_PLAN.statewideCrawl === false
    && NEW_JERSEY_SAMPLE_PLAN.extrapolateStatewideFromSample === false
    && NEW_JERSEY_SAMPLE_PLAN.automaticGeocoding === false;
  return {
    observedOn: NEW_JERSEY_SAMPLE_QUALITY_OBSERVED_ON,
    plan: NEW_JERSEY_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
