/**
 * Kentucky bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Population metrics use the OIG Assisted Living Community Directory workbook
 * type-row count (247). Sample rows are stratified fixtures only. Do not invent
 * missing license numbers, invent geocodes, or extrapolate statewide totals
 * from the sample.
 */

export const KENTUCKY_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const KENTUCKY_SAMPLE_PLAN = {
  intendedSource: "OIG Assisted Living Community Directory XLSX (November 2026)",
  intendedCategories: ["ALC", "ALC-BH", "ALC-DC"],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
  automaticGeocoding: false,
} as const;

export const KENTUCKY_POPULATION_QUALITY = {
  observedOn: KENTUCKY_SAMPLE_QUALITY_OBSERVED_ON,
  directoryTypeRows: 247,
  uniqueLicenseNbr: 244,
  blankLicense: 1,
  dupLicenseGroups: 2,
  blankStreet: 0,
  blankCity: 0,
  coordinateColumns: false,
  facilitySpecificLinks: 0,
  unitsZero: 1,
  pendingRenewal: 75,
} as const;

export const KENTUCKY_SAMPLE_RESULT = {
  observedOn: KENTUCKY_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 32,
  alcSampled: 12,
  alcBhSampled: 10,
  alcDcSampled: 10,
  pendingRenewalSampled: 10,
  blankLicenseSampled: 1,
  zeroUnitsSampled: 1,
  licensingIdentifiersObserved: 31,
  physicalAddressesObserved: 32,
  capacitiesObserved: 32,
  expirationValuesObserved: 32,
  coordinatesObserved: 0,
  facilitySpecificLinksObserved: 0,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "Stratified sample across ALC / ALC-BH / ALC-DC, including Pending Renewal, blank LICENSE #, duplicate LICENSE #, and UNITS=0 rows. Population metrics use the full 247-row workbook. Do not invent blank licenses or treat Pending Renewal as Active/Closed.",
} as const;

export function evaluateKentuckySampleQuality(
  result = KENTUCKY_SAMPLE_RESULT,
  population = KENTUCKY_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 32
    && result.alcSampled + result.alcBhSampled + result.alcDcSampled === 32
    && result.licensingIdentifiersObserved === 31
    && result.blankLicenseSampled === 1
    && result.facilitySpecificLinksObserved === 0
    && result.coordinatesObserved === 0
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.directoryTypeRows === 247
    && population.uniqueLicenseNbr === 244
    && population.blankLicense === 1
    && population.dupLicenseGroups === 2
    && population.coordinateColumns === false
    && KENTUCKY_SAMPLE_PLAN.statewideCrawl === false
    && KENTUCKY_SAMPLE_PLAN.extrapolateStatewideFromSample === false
    && KENTUCKY_SAMPLE_PLAN.automaticGeocoding === false;
  return {
    observedOn: KENTUCKY_SAMPLE_QUALITY_OBSERVED_ON,
    plan: KENTUCKY_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
