const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MICHIGAN_LICENSE = /^[A-Z]{2}\d{9}$/;

export type PublicationControl = "public" | "development" | "unpublished";
export type OnboardingRole = "reference" | "candidate";

export type OnboardingCategory = {
  code: string;
  label: string | null;
  eligible: boolean;
  observedRows: number | null;
};

export type OnboardingProfile = {
  state: "Washington" | "Oregon" | "California" | "Michigan" | "Pennsylvania";
  role: OnboardingRole;
  publication: PublicationControl;
  categories: readonly OnboardingCategory[];
  sourceUrl: string;
  sourceFormat: string;
  coordinateColumns: boolean;
  recordedExportDate: string | null;
  disclosurePrefix: string | null;
  disclosureVerified: boolean;
  blockers: readonly string[];
};

const WASHINGTON_BLOCKERS = [] as const;

const OREGON_BLOCKERS = [
  "accepted-provider-export-has-no-coordinate-columns",
  "gis-point-layer-is-not-the-accepted-export",
  "gis-active-count-is-not-reconciled-to-the-directory",
  "gis-service-edit-time-is-not-an-export-date",
  "provider-export-has-no-date-column",
  "download-filename-is-not-an-export-date",
  "twenty-four-hour-update-notice-is-not-an-export-date",
  "street-location-is-not-an-accepted-public-field",
] as const;

const CALIFORNIA_BLOCKERS = [
  "open-data-has-no-coordinate-columns",
  "catalog-timestamps-are-not-an-export-date",
  "file-date-values-are-not-iso-export-dates",
  "temporal-coverage-text-is-not-an-export-date",
  "accrual-periodicity-other-is-not-an-update-frequency",
  "gis-service-edit-time-is-not-an-export-date",
  "gis-status-code-has-no-published-domain",
  "arf-file-mixes-other-license-categories",
  "no-facility-type-is-accepted",
  "address-and-contact-fields-are-not-accepted",
  "live-search-status-does-not-confirm-the-open-data-status",
  "additional-live-status-sample-timed-out",
  "blank-residential-care-category-is-not-corrected",
  "shifted-adult-residential-row-is-not-corrected",
] as const;

const MICHIGAN_BLOCKERS = [
  "file-server-clock-is-not-an-export-date",
  "daily-update-notice-is-not-an-export-date",
  "license-dates-are-eight-digits-not-iso",
  "license-dates-do-not-match-the-documented-slash-form",
  "open-file-label-is-not-an-availability-claim",
  "no-coordinate-columns",
  "undescribed-type-code-xh-is-not-corrected",
  "nine-digit-zips-are-not-corrected",
  "street-address-column-is-not-filled-from-the-supplemental-column",
  "supplemental-address-is-not-defined-as-a-physical-or-mailing-address",
  "address-phone-and-licensee-fields-are-not-accepted",
] as const;

export const MICHIGAN_OFFICIAL_SOURCE_BLOCKERS = [
  "supplemental-address-is-not-defined-as-a-physical-or-mailing-address",
  "undescribed-type-code-xh-is-not-corrected",
] as const;

const PENNSYLVANIA_BLOCKERS = [
  "catalog-timestamp-is-not-an-export-date",
  "directory-daily-refresh-notice-is-not-an-export-date",
  "georeferenced-coordinates-are-not-licensing-coordinates",
  "no-per-facility-disclosure-link-is-recorded",
  "open-data-object-id-is-not-a-license-number",
  "no-per-row-licensing-status",
  "letter-only-street-values-are-not-corrected",
  "street-additional-information-is-not-copied-into-the-street",
  "phone-and-capacity-fields-are-not-accepted",
] as const;

export const MICHIGAN_SOURCE_URL = "https://documents.apps.lara.state.mi.us/bchs/afc_sw.txt";
export const MICHIGAN_RECORD_DESCRIPTION_URL =
  "https://www.michigan.gov/lara/bureau-list/bchs/adult/online-lookups/adult-foster-care-record-description";
export const MICHIGAN_PROFILE_PREFIX = "https://adultfostercare.apps.lara.state.mi.us/Home/FacilityProfile/";
export const MICHIGAN_FILE_SERVER_CLOCK = "Mon, 09 Nov 2026 03:38:41 GMT";
export const MICHIGAN_RECORDED_EXPORT_DATE = null;
export const MICHIGAN_FILE_ROWS = 4480;
export const MICHIGAN_POSITIONAL_FIELDS = 31;
export const MICHIGAN_FIVE_DIGIT_ZIPS = 4373;
export const MICHIGAN_NINE_DIGIT_ZIPS = 107;
export const MICHIGAN_EIGHT_DIGIT_DATES = 4246;
export const MICHIGAN_BLANK_DATES = 234;

export const MICHIGAN_OBSERVED_TYPES = [
  { code: "AF", label: "Family home (capacity 1-6)", eligible: true, observedRows: 421 },
  { code: "AS", label: "Small group (capacity 1-6)", eligible: true, observedRows: 2487 },
  { code: "AM", label: "Medium group (capacity 7-12)", eligible: true, observedRows: 425 },
  { code: "AL", label: "Large group (capacity 13-20)", eligible: true, observedRows: 556 },
  { code: "AG", label: "Congregate (capacity greater than 20)", eligible: true, observedRows: 4 },
  { code: "AI", label: "County infirmary (capacity greater than 20)", eligible: true, observedRows: 2 },
  { code: "AH", label: "Home for the aged", eligible: true, observedRows: 351 },
  { code: "XH", label: null, eligible: false, observedRows: 234 },
] as const;

export const MICHIGAN_OBSERVED_STATUSES = [
  { code: "REGULAR", observedRows: 4001 },
  { code: "TEMPORARY", observedRows: 181 },
  { code: "1ST PROVISIONAL", observedRows: 62 },
  { code: "EXEMPT", observedRows: 234 },
  { code: "NONE", observedRows: 2 },
] as const;

export const PENNSYLVANIA_DATASET_URL =
  "https://data.pa.gov/Services-Near-You/Licensed-Personal-Care-Homes-Current-Statewide-Hum/pqf4-d4xn";
export const PENNSYLVANIA_SOURCE_URL = "https://data.pa.gov/api/views/pqf4-d4xn/rows.csv?accessType=DOWNLOAD";
export const PENNSYLVANIA_PROVIDER_DIRECTORY =
  "https://www.humanservices.dhs.pa.gov/human_service_provider_directory/";
export const PENNSYLVANIA_RECORDED_EXPORT_DATE = null;
export const PENNSYLVANIA_CATALOG_ROWS_UPDATED_AT = "2026-11-08T06:09:03Z";
export const PENNSYLVANIA_ROWS = 989;
export const PENNSYLVANIA_USABLE_STREET_ROWS = 976;
export const PENNSYLVANIA_LETTER_ONLY_STREET_ROWS = 13;
export const PENNSYLVANIA_PUBLICATION_ELIGIBLE_ROWS = 0;

const PROFILES = [
  {
    state: "Washington",
    role: "reference",
    publication: "public",
    categories: [
      { code: "adult-family-home", label: "Adult family home", eligible: true, observedRows: null },
    ],
    sourceUrl: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx",
    sourceFormat: "official-directory",
    coordinateColumns: true,
    recordedExportDate: "2026-11-09",
    disclosurePrefix: "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?ref=adv&Lic=",
    disclosureVerified: true,
    blockers: WASHINGTON_BLOCKERS,
  },
  {
    state: "Oregon",
    role: "reference",
    publication: "development",
    categories: [
      { code: "adult-foster-home", label: "Adult foster home", eligible: true, observedRows: null },
    ],
    sourceUrl: "https://ltclicensing.oregon.gov/Providers",
    sourceFormat: "official-provider-export",
    coordinateColumns: false,
    recordedExportDate: null,
    disclosurePrefix: "https://ltclicensing.oregon.gov/Providers/Details/",
    disclosureVerified: true,
    blockers: OREGON_BLOCKERS,
  },
  {
    state: "California",
    role: "reference",
    publication: "unpublished",
    categories: [
      { code: "RCFE", label: "Residential care facility for the elderly", eligible: true, observedRows: null },
      { code: "ARF", label: "Adult residential facility", eligible: true, observedRows: null },
    ],
    sourceUrl: "https://data.chhs.ca.gov/dataset/ccl-facilities",
    sourceFormat: "open-data",
    coordinateColumns: false,
    recordedExportDate: null,
    disclosurePrefix: "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/",
    disclosureVerified: true,
    blockers: CALIFORNIA_BLOCKERS,
  },
  {
    state: "Michigan",
    role: "candidate",
    publication: "unpublished",
    categories: MICHIGAN_OBSERVED_TYPES,
    sourceUrl: MICHIGAN_SOURCE_URL,
    sourceFormat: "positional-comma-delimited-text",
    coordinateColumns: false,
    recordedExportDate: MICHIGAN_RECORDED_EXPORT_DATE,
    disclosurePrefix: MICHIGAN_PROFILE_PREFIX,
    disclosureVerified: true,
    blockers: MICHIGAN_BLOCKERS,
  },
  {
    state: "Pennsylvania",
    role: "candidate",
    publication: "unpublished",
    categories: [
      { code: "personal-care-home", label: "Personal care home", eligible: true, observedRows: PENNSYLVANIA_ROWS },
    ],
    sourceUrl: PENNSYLVANIA_SOURCE_URL,
    sourceFormat: "comma-delimited-open-data",
    coordinateColumns: false,
    recordedExportDate: PENNSYLVANIA_RECORDED_EXPORT_DATE,
    disclosurePrefix: null,
    disclosureVerified: false,
    blockers: PENNSYLVANIA_BLOCKERS,
  },
] as const satisfies readonly OnboardingProfile[];

export function onboardingProfiles(): readonly OnboardingProfile[] {
  return PROFILES;
}

export function onboardingProfile(state: OnboardingProfile["state"]): OnboardingProfile {
  const profile = PROFILES.find(item => item.state === state);
  if (!profile) throw new Error("Unknown onboarding profile");
  return profile;
}

export function publicPublicationPermitted(profile: OnboardingProfile): boolean {
  return profile.publication === "public"
    && profile.categories.some(category => category.eligible)
    && profile.sourceUrl.startsWith("https://")
    && profile.recordedExportDate != null
    && ISO_DATE.test(profile.recordedExportDate)
    && profile.disclosurePrefix != null
    && profile.disclosureVerified
    && profile.blockers.length === 0;
}

export function michiganProfileUrl(license: string): string | null {
  if (!MICHIGAN_LICENSE.test(license)) return null;
  return `${MICHIGAN_PROFILE_PREFIX}${license}`;
}

export function michiganDescribedRows(): number {
  return MICHIGAN_OBSERVED_TYPES.filter(category => category.eligible).reduce((sum, category) => sum + category.observedRows, 0);
}

export const NEXT_STATE_REVIEW = [
  {
    state: "Pennsylvania",
    rank: 1,
    selected: true,
    source: "Department of Human Services open-data CSV",
    rows: 989,
    usableStreetRows: 976,
    unresolvedStreetRows: 13,
    note: "One delimited file, one facility class, and street text on 976 rows. The catalog timestamp is not an export date, georeferenced coordinates are not licensing coordinates, and no per-facility disclosure prefix is recorded.",
  },
  {
    state: "Wisconsin",
    rank: 2,
    selected: false,
    source: "DHS adult family home PDF directory and a separate GIS layer",
    rows: null,
    usableStreetRows: null,
    unresolvedStreetRows: null,
    note: "The PDF directory has 1,980 distinct parenthetical identifiers and a separate mailing-address label. The GIS layer has 2,203 adult family home features, no editing timestamp, and 9 features without a license number. Those counts are not reconciled, so the GIS layer is not the accepted directory.",
  },
  {
    state: "Minnesota",
    rank: 3,
    selected: false,
    source: "DHS Licensing Information Lookup",
    rows: null,
    usableStreetRows: null,
    unresolvedStreetRows: null,
    note: "The lookup can post back a CSV and links profiles at Details.aspx. One response contained 1,148 profile links. The rendered summary said 1,149 licenses, 1,025 active and 124 non-active. Those figures are not reconciled, and the response had no Last-Modified header.",
  },
] as const;

export function adoptPennsylvaniaExportDate(catalogTimestamp: string): null {
  void catalogTimestamp;
  return null;
}

export const PENNSYLVANIA_PUBLICATION_REQUIREMENTS = [
  { requirement: "license-identifier", blocker: "open-data-object-id-is-not-a-license-number" },
  { requirement: "per-row-licensing-status", blocker: "no-per-row-licensing-status" },
  { requirement: "facility-disclosure-link", blocker: "no-per-facility-disclosure-link-is-recorded" },
  { requirement: "iso-export-date", blocker: "catalog-timestamp-is-not-an-export-date" },
] as const;

export const NORTH_CAROLINA_FEASIBILITY = {
  state: "North Carolina",
  selected: false,
  publicationFeasible: false,
  adultCareHomes: 566,
  familyCareHomes: 520,
  uniqueLicenseIdentifiers: 1086,
  siteAddresses: 1086,
  perRowStatus: false,
  disclosureVerified: false,
  listingsPageUpdated: "10/28/2026",
  workbookAsOf: "10/2026",
  recordedExportDate: null,
  coordinateColumns: false,
  facilityPageIdentifierIsLicense: false,
  expiryBeforeObservation: 5,
  publicationEligibleRows: 0,
} as const;

export const IOWA_FEASIBILITY = {
  state: "Iowa",
  selected: false,
  publicationFeasible: false,
  certifiedPrograms: 335,
  certificationIdentifiers: 335,
  facilityAddresses: 335,
  fiveDigitZips: 85,
  nineDigitZips: 250,
  perRowStatus: false,
  disclosureVerified: false,
  recordedExportDate: null,
} as const;

export function adoptListingDate(observedDate: string): null {
  void observedDate;
  return null;
}
