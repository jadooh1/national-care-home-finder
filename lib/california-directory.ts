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
export const CALIFORNIA_FACILITY_DETAIL_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";
const CALIFORNIA_OFFICIAL_FACILITY_NUMBER = /^(?:[1-9][0-9]{7}|[1-9][0-9]{8})$/;

export const CALIFORNIA_DETAIL_VERIFICATION = {
  observedOn: "2026-11-13",
  route: "/FacDetail/{facNumber}",
  api: "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
  rcfeExamples: 1,
  arfExamples: 1,
  identifierMatched: true,
  categoryMatched: true,
  openDataStatusConfirmed: false,
  invalidZeroReturnsFacility: false,
  ccrcLiveCheckCompleted: false,
} as const;

export const CALIFORNIA_SOURCE_RECONCILIATION = {
  observedOn: "2026-11-13",
  datasetUrl: "https://data.chhs.ca.gov/dataset/ccl-facilities",
  temporalCoverage: "Data as of 05252025",
  rcfeResourceId: "744d1583-f9eb-45b6-b0f8-b9a9dab936a6",
  arfResourceId: "9f5d1d00-6b24-4f44-a158-9cbe4b43f117",
  rcfeRows: 12522,
  arfRows: 10498,
  rcfeResourceLastModified: "2025-05-27T23:43:15.194749",
  arfResourceLastModified: "2025-05-27T23:42:09.892479",
  packageMetadataModified: "2025-11-06T23:26:08.051889",
} as const;

export const CALIFORNIA_FACILITY_SEARCH_LAST_OBSERVED = {
  url: "https://www.ccld.dss.ca.gov/carefacilitysearch/",
  status: 200,
  observedOn: "2026-11-13",
  rechecked: true,
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

export function californiaStatusLabel(originalStatus: string): string | null {
  if (!(CALIFORNIA_STATUS_ORDER as readonly string[]).includes(originalStatus)) return null;
  return CALIFORNIA_STATUS_LABELS[originalStatus as CaliforniaLicenseStatus];
}

export function californiaDisclosureUrl(facilityNumber: string): string | null {
  if (!CALIFORNIA_OFFICIAL_FACILITY_NUMBER.test(facilityNumber)) return null;
  return `${CALIFORNIA_FACILITY_DETAIL_PREFIX}${facilityNumber}`;
}
