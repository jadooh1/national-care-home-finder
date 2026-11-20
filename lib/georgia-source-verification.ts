/**
 * Georgia care-home source discovery verification (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Personal Care Homes (Ch. 111-8-62) and Assisted Living Communities
 * (Ch. 111-8-63; PCH serving 25+ residents licensed for assisted living care)
 * are separate HFRD types and are NOT assumed equivalent to Washington AFH.
 */

export const GEORGIA_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const GEORGIA_GETDATA_URL =
  "https://forms.dch.georgia.gov/HFRD/GetFacilitiesData.svc/GetData";
export const GEORGIA_FACILITY_FINDER_URL =
  "https://forms.dch.georgia.gov/HFRD/GaMap2Care.html";
export const GEORGIA_HFRD_HOME_URL = "https://forms.dch.georgia.gov/HFRD/";
export const GEORGIA_PCH_PROGRAM_URL =
  "https://dch.georgia.gov/divisionsoffices/hfrd/facilities-provider-information/personal-care-homes";
export const GEORGIA_VERIFY_LICENSE_URL =
  "https://forms.dch.georgia.gov/hfrd/Verify_License.html";
export const GEORGIA_INSPECTION_SEARCH_URL =
  "https://weblink.dch.georgia.gov/WebLink/CustomSearch.aspx?SearchName=InspectionReportSearch&repo=WEB";
export const GEORGIA_REGULATED_PDF_URL =
  "https://forms.dch.georgia.gov/HFRD/List_Of_Regulated_Facilities.pdf";

/** Prior nationwide note: Class D; official fields not verified. */
export const GEORGIA_PRIOR_UNVERIFIED_BASELINE = {
  compatibilityClass: "D",
  licensingFileOpened: false,
  recordedExportDate: null,
} as const;

export const GEORGIA_TYPE_DEFINITIONS = {
  authority: "Georgia Department of Community Health, Healthcare Facility Regulation Division",
  personalCareHome:
    "Ch. 111-8-62: dwelling providing housing, food, and personal services for two or more unrelated adults.",
  assistedLivingCommunity:
    "Ch. 111-8-63: a personal care home serving 25 residents or more that is licensed to provide assisted living care.",
  categoryEquivalenceToWashingtonAfh: false,
} as const;

export const GEORGIA_CURRENT_CAPTURE = {
  observedOn: GEORGIA_SOURCE_VERIFICATION_OBSERVED_ON,
  getData: {
    sourceUrl: GEORGIA_GETDATA_URL,
    httpStatus: 200,
    bytes: 20792202,
    sha256: "e15441fd0210e0691e7fe00f9ca586122d993c5c485573039c857800a1504aae",
    httpLastModified: null,
    httpLastModifiedIsExportDate: false,
    recordedExportDate: null,
    allFacilityTypeRows: 36194,
  },
  personalCareHome: {
    facilityType: "PERSONAL CARE HOME",
    rows: 1573,
    uniqueFacids: 1573,
    facidPrefix: "PCH",
    blankAddress: 0,
    addressLetterDigit: 1573,
    stateGaNormalized: 1506,
    blankState: 67,
    zeroBeds: 63,
    bedMin: 0,
    bedMax: 200,
    bedsGe25: 147,
    bedsLt25: 1426,
    operstdesc: { Active: 1349, ACTIVE: 224 },
    closedDatePresent: 0,
    coordinatePairs: 1573,
    accuracyRooftop: 1293,
  },
  assistedLivingCommunity: {
    facilityType: "ASSISTED LIVING COMMUNITY",
    rows: 326,
    uniqueFacids: 326,
    facidPrefix: "ALC",
    blankAddress: 0,
    addressLetterDigit: 326,
    stateGaNormalized: 324,
    blankState: 2,
    zeroBeds: 4,
    bedMin: 0,
    bedMax: 307,
    bedsGe25: 321,
    bedsLt25: 5,
    operstdesc: { Active: 313, ACTIVE: 13 },
    closedDatePresent: 0,
    coordinatePairs: 326,
    accuracyRooftop: 286,
  },
  combined: {
    rows: 1899,
    facidOverlap: 0,
    coordinatePairs: 1899,
    coordinatesAreLicensingCoordinates: false,
    coordinateSourceDescribed: true,
    coordinateSource: "Google geocode Accuracy (ROOFTOP / RANGE_INTERPOLATED / etc.)",
    perRowStatusPresent: true,
    statusDomainOnlyActiveVariants: true,
  },
  regulatedPdf: {
    sourceUrl: GEORGIA_REGULATED_PDF_URL,
    lastModified: "Tue, 10 Mar 2020 13:52:02 GMT",
    rejectedAsCurrentLicensingSource: true,
  },
  definitions: GEORGIA_TYPE_DEFINITIONS,
  prior: GEORGIA_PRIOR_UNVERIFIED_BASELINE,
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateGeorgiaSourceVerification(
  current = GEORGIA_CURRENT_CAPTURE,
) {
  const p = current.personalCareHome;
  const a = current.assistedLivingCommunity;
  const c = current.combined;
  const integrityOk =
    p.rows === 1573
    && a.rows === 326
    && c.rows === 1899
    && p.uniqueFacids === 1573
    && a.uniqueFacids === 326
    && c.facidOverlap === 0
    && p.blankAddress === 0
    && a.blankAddress === 0
    && p.operstdesc.Active + p.operstdesc.ACTIVE === p.rows
    && a.operstdesc.Active + a.operstdesc.ACTIVE === a.rows
    && c.coordinatesAreLicensingCoordinates === false
    && current.getData.recordedExportDate === null
    && current.regulatedPdf.rejectedAsCurrentLicensingSource === true
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: GEORGIA_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: GEORGIA_PRIOR_UNVERIFIED_BASELINE,
    current,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function georgiaDirectoryReady(): false {
  return false;
}
