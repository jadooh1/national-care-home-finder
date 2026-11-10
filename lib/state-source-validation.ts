const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type StateSourceProfile = {
  state: string;
  sourceUrl: string;
  resourceName: string;
  requiredHeader: readonly string[];
  idField: string;
  nameField: string;
  addressField: string;
  categoryField: string;
  statusField: string;
  acceptedStatuses: readonly string[];
  stateField: string;
  expectedState: string;
  zipField: string;
  dateField: string;
  eligibleCategories: readonly string[];
  disclosureUrl: string | null;
};

export type OfficialLicenseRecord = {
  source_url: string;
  resource_name: string;
  license_category: string;
  license_id: string;
  official_fields: Record<string, string>;
};

export type SourceValidationReport = {
  state: string;
  source_url: string;
  resource_name: string;
  persists_records: false;
  header_ok: boolean;
  rows_read: number;
  records: OfficialLicenseRecord[];
  duplicate_license_ids: string[];
  blank_license_ids: number;
  blank_names: number;
  blank_addresses: number;
  blank_zips: number;
  non_five_digit_zips: number;
  addresses_without_street_text: number;
  blank_categories: number;
  status_counts: Record<string, number>;
  category_counts: Record<string, number>;
  unrecognized_status: number;
  unexpected_state: number;
  raw_file_dates: string[];
  iso_file_dates: number;
  recorded_export_date: null;
  coordinate_columns: false;
  disclosure_url: string | null;
  directory_ready: false;
  refresh_activated: false;
};

export const CALIFORNIA_CDSS_DATASET_URL = "https://data.chhs.ca.gov/dataset/ccl-facilities";

export const CALIFORNIA_CDSS_HEADER = [
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

export const CALIFORNIA_ACCEPTED_STATUSES = [
  "LICENSED",
  "CLOSED",
  "PENDING",
  "ON PROBATION",
] as const;

export const CALIFORNIA_RCFE_CATEGORIES = [
  "RESIDENTIAL CARE ELDERLY",
  "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
] as const;

export const CALIFORNIA_ARF_CATEGORIES = [
  "ADULT RESIDENTIAL",
  "ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS",
  "COMMUNITY CRISIS HOME - ARF",
  "ENHANCED BEHAVIORAL SUPPORTS HOME - ARF",
] as const;

const CALIFORNIA_PROFILE = {
  state: "California",
  sourceUrl: CALIFORNIA_CDSS_DATASET_URL,
  requiredHeader: CALIFORNIA_CDSS_HEADER,
  idField: "facility_number",
  nameField: "facility_name",
  addressField: "facility_address",
  categoryField: "facility_type",
  statusField: "facility_status",
  acceptedStatuses: CALIFORNIA_ACCEPTED_STATUSES,
  stateField: "facility_state",
  expectedState: "CA",
  zipField: "facility_zip",
  dateField: "file_date",
  disclosureUrl: null,
} as const;

export const CALIFORNIA_RCFE_PROFILE: StateSourceProfile = {
  ...CALIFORNIA_PROFILE,
  resourceName: "Residential Care Facilities for the Elderly",
  eligibleCategories: CALIFORNIA_RCFE_CATEGORIES,
};

export const CALIFORNIA_ARF_PROFILE: StateSourceProfile = {
  ...CALIFORNIA_PROFILE,
  resourceName: "Adult Residential Facilities",
  eligibleCategories: CALIFORNIA_ARF_CATEGORIES,
};

export function adoptExportDate(recorded: string | null, rawFileDates: readonly string[]): string | null {
  if (recorded == null || !ISO_DATE.test(recorded)) return null;
  if (!rawFileDates.includes(recorded)) return null;
  return recorded;
}

export function validateStateSource(
  profile: StateSourceProfile,
  table: readonly (readonly string[])[],
): SourceValidationReport {
  const header = table[0] ?? [];
  const headerOk = header.length === profile.requiredHeader.length
    && profile.requiredHeader.every((name, index) => header[index] === name);
  const base = emptyReport(profile);
  if (!headerOk) return base;

  const data = table.slice(1).filter(row => row.some(cell => cell.trim() !== ""));
  const records = data.map(row => normalizeRow(profile, header, row));
  const ids = records.map(record => record.license_id);
  const duplicateLicenseIds = duplicates(ids.filter(id => id.trim() !== ""));
  const rawFileDates = [...new Set(records.map(record => record.official_fields[profile.dateField] ?? "").filter(value => value.trim() !== ""))].sort();
  return {
    ...base,
    header_ok: true,
    rows_read: records.length,
    records,
    duplicate_license_ids: duplicateLicenseIds,
    blank_license_ids: countBlank(records, profile.idField),
    blank_names: countBlank(records, profile.nameField),
    blank_addresses: countBlank(records, profile.addressField),
    blank_zips: countBlank(records, profile.zipField),
    non_five_digit_zips: records.filter(record => {
      const zip = (record.official_fields[profile.zipField] ?? "").trim();
      return zip !== "" && !/^\d{5}$/.test(zip);
    }).length,
    addresses_without_street_text: records.filter(record => {
      const address = (record.official_fields[profile.addressField] ?? "").trim();
      return address !== "" && !/[A-Za-z]/.test(address);
    }).length,
    blank_categories: countBlank(records, profile.categoryField),
    status_counts: tally(records, profile.statusField),
    category_counts: tally(records, profile.categoryField),
    unrecognized_status: records.filter(record => !profile.acceptedStatuses.includes(record.official_fields[profile.statusField] ?? "")).length,
    unexpected_state: records.filter(record => (record.official_fields[profile.stateField] ?? "") !== profile.expectedState).length,
    raw_file_dates: rawFileDates,
    iso_file_dates: rawFileDates.filter(value => ISO_DATE.test(value)).length,
  };
}

function normalizeRow(
  profile: StateSourceProfile,
  header: readonly string[],
  row: readonly string[],
): OfficialLicenseRecord {
  const officialFields: Record<string, string> = {};
  header.forEach((name, index) => {
    officialFields[name] = row[index] ?? "";
  });
  return {
    source_url: profile.sourceUrl,
    resource_name: profile.resourceName,
    license_category: officialFields[profile.categoryField] ?? "",
    license_id: officialFields[profile.idField] ?? "",
    official_fields: officialFields,
  };
}

function countBlank(records: readonly OfficialLicenseRecord[], field: string): number {
  return records.filter(record => (record.official_fields[field] ?? "").trim() === "").length;
}

function tally(records: readonly OfficialLicenseRecord[], field: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const record of records) {
    const value = record.official_fields[field] ?? "";
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function duplicates(values: readonly string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value).sort();
}

export type ExclusionReason =
  | "unverified_category"
  | "unrecognized_status"
  | "unexpected_state"
  | "invalid_zip"
  | "incomplete_identity";

export type PublicationReadiness = {
  rows_read: number;
  eligible: number;
  eligible_by_status: Record<string, number>;
  excluded: number;
  excluded_by_reason: Record<ExclusionReason, number>;
  unresolved_exceptions: {
    blank_categories: number;
    unrecognized_status: number;
    unexpected_state: number;
    non_five_digit_zips: number;
  };
  source_fields_rewritten: false;
  disclosure_url: null;
  recorded_export_date: null;
  directory_ready: false;
};

export function publicationReadiness(
  profile: StateSourceProfile,
  report: SourceValidationReport,
): PublicationReadiness {
  const excludedByReason: Record<ExclusionReason, number> = {
    unverified_category: 0,
    unrecognized_status: 0,
    unexpected_state: 0,
    invalid_zip: 0,
    incomplete_identity: 0,
  };
  const eligibleByStatus: Record<string, number> = {};
  let eligible = 0;
  for (const record of report.records) {
    const reason = exclusionReason(profile, record);
    if (reason) {
      excludedByReason[reason] += 1;
      continue;
    }
    eligible += 1;
    const status = record.official_fields[profile.statusField] ?? "";
    eligibleByStatus[status] = (eligibleByStatus[status] ?? 0) + 1;
  }
  return {
    rows_read: report.rows_read,
    eligible,
    eligible_by_status: eligibleByStatus,
    excluded: report.rows_read - eligible,
    excluded_by_reason: excludedByReason,
    unresolved_exceptions: {
      blank_categories: report.blank_categories,
      unrecognized_status: report.unrecognized_status,
      unexpected_state: report.unexpected_state,
      non_five_digit_zips: report.non_five_digit_zips,
    },
    source_fields_rewritten: false,
    disclosure_url: null,
    recorded_export_date: null,
    directory_ready: false,
  };
}

function exclusionReason(
  profile: StateSourceProfile,
  record: OfficialLicenseRecord,
): ExclusionReason | null {
  const category = record.official_fields[profile.categoryField] ?? "";
  if (!profile.eligibleCategories.some(value => value === category)) return "unverified_category";
  const status = record.official_fields[profile.statusField] ?? "";
  if (!profile.acceptedStatuses.includes(status)) return "unrecognized_status";
  if ((record.official_fields[profile.stateField] ?? "") !== profile.expectedState) return "unexpected_state";
  const zip = (record.official_fields[profile.zipField] ?? "").trim();
  if (!/^\d{5}$/.test(zip)) return "invalid_zip";
  const identity = [profile.idField, profile.nameField, profile.addressField];
  if (identity.some(field => (record.official_fields[field] ?? "").trim() === "")) return "incomplete_identity";
  return null;
}

function emptyReport(profile: StateSourceProfile): SourceValidationReport {
  return {
    state: profile.state,
    source_url: profile.sourceUrl,
    resource_name: profile.resourceName,
    persists_records: false,
    header_ok: false,
    rows_read: 0,
    records: [],
    duplicate_license_ids: [],
    blank_license_ids: 0,
    blank_names: 0,
    blank_addresses: 0,
    blank_zips: 0,
    non_five_digit_zips: 0,
    addresses_without_street_text: 0,
    blank_categories: 0,
    status_counts: {},
    category_counts: {},
    unrecognized_status: 0,
    unexpected_state: 0,
    raw_file_dates: [],
    iso_file_dates: 0,
    recorded_export_date: null,
    coordinate_columns: false,
    disclosure_url: profile.disclosureUrl,
    directory_ready: false,
    refresh_activated: false,
  };
}
