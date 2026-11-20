/**
 * Massachusetts bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Population metrics use the EOEA certified ALR usable row count (271).
 * Sample rows are stratified fixtures only. Do not invent missing values,
 * invent geocodes, or extrapolate statewide totals from the sample.
 */

export const MASSACHUSETTS_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const MASSACHUSETTS_SAMPLE_PLAN = {
  intendedSource: "EOEA/AGE certified Assisted Living Residences Excel list",
  intendedCategories: ["Assisted Living Residence (certified)"],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
  automaticGeocoding: false,
} as const;

export const MASSACHUSETTS_POPULATION_QUALITY = {
  observedOn: MASSACHUSETTS_SAMPLE_QUALITY_OBSERVED_ON,
  rows: 271,
  uniqueAlrNames: 271,
  blankAddress: 0,
  coordinateColumns: false,
  certificationIdentifierColumn: false,
  facilitySpecificDisclosurePrefix: true,
} as const;

export const MASSACHUSETTS_SAMPLE_RESULT = {
  observedOn: MASSACHUSETTS_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 32,
  certifiedSampled: 32,
  withScrUnitsSampled: 25,
  scrZeroSampled: 7,
  traditionalZeroSampled: 6,
  licensingIdentifiersObserved: 0,
  alrNamesObserved: 32,
  physicalAddressesObserved: 32,
  unitCountsObserved: 32,
  statusesObserved: 32,
  coordinatesObserved: 0,
  facilitySpecificLinksObserved: 32,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "Stratified sample across SCR and traditional-unit bands. Population metrics use 271 Certified rows with name+address. Sample unit counts are not extrapolated statewide. No certification-number column exists.",
} as const;

export function evaluateMassachusettsSampleQuality(
  result = MASSACHUSETTS_SAMPLE_RESULT,
  population = MASSACHUSETTS_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 32
    && result.withScrUnitsSampled + result.scrZeroSampled === 32
    && result.alrNamesObserved === 32
    && result.licensingIdentifiersObserved === 0
    && result.facilitySpecificLinksObserved === 32
    && result.coordinatesObserved === 0
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.rows === 271
    && population.blankAddress === 0
    && population.coordinateColumns === false
    && population.certificationIdentifierColumn === false
    && MASSACHUSETTS_SAMPLE_PLAN.statewideCrawl === false
    && MASSACHUSETTS_SAMPLE_PLAN.extrapolateStatewideFromSample === false
    && MASSACHUSETTS_SAMPLE_PLAN.automaticGeocoding === false;
  return {
    observedOn: MASSACHUSETTS_SAMPLE_QUALITY_OBSERVED_ON,
    plan: MASSACHUSETTS_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
