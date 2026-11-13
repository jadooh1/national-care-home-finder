export const MISSOURI_PUBLICATION = "unpublished" as const;
export const MISSOURI_SOURCE_URL = "https://data.mo.gov/Health/LTC-DIRECTORY/fenu-sipv";
export const MISSOURI_METADATA_URL = "https://data.mo.gov/api/views/fenu-sipv.json";
export const MISSOURI_INSPECTION_SEARCH_URL = "https://healthapps.dhss.mo.gov/showmeltc/default.aspx";
export const MISSOURI_OBSERVED_ON = "2026-11-13";
export const MISSOURI_CATALOG_UPDATED_AT = "2026-11-04T18:30:08Z";
export const MISSOURI_RECORDED_EXPORT_DATE = null;

export const MISSOURI_ROWS = 1102;
export const MISSOURI_FACILITY_NUMBERS = 987;
export const MISSOURI_LICENSE_NUMBERS = 1096;
export const MISSOURI_LEVEL_COUNTS = {
  ALF: 60,
  "ALF**": 271,
  ICF: 18,
  RCF: 166,
  "RCF*": 103,
  SNF: 484,
} as const;
export const MISSOURI_LICENSE_BLANK = 0;
export const MISSOURI_ADDRESS_BLANK = 0;
export const MISSOURI_CAPACITY_BLANK = 0;
export const MISSOURI_EFFECTIVE_DATE_BLANK = 0;
export const MISSOURI_EXPIRATION_BLANK = 0;
export const MISSOURI_CERTIFICATION_BLANK = 618;
export const MISSOURI_CERTIFICATION_PEND = 3;

export function adoptMissouriExportDate(candidate: string | null): null {
  void candidate;
  return null;
}

export function missouriDirectoryReady(): false {
  return false;
}

export function missouriDisclosureUrl(licenseNumber: string): null {
  void licenseNumber;
  return null;
}

export function missouriPublicationReadiness() {
  return {
    candidate: "Missouri" as const,
    publication: MISSOURI_PUBLICATION,
    observedOn: MISSOURI_OBSERVED_ON,
    catalogUpdatedAt: MISSOURI_CATALOG_UPDATED_AT,
    authoritativeExportDate: adoptMissouriExportDate(MISSOURI_CATALOG_UPDATED_AT),
    rows: MISSOURI_ROWS,
    facilityNumbers: MISSOURI_FACILITY_NUMBERS,
    licenseNumbers: MISSOURI_LICENSE_NUMBERS,
    statusReady: false as const,
    disclosureReady: false as const,
    coordinateColumns: false as const,
    directoryReady: missouriDirectoryReady(),
    mapReady: false as const,
    blockers: [
      "no-per-row-operating-status",
      "catalog-timestamp-is-not-an-export-date",
      "no-facility-specific-disclosure-link",
      "facility-number-is-not-unique",
      "license-number-is-not-unique",
      "mixed-level-of-care",
    ] as const,
  };
}
