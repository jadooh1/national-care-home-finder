/**
 * Texas care-home source discovery verification (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Texas Assisted Living Type A / B / C (26 TAC §553.5) are NOT assumed
 * equivalent to Washington adult family homes.
 */

export const TEXAS_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const TEXAS_PRIOR_NOV13_BASELINE = {
  observedOn: "2026-11-13",
  rows: 2016,
  typeA: 336,
  typeB: 1672,
  typeC: 8,
  activeAsOf: "11/12/2026",
  fileLastModified: "Fri, 13 Nov 2026 14:07:19 GMT",
  geoCommaOnly: 78,
  closuresFacilityIds: 1510,
  recordedExportDate: null,
} as const;

export const TEXAS_TYPE_DEFINITIONS = {
  regulation: "26 TAC §553.5 (Types of Assisted Living Facilities)",
  typeA:
    "Residents capable of evacuating without staff physical assistance; no routine nighttime attendance; capable of following emergency directions.",
  typeB:
    "Residents may need staff help to evacuate / nighttime attendance / wheelchair transfer; must not be permanently bedfast.",
  typeC:
    "Legacy four-bed adult foster care license; HHSC no longer issues new Type C licenses.",
  sizeNote:
    "Small (≤16) vs large (≥17) is a separate construction size class, not the Type A/B evacuation class.",
  categoryEquivalenceToWashingtonAfh: false,
} as const;

export const TEXAS_CURRENT_CAPTURE = {
  observedOn: TEXAS_SOURCE_VERIFICATION_OBSERVED_ON,
  workbook: {
    sourceUrl: "https://apps.hhs.texas.gov/providers/directories/al.xlsx",
    httpStatus: 200,
    bytes: 575194,
    sha256: "7b83f02c3fa33baf90ab428159b6f562ef0180899afd489ba11de891d2dce476",
    lastModified: "Fri, 20 Nov 2026 14:11:45 GMT",
    lastModifiedIsExportDate: false,
    sheet: "ALF_Directory",
    activeAsOfLabel: "11/19/2026",
    activeAsOfIsIsoExportDate: false,
    recordedExportDate: null,
    rows: 2019,
    uniqueFacilityIds: 2019,
    uniqueLicenseNumbers: 2019,
    duplicateFacilityIds: 0,
    duplicateLicenseNumbers: 0,
    facilityIdLeadingZerosPreserved: 533,
    programTypeAssistedLiving: 2019,
    serviceType: { "TYPE A": 335, "TYPE B": 1676, "TYPE C": 8 },
    state: { TX: 1522, TEXAS: 497 },
    facilityLicensedYes: 2019,
    facilityCertified: { YES: 1, NO: 2018 },
    blankPhysicalAddress: 0,
    blankCity: 0,
    addressLetterDigit: 2019,
    blankCapacity: 0,
    zeroCapacity: 0,
    capacityMin: 4,
    capacityMax: 335,
    zipFive: 2009,
    zipNine: 10,
    geoPairs: 1937,
    geoCommaOnly: 82,
    physicalAddressLabeledSeparatelyFromOwnerMailing: true,
    accountIdColumnPresent: false,
    coordinatesAreLicensingCoordinates: false,
    coordinateSourceDescribed: false,
  },
  closures: {
    sourceUrl: "https://apps.hhs.texas.gov/providers/directories/Closures/alf_closures.pdf",
    lastModified: "Mon, 16 Nov 2026 15:33:00 GMT",
    lastModifiedIsExportDate: false,
    uniqueFacilityIds: 1515,
    typeCounts: { "TYPE A": 791, "TYPE B": 512, "TYPE C": 190, "TYPE E": 22 },
    overlapExactWithActiveWorkbook: 0,
  },
  definitions: TEXAS_TYPE_DEFINITIONS,
  priorNov13: TEXAS_PRIOR_NOV13_BASELINE,
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateTexasSourceVerification(
  current = TEXAS_CURRENT_CAPTURE,
) {
  const w = current.workbook;
  const integrityOk =
    w.rows === 2019
    && w.serviceType["TYPE A"] + w.serviceType["TYPE B"] + w.serviceType["TYPE C"] === 2019
    && w.state.TX + w.state.TEXAS === 2019
    && w.geoPairs + w.geoCommaOnly === 2019
    && w.facilityLicensedYes === 2019
    && w.blankPhysicalAddress === 0
    && w.zeroCapacity === 0
    && w.accountIdColumnPresent === false
    && w.recordedExportDate === null
    && w.activeAsOfIsIsoExportDate === false
    && w.coordinatesAreLicensingCoordinates === false
    && current.closures.overlapExactWithActiveWorkbook === 0
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: TEXAS_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: TEXAS_PRIOR_NOV13_BASELINE,
    current,
    rowDeltaVsPrior: current.workbook.rows - TEXAS_PRIOR_NOV13_BASELINE.rows,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function texasDirectoryReady(): false {
  return false;
}
