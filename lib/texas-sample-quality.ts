/**
 * Texas bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Active-license workbook population metrics use the full ALF file.
 * Sample rows are stratified fixtures only. Do not invent missing values,
 * geocode facilities, or extrapolate statewide totals from the sample.
 */

export const TEXAS_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const TEXAS_SAMPLE_PLAN = {
  intendedSource: "HHSC active assisted-living workbook (al.xlsx)",
  intendedCategories: ["TYPE A", "TYPE B", "TYPE C"],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
  automaticGeocoding: false,
} as const;

export const TEXAS_POPULATION_QUALITY = {
  observedOn: TEXAS_SAMPLE_QUALITY_OBSERVED_ON,
  rows: 2019,
  uniqueFacilityIds: 2019,
  uniqueLicenseNumbers: 2019,
  blankPhysicalAddress: 0,
  blankCapacity: 0,
  zeroCapacity: 0,
  geoPairs: 1937,
  geoCommaOnly: 82,
  facilityLicensedYes: 2019,
  leadingZeroFacilityIds: 533,
} as const;

export const TEXAS_SAMPLE_RESULT = {
  observedOn: TEXAS_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 32,
  licensingIdentifiersObserved: 32,
  physicalAddressesObserved: 32,
  mailingAddressesObserved: 0,
  capacitiesObserved: 32,
  statusesObserved: 32,
  coordinatesObserved: 32,
  facilitySpecificLinksObserved: 0,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "Stratified sample across TYPE A / B / C plus comma-only Geo Location examples. Population metrics use the full 2,019-row workbook.",
} as const;

export function evaluateTexasSampleQuality(
  result = TEXAS_SAMPLE_RESULT,
  population = TEXAS_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 32
    && result.licensingIdentifiersObserved === 32
    && result.facilitySpecificLinksObserved === 0
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.rows === 2019
    && population.geoPairs + population.geoCommaOnly === 2019
    && population.blankPhysicalAddress === 0
    && TEXAS_SAMPLE_PLAN.statewideCrawl === false
    && TEXAS_SAMPLE_PLAN.extrapolateStatewideFromSample === false
    && TEXAS_SAMPLE_PLAN.automaticGeocoding === false;
  return {
    observedOn: TEXAS_SAMPLE_QUALITY_OBSERVED_ON,
    plan: TEXAS_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
