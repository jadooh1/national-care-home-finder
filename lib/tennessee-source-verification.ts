/**
 * Tennessee assisted-care living facility source discovery verification
 * (development-only). Intentionally free of sibling runtime imports.
 *
 * Assisted Care Living Facilities (ACLF) licensed by the Tennessee Health
 * Facilities Commission / Board for Licensing Health Care Facilities are NOT
 * assumed equivalent to Residential Homes for the Aged, nursing facilities, or
 * Washington adult family homes.
 */

export const TENNESSEE_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const TENNESSEE_HFC_REPORTS_URL =
  "https://www.tn.gov/hfc/publication-and-reports/licensure-reports.html";
export const TENNESSEE_ACLF_FULL_BEDS_URL =
  "https://www.tn.gov/content/dam/tn/health/healthprofboards/hcf/ACLF-Full-Beds-Report.pdf";
export const TENNESSEE_RHA_FULL_BEDS_URL =
  "https://www.tn.gov/content/dam/tn/health/healthprofboards/hcf/RHA-Full-Beds-Report.pdf";
export const TENNESSEE_FACILITY_LISTINGS_URL =
  "https://internet.health.tn.gov/FacilityListings/";

/** Prior nationwide note: Class D; official fields not verified. */
export const TENNESSEE_PRIOR_BASELINE = {
  compatibilityClass: "D",
  licensingFileOpened: false,
  recordedExportDate: null,
  observedRows: null,
} as const;

export const TENNESSEE_TYPE_DEFINITIONS = {
  authority:
    "Tennessee Health Facilities Commission / Board for Licensing Health Care Facilities",
  assistedCareLivingFacility:
    "FACILITY_TYPE Assisted Care Living Facility on the HFC ACLF Full Bed Report.",
  residentialHomeForAged:
    "Separate Home for the Aged Full Bed Report; not merged into the ACLF roster.",
  nursingFacility:
    "Separate Nursing Home Full Bed Report exists on the HFC reports index; not adopted here.",
  categoryEquivalenceToWashingtonAfh: false,
} as const;

export const TENNESSEE_CURRENT_CAPTURE = {
  observedOn: TENNESSEE_SOURCE_VERIFICATION_OBSERVED_ON,
  aclfFullBedsReport: {
    sourceUrl: TENNESSEE_ACLF_FULL_BEDS_URL,
    reportsIndexUrl: TENNESSEE_HFC_REPORTS_URL,
    reportsIndexLatestLabel:
      "Assisted Care Living Facilities Full Bed Report - October 2026",
    reportLabelIsIsoExportDate: false,
    httpLastModified: null,
    httpLastModifiedUnavailableDueToEgress403: true,
    recordedExportDate: null,
    captureMethod: "webfetch-markdown-table-extract",
    binaryPdfSha256Unavailable: true,
    textExtractSha256:
      "ba7da4b80465973ca3ead1691a1993914bce22b36b4a2fe8b02d1e652272fd18",
    textExtractBytes: 54248,
    rows: 333,
    uniqueLicNo: 333,
    dupLicGroups: 0,
    blankStreet: 0,
    blankCity: 7,
    statusCounts: {
      Licensed: 331,
      "On Probation": 1,
      "LLC Licensed": 1,
    },
    bedsMin: 6,
    bedsMax: 184,
    bedsNullish: 0,
    bedsZero: 0,
    securedGt0: 188,
    coordinateColumns: false,
  },
  residentialHomeForAged: {
    sourceUrl: TENNESSEE_RHA_FULL_BEDS_URL,
    reportsIndexLatestLabel:
      "Residential Home for the Aged Full Bed Report - October 2026",
    undatedPdfFooterGeneratedLabel: "May 25, 2022",
    undatedPdfAcceptedAsCurrentOctober2026Roster: false,
    adoptedAsAclfRoster: false,
    note:
      "RHA is a separate license type. The undated RHA-Full-Beds-Report.pdf extract includes footer “Generated May 25, 2022” while the HFC index lists an October 2026 edition — not adopted as a current reconciled RHA count.",
  },
  facilityListings: {
    sourceUrl: TENNESSEE_FACILITY_LISTINGS_URL,
    egress403FromAgentEnvironment: true,
    licNoDetailPrefixVerified: false,
  },
  definitions: TENNESSEE_TYPE_DEFINITIONS,
  prior: TENNESSEE_PRIOR_BASELINE,
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateTennesseeSourceVerification(
  current = TENNESSEE_CURRENT_CAPTURE,
) {
  const a = current.aclfFullBedsReport;
  const integrityOk =
    a.rows === 333
    && a.uniqueLicNo === 333
    && a.dupLicGroups === 0
    && a.blankStreet === 0
    && a.bedsNullish === 0
    && a.bedsZero === 0
    && a.statusCounts.Licensed === 331
    && a.coordinateColumns === false
    && a.recordedExportDate === null
    && current.residentialHomeForAged.adoptedAsAclfRoster === false
    && current.residentialHomeForAged.undatedPdfAcceptedAsCurrentOctober2026Roster
      === false
    && current.facilityListings.licNoDetailPrefixVerified === false
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: TENNESSEE_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: TENNESSEE_PRIOR_BASELINE,
    current,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function tennesseeDirectoryReady(): false {
  return false;
}
