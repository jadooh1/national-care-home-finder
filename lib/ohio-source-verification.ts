/**
 * Ohio residential care facility source discovery verification (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Residential Care Facilities (ORC Ch. 3721; OAC 3701-16) are licensed by ODH
 * and are NOT assumed equivalent to Washington adult family homes.
 */

export const OHIO_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const OHIO_FACILITY_LISTING_CRITERIA_URL =
  "https://publicapps.odh.ohio.gov/EID/reports/EID_Report_Criteria.aspx";
export const OHIO_PROVIDER_SEARCH_URL =
  "https://publicapps.odh.ohio.gov/EID/Provider_Search.aspx";
export const OHIO_DETAIL_STATE_LICENSE_URL =
  "https://publicapps.odh.ohio.gov/EID/Detail_StateLicense.aspx";
export const OHIO_EID_HOME_URL = "https://publicapps.odh.ohio.gov/eid/";
export const OHIO_RCF_PROGRAM_URL =
  "https://odh.ohio.gov/know-our-programs/residential-care-facilities-assisted-living";
export const OHIO_ARCGIS_DERIVATIVE_URL =
  "https://services6.arcgis.com/zxOMWqh0yAD6mMsJ/arcgis/rest/services/Assisted_Facilities_in_Ohio_NEW/FeatureServer/0";

/** Prior nationwide note: Class C; search can generate a report; no adopted count. */
export const OHIO_PRIOR_BASELINE = {
  compatibilityClass: "C",
  licensingFileOpened: false,
  recordedExportDate: null,
  observedRows: null,
} as const;

export const OHIO_TYPE_DEFINITIONS = {
  authority: "Ohio Department of Health, Bureau of Regulatory Operations",
  residentialCareFacility:
    "ORC Ch. 3721 / OAC 3701-16: residential care facility (assisted living) providing accommodations and personal care; licensed capacity thresholds per statute.",
  factypeL12: "L12 / ABBREV SL-R — Residential Care or Assisted Living on the Facility Listing extract.",
  factypeL17Note:
    "Five CLOSED CIN-R / FACTYPE L17 rows appeared in the same Residential Care listing extract and are retained as source values but are not treated as active RCF inventory.",
  categoryEquivalenceToWashingtonAfh: false,
} as const;

export const OHIO_CURRENT_CAPTURE = {
  observedOn: OHIO_SOURCE_VERIFICATION_OBSERVED_ON,
  facilityListing: {
    sourceUrl: OHIO_FACILITY_LISTING_CRITERIA_URL,
    criteria:
      "State of Ohio License; provider type 22 Residential Care or Assisted Living; ALL STATUS; ALL COUNTIES; Include Owner=NO",
    csvBytes: 287686,
    csvSha256: "34e2c6a45b5470a94b22ad8c52f71931175753291f52b022517d7dea4c823ba9",
    pdfBytes: 296760,
    pdfSha256: "fafbd623cf0d773ef3d8023c1c0f9795c33714850d46fa48dc512bea380c79fa",
    httpLastModifiedOnPdf: "Fri, 20 Nov 2026 22:29:35 GMT",
    httpLastModifiedIsExportDate: false,
    pdfFilenameTimestampIsExportDate: false,
    serverDeployDate: "10/4/2026",
    softwareReleaseDate: "01/27/2026",
    recordedExportDate: null,
    rawCsvRowsIncludingHtmlGarbage: 1174,
    htmlGarbageRowsRejected: 17,
  },
  residentialCare: {
    licensedRows: 1157,
    l12Rows: 1152,
    l17ClosedRows: 5,
    uniqueFacidL12: 1152,
    uniqueStateidL12: 1149,
    facidDuplicates: 0,
    blankAddressL12: 0,
    statusCountsL12: {
      ACTIVE: 801,
      "ACTIVE - PENDING RENEWAL": 16,
      PENDING: 26,
      "CLOSED-OWNER": 220,
      "CLOSED-OTHER": 58,
      "CLOSED-STATE": 31,
    },
    activeCount: 801,
    closedDatePresentOnClosedRows: 309,
    bedsNullishActive: 0,
    bedMinActive: 5,
    bedMaxActive: 508,
    zeroBedsActive: 0,
    coordinateColumns: false,
  },
  arcgisDerivative: {
    sourceUrl: OHIO_ARCGIS_DERIVATIVE_URL,
    rows: 814,
    dataLastEditDate: "2026-10-05T13:40:01.615Z",
    acceptedAsAuthoritativeExport: false,
    coordinatesAreLicensingCoordinates: false,
    note: "OEMA republish of ODH OneSource every 2 months; not the Facility Listing extract.",
  },
  programPage: {
    sourceUrl: OHIO_RCF_PROGRAM_URL,
    approxCountPhrase: 720,
    acceptedAsRosterCount: false,
  },
  definitions: OHIO_TYPE_DEFINITIONS,
  prior: OHIO_PRIOR_BASELINE,
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateOhioSourceVerification(
  current = OHIO_CURRENT_CAPTURE,
) {
  const r = current.residentialCare;
  const integrityOk =
    r.l12Rows === 1152
    && r.uniqueFacidL12 === 1152
    && r.facidDuplicates === 0
    && r.blankAddressL12 === 0
    && r.activeCount === 801
    && r.statusCountsL12.ACTIVE === 801
    && r.coordinateColumns === false
    && current.facilityListing.recordedExportDate === null
    && current.arcgisDerivative.acceptedAsAuthoritativeExport === false
    && current.programPage.acceptedAsRosterCount === false
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: OHIO_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: OHIO_PRIOR_BASELINE,
    current,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function ohioDirectoryReady(): false {
  return false;
}
