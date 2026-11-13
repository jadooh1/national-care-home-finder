export const TEXAS_PUBLICATION = "unpublished" as const;
export const TEXAS_SOURCE_URL = "https://apps.hhs.texas.gov/providers/directories/al.xlsx";
export const TEXAS_SEARCH_URL = "https://tulip.hhs.texas.gov/TULIP/s/ltc-provider-search";
export const TEXAS_DETAIL_URL = "https://tulip.hhs.texas.gov/TULIP/s/ltc-provider-detail";
export const TEXAS_CLOSURES_URL = "https://apps.hhs.texas.gov/providers/directories/Closures/alf_closures.pdf";
export const TEXAS_OBSERVED_ON = "2026-11-13";
export const TEXAS_ACTIVE_AS_OF = "11/12/2026";
export const TEXAS_FILE_LAST_MODIFIED = "Fri, 13 Nov 2026 14:07:19 GMT";
export const TEXAS_CLOSURES_FILE_CLOCK = "Mon, 09 Nov 2026 15:31:49 GMT";
export const TEXAS_RECORDED_EXPORT_DATE = null;

export const TEXAS_ROWS = 2016;
export const TEXAS_TYPE_A = 336;
export const TEXAS_TYPE_B = 1672;
export const TEXAS_TYPE_C = 8;
export const TEXAS_STATE_TX = 1522;
export const TEXAS_STATE_TEXAS = 494;
export const TEXAS_LICENSED_YES = 2016;
export const TEXAS_CERTIFIED_NO = 2015;
export const TEXAS_CERTIFIED_YES = 1;
export const TEXAS_GEO_PAIRS = 1938;
export const TEXAS_GEO_COMMA_ONLY = 78;
export const TEXAS_EFFECTIVE_DATE_BLANK = 1;
export const TEXAS_EXPIRATION_DATE_BLANK = 1;
export const TEXAS_INITIAL_DATE_BLANK = 445;
export const TEXAS_ZIP_FIVE = 2006;
export const TEXAS_ZIP_NINE = 10;
export const TEXAS_ALZHEIMER_CERTIFICATES = 736;
export const TEXAS_ACCOUNT_IDS = 0;

export function adoptTexasExportDate(candidate: string | null): null {
  void candidate;
  return null;
}

export function texasDirectoryReady(): false {
  return false;
}

export function texasDisclosureUrl(identifier: string): null {
  void identifier;
  return null;
}

export function texasPublicationReadiness() {
  return {
    publication: TEXAS_PUBLICATION,
    observedOn: TEXAS_OBSERVED_ON,
    activeAsOf: TEXAS_ACTIVE_AS_OF,
    fileLastModified: TEXAS_FILE_LAST_MODIFIED,
    authoritativeExportDate: adoptTexasExportDate(TEXAS_ACTIVE_AS_OF),
    rows: TEXAS_ROWS,
    statusReady: false as const,
    disclosureReady: false as const,
    coordinateColumns: false as const,
    directoryReady: texasDirectoryReady(),
    mapReady: false as const,
    blockers: [
      "active-as-of-label-is-not-an-iso-export-date",
      "file-last-modified-is-not-an-export-date",
      "tulip-detail-uses-an-account-id-not-in-the-workbook",
      "closures-pdf-is-not-reconciled",
      "state-value-is-not-one-spelling",
      "comma-only-geo-cells-are-not-coordinates",
      "geo-location-source-is-not-described",
    ] as const,
  };
}
