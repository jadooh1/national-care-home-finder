/**
 * Maryland assisted living program source discovery verification (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Assisted Living Programs licensed by MDH OHCQ are NOT assumed equivalent
 * to Washington adult family homes. Level of Care (1/2/3) is distinct from
 * observed capacity bands (≤16 vs >16). Do not invent regulatory small/large
 * labels beyond those observed source fields.
 */

export const MARYLAND_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const MARYLAND_OHCQ_DIRECTORIES_URL =
  "https://health.maryland.gov/ohcq/Pages/OHCQ-Licensee-Directories.aspx";
export const MARYLAND_ALP_EXCEL_URL =
  "https://health.maryland.gov/ohcq/docs/Provider-Listings/Excel/Assisted-Living-Excel.xlsx";
export const MARYLAND_OHCQ_HOME_URL = "https://health.maryland.gov/ohcq/Pages/Index.aspx";
export const MARYLAND_MHCC_CONSUMER_GUIDE_URL =
  "https://healthcarequality.mhcc.maryland.gov/AssistedLiving/Suggestion";
export const MARYLAND_OPEN_DATA_IMAP_URL =
  "https://mdgeodata.md.gov/imap/rest/services/Health/MD_LongTermCareAssistedLiving/FeatureServer/1";

/** Prior nationwide note: Class D; licensing directory not opened. */
export const MARYLAND_PRIOR_BASELINE = {
  compatibilityClass: "D",
  licensingFileOpened: false,
  recordedExportDate: null,
  observedRows: null,
} as const;

export const MARYLAND_TYPE_DEFINITIONS = {
  authority: "Maryland Department of Health, Office of Health Care Quality (OHCQ)",
  assistedLivingProgram:
    "Assisted Living Program licensed by MDH OHCQ; Level of Care 1/2/3 on the licensee Excel directory.",
  levelOfCare:
    "Source Level of Care values Level 1 / Level 2 / Level 3 (plus one blank on this capture).",
  capacityBandsObserved:
    "Observed Capacity ≤16: 1,472 rows; Capacity >16: 204 rows. Capacity bands are not a Washington AFH mapping and are not invented small/large regulatory labels.",
  categoryEquivalenceToWashingtonAfh: false,
} as const;

export const MARYLAND_CURRENT_CAPTURE = {
  observedOn: MARYLAND_SOURCE_VERIFICATION_OBSERVED_ON,
  assistedLivingExcel: {
    sourceUrl: MARYLAND_ALP_EXCEL_URL,
    directoriesPageUrl: MARYLAND_OHCQ_DIRECTORIES_URL,
    sheetName: "ALs-EXCEL as of 11-05-26",
    sheetAsOfLabel: "11-05-26",
    sheetAsOfIsIsoExportDate: false,
    pageLastUpdatedLabel: "November 16, 2026",
    pageLastUpdatedIsIsoExportDate: false,
    httpLastModified: "Fri, 06 Nov 2026 00:51:34 GMT",
    httpLastModifiedIsExportDate: false,
    recordedExportDate: null,
    bytes: 191830,
    sha256: "c5eefe03324e16638c5051f6af39549dfc3a5019410217d31b61d5d97cb16f73",
    rows: 1676,
    uniqueLicenseNumber: 1675,
    blankLicenseNumber: 0,
    duplicateLicenseGroups: 1,
    duplicateLicenseNumber: "AL-00064",
    blankStreetAddress: 0,
    perRowStatusColumn: false,
    coordinateColumns: false,
    capacityNullish: 0,
    capacityZero: 0,
    capacityMin: 2,
    capacityMax: 319,
    capacityLe16: 1472,
    capacityGt16: 204,
    levelOfCareCounts: {
      "Level 1": 1,
      "Level 2": 51,
      "Level 3": 1623,
      blank: 1,
    },
    specialCareBedsNonzero: 113,
  },
  openDataImap: {
    sourceUrl: MARYLAND_OPEN_DATA_IMAP_URL,
    rows: 1568,
    acceptedAsAuthoritativeLicensingRoster: false,
    coordinatesAreLicensingCoordinates: false,
    note:
      "OP&R / IMAP LongTermCare Assisted Living FeatureServer with XCoordinate/YCoordinate and OHCQ_Index_No_. Row count 1,568 ≠ OHCQ Excel 1,676. Rejected as licensing roster and as licensing coordinates.",
  },
  mhcc: {
    consumerGuideUrl: MARYLAND_MHCC_CONSUMER_GUIDE_URL,
    uniformDisclosureStatementIsOnRequestNotUrl: true,
    guessedFacilityDetailRejected: true,
  },
  definitions: MARYLAND_TYPE_DEFINITIONS,
  prior: MARYLAND_PRIOR_BASELINE,
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateMarylandSourceVerification(
  current = MARYLAND_CURRENT_CAPTURE,
) {
  const a = current.assistedLivingExcel;
  const integrityOk =
    a.rows === 1676
    && a.uniqueLicenseNumber === 1675
    && a.duplicateLicenseGroups === 1
    && a.blankStreetAddress === 0
    && a.capacityNullish === 0
    && a.capacityZero === 0
    && a.capacityLe16 === 1472
    && a.capacityGt16 === 204
    && a.perRowStatusColumn === false
    && a.coordinateColumns === false
    && a.recordedExportDate === null
    && current.openDataImap.acceptedAsAuthoritativeLicensingRoster === false
    && current.openDataImap.coordinatesAreLicensingCoordinates === false
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: MARYLAND_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: MARYLAND_PRIOR_BASELINE,
    current,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function marylandDirectoryReady(): false {
  return false;
}
