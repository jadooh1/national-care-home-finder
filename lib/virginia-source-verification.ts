/**
 * Virginia assisted living source discovery verification (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Assisted Living Facilities licensed by VDSS Division of Licensing Programs
 * are NOT assumed equivalent to Washington adult family homes.
 */

export const VIRGINIA_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const VIRGINIA_ALF_SEARCH_URL =
  "https://www.dss.virginia.gov/licensed-care/search-licensing-programs/assisted-living-facility-search/";
export const VIRGINIA_ALF_PROGRAM_URL =
  "https://www.dss.virginia.gov/licensed-care/assisted-living-facilities-alf/";
export const VIRGINIA_LICENSED_CARE_URL =
  "https://www.dss.virginia.gov/licensed-care/";
export const VIRGINIA_LEGACY_ALF_CGI_URL =
  "https://www.dss.virginia.gov/facility/search/alf.cgi";

/** Prior nationwide note: Class D; official fields not verified. */
export const VIRGINIA_PRIOR_BASELINE = {
  compatibilityClass: "D",
  licensingFileOpened: false,
  recordedExportDate: null,
  observedRows: null,
} as const;

export const VIRGINIA_TYPE_DEFINITIONS = {
  authority: "Virginia Department of Social Services, Division of Licensing Programs",
  assistedLivingFacility:
    "Congregate residential setting providing or coordinating personal and health care services, 24-hour supervision, and assistance for four or more adults who are aged, infirm, or who have disabilities (VDSS DOLP).",
  licenseTypeCodesObservedInSample: ["1YR", "2YR", "3YR", "COND"],
  categoryEquivalenceToWashingtonAfh: false,
} as const;

export const VIRGINIA_CURRENT_CAPTURE = {
  observedOn: VIRGINIA_SOURCE_VERIFICATION_OBSERVED_ON,
  alfSearch: {
    sourceUrl: VIRGINIA_ALF_SEARCH_URL,
    listPagesFetched: 2,
    listPerPage: 500,
    listTotalReported: 576,
    listRowsCombined: 576,
    uniqueLicenseId: 575,
    duplicateLicenseIdRows: 1,
    duplicateLicenseId: 53896,
    listJsonBytes: 262232,
    listJsonSha256: "c185b072484eb3d1398cbeaba05e2d1edd01c56abcfea5fc64ab65ac3112bf2d",
    httpLastModified: null,
    recordedExportDate: null,
    legacyAlfCgiRedirectsToLicensedCare: true,
  },
  assistedLiving: {
    uniqueLicenseId: 575,
    licensedTrue: 575,
    facilityType: "Assisted Living Facility",
    blankComposedAddress: 0,
    capacityOnList: false,
    licenseTypeOnList: false,
    licensedBooleanOnList: true,
    coordinateColumns: false,
  },
  disclosure: {
    prefixVerified: true,
    pattern: "?licenseId={licenseId}&endpoint=alf",
    capacityOnDetailSample: true,
    licenseTypeOnDetailSample: true,
    coordinatesOnDetailSample: false,
  },
  definitions: VIRGINIA_TYPE_DEFINITIONS,
  prior: VIRGINIA_PRIOR_BASELINE,
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateVirginiaSourceVerification(
  current = VIRGINIA_CURRENT_CAPTURE,
) {
  const a = current.assistedLiving;
  const integrityOk =
    a.uniqueLicenseId === 575
    && current.alfSearch.listTotalReported === 576
    && current.alfSearch.duplicateLicenseIdRows === 1
    && a.blankComposedAddress === 0
    && a.capacityOnList === false
    && a.coordinateColumns === false
    && current.alfSearch.recordedExportDate === null
    && current.disclosure.prefixVerified === true
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: VIRGINIA_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: VIRGINIA_PRIOR_BASELINE,
    current,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function virginiaDirectoryReady(): false {
  return false;
}
