/**
 * Texas HHSC assisted-living directory constants (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Current capture observed 2026-11-20. Prior Nov 13 baseline retained for
 * comparison in texas-source-verification.ts.
 */

export const TEXAS_PUBLICATION = "unpublished" as const;
export const TEXAS_SOURCE_URL = "https://apps.hhs.texas.gov/providers/directories/al.xlsx";
export const TEXAS_SEARCH_URL = "https://tulip.hhs.texas.gov/TULIP/s/ltc-provider-search";
export const TEXAS_DETAIL_URL = "https://tulip.hhs.texas.gov/TULIP/s/ltc-provider-detail";
export const TEXAS_CLOSURES_URL = "https://apps.hhs.texas.gov/providers/directories/Closures/alf_closures.pdf";
export const TEXAS_OBSERVED_ON = "2026-11-20";
export const TEXAS_ACTIVE_AS_OF = "11/19/2026";
export const TEXAS_FILE_LAST_MODIFIED = "Fri, 20 Nov 2026 14:11:45 GMT";
export const TEXAS_CLOSURES_FILE_CLOCK = "Mon, 16 Nov 2026 15:33:00 GMT";
export const TEXAS_RECORDED_EXPORT_DATE = null;
export const TEXAS_WORKBOOK_SHA256 =
  "7b83f02c3fa33baf90ab428159b6f562ef0180899afd489ba11de891d2dce476";

export const TEXAS_ROWS = 2019;
export const TEXAS_TYPE_A = 335;
export const TEXAS_TYPE_B = 1676;
export const TEXAS_TYPE_C = 8;
export const TEXAS_STATE_TX = 1522;
export const TEXAS_STATE_TEXAS = 497;
export const TEXAS_LICENSED_YES = 2019;
export const TEXAS_CERTIFIED_NO = 2018;
export const TEXAS_CERTIFIED_YES = 1;
export const TEXAS_GEO_PAIRS = 1937;
export const TEXAS_GEO_COMMA_ONLY = 82;
export const TEXAS_EFFECTIVE_DATE_BLANK = 1;
export const TEXAS_EXPIRATION_DATE_BLANK = 1;
export const TEXAS_INITIAL_DATE_BLANK = 448;
export const TEXAS_ZIP_FIVE = 2009;
export const TEXAS_ZIP_NINE = 10;
export const TEXAS_ALZHEIMER_CERTIFICATES = 738;
export const TEXAS_ACCOUNT_IDS = 0;
export const TEXAS_FACILITY_ID_LEADING_ZEROS = 533;
export const TEXAS_CLOSURE_FACILITY_IDS = 1515;
export const TEXAS_CLOSURE_ACTIVE_ID_OVERLAP = 0;
export const TEXAS_CLOSURE_TYPE_A = 791;
export const TEXAS_CLOSURE_TYPE_B = 512;
export const TEXAS_CLOSURE_TYPE_C = 190;
export const TEXAS_CLOSURE_TYPE_E = 22;
export const TEXAS_CLOSURE_DATE_TOKENS = 1650;
export const TEXAS_CONTACT_PAGE =
  "https://www.hhs.texas.gov/providers/long-term-care-providers/assisted-living-facilities-alf";
export const TEXAS_LICENSING_PHONE = "512-438-2630";
export const TEXAS_POLICY_PHONE = "512-438-3161";
export const TEXAS_POLICY_EMAIL = "LTCRPolicy@hhs.texas.gov";

/** Prior Nov 13 capture (retained for delta checks). */
export const TEXAS_PRIOR_NOV13 = {
  observedOn: "2026-11-13",
  rows: 2016,
  typeA: 336,
  typeB: 1672,
  typeC: 8,
  activeAsOf: "11/12/2026",
  fileLastModified: "Fri, 13 Nov 2026 14:07:19 GMT",
  geoCommaOnly: 78,
  closuresFacilityIds: 1510,
} as const;

export function texasSourceDateRole(
  candidate: string | null,
): "source-publication-label" | "rewritten-iso-not-authoritative" | "file-clock" | "not-an-authoritative-date" {
  if (candidate === TEXAS_ACTIVE_AS_OF || candidate === TEXAS_PRIOR_NOV13.activeAsOf) {
    return "source-publication-label";
  }
  if (candidate === "2026-11-19" || candidate === "2026-11-12") {
    return "rewritten-iso-not-authoritative";
  }
  if (
    candidate === TEXAS_FILE_LAST_MODIFIED
    || candidate === TEXAS_CLOSURES_FILE_CLOCK
    || candidate === TEXAS_PRIOR_NOV13.fileLastModified
  ) {
    return "file-clock";
  }
  return "not-an-authoritative-date";
}

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
      "facility-licensed-yes-is-not-operating-status",
      "closures-do-not-establish-active-operating-status",
      "state-value-is-not-one-spelling",
      "comma-only-geo-cells-are-not-coordinates",
      "geo-location-source-is-not-described",
      "type-a-b-c-not-washington-afh",
    ] as const,
  };
}
