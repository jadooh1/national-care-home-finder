/**
 * Colorado bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * ALR category query (685 rows) is a bounded FeatureServer filter, not a
 * statewide crawl of every CDPHE facility type. Sample rows are stratified
 * for regression fixtures only. Do not invent missing values or extrapolate
 * statewide totals from the sample.
 */

export const COLORADO_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const COLORADO_SAMPLE_PLAN = {
  intendedSource: "CDPHE Health Facilities FeatureServer layer 0",
  intendedCategories: [
    "Assisted Living Residence (ALR ONLY)",
    "Assisted Living Residence (ALR/ACF)",
    "Assisted Living Residence (ALR/BISL)",
  ],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
  categoryFilter: "Facility_Type='Assisted Living Residence'",
} as const;

/** Full ALR filter population quality (not extrapolated from sample). */
export const COLORADO_ALR_POPULATION_QUALITY = {
  observedOn: COLORADO_SAMPLE_QUALITY_OBSERVED_ON,
  rows: 685,
  uniqueFacilityIds: 685,
  duplicateFacilityIds: 0,
  blankFacilityId: 0,
  blankName: 0,
  blankAddress: 0,
  addressCoZipPattern: 685,
  blankCounty: 0,
  blankBeds: 0,
  zeroBeds: 27,
  blankLatLon: 0,
  operatingStatus: { Active: 670, Pending: 15 },
  licensedFlag: { Licensed: 659, "HCPF Certified": 26 },
  typeDetail: { "ALR ONLY": 358, "ALR/ACF": 285, "ALR/BISL": 42 },
  activeLicensedBedsGt0: 646,
  alrIdSetSha256:
    "3e4fa60a3245a7961c98c2c124d4287b29dc6e8f8b364f7045ff88cddc5fde56",
} as const;

/** Stratified bounded sample retained as a fixture (34 rows). */
export const COLORADO_SAMPLE_RESULT = {
  observedOn: COLORADO_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 34,
  licensingIdentifiersObserved: 34,
  physicalAddressesObserved: 34,
  mailingAddressesObserved: 0,
  capacitiesObserved: 34,
  zeroCapacityInSample: 14,
  statusesObserved: 34,
  coordinatesObserved: 34,
  facilitySpecificLinksObserved: 0,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "Sample includes ALR ONLY / ALR/ACF / ALR/BISL strata plus zero-bed, Pending, and HCPF Certified examples. Population metrics use the full ALR filter (685), not the sample.",
} as const;

export function evaluateColoradoSampleQuality(
  result = COLORADO_SAMPLE_RESULT,
  population = COLORADO_ALR_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 34
    && result.licensingIdentifiersObserved === 34
    && result.physicalAddressesObserved === 34
    && result.facilitySpecificLinksObserved === 0
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.rows === 685
    && population.uniqueFacilityIds === 685
    && population.zeroBeds === 27
    && population.blankAddress === 0
    && COLORADO_SAMPLE_PLAN.statewideCrawl === false
    && COLORADO_SAMPLE_PLAN.extrapolateStatewideFromSample === false;
  return {
    observedOn: COLORADO_SAMPLE_QUALITY_OBSERVED_ON,
    plan: COLORADO_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
