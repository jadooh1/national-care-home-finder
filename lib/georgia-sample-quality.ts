/**
 * Georgia bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Population metrics use the full PCH + ALC filter of HFR GetData (1,899 rows).
 * Sample rows are stratified fixtures only. Do not invent missing values,
 * invent geocodes, or extrapolate statewide totals from the sample.
 */

export const GEORGIA_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const GEORGIA_SAMPLE_PLAN = {
  intendedSource: "HFRD GetFacilitiesData.svc/GetData (PCH + ALC filter)",
  intendedCategories: ["PERSONAL CARE HOME", "ASSISTED LIVING COMMUNITY"],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
  automaticGeocoding: false,
} as const;

export const GEORGIA_POPULATION_QUALITY = {
  observedOn: GEORGIA_SAMPLE_QUALITY_OBSERVED_ON,
  rows: 1899,
  pchRows: 1573,
  alcRows: 326,
  uniqueFacids: 1899,
  blankAddress: 0,
  zeroBeds: 67,
  coordinatePairs: 1899,
  facilitySpecificLinks: 0,
} as const;

export const GEORGIA_SAMPLE_RESULT = {
  observedOn: GEORGIA_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 32,
  pchSampled: 20,
  alcSampled: 12,
  licensingIdentifiersObserved: 32,
  physicalAddressesObserved: 32,
  capacitiesObserved: 32,
  statusesObserved: 32,
  coordinatesObserved: 32,
  facilitySpecificLinksObserved: 0,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "Stratified sample: 20 PCH + 12 ALC. Population metrics use the full 1,899-row PCH/ALC GetData filter.",
} as const;

export function evaluateGeorgiaSampleQuality(
  result = GEORGIA_SAMPLE_RESULT,
  population = GEORGIA_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 32
    && result.pchSampled + result.alcSampled === 32
    && result.licensingIdentifiersObserved === 32
    && result.facilitySpecificLinksObserved === 0
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.rows === 1899
    && population.pchRows + population.alcRows === 1899
    && population.blankAddress === 0
    && GEORGIA_SAMPLE_PLAN.statewideCrawl === false
    && GEORGIA_SAMPLE_PLAN.extrapolateStatewideFromSample === false
    && GEORGIA_SAMPLE_PLAN.automaticGeocoding === false;
  return {
    observedOn: GEORGIA_SAMPLE_QUALITY_OBSERVED_ON,
    plan: GEORGIA_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
