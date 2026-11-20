/**
 * Virginia bounded sample-quality assessment (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Population metrics use the ALF search list unique licenseId count (575).
 * Detail fields (capacity, licenseType) are sample-only — do not extrapolate
 * statewide totals from the sample. Do not invent geocodes.
 */

export const VIRGINIA_SAMPLE_QUALITY_OBSERVED_ON = "2026-11-20";

export const VIRGINIA_SAMPLE_PLAN = {
  intendedSource: "VDSS Assisted Living Facility Search (list + bounded detail)",
  intendedCategories: ["Assisted Living Facility"],
  boundedReadOnly: true,
  statewideCrawl: false,
  inventMissingValues: false,
  extrapolateStatewideFromSample: false,
  automaticGeocoding: false,
  detailFetchesBoundedToSample: true,
} as const;

export const VIRGINIA_POPULATION_QUALITY = {
  observedOn: VIRGINIA_SAMPLE_QUALITY_OBSERVED_ON,
  rows: 575,
  uniqueLicenseIds: 575,
  blankAddress: 0,
  coordinateColumns: false,
  capacityOnList: false,
  facilitySpecificDisclosurePrefix: true,
} as const;

export const VIRGINIA_SAMPLE_RESULT = {
  observedOn: VIRGINIA_SAMPLE_QUALITY_OBSERVED_ON,
  sampleExecuted: true,
  rowsSampled: 32,
  detailFetchesOk: 32,
  licensingIdentifiersObserved: 32,
  physicalAddressesObserved: 32,
  capacitiesObservedOnDetail: 32,
  licenseTypesObservedOnDetail: 32,
  licenseTypeCodes: { "1YR": 11, "2YR": 12, "3YR": 6, COND: 3 },
  capacityMin: 4,
  capacityMax: 225,
  capacityZero: 0,
  coordinatesObserved: 0,
  facilitySpecificLinksObserved: 32,
  unresolvedMarkedIneligible: true,
  populationIsNotExtrapolatedFromSample: true,
  note:
    "32 detail pages fetched only. Capacity and licenseType are sample-observed; not extrapolated to 575.",
} as const;

export function evaluateVirginiaSampleQuality(
  result = VIRGINIA_SAMPLE_RESULT,
  population = VIRGINIA_POPULATION_QUALITY,
) {
  const integrityOk =
    result.sampleExecuted === true
    && result.rowsSampled === 32
    && result.detailFetchesOk === 32
    && result.licensingIdentifiersObserved === 32
    && result.facilitySpecificLinksObserved === 32
    && result.coordinatesObserved === 0
    && result.populationIsNotExtrapolatedFromSample === true
    && result.unresolvedMarkedIneligible === true
    && population.rows === 575
    && population.blankAddress === 0
    && population.coordinateColumns === false
    && VIRGINIA_SAMPLE_PLAN.statewideCrawl === false
    && VIRGINIA_SAMPLE_PLAN.extrapolateStatewideFromSample === false
    && VIRGINIA_SAMPLE_PLAN.automaticGeocoding === false
    && VIRGINIA_SAMPLE_PLAN.detailFetchesBoundedToSample === true;
  return {
    observedOn: VIRGINIA_SAMPLE_QUALITY_OBSERVED_ON,
    plan: VIRGINIA_SAMPLE_PLAN,
    population,
    result,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
