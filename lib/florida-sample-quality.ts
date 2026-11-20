/**
 * Florida bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Population metrics use the full ALF comparison embed (3,025 rows).
 * Sample rows are stratified fixtures only. Do not invent missing values,
 * geocode facilities, or extrapolate statewide totals from the sample.
 */

export const FLORIDA_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const FLORIDA_SAMPLE_PLAN = {
  intendedSource: "FloridaHealthFinder ALF comparison embed (Facility-Provider/ALF)",
  intendedStatuses: [
    "LICENSED",
    "IN REVIEW",
    "PROVISIONAL",
    "IN LITIGATION",
    "PROV LITIGATION",
    "INACTIVE",
    "SUSPENDED",
  ],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
  automaticGeocoding: false,
} as const;

export const FLORIDA_POPULATION_QUALITY = {
  observedOn: FLORIDA_SAMPLE_QUALITY_OBSERVED_ON,
  rows: 3025,
  uniqueFileNumbers: 3025,
  uniqueLicenseIDs: 3025,
  uniqueLicenseNumbers: 3024,
  blankAddress: 0,
  blankBedCount: 0,
  zeroCapacity: 0,
  coordinatePairs: 3025,
  blankCoordinates: 0,
  licensedStatusRows: 2253,
} as const;

export const FLORIDA_SAMPLE_RESULT = {
  observedOn: FLORIDA_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 32,
  licensingIdentifiersObserved: 32,
  physicalAddressesObserved: 32,
  capacitiesObserved: 32,
  statusesObserved: 32,
  coordinatesObserved: 32,
  facilitySpecificLinksObserved: 32,
  profileLidVerifiedOnSampleFacility: true,
  inspectionVerifiedOnSampleFacility: true,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "Stratified sample across LicenseStatus values. Population metrics use the full 3,025-row ALF embed. Profile LID and inspection prefixes verified on FileNumber 11968002 / LicenseID 313782.",
} as const;

export function evaluateFloridaSampleQuality(
  result = FLORIDA_SAMPLE_RESULT,
  population = FLORIDA_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 32
    && result.licensingIdentifiersObserved === 32
    && result.facilitySpecificLinksObserved === 32
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.rows === 3025
    && population.coordinatePairs === 3025
    && population.blankAddress === 0
    && population.uniqueLicenseNumbers === 3024
    && FLORIDA_SAMPLE_PLAN.statewideCrawl === false
    && FLORIDA_SAMPLE_PLAN.extrapolateStatewideFromSample === false
    && FLORIDA_SAMPLE_PLAN.automaticGeocoding === false;
  return {
    observedOn: FLORIDA_SAMPLE_QUALITY_OBSERVED_ON,
    plan: FLORIDA_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
