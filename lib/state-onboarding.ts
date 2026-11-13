const SOURCE_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const OREGON_GIS_LAYER_URL =
  "https://services.arcgis.com/uUvqNMGPm7axC2dD/arcgis/rest/services/webFACILITY/FeatureServer/0";

export const CALIFORNIA_CCLD_DATASET_URL = "https://data.chhs.ca.gov/dataset/ccl-facilities";

export const CALIFORNIA_FACILITY_SEARCH_WELCOME_URL =
  "https://www.cdss.ca.gov/inforesources/community-care-licensing/facility-search-welcome";

export const CALIFORNIA_FACILITY_SEARCH_APPLICATION_URL =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/";

export const CALIFORNIA_OPEN_DATA_FIELDS = [
  "facility_type",
  "facility_number",
  "facility_name",
  "licensee",
  "facility_administrator",
  "facility_telephone_number",
  "facility_address",
  "facility_city",
  "facility_state",
  "facility_zip",
  "county_name",
  "regional_office",
  "facility_capacity",
  "facility_status",
  "license_first_date",
  "closed_date",
  "file_date",
] as const;

export const CALIFORNIA_CANDIDATE_FACILITY_TYPES = [
  "Residential Care Facilities for the Elderly",
  "Adult Residential Facilities",
] as const;

export const CALIFORNIA_OUT_OF_SCOPE_RESOURCES = [
  "Child Care Centers",
  "Family Child Care Homes",
  "24-Hour Residential Care for Children",
  "Foster Family Agencies",
  "Home Care Organization",
] as const;

const WITHHELD_CALIFORNIA_FIELDS = [
  "licensee",
  "facility_administrator",
  "facility_telephone_number",
  "facility_address",
] as const;

export type CandidateState = "Oregon" | "California";

export type OnboardingDecision = {
  state: CandidateState;
  publication: "development" | "unpublished";
  coordinateColumns: false;
  recordedExportDate: null;
  mapEnabled: false;
  refreshEnabled: false;
  blockers: readonly string[];
};

export function acceptedExportDate(recorded: string | null, offered: string | null): string | null {
  if (recorded == null || offered !== recorded || !SOURCE_DATE.test(recorded)) return null;
  return recorded;
}

export function candidateMapReady(input: {
  coordinateColumns: boolean;
  recordedExportDate: string | null;
  offeredExportDate: string | null;
  duplicateIds: readonly string[];
  blockers: readonly string[];
}): boolean {
  return input.coordinateColumns
    && acceptedExportDate(input.recordedExportDate, input.offeredExportDate) != null
    && input.duplicateIds.length === 0
    && input.blockers.length === 0;
}

export function candidateRefreshReady(): false {
  return false;
}

const OREGON_BLOCKERS = [
  "accepted-provider-export-has-no-coordinate-columns",
  "gis-point-layer-is-not-the-accepted-export",
  "gis-active-count-is-not-reconciled-to-the-directory",
  "gis-service-edit-time-is-not-an-export-date",
  "street-location-is-not-an-accepted-public-field",
] as const;

const CALIFORNIA_BLOCKERS = [
  "open-data-has-no-coordinate-columns",
  "catalog-timestamps-are-not-an-export-date",
  "file-date-values-are-not-iso-export-dates",
  "arf-file-mixes-other-license-categories",
  "no-facility-type-is-accepted",
  "address-and-contact-fields-are-not-accepted",
  "live-search-status-does-not-confirm-the-open-data-status",
  "blank-residential-care-category-is-not-corrected",
  "shifted-adult-residential-row-is-not-corrected",
] as const;

export function onboardingDecision(state: CandidateState): OnboardingDecision {
  if (state === "Oregon") {
    return {
      state,
      publication: "development",
      coordinateColumns: false,
      recordedExportDate: null,
      mapEnabled: false,
      refreshEnabled: false,
      blockers: OREGON_BLOCKERS,
    };
  }
  return {
    state,
    publication: "unpublished",
    coordinateColumns: false,
    recordedExportDate: null,
    mapEnabled: false,
    refreshEnabled: false,
    blockers: CALIFORNIA_BLOCKERS,
  };
}

export function withheldCaliforniaFields(header: readonly string[]): string[] {
  return WITHHELD_CALIFORNIA_FIELDS.filter(field => header.includes(field));
}
