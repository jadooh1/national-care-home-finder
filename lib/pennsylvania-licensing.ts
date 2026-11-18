const FIVE_DIGIT_ZIP = /^\d{5}$/;

export const PENNSYLVANIA_SOURCE_URL = "https://data.pa.gov/api/views/pqf4-d4xn/rows.csv?accessType=DOWNLOAD";
export const PENNSYLVANIA_DATASET_URL =
  "https://data.pa.gov/Services-Near-You/Licensed-Personal-Care-Homes-Current-Statewide-Hum/pqf4-d4xn";
export const PENNSYLVANIA_PROVIDER_DIRECTORY =
  "https://www.humanservices.dhs.pa.gov/human_service_provider_directory/";
export const PENNSYLVANIA_DIRECTORY_SEARCH_RESULT =
  "https://www.humanservices.dhs.pa.gov/HUMAN_SERVICE_PROVIDER_DIRECTORY/Home/HumanServicesProviderDirectorySearchResult";
export const PENNSYLVANIA_SPATIAL_SEARCH =
  "https://www.humanservices.dhs.pa.gov/LicensedFacilitiesSpatialSearch/licensedfacilitiesspatialsearch.html";
export const PENNSYLVANIA_RECORDED_EXPORT_DATE = null;
export const PENNSYLVANIA_CATALOG_ROWS_UPDATED_AT = "2026-11-08T06:09:03Z";
export const PENNSYLVANIA_TYPE = "PERSONAL CARE HOMES";
export const PENNSYLVANIA_PROGRAM_OFFICE = "ADULT RESIDENTIAL FACILITY";

export const PENNSYLVANIA_OFFICIAL_VALIDATION = {
  rows: 989,
  objectIdsUnique: 989,
  objectIdBlank: 0,
  duplicateObjectIds: 0,
  objectIdDigits: 6,
  nameBlank: 0,
  nameDuplicateGroups: 25,
  rowsSharingAName: 66,
  sharedStreetCityZipGroups: 15,
  sharedAddressSameNameGroups: 1,
  sharedAddressDifferentNameGroups: 14,
  typePersonalCareHomes: 989,
  programOfficeRows: 989,
  statePa: 989,
  fiveDigitZips: 989,
  usableStreetRows: 976,
  letterOnlyStreetRows: 13,
  letterOnlyWithAdditionalText: 6,
  letterOnlyNamedStreetWithoutNumber: 7,
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
  statusColumn: false,
  licenseNumberColumn: false,
  publicationEligibleRows: 0,
} as const;

export type PennsylvaniaRowCheck = {
  objectId: string;
  typeServed: string;
  originalStreet: string;
  originalStreetAdditional: string;
  usableStreet: string | null;
  publicationEligible: false;
  licensingCoordinates: null;
};

export type PennsylvaniaValidationReport = {
  rowsRead: number;
  duplicateObjectIds: number;
  usableStreetRows: number;
  letterOnlyStreetRows: number;
  originalFieldsRewritten: false;
  recordedExportDate: null;
  licensingCoordinates: false;
  availabilityInferred: false;
  directoryReady: false;
  mapReady: false;
  rows: PennsylvaniaRowCheck[];
};

export function usablePennsylvaniaStreet(street: string): string | null {
  const value = street.trim();
  if (/[A-Za-z]/.test(value) && /\d/.test(value)) return value;
  return null;
}

export function retainedPennsylvaniaAddress(row: { street: string; streetAdditional: string }) {
  return {
    street: row.street,
    streetAdditional: row.streetAdditional,
    usableStreet: usablePennsylvaniaStreet(row.street),
    publicationEligible: false as const,
  };
}

export function adoptPennsylvaniaLicensingDate(catalogTimestamp: string): null {
  void catalogTimestamp;
  return null;
}

export function pennsylvaniaDirectoryReady(): false {
  return false;
}

export function pennsylvaniaDisclosureUrl(sourceRecordId: string): null {
  void sourceRecordId;
  return null;
}

export function pennsylvaniaMapReady(): false {
  return false;
}

export function validatePennsylvaniaRoster(table: readonly Record<string, string>[]): PennsylvaniaValidationReport {
  const seen = new Map<string, number>();
  let usableStreetRows = 0;
  let letterOnlyStreetRows = 0;
  const rows = table.map(row => {
    const objectId = (row.objectId ?? "").trim();
    if (objectId !== "") seen.set(objectId, (seen.get(objectId) ?? 0) + 1);
    const originalStreet = row.street ?? "";
    const usableStreet = usablePennsylvaniaStreet(originalStreet);
    if (usableStreet) usableStreetRows += 1;
    else if (/[A-Za-z]/.test(originalStreet) && !/\d/.test(originalStreet)) letterOnlyStreetRows += 1;
    return {
      objectId,
      typeServed: row.typeServed ?? "",
      originalStreet,
      originalStreetAdditional: row.streetAdditional ?? "",
      usableStreet,
      publicationEligible: false as const,
      licensingCoordinates: null,
    };
  });
  return {
    rowsRead: rows.length,
    duplicateObjectIds: [...seen.values()].filter(count => count > 1).length,
    usableStreetRows,
    letterOnlyStreetRows,
    originalFieldsRewritten: false,
    recordedExportDate: null,
    licensingCoordinates: false,
    availabilityInferred: false,
    directoryReady: false,
    mapReady: false,
    rows,
  };
}

export function pennsylvaniaZip(original: string): string | null {
  return FIVE_DIGIT_ZIP.test(original.trim()) ? original.trim() : null;
}
