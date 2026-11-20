/**
 * Pennsylvania official source verification snapshot (development-only).
 * Intentionally free of sibling runtime imports.
 */

export const PENNSYLVANIA_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const PENNSYLVANIA_SOURCE_VERIFICATION = {
  sourceUrl: "https://data.pa.gov/api/views/pqf4-d4xn/rows.csv?accessType=DOWNLOAD",
  datasetUrl:
    "https://data.pa.gov/Services-Near-You/Licensed-Personal-Care-Homes-Current-Statewide-Hum/pqf4-d4xn",
  rows: 989,
  objectIdsUnique: 989,
  objectIdBlank: 0,
  duplicateObjectIds: 0,
  typePersonalCareHomes: 989,
  programOfficeAdultResidential: 989,
  statePa: 989,
  fiveDigitZips: 989,
  usableStreetRows: 976,
  letterOnlyStreetRows: 13,
  capacityMinimum: 4,
  capacityMaximum: 250,
  capacityUnderFour: 0,
  phoneBlank: 0,
  georeferencedRows: 989,
  licensingCoordinateRows: 0,
  accuracyInterpolated: 975,
  accuracyStreetCentroid: 4,
  accuracyZip4Centroid: 2,
  accuracyZipCentroid: 7,
  accuracyIntersection: 1,
  licenseNumberColumn: false,
  statusColumn: false,
  recordedExportDate: null,
  catalogRowsUpdatedAt: "2026-11-08T06:09:03Z",
  catalogTimestampIsExportDate: false,
  sha256: "c91722696b1accbe778f25189fc727e5bd55f5028bac3d529c54d3e8e8192973",
  bytes: 227204,
  publicationEligibleRows: 0,
} as const;

export function evaluatePennsylvaniaSourceVerification() {
  const v = PENNSYLVANIA_SOURCE_VERIFICATION;
  const integrityOk =
    v.rows === 989
    && v.objectIdsUnique === 989
    && v.usableStreetRows + v.letterOnlyStreetRows === 989
    && v.licensingCoordinateRows === 0
    && v.recordedExportDate === null
    && v.publicationEligibleRows === 0;
  return {
    observedOn: PENNSYLVANIA_SOURCE_VERIFICATION_OBSERVED_ON,
    verification: v,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
