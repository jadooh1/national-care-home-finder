/**
 * Florida assisted-living source discovery verification (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Florida Assisted Living Facilities (Ch. 429, F.S.) and Adult Family Care
 * Homes are NOT assumed equivalent to Washington adult family homes.
 */

export const FLORIDA_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const FLORIDA_ALF_COMPARISON_URL =
  "https://quality.healthfinder.fl.gov/Facility-Provider/ALF?LS=1&type=1";
export const FLORIDA_AFCH_COMPARISON_URL =
  "https://quality.healthfinder.fl.gov/Facility-Provider/Adult-FamilyCare?type=1";
export const FLORIDA_LOCATE_SEARCH_URL =
  "https://quality.healthfinder.fl.gov/Facility-Search/FacilityLocateSearch";
export const FLORIDA_AHCA_ALF_PAGE =
  "https://ahca.myflorida.com/health-quality-assurance/bureau-of-health-facility-regulation/assisted-living-unit/assisted-living-facility.html";
export const FLORIDA_AHCA_AFCH_PAGE =
  "https://ahca.myflorida.com/health-quality-assurance/bureau-of-health-facility-regulation/assisted-living-unit/adult-family-care-home.html";
export const FLORIDA_DOH_GIS_2013_LAYER =
  "https://maps.floridahealth.gov/server/rest/services/DEMO/HealthCareFacilities/FeatureServer/3";
export const FLORIDA_MIAMI_DADE_SAMPLE_XLSX =
  "https://quality.healthfinder.fl.gov/files/AllFacilityData_MiamiDade_08242026.xlsx";

/** Prior nationwide note: comparison search only; no licensing file opened. */
export const FLORIDA_PRIOR_COMPARISON_SEARCH_BASELINE = {
  source: "FloridaHealthFinder assisted living comparison",
  sourceUrl: "https://quality.healthfinder.fl.gov/compare-tools/ALF",
  licensingFileOpened: false,
  compatibilityClass: "C",
  recordedExportDate: null,
} as const;

export const FLORIDA_TYPE_DEFINITIONS = {
  statute: "Chapter 429, Florida Statutes (Assisted Care Communities)",
  assistedLivingFacility:
    "AHCA-licensed assisted living facility providing personal care in a home-like setting; ClientCode 11 on FloridaHealthFinder.",
  adultFamilyCareHome:
    "AHCA-licensed adult family care home; provider must live in the home; up to 5 residents; ClientCode 52. Separate from ALF.",
  specialtyLicensesOnProfile: [
    "Extended Congregate Care (ECC)",
    "Limited Mental Health (LMH)",
    "Limited Nursing Services (LNS)",
  ] as const,
  categoryEquivalenceToWashingtonAfh: false,
} as const;

export const FLORIDA_CURRENT_CAPTURE = {
  observedOn: FLORIDA_SOURCE_VERIFICATION_OBSERVED_ON,
  alf: {
    sourceUrl: FLORIDA_ALF_COMPARISON_URL,
    httpStatus: 200,
    pageBytes: 1673080,
    embedSha256:
      "ca0c538c20ce61bee41e3362b690b5dd04728c8a5d18d6bcd3f863112fe2d75d",
    httpLastModified: null,
    httpLastModifiedIsExportDate: false,
    pageDateHeader: "Fri, 20 Nov 2026 21:47:04 GMT",
    pageDateHeaderIsExportDate: false,
    nightlyUpdateClaimObserved: true,
    nightlyUpdateClaimIsExportDate: false,
    recordedExportDate: null,
    rows: 3025,
    uniqueFileNumbers: 3025,
    uniqueLicenseIDs: 3025,
    uniqueLicenseNumbers: 3024,
    duplicateLicenseNumber: "7622",
    duplicateLicenseNumberPairs: 1,
    facilityTypeAssistedLivingFacility: 3025,
    clientCode: "11",
    licenseStatus: {
      LICENSED: 2253,
      "IN REVIEW": 645,
      PROVISIONAL: 86,
      "IN LITIGATION": 33,
      "PROV LITIGATION": 4,
      INACTIVE: 2,
      "PENDING DENIED RENEWAL": 1,
      SUSPENDED: 1,
    },
    isClosedFalse: 3025,
    isClosedTrue: 0,
    blankAddress: 0,
    blankCity: 0,
    blankState: 1,
    blankZip: 0,
    addressLetterDigit: 3024,
    addressTypeStreet: 3025,
    zipFive: 2218,
    zipNine: 807,
    blankBedCount: 0,
    zeroCapacity: 0,
    bedMin: 4,
    bedMax: 510,
    coordinatePairs: 3025,
    blankCoordinates: 0,
    zeroCoordinates: 0,
    countyInListEmbed: false,
    specialtyLicenseInListEmbed: false,
    coordinatesAreLicensingCoordinates: false,
    coordinateSourceDescribed: false,
  },
  afch: {
    sourceUrl: FLORIDA_AFCH_COMPARISON_URL,
    rows: 230,
    uniqueFileNumbers: 230,
    uniqueLicenseIDs: 230,
    uniqueLicenseNumbers: 230,
    facilityTypeAdultFamilyCareHome: 230,
    clientCode: "52",
    licenseStatus: {
      LICENSED: 211,
      "IN REVIEW": 18,
      "IN LITIGATION": 1,
    },
    bedMin: 2,
    bedMax: 5,
    blankAddress: 0,
    blankCoordinates: 0,
    categoryEquivalenceToWashingtonAfh: false,
  },
  dohGis2013: {
    sourceUrl: FLORIDA_DOH_GIS_2013_LAYER,
    rows: 3093,
    descriptionStamp: "AHCA download May 7, 2013 / licensure snapshot May 1, 2013",
    rejectedAsCurrentLicensingSource: true,
  },
  miamiDadeSample: {
    sourceUrl: FLORIDA_MIAMI_DADE_SAMPLE_XLSX,
    titleStamp: "All Facilities_2026/8/24_9:56:9",
    httpLastModified: "Wed, 16 Sep 2026 13:42:30 GMT",
    titleStampIsStatewideAlfExportDate: false,
    httpLastModifiedIsExportDate: false,
    mixedFacilityTypes: true,
  },
  definitions: FLORIDA_TYPE_DEFINITIONS,
  prior: FLORIDA_PRIOR_COMPARISON_SEARCH_BASELINE,
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateFloridaSourceVerification(
  current = FLORIDA_CURRENT_CAPTURE,
) {
  const a = current.alf;
  const statusSum = Object.values(a.licenseStatus).reduce((s, n) => s + n, 0);
  const integrityOk =
    a.rows === 3025
    && statusSum === 3025
    && a.uniqueFileNumbers === 3025
    && a.uniqueLicenseIDs === 3025
    && a.uniqueLicenseNumbers === 3024
    && a.facilityTypeAssistedLivingFacility === 3025
    && a.blankAddress === 0
    && a.zeroCapacity === 0
    && a.coordinatePairs === 3025
    && a.recordedExportDate === null
    && a.coordinatesAreLicensingCoordinates === false
    && a.countyInListEmbed === false
    && current.dohGis2013.rejectedAsCurrentLicensingSource === true
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.categoryEquivalenceToWashingtonAfh === false
    && current.afch.rows === 230
    && current.afch.bedMax === 5
    && current.afch.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: FLORIDA_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: FLORIDA_PRIOR_COMPARISON_SEARCH_BASELINE,
    current,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function floridaDirectoryReady(): false {
  return false;
}
