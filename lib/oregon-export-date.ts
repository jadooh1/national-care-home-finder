export const OREGON_EXPORT_OBSERVED_ON = "2026-11-13";
export const OREGON_EXPORT_URL = "https://ltclicensing.oregon.gov/Providers/Export";
export const OREGON_EXPORT_FILENAME = "Provider_Export_11-13-2026.csv";
export const OREGON_EXPORT_HTTP_DATE = "Fri, 13 Nov 2026 19:10:26 GMT";
export const OREGON_UPDATE_NOTICE = "Information is updated every 24 hours.";
export const OREGON_EXPORT_HAS_DATE_COLUMN = false;
export const OREGON_RECORDED_EXPORT_DATE = null;
export const OREGON_EXPORT_REPLY_CHECKED_ON = "2026-11-13";
export const OREGON_EXPORT_REPLY_FOUND = false;
export const OREGON_EXPORT_ROWS = 4755;
export const OREGON_EXPORT_OPEN_ROWS = 2307;
export const OREGON_EXPORT_CLOSED_ROWS = 2448;
export const OREGON_EXPORT_AFH_OPEN_ROWS = 1606;
export const OREGON_EXPORT_AFH_OPEN_ACCEPTED_BEDS = 1582;
export const OREGON_EXPORT_AFH_OPEN_ZERO_BEDS = 24;
export const OREGON_DIRECTORY_ACCEPTED_ROWS = 1584;
export const OREGON_DIRECTORY_ZERO_BED_ROWS = 20;
export const OREGON_EXPORT_IDS_OUTSIDE_PATTERN = 3;
export const OREGON_EXPORT_CONTACT_EMAIL = "ltclicensing.web@odhsoha.oregon.gov";
export const OREGON_EXPORT_CONTACT_PHONE = "(503) 373-2227";
export const OREGON_RECORDS_REQUEST_URL = "https://www.oregon.gov/odhs/pages/records-requests.aspx";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function adoptOregonExportDate(candidate: string | null): null {
  if (candidate == null || ISO_DATE.test(candidate)) return null;
  return null;
}

export function oregonExportDateReady(): false {
  return false;
}

export function oregonExportComparison() {
  return {
    recordedAcceptedRows: OREGON_DIRECTORY_ACCEPTED_ROWS,
    laterAcceptedRows: OREGON_EXPORT_AFH_OPEN_ACCEPTED_BEDS,
    recordedZeroBedRows: OREGON_DIRECTORY_ZERO_BED_ROWS,
    laterZeroBedRows: OREGON_EXPORT_AFH_OPEN_ZERO_BEDS,
    recordsChanged: false,
    exportDateAdopted: oregonExportDateReady(),
  };
}
