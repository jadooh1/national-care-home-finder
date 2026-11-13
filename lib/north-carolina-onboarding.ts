export const NORTH_CAROLINA_PUBLICATION = "unpublished" as const;
export const NORTH_CAROLINA_OBSERVED_ON = "2026-11-13";
export const NORTH_CAROLINA_LISTINGS_URL = "https://info.ncdhhs.gov/dhsr/reports.htm";
export const NORTH_CAROLINA_ADULT_WORKBOOK_URL = "https://info.ncdhhs.gov/dhsr/data/Ahlist.xlsx";
export const NORTH_CAROLINA_FAMILY_WORKBOOK_URL = "https://info.ncdhhs.gov/dhsr/data/Fchlist.xlsx";
export const NORTH_CAROLINA_STAR_SEARCH_URL = "https://info.ncdhhs.gov/dhsr/acls/star/search.asp";

export const NORTH_CAROLINA_LISTINGS_PAGE_UPDATED = "10/28/2026";
export const NORTH_CAROLINA_WORKBOOK_AS_OF = "10/2026";
export const NORTH_CAROLINA_ADULT_FILE_CLOCK = "Wed, 28 Oct 2026 17:10:30 GMT";
export const NORTH_CAROLINA_FAMILY_FILE_CLOCK = "Wed, 28 Oct 2026 17:10:29 GMT";
export const NORTH_CAROLINA_RECORDED_EXPORT_DATE = null;

export const NORTH_CAROLINA_ADULT_CARE_HOMES = 566;
export const NORTH_CAROLINA_FAMILY_CARE_HOMES = 520;
export const NORTH_CAROLINA_UNIQUE_LICENSES = 1086;
export const NORTH_CAROLINA_BLANK_ROWS = 2;
export const NORTH_CAROLINA_LICENSE_OVERLAP = 0;
export const NORTH_CAROLINA_SITE_ADDRESSES = 1086;
export const NORTH_CAROLINA_FIVE_DIGIT_SITE_ZIPS = 1086;
export const NORTH_CAROLINA_ADULT_COUNTIES = 96;
export const NORTH_CAROLINA_FAMILY_COUNTIES = 64;
export const NORTH_CAROLINA_IDENTICAL_MAILING_ADDRESSES = 184;
export const NORTH_CAROLINA_DISTINCT_MAILING_ADDRESSES = 902;
export const NORTH_CAROLINA_ADULT_BED_MINIMUM = 9;
export const NORTH_CAROLINA_FAMILY_BEDS_OUTSIDE_RANGE = 0;
export const NORTH_CAROLINA_STAR_NOT_AVAILABLE = 27;
export const NORTH_CAROLINA_EXPIRY_BEFORE_OBSERVATION = 5;
export const NORTH_CAROLINA_PUBLICATION_ELIGIBLE_ROWS = 0;

export const NORTH_CAROLINA_BLOCKERS = [
  "listings-page-date-is-not-an-export-date",
  "workbook-as-of-label-is-not-an-export-date",
  "file-server-clock-is-not-an-export-date",
  "no-per-row-licensing-status",
  "star-rating-is-not-a-licensing-status",
  "expiry-date-is-not-a-licensing-status",
  "no-coordinate-columns",
  "star-result-identifier-is-not-the-license-number",
] as const;

export function northCarolinaDirectoryReady(): false {
  return false;
}

export function northCarolinaMapReady(): false {
  return false;
}

export function adoptNorthCarolinaExportDate(candidate: string | null): null {
  if (candidate == null) return null;
  return null;
}

export function northCarolinaDisclosureUrl(licenseIdentifier: string): null {
  if (licenseIdentifier.trim() === "") return null;
  return null;
}

export function mayRepresentNorthCarolinaRecordAsCurrentlyActive(): false {
  return false;
}

export function northCarolinaPublicationReadiness() {
  return {
    publication: NORTH_CAROLINA_PUBLICATION,
    observedOn: NORTH_CAROLINA_OBSERVED_ON,
    authoritativeExportDate: NORTH_CAROLINA_RECORDED_EXPORT_DATE,
    updateFrequencyDocumented: false,
    structurallyEligibleRows: NORTH_CAROLINA_UNIQUE_LICENSES,
    publicationEligibleRows: NORTH_CAROLINA_PUBLICATION_ELIGIBLE_ROWS,
    directoryReady: northCarolinaDirectoryReady(),
    mapReady: northCarolinaMapReady(),
    disclosureReady: false,
    currentStatusReady: false,
    currentlyActive: mayRepresentNorthCarolinaRecordAsCurrentlyActive(),
    blockers: NORTH_CAROLINA_BLOCKERS,
  };
}
