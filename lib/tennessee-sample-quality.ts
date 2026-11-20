/**
 * Tennessee bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Population metrics use the HFC ACLF Full Bed Report unique lic_no count (333).
 * Sample rows are stratified fixtures only. Do not invent missing cities,
 * invent geocodes, or extrapolate statewide totals from the sample.
 */

export const TENNESSEE_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const TENNESSEE_SAMPLE_PLAN = {
  intendedSource: "HFC Assisted Care Living Facilities Full Bed Report PDF",
  intendedCategories: ["Assisted Care Living Facility"],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
  automaticGeocoding: false,
} as const;

export const TENNESSEE_POPULATION_QUALITY = {
  observedOn: TENNESSEE_SAMPLE_QUALITY_OBSERVED_ON,
  rows: 333,
  uniqueLicNo: 333,
  blankStreet: 0,
  blankCity: 7,
  coordinateColumns: false,
  facilitySpecificLinks: 0,
} as const;

export const TENNESSEE_SAMPLE_RESULT = {
  observedOn: TENNESSEE_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 32,
  licensedSampled: 30,
  onProbationSampled: 1,
  llcLicensedSampled: 1,
  blankCitySampled: 5,
  licensingIdentifiersObserved: 32,
  physicalAddressesObserved: 32,
  capacitiesObserved: 32,
  statusesObserved: 32,
  coordinatesObserved: 0,
  facilitySpecificLinksObserved: 0,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "Stratified sample across Licensed / On Probation / LLC Licensed, secured beds, and blank-city rows. Population metrics use the full 333-row ACLF extract. Blank cities are not invented from street text.",
} as const;

export function evaluateTennesseeSampleQuality(
  result = TENNESSEE_SAMPLE_RESULT,
  population = TENNESSEE_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 32
    && result.licensedSampled + result.onProbationSampled + result.llcLicensedSampled
      === 32
    && result.licensingIdentifiersObserved === 32
    && result.facilitySpecificLinksObserved === 0
    && result.coordinatesObserved === 0
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.rows === 333
    && population.uniqueLicNo === 333
    && population.blankStreet === 0
    && population.coordinateColumns === false
    && TENNESSEE_SAMPLE_PLAN.statewideCrawl === false
    && TENNESSEE_SAMPLE_PLAN.extrapolateStatewideFromSample === false
    && TENNESSEE_SAMPLE_PLAN.automaticGeocoding === false;
  return {
    observedOn: TENNESSEE_SAMPLE_QUALITY_OBSERVED_ON,
    plan: TENNESSEE_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
