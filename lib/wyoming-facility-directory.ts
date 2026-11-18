export const WYOMING_PUBLICATION = "unpublished" as const;
export const WYOMING_DIRECTORY_PAGE = "https://health.wyo.gov/aging/hls/healthcare-facility-directory/";
export const WYOMING_WORKBOOK_URL = "https://health.wyo.gov/wp-content/uploads/2026/11/2026-2027-Facility-Directory.xlsx";
export const WYOMING_FILE_LAST_MODIFIED = "Mon, 02 Nov 2026 14:45:09 GMT";
export const WYOMING_OBSERVED_ON = "2026-11-13";
export const WYOMING_RECORDED_EXPORT_DATE = null;
export const WYOMING_ALF_TYPE_CODE_ROWS = 31;

export function adoptWyomingExportDate(candidate: string | null): null {
  void candidate;
  return null;
}

export function wyomingDirectoryReady(): false {
  return false;
}

export function wyomingDisclosureUrl(licenseNumber: string): null {
  void licenseNumber;
  return null;
}
