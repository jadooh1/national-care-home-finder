export const INDIANA_PUBLICATION = "unpublished" as const;
export const INDIANA_SOURCE_URL = "https://www.in.gov/health/reports/QAMIS/resdir/wdirRes.htm";
export const INDIANA_OBSERVED_ON = "2026-11-13";
export const INDIANA_POSTED_TO_WEB = "11/5/2026";
export const INDIANA_RECORDED_EXPORT_DATE = null;

export const INDIANA_FACILITIES = 225;
export const INDIANA_UNIQUE_LICENSES = 225;
export const INDIANA_LICENSE_SHAPE = "99-999999-9";
export const INDIANA_STREET_LINES = 228;
export const INDIANA_CITY_ZIP_LINES = 225;
export const INDIANA_STATE_ABBREVIATION_LINES = 0;
export const INDIANA_STATUS_LABELS = 0;
export const INDIANA_BED_LABELS = 0;
export const INDIANA_COUNTY_LABELS = 0;
export const INDIANA_FACILITY_LINKS = 0;
export const INDIANA_ADMINISTRATOR_BLANK = 1;
export const INDIANA_EXPIRE_BLANK = 0;
export const INDIANA_EXPIRE_SINGLE_DIGIT_MONTH = 171;
export const INDIANA_EXPIRE_TWO_DIGIT_MONTH = 54;

export function adoptIndianaExportDate(candidate: string | null): null {
  void candidate;
  return null;
}

export function indianaDirectoryReady(): false {
  return false;
}

export function indianaDisclosureUrl(licenseNumber: string): null {
  void licenseNumber;
  return null;
}

export function indianaPublicationReadiness() {
  return {
    publication: INDIANA_PUBLICATION,
    observedOn: INDIANA_OBSERVED_ON,
    postedToWeb: INDIANA_POSTED_TO_WEB,
    authoritativeExportDate: adoptIndianaExportDate(INDIANA_POSTED_TO_WEB),
    facilities: INDIANA_FACILITIES,
    uniqueLicenses: INDIANA_UNIQUE_LICENSES,
    statusReady: false as const,
    disclosureReady: false as const,
    coordinateColumns: false as const,
    directoryReady: indianaDirectoryReady(),
    mapReady: false as const,
  };
}
