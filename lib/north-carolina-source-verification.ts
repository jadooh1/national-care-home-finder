/**
 * North Carolina care-home source discovery verification (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Adult Care Homes (HAL, observed beds 9–201) and Family Care Homes (FCL,
 * observed beds 2–6) are separate DHSR license types and are NOT assumed
 * equivalent to Washington adult family homes.
 */

export const NORTH_CAROLINA_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const NORTH_CAROLINA_LISTINGS_URL = "https://info.ncdhhs.gov/dhsr/reports.htm";
export const NORTH_CAROLINA_FAC_LISTINGS_URL =
  "https://info.ncdhhs.gov/DHSR/acls/faclistings.html";
export const NORTH_CAROLINA_ADULT_WORKBOOK_URL =
  "https://info.ncdhhs.gov/dhsr/data/Ahlist.xlsx";
export const NORTH_CAROLINA_FAMILY_WORKBOOK_URL =
  "https://info.ncdhhs.gov/dhsr/data/Fchlist.xlsx";
export const NORTH_CAROLINA_STAR_SEARCH_URL =
  "https://info.ncdhhs.gov/dhsr/acls/star/search.asp";
export const NORTH_CAROLINA_STALE_FCH_TXT_URL =
  "https://info.ncdhhs.gov/dhsr/data/fch.txt";

/** Prior Nov 13 feasibility baseline (same unique license totals). */
export const NORTH_CAROLINA_PRIOR_NOV13_BASELINE = {
  observedOn: "2026-11-13",
  adultCareHomes: 566,
  familyCareHomes: 520,
  uniqueLicenses: 1086,
  blankRows: 2,
  listingsPageUpdated: "10/28/2026",
  workbookAsOf: "10/2026",
  adultFileClock: "Wed, 28 Oct 2026 17:10:30 GMT",
  familyFileClock: "Wed, 28 Oct 2026 17:10:29 GMT",
  identicalMailing: 184,
  distinctMailing: 902,
  recordedExportDate: null,
} as const;

export const NORTH_CAROLINA_TYPE_DEFINITIONS = {
  authority:
    "NCDHHS Division of Health Service Regulation, Adult Care Licensure Section",
  adultCareHome:
    "HAL-prefixed adult care home / home for the aged license; observed beds 9–201 on this capture.",
  familyCareHome:
    "FCL-prefixed family care home license; smaller adult care home for 2–6 unrelated residents; observed beds 2–6.",
  specialCareUnits:
    "Separate Special Care Units workbook exists; not adopted as the primary HAL/FCL roster.",
  categoryEquivalenceToWashingtonAfh: false,
} as const;

export const NORTH_CAROLINA_CURRENT_CAPTURE = {
  observedOn: NORTH_CAROLINA_SOURCE_VERIFICATION_OBSERVED_ON,
  listings: {
    sourceUrl: NORTH_CAROLINA_LISTINGS_URL,
    pageUpdatedLabel: "10/28/2026",
    pageUpdatedIsExportDate: false,
  },
  adult: {
    sourceUrl: NORTH_CAROLINA_ADULT_WORKBOOK_URL,
    httpStatus: 200,
    bytes: 125709,
    sha256: "5671a352bea147a1b7b1607e7d73cb41b953f1af2aa459e83d25ab39dcca3d92",
    lastModified: "Wed, 28 Oct 2026 17:10:30 GMT",
    lastModifiedIsExportDate: false,
    asOfLabel: "10/2026",
    asOfIsExportDate: false,
    recordedExportDate: null,
    licensedRows: 566,
    blankTrailingRows: 1,
    uniqueLicenseNumbers: 566,
    licensePrefix: "HAL",
    blankSiteAddress: 0,
    siteStateNc: 566,
    fiveDigitSiteZips: 566,
    bedMin: 9,
    bedMax: 201,
    blankBeds: 0,
    counties: 96,
    starNotAvailable: 8,
    expiryBeforeObservation: 1,
    identicalMailing: 128,
    distinctMailing: 438,
    facilityStateOutsideNc: 40,
    coordinateColumns: false,
    perRowStatusColumn: false,
  },
  family: {
    sourceUrl: NORTH_CAROLINA_FAMILY_WORKBOOK_URL,
    httpStatus: 200,
    bytes: 112487,
    sha256: "c6d66684bf04ae0f98c00c644a9c2a1af7935e9a6e91e6eb494220bf6b8afc80",
    lastModified: "Wed, 28 Oct 2026 17:10:29 GMT",
    lastModifiedIsExportDate: false,
    asOfLabel: "10/2026",
    asOfIsExportDate: false,
    recordedExportDate: null,
    licensedRows: 520,
    blankTrailingRows: 1,
    uniqueLicenseNumbers: 520,
    licensePrefix: "FCL",
    blankSiteAddress: 0,
    siteStateNc: 520,
    fiveDigitSiteZips: 520,
    bedMin: 2,
    bedMax: 6,
    bedsOutside2to6: 0,
    blankBeds: 0,
    counties: 64,
    starNotAvailable: 19,
    expiryBeforeObservation: 4,
    identicalMailing: 61,
    distinctMailing: 459,
    facilityStateOutsideNc: 14,
    coordinateColumns: false,
    perRowStatusColumn: false,
  },
  combined: {
    uniqueLicenses: 1086,
    blankRows: 2,
    licenseOverlap: 0,
    siteAddresses: 1086,
    fiveDigitSiteZips: 1086,
    identicalMailing: 189,
    distinctMailing: 897,
    starNotAvailable: 27,
    expiryBeforeObservation: 5,
  },
  staleFchTxt: {
    sourceUrl: NORTH_CAROLINA_STALE_FCH_TXT_URL,
    lastModified: "Thu, 15 Dec 2021 19:29:02 GMT",
    rejectedAsCurrentLicensingSource: true,
  },
  definitions: NORTH_CAROLINA_TYPE_DEFINITIONS,
  prior: NORTH_CAROLINA_PRIOR_NOV13_BASELINE,
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateNorthCarolinaSourceVerification(
  current = NORTH_CAROLINA_CURRENT_CAPTURE,
) {
  const a = current.adult;
  const f = current.family;
  const c = current.combined;
  const integrityOk =
    a.licensedRows === 566
    && f.licensedRows === 520
    && c.uniqueLicenses === 1086
    && a.licensedRows + f.licensedRows === c.uniqueLicenses
    && c.licenseOverlap === 0
    && c.blankRows === 2
    && a.blankSiteAddress === 0
    && f.blankSiteAddress === 0
    && f.bedsOutside2to6 === 0
    && a.bedMin >= 7
    && f.bedMax <= 6
    && c.identicalMailing + c.distinctMailing === c.uniqueLicenses
    && a.recordedExportDate === null
    && f.recordedExportDate === null
    && a.coordinateColumns === false
    && a.perRowStatusColumn === false
    && current.staleFchTxt.rejectedAsCurrentLicensingSource === true
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: NORTH_CAROLINA_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: NORTH_CAROLINA_PRIOR_NOV13_BASELINE,
    current,
    licenseDeltaVsPrior: c.uniqueLicenses - NORTH_CAROLINA_PRIOR_NOV13_BASELINE.uniqueLicenses,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function northCarolinaSourceDirectoryReady(): false {
  return false;
}
