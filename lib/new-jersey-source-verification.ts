/**
 * New Jersey assisted living source discovery verification (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Assisted Living Residences (ALR), Comprehensive Personal Care Homes (CPCH),
 * and Assisted Living Programs (ALP) are separate NJDOH facility types and are
 * NOT assumed equivalent to Washington adult family homes. Adult Family Care /
 * Alternate Family Care is a separate type and is also not Washington AFH.
 */

export const NEW_JERSEY_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const NEW_JERSEY_LTC_SEARCH_URL =
  "https://healthapps.nj.gov/facilities/fsSearch.aspx";
export const NEW_JERSEY_LTC_COUNTY_SEARCH_URL =
  "https://healthapps.nj.gov/facilities/fsSetSearch.aspx?by=county";
export const NEW_JERSEY_ALL_LTC_XLSX_URL =
  "https://healthapps.nj.gov/facilities/documents2/All_LTC.xlsx";
export const NEW_JERSEY_FACILITY_DETAILS_PREFIX =
  "https://healthapps.nj.gov/facilities/fsFacilityDetails.aspx?item=";
export const NEW_JERSEY_HEALTH_FACILITIES_URL =
  "https://www.nj.gov/health/healthfacilities/";

/** Prior nationwide note: Class C; search filters exist; no roster opened. */
export const NEW_JERSEY_PRIOR_BASELINE = {
  compatibilityClass: "C",
  licensingFileOpened: false,
  recordedExportDate: null,
  observedRows: null,
} as const;

export const NEW_JERSEY_TYPE_DEFINITIONS = {
  authority: "New Jersey Department of Health, Health Facilities",
  assistedLivingResidence:
    "FACILITY_TYPE ASSISTED LIVING RESIDENCE on the All_LTC.xlsx licensee workbook.",
  comprehensivePersonalCareHome:
    "FACILITY_TYPE COMPREHENSIVE PERSONAL CARE HOME on the All_LTC.xlsx licensee workbook.",
  assistedLivingProgram:
    "FACILITY_TYPE ASSISTED LIVING PROGRAM on the All_LTC.xlsx licensee workbook (Lic_Beds_Slots observed as 0 on all ALP rows in this capture).",
  adultFamilyCareNote:
    "Adult Family Care / Alternate Family Care is a separate search/workbook type and is not Washington adult family home.",
  categoryEquivalenceToWashingtonAfh: false,
} as const;

export const NEW_JERSEY_CURRENT_CAPTURE = {
  observedOn: NEW_JERSEY_SOURCE_VERIFICATION_OBSERVED_ON,
  allLtcWorkbook: {
    sourceUrl: NEW_JERSEY_ALL_LTC_XLSX_URL,
    sheetName: "All_LTC",
    bytes: 248181,
    sha256: "39d0e7f6af13130a4e7fb328e9cfc7704853702e65f503d6e8b8724dd710f716",
    httpLastModified: "Fri, 06 Nov 2026 18:16:17 GMT",
    httpLastModifiedIsExportDate: false,
    runDateLabel: "2026-11-06",
    runDateIsIsoExportDate: false,
    recordedExportDate: null,
    workbookRows: 894,
  },
  assistedLivingResidence: {
    facilityType: "ASSISTED LIVING RESIDENCE",
    rows: 256,
    uniqueFacID: 256,
    uniqueLic: 256,
    blankAddress: 0,
    bedMin: 21,
    bedMax: 288,
    bedsNullish: 0,
    bedsZero: 0,
    nonzeroCoordRows: 246,
    zeroCoordRows: 10,
    perRowOperatingStatusColumn: false,
  },
  comprehensivePersonalCareHome: {
    facilityType: "COMPREHENSIVE PERSONAL CARE HOME",
    rows: 32,
    uniqueFacID: 32,
    uniqueLic: 32,
    blankAddress: 0,
    bedMin: 16,
    bedMax: 308,
    bedsNullish: 0,
    bedsZero: 0,
    nonzeroCoordRows: 32,
    zeroCoordRows: 0,
    perRowOperatingStatusColumn: false,
  },
  assistedLivingProgram: {
    facilityType: "ASSISTED LIVING PROGRAM",
    rows: 17,
    uniqueFacID: 17,
    uniqueLic: 17,
    blankAddress: 0,
    bedMin: 0,
    bedMax: 0,
    bedsNullish: 0,
    bedsZero: 17,
    nonzeroCoordRows: 15,
    zeroCoordRows: 2,
    perRowOperatingStatusColumn: false,
  },
  combined: {
    rows: 305,
    uniqueFacID: 305,
    uniqueLic: 305,
    facIdOverlapAcrossTypes: 0,
    licOverlapAcrossTypes: 0,
    coordinateColumns: true,
    coordinatesAreLicensingCoordinates: false,
  },
  disclosure: {
    prefixVerified: true,
    pattern: "fsFacilityDetails.aspx?item={FacID}",
    prefix: NEW_JERSEY_FACILITY_DETAILS_PREFIX,
    verifiedOnAlrCpchAlpSample: true,
  },
  definitions: NEW_JERSEY_TYPE_DEFINITIONS,
  prior: NEW_JERSEY_PRIOR_BASELINE,
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateNewJerseySourceVerification(
  current = NEW_JERSEY_CURRENT_CAPTURE,
) {
  const c = current.combined;
  const integrityOk =
    current.assistedLivingResidence.rows === 256
    && current.comprehensivePersonalCareHome.rows === 32
    && current.assistedLivingProgram.rows === 17
    && c.rows === 305
    && c.uniqueFacID === 305
    && c.facIdOverlapAcrossTypes === 0
    && current.assistedLivingProgram.bedsZero === 17
    && current.allLtcWorkbook.recordedExportDate === null
    && current.allLtcWorkbook.runDateIsIsoExportDate === false
    && c.coordinatesAreLicensingCoordinates === false
    && current.disclosure.prefixVerified === true
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: NEW_JERSEY_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: NEW_JERSEY_PRIOR_BASELINE,
    current,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function newJerseyDirectoryReady(): false {
  return false;
}
