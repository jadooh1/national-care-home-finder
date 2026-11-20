/**
 * North Carolina bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Population metrics use the full HAL + FCL workbooks (1,086 licensed rows).
 * Sample rows are stratified fixtures only. Do not invent missing values,
 * geocode facilities, or extrapolate statewide totals from the sample.
 */

export const NORTH_CAROLINA_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const NORTH_CAROLINA_SAMPLE_PLAN = {
  intendedSources: [
    "DHSR adult care home workbook (Ahlist.xlsx)",
    "DHSR family care home workbook (Fchlist.xlsx)",
  ],
  intendedCategories: ["HAL", "FCL"],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
  automaticGeocoding: false,
} as const;

export const NORTH_CAROLINA_POPULATION_QUALITY = {
  observedOn: NORTH_CAROLINA_SAMPLE_QUALITY_OBSERVED_ON,
  rows: 1086,
  adultRows: 566,
  familyRows: 520,
  uniqueLicenses: 1086,
  blankSiteAddress: 0,
  blankBeds: 0,
  coordinateColumns: 0,
  perRowStatusColumn: 0,
  facilitySpecificLinks: 0,
} as const;

export const NORTH_CAROLINA_SAMPLE_RESULT = {
  observedOn: NORTH_CAROLINA_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 32,
  adultSampled: 16,
  familySampled: 16,
  licensingIdentifiersObserved: 32,
  siteAddressesObserved: 32,
  capacitiesObserved: 32,
  statusesObserved: 0,
  coordinatesObserved: 0,
  facilitySpecificLinksObserved: 0,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "Stratified sample: 16 HAL + 16 FCL. Population metrics use the full 1,086 licensed workbook rows. No per-row status or coordinate columns exist.",
} as const;

export function evaluateNorthCarolinaSampleQuality(
  result = NORTH_CAROLINA_SAMPLE_RESULT,
  population = NORTH_CAROLINA_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 32
    && result.adultSampled + result.familySampled === 32
    && result.licensingIdentifiersObserved === 32
    && result.facilitySpecificLinksObserved === 0
    && result.statusesObserved === 0
    && result.coordinatesObserved === 0
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.rows === 1086
    && population.adultRows + population.familyRows === 1086
    && population.blankSiteAddress === 0
    && NORTH_CAROLINA_SAMPLE_PLAN.statewideCrawl === false
    && NORTH_CAROLINA_SAMPLE_PLAN.extrapolateStatewideFromSample === false
    && NORTH_CAROLINA_SAMPLE_PLAN.automaticGeocoding === false;
  return {
    observedOn: NORTH_CAROLINA_SAMPLE_QUALITY_OBSERVED_ON,
    plan: NORTH_CAROLINA_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
