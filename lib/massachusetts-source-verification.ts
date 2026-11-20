/**
 * Massachusetts assisted living residence source discovery verification
 * (development-only). Intentionally free of sibling runtime imports.
 *
 * EOEA/AGE certifies Assisted Living Residences. Certification is not a DPH
 * nursing-home or rest-home license, not MassHealth adult foster care, and is
 * NOT assumed equivalent to Washington adult family homes. Units are units,
 * not beds.
 */

export const MASSACHUSETTS_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const MASSACHUSETTS_ALR_PROGRAM_URL =
  "https://www.mass.gov/assisted-living-residences";
export const MASSACHUSETTS_ALR_LOCATIONS_URL =
  "https://www.mass.gov/assisted-living-residences/locations";
export const MASSACHUSETTS_ALR_LIST_URL =
  "https://www.mass.gov/doc/list-of-certified-assisted-living-residences-as-of-june-2026/download";
export const MASSACHUSETTS_ALR_LIST_APRIL_2025_URL =
  "https://www.mass.gov/doc/list-of-certified-assisted-living-residences-as-of-april-2025/download";
export const MASSACHUSETTS_LOCATION_PREFIX = "https://www.mass.gov/locations/";
export const MASSACHUSETTS_MASSGIS_LTC_URL =
  "https://www.mass.gov/info-details/massgis-data-long-term-care-residences";

/** Prior nationwide note: Class C; MassHealth adult foster care only. */
export const MASSACHUSETTS_PRIOR_BASELINE = {
  compatibilityClass: "C",
  licensingFileOpened: false,
  recordedExportDate: null,
  observedRows: null,
  note: "Prior row described MassHealth adult foster care agencies, not EOEA ALR certification.",
} as const;

export const MASSACHUSETTS_TYPE_DEFINITIONS = {
  authority: "Massachusetts Executive Office of Aging & Independence (EOEA / AGE)",
  assistedLivingResidence:
    "Private residence certified by EOEA/AGE offering housing, meals, and personal care for a monthly fee (651 CMR 12.00).",
  specialCareUnits:
    "# SCR Units on the certified list; special-care designation is a unit count, not a separate license type.",
  notDphNursingOrRestHomeLicense: true,
  notMassHealthAdultFosterCare: true,
  unitsAreNotBeds: true,
  categoryEquivalenceToWashingtonAfh: false,
} as const;

export const MASSACHUSETTS_CURRENT_CAPTURE = {
  observedOn: MASSACHUSETTS_SOURCE_VERIFICATION_OBSERVED_ON,
  certifiedList: {
    sourceUrl: MASSACHUSETTS_ALR_LIST_URL,
    april2025UrlRedirectsToJune2026: true,
    titleAsOfLabel: "June 25, 2026",
    titleAsOfIsIsoExportDate: false,
    httpLastModified: "Tue, 14 Jul 2026 17:59:02 GMT",
    httpLastModifiedIsExportDate: false,
    dateOfLastUpdateColumnIsExportDate: false,
    recordedExportDate: null,
    bytes: 87630,
    sha256: "8138c184ee099c7b5242cbdfb355ee03bd9392526c2b0f9bfb25fe29a6d7d7e7",
    workbookDataRows: 273,
    certifiedUsableRows: 271,
    statusAnomalyRows: 1,
    blankTrailingRows: 1,
    uniqueAlrNameCertified: 271,
    certificationIdentifierColumn: false,
    federalEinIsNotFacilityCertificationId: true,
    blankAddressCertified: 0,
    statusCertified: 271,
    unitsMin: 8,
    unitsMax: 173,
    unitsNullishCertified: 0,
    unitsZeroCertified: 0,
    sumTotalUnitsCertified: 19266,
    sumTraditionalUnitsCertified: 13870,
    sumScrUnitsCertified: 5396,
    certifiedWithScrUnits: 204,
    certifiedScrZero: 67,
    coordinateColumns: false,
  },
  massGis: {
    sourceUrl: MASSACHUSETTS_MASSGIS_LTC_URL,
    lastUpdated: "2024-03-01",
    basedOnListings: "2023-10/11",
    mixesNursingRestHomeAndAlr: true,
    acceptedAsAuthoritativeRoster: false,
    coordinatesAreLicensingCoordinates: false,
    note:
      "MassGIS Long-Term Care Residences (March 2024) mixes NH/RH/ALR, is based on Oct–Nov 2023 listings, and removed FACID/TOTAL_UNITS. Rejected as the ALR certification roster and as licensing coordinates.",
  },
  disclosure: {
    prefixVerified: true,
    pattern: "https://www.mass.gov/locations/{slug-from-alr-name}",
    prefix: MASSACHUSETTS_LOCATION_PREFIX,
    note:
      "Name-derived slug (not a source certification id). Verified facility-specific location pages for bounded samples.",
  },
  definitions: MASSACHUSETTS_TYPE_DEFINITIONS,
  prior: MASSACHUSETTS_PRIOR_BASELINE,
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateMassachusettsSourceVerification(
  current = MASSACHUSETTS_CURRENT_CAPTURE,
) {
  const c = current.certifiedList;
  const integrityOk =
    c.certifiedUsableRows === 271
    && c.statusCertified === 271
    && c.statusAnomalyRows === 1
    && c.blankTrailingRows === 1
    && c.uniqueAlrNameCertified === 271
    && c.blankAddressCertified === 0
    && c.certificationIdentifierColumn === false
    && c.federalEinIsNotFacilityCertificationId === true
    && c.coordinateColumns === false
    && c.recordedExportDate === null
    && current.massGis.acceptedAsAuthoritativeRoster === false
    && current.massGis.coordinatesAreLicensingCoordinates === false
    && current.disclosure.prefixVerified === true
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.notDphNursingOrRestHomeLicense === true
    && current.definitions.notMassHealthAdultFosterCare === true;
  return {
    observedOn: MASSACHUSETTS_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: MASSACHUSETTS_PRIOR_BASELINE,
    current,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function massachusettsDirectoryReady(): false {
  return false;
}
