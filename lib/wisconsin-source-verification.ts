/**
 * Wisconsin AFH source verification (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const WISCONSIN_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const WISCONSIN_AFH_GUIDE_URL = "https://www.dhs.wisconsin.gov/guide/afh.htm";
export const WISCONSIN_PDF_DIRECTORY_URL = "https://www.dhs.wisconsin.gov/guide/afhdir.pdf";
export const WISCONSIN_EXCEL_DIRECTORY_URL = "https://www.dhs.wisconsin.gov/guide/afhdirexcel.xlsx";
export const WISCONSIN_GIS_LAYER_URL =
  "https://dhsgis.wi.gov/server/rest/services/DHS_GIS/Facilities/MapServer/2";
export const WISCONSIN_PROVIDER_SEARCH_URL =
  "https://www.forwardhealth.wi.gov/WIPortal/subsystem/public/DQAProviderSearch.aspx";

/** Prior recorded observation from next-state onboarding (PDF IDs + GIS). */
export const WISCONSIN_PRIOR_RECORDED_BASELINE = {
  pdfDistinctParentheticalIds: 1980,
  pdfDatePhrase: null,
  gisFeatures: 2203,
  gisBlankLicense: 9,
  gisBlankAddressCityZip: 0,
  gisEditingTimestamp: null,
  recordedExportDate: null,
  selected: false,
  gisAcceptedAsDirectory: false,
} as const;

/** Current read-only capture (this investigation). HTTP clocks ≠ export date. */
export const WISCONSIN_CURRENT_CAPTURE = {
  observedOn: WISCONSIN_SOURCE_VERIFICATION_OBSERVED_ON,
  excel: {
    sourceUrl: WISCONSIN_EXCEL_DIRECTORY_URL,
    httpStatus: 200,
    lastModified: "Mon, 20 Jul 2026 13:40:37 GMT",
    bytes: 676722,
    sha256: "bbefc34f6233576c745b8aa622a517e91c8448b0def2678e9a7e10ae55ca6962",
    rows: 2479,
    uniqueFacilityIds: 2479,
    duplicateFacilityIds: 0,
    blankStreet: 0,
    blankCity: 0,
    blankZip5: 0,
    stateWi: 2479,
    streetLetterAndDigit: 2479,
    mailingStreetDiffers: 1751,
    capacity3: 437,
    capacity4: 2042,
    classes: { AMBULATORY: 1205, AFH: 679, NONAMBULATORY: 595 },
    perRowLicensingStatusColumn: false,
    recordedExportDate: null,
    lastModifiedIsExportDate: false,
  },
  pdf: {
    sourceUrl: WISCONSIN_PDF_DIRECTORY_URL,
    httpStatus: 200,
    lastModified: "Thu, 05 Nov 2026 00:00:47 GMT",
    bytes: 935363,
    sha256: "e6701ba14ad7877256bc083de734d800c18e72403365df24036e83e1360797eb",
    nameIdPairs: 2517,
    uniqueParentheticalIds: 2516,
    duplicateParentheticalId: "0018697",
    directoryUpdatedStamp: "11/04/2026",
    directoryUpdatedStampIsExportDate: false,
    facilityAddressLabel: "Facility Name and Address",
    mailingAddressLabel: "Mailing Address",
    recordedExportDate: null,
    lastModifiedIsExportDate: false,
  },
  gis: {
    sourceUrl: WISCONSIN_GIS_LAYER_URL,
    httpStatus: 200,
    features: 2203,
    typeAdultFamilyHome: 2203,
    stateWi: 2203,
    blankWiLicenseNum: 9,
    duplicateWiLicenseKeys: 2,
    blankAddress: 0,
    blankCity: 0,
    blankZip: 0,
    blankLatLon: 0,
    hasLastEditTime: false,
    editingInfo: null,
    recordedExportDate: null,
  },
  excelVsPdf: {
    intersection: 2419,
    excelOnly: 60,
    pdfOnly: 97,
  },
  countyRegulatedOneTwoBedOutsideStateDirectory: true,
  publicationEligibleRows: 0,
} as const;

export function compareWisconsinBaselineToCurrent(
  prior = WISCONSIN_PRIOR_RECORDED_BASELINE,
  current = WISCONSIN_CURRENT_CAPTURE,
) {
  return {
    gisFeatureDelta: current.gis.features - prior.gisFeatures,
    gisBlankLicenseUnchanged: current.gis.blankWiLicenseNum === prior.gisBlankLicense,
    pdfIdDeltaVsPrior: current.pdf.uniqueParentheticalIds - prior.pdfDistinctParentheticalIds,
    excelRowsNowPrimaryLicensingCount: current.excel.rows,
    exportDateStillAbsent:
      current.excel.recordedExportDate === null
      && current.pdf.recordedExportDate === null
      && current.gis.recordedExportDate === null
      && prior.recordedExportDate === null,
    gisStillNotAcceptedAsDirectory: prior.gisAcceptedAsDirectory === false,
    note:
      "Structured Excel directory is now 2,479 Facility ID rows (prior PDF-only baseline was 1,980). GIS remains 2,203 features with 9 blank WI_LICENSE_NUM. Directory Updated 11/04/2026 and HTTP Last-Modified values are rejected as ISO export dates.",
  };
}

export function evaluateWisconsinSourceVerification() {
  const comparison = compareWisconsinBaselineToCurrent();
  const excel = WISCONSIN_CURRENT_CAPTURE.excel;
  const integrityOk =
    excel.rows === 2479
    && excel.uniqueFacilityIds === 2479
    && excel.capacity3 + excel.capacity4 === 2479
    && WISCONSIN_CURRENT_CAPTURE.gis.features === 2203
    && WISCONSIN_CURRENT_CAPTURE.gis.blankWiLicenseNum === 9
    && WISCONSIN_CURRENT_CAPTURE.publicationEligibleRows === 0
    && excel.recordedExportDate === null;
  return {
    observedOn: WISCONSIN_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: WISCONSIN_PRIOR_RECORDED_BASELINE,
    current: WISCONSIN_CURRENT_CAPTURE,
    comparison,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function wisconsinDirectoryReady(): false {
  return false;
}
