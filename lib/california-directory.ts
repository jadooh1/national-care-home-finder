export const CALIFORNIA_DIRECTORY_PUBLICATION = "unpublished" as const;

export const CALIFORNIA_STATUS_ORDER = [
  "LICENSED",
  "CLOSED",
  "PENDING",
  "ON PROBATION",
] as const;

export type CaliforniaLicenseStatus = (typeof CALIFORNIA_STATUS_ORDER)[number];

export const CALIFORNIA_STATUS_LABELS: Record<CaliforniaLicenseStatus, string> = {
  LICENSED: "Licensed",
  CLOSED: "Closed",
  PENDING: "Pending",
  "ON PROBATION": "On probation",
};

export const CALIFORNIA_RCFE_LABEL = "Residential Care Facilities for the Elderly";
export const CALIFORNIA_ARF_LABEL = "Adult Residential Facilities";

export const CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS: Record<CaliforniaLicenseStatus, number> = {
  LICENSED: 7939,
  CLOSED: 3821,
  PENDING: 738,
  "ON PROBATION": 23,
};

export const CALIFORNIA_ARF_ELIGIBLE_BY_STATUS: Record<CaliforniaLicenseStatus, number> = {
  LICENSED: 6332,
  CLOSED: 1840,
  PENDING: 429,
  "ON PROBATION": 9,
};

export const CALIFORNIA_EXCLUDED_RECORDS = {
  blankCategory: 1,
  otherLicenseCategory: 1887,
  shiftedRow: 1,
} as const;

export const CALIFORNIA_RAW_FILE_DATES = {
  rcfe: "5252025",
  arf: "05252025",
} as const;

export const CALIFORNIA_RECORDED_EXPORT_DATE = null;
export const CALIFORNIA_PROFILE_URL = null;
export const CALIFORNIA_COORDINATE_COLUMNS = false;

export const CALIFORNIA_FACILITY_SEARCH_LAST_OBSERVED = {
  url: "https://www.ccld.dss.ca.gov/carefacilitysearch/",
  status: 503,
  rechecked: false,
} as const;

export function countStatuses(counts: Record<CaliforniaLicenseStatus, number>): number {
  return CALIFORNIA_STATUS_ORDER.reduce((total, status) => total + counts[status], 0);
}

export function californiaEligibleCount(): number {
  return countStatuses(CALIFORNIA_RCFE_ELIGIBLE_BY_STATUS) + countStatuses(CALIFORNIA_ARF_ELIGIBLE_BY_STATUS);
}

export function californiaExcludedCount(): number {
  return CALIFORNIA_EXCLUDED_RECORDS.blankCategory
    + CALIFORNIA_EXCLUDED_RECORDS.otherLicenseCategory
    + CALIFORNIA_EXCLUDED_RECORDS.shiftedRow;
}

export function californiaDirectoryReady(): false {
  return false;
}

export function californiaProfileUrl(): null {
  return CALIFORNIA_PROFILE_URL;
}
