/**
 * Oregon ODHS provider-export freshness evidence (development-only).
 * Does not invent ISO export dates from filename, HTTP Date, or update notices.
 */

export const OREGON_EXPORT_OBSERVED_ON = "2026-11-26";
export const OREGON_EXPORT_URL = "https://ltclicensing.oregon.gov/Providers/Export";
export const OREGON_EXPORT_FILENAME = "Provider_Export_11-26-2026.csv";
export const OREGON_EXPORT_EXCEL_FILENAME = "Provider_Export_11-26-2026.xlsx";
export const OREGON_EXPORT_HTTP_DATE = "Thu, 26 Nov 2026 20:59:54 GMT";
export const OREGON_EXPORT_EXCEL_HTTP_DATE = "Thu, 26 Nov 2026 20:59:57 GMT";
export const OREGON_UPDATE_NOTICE = "Information is updated every 24 hours.";
export const OREGON_EXPORT_HAS_DATE_COLUMN = false;
export const OREGON_RECORDED_EXPORT_DATE = null;

/**
 * ODHS confirmation (task input, 2026-11-26): website content updates daily,
 * and street addresses are available in both CSV and Excel exports.
 * This is a freshness *policy signal*, not an ISO as-of stamp.
 */
export const OREGON_ODHS_DAILY_UPDATE_CONFIRMED = true;
export const OREGON_ODHS_ADDRESS_AVAILABILITY_CONFIRMED = true;
export const OREGON_ODHS_CONFIRMATION_OBSERVED_ON = "2026-11-26";

/** Prior Nov 13 capture retained for delta comparison only. */
export const OREGON_EXPORT_PRIOR_NOV13 = {
  observedOn: "2026-11-13",
  filename: "Provider_Export_11-13-2026.csv",
  httpDate: "Fri, 13 Nov 2026 19:10:26 GMT",
  rows: 4755,
  openRows: 2307,
  closedRows: 2448,
  afhOpenRows: 1606,
  afhOpenAcceptedBeds: 1582,
  afhOpenZeroBeds: 24,
  bytes: 686812,
  sha256: "604cd4270f23c016ff4007dba6b5702fd2ade659005008d9155beb02c8c37cda",
} as const;

export const OREGON_EXPORT_REPLY_CHECKED_ON = "2026-11-26";
export const OREGON_EXPORT_REPLY_FOUND = false;
export const OREGON_EXPORT_ROWS = 4756;
export const OREGON_EXPORT_OPEN_ROWS = 2304;
export const OREGON_EXPORT_CLOSED_ROWS = 2452;
export const OREGON_EXPORT_AFH_OPEN_ROWS = 1603;
export const OREGON_EXPORT_AFH_OPEN_ACCEPTED_BEDS = 1579;
export const OREGON_EXPORT_AFH_OPEN_ZERO_BEDS = 24;
export const OREGON_DIRECTORY_ACCEPTED_ROWS = 1584;
export const OREGON_DIRECTORY_ZERO_BED_ROWS = 20;
export const OREGON_EXPORT_IDS_OUTSIDE_PATTERN = 3;
export const OREGON_EXPORT_CONTACT_EMAIL = "ltclicensing.web@odhsoha.oregon.gov";
export const OREGON_EXPORT_CONTACT_PHONE = "(503) 373-2227";
export const OREGON_RECORDS_REQUEST_URL = "https://www.oregon.gov/odhs/pages/records-requests.aspx";

export const OREGON_EXPORT_CSV_BYTES = 686792;
export const OREGON_EXPORT_CSV_SHA256 =
  "df843f7195242517723f8354bfd53095ec0a8f1baa7f76a19b7eb1010a0d63b2";
export const OREGON_EXPORT_XLSX_BYTES = 431323;
export const OREGON_EXPORT_XLSX_SHA256 =
  "036885f39e197ac02518dec257744c25664af039d92f85beb6191e0b20389bcd";

/** Street coverage on Open AFH beds 1–5 in the authoritative CSV capture. */
export const OREGON_EXPORT_ACCEPTED_STREET_PRESENT = 1579;
export const OREGON_EXPORT_ACCEPTED_STREET_BLANK = 0;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function adoptOregonExportDate(candidate: string | null): null {
  if (candidate == null || ISO_DATE.test(candidate)) return null;
  return null;
}

export function oregonExportDateReady(): false {
  return false;
}

/**
 * Daily-refresh confirmation is recorded, but it is not an ISO export stamp.
 * Filename / HTTP Date / 24-hour notice remain non-authoritative as dates.
 */
export function oregonFreshnessPolicyReady(): false {
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
    freshnessPolicyReady: oregonFreshnessPolicyReady(),
    streetCoverageComplete:
      OREGON_EXPORT_ACCEPTED_STREET_BLANK === 0
      && OREGON_EXPORT_ACCEPTED_STREET_PRESENT === OREGON_EXPORT_AFH_OPEN_ACCEPTED_BEDS,
    csvExcelAcceptedParityExpected: true as const,
  };
}
