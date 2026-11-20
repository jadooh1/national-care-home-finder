/**
 * South Carolina bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Population metrics use the Health Facilities FeatureServer CRCF filter
 * (PERMIT_TYPE = HLRESIDENTIALCARE) unique LICENSE_NBR count (427).
 * Sample rows are stratified fixtures only. Do not invent missing values,
 * invent geocodes, or extrapolate statewide totals from the sample.
 */

export const SOUTH_CAROLINA_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const SOUTH_CAROLINA_SAMPLE_PLAN = {
  intendedSource:
    "DPH Health Facilities FeatureServer CRCF filter (HLRESIDENTIALCARE)",
  intendedCategories: ["Community Residential Care Facility"],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
  automaticGeocoding: false,
} as const;

export const SOUTH_CAROLINA_POPULATION_QUALITY = {
  observedOn: SOUTH_CAROLINA_SAMPLE_QUALITY_OBSERVED_ON,
  rows: 427,
  uniqueLicenseNbr: 427,
  blankStreet: 0,
  blankCity: 0,
  geometryPresent4326: 427,
  facilitySpecificLinks: 0,
  crcNbrTotalBedsNull: 272,
  crcConflictsWithNbr: 54,
} as const;

export const SOUTH_CAROLINA_SAMPLE_RESULT = {
  observedOn: SOUTH_CAROLINA_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 32,
  band1to6Sampled: 10,
  band7to16Sampled: 11,
  band17PlusSampled: 11,
  licensingIdentifiersObserved: 32,
  physicalAddressesObserved: 32,
  capacitiesObserved: 32,
  statusesObserved: 32,
  coordinatesObserved: 32,
  facilitySpecificLinksObserved: 0,
  crcBedsNullSampled: 22,
  crcConflictsSampled: 2,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "Stratified sample across NBR_LICENSED bands 1–6 / 7–16 / 17+, including CRC_NBR_TOTAL_BEDS null and conflict rows. Population metrics use the full 427-row CRCF query. Do not invent CRC_NBR_TOTAL_BEDS from NBR_LICENSED.",
} as const;

export function evaluateSouthCarolinaSampleQuality(
  result = SOUTH_CAROLINA_SAMPLE_RESULT,
  population = SOUTH_CAROLINA_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 32
    && result.band1to6Sampled + result.band7to16Sampled + result.band17PlusSampled
      === 32
    && result.licensingIdentifiersObserved === 32
    && result.facilitySpecificLinksObserved === 0
    && result.coordinatesObserved === 32
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.rows === 427
    && population.uniqueLicenseNbr === 427
    && population.blankStreet === 0
    && population.geometryPresent4326 === 427
    && SOUTH_CAROLINA_SAMPLE_PLAN.statewideCrawl === false
    && SOUTH_CAROLINA_SAMPLE_PLAN.extrapolateStatewideFromSample === false
    && SOUTH_CAROLINA_SAMPLE_PLAN.automaticGeocoding === false;
  return {
    observedOn: SOUTH_CAROLINA_SAMPLE_QUALITY_OBSERVED_ON,
    plan: SOUTH_CAROLINA_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
