export const CALIFORNIA_ACCEPTED_STATUS_TEXT = [
  "LICENSED",
  "CLOSED",
  "PENDING",
  "ON PROBATION",
] as const;

export const CALIFORNIA_RCFE_ACCEPTED_CATEGORIES = [
  "RESIDENTIAL CARE ELDERLY",
  "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
] as const;

export const CALIFORNIA_ARF_ACCEPTED_CATEGORIES = [
  "ADULT RESIDENTIAL",
  "ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS",
  "COMMUNITY CRISIS HOME - ARF",
  "ENHANCED BEHAVIORAL SUPPORTS HOME - ARF",
] as const;

export const CALIFORNIA_SOURCE_URL = "https://data.chhs.ca.gov/dataset/ccl-facilities";

export const CALIFORNIA_PUBLICATION_BLOCKERS = [
  "no-facilities-id",
  "address-and-contact-fields-are-not-accepted",
  "no-facility-type-is-accepted",
  "open-data-status-is-historical-file-text",
  "confirmed-live-status-conflicts-remain",
  "no-authoritative-iso-export-date",
  "profile-url-is-not-adopted",
  "detail-route-was-observed-for-two-examples-without-status-confirmation",
] as const;

export const CALIFORNIA_OPTIONAL_ENHANCEMENTS = [
  "open-data-has-no-coordinate-columns",
] as const;

export const CALIFORNIA_RECORDED_STATUS_CONFLICTS = [
  { file: "RCFE", openDataStatus: "LICENSED", liveStatus: "Closed, Change of Ownership" },
  { file: "ARF", openDataStatus: "LICENSED", liveStatus: "Closed, Licensee Initiated" },
] as const;

export type CaliforniaSourceFile = "RCFE" | "ARF";

export type CaliforniaSourceRow = {
  file: CaliforniaSourceFile;
  facility_type: string;
  facility_number: string;
  facility_name: string;
  facility_address: string;
  facility_city: string;
  facility_state: string;
  facility_zip: string;
  facility_status: string;
  file_date: string;
  source_url?: string;
};

export type CaliforniaRowFinding =
  | "missing-license"
  | "missing-name"
  | "missing-address"
  | "missing-status"
  | "missing-state"
  | "blank-category"
  | "other-license-category"
  | "shifted-row"
  | "unexpected-state"
  | "unrecognized-status"
  | "duplicate-license";

export type CaliforniaStatusNote = {
  openDataStatus: string;
  liveStatus: string | null;
  classification: "match" | "conflict" | "missing" | "inconclusive";
};

export type CaliforniaNormalizedRecord = {
  originalLicenseId: string;
  originalStatus: string;
  originalCategory: string;
  originalFileDate: string;
  originalAddress: string;
  sourceUrl: string;
  file: CaliforniaSourceFile;
  facilityId: null;
  acceptedName: null;
  acceptedAddress: null;
  acceptedLicense: null;
  exportDate: null;
  disclosureUrl: null;
  latitude: null;
  longitude: null;
  publication: "unpublished";
  ownerClaimEligible: false;
  findings: CaliforniaRowFinding[];
};

export type CaliforniaSourceValidation = {
  persistsRecords: false;
  records: CaliforniaNormalizedRecord[];
  duplicateLicenseIds: string[];
  statusConflicts: number;
  publication: "unpublished";
  ownerClaimEligible: false;
};

const FINDING_ORDER = [
  "missing-license",
  "missing-name",
  "missing-address",
  "missing-status",
  "missing-state",
  "blank-category",
  "shifted-row",
  "other-license-category",
  "unexpected-state",
  "unrecognized-status",
  "duplicate-license",
] as const satisfies readonly CaliforniaRowFinding[];

export function validateCaliforniaSourceRows(
  rows: readonly CaliforniaSourceRow[],
  statusNotes: readonly CaliforniaStatusNote[] = [],
): CaliforniaSourceValidation {
  const duplicateLicenseIds = duplicateLicenses(rows);
  const records = rows.map(row => normalizeCaliforniaRow(row, duplicateLicenseIds));
  return {
    persistsRecords: false,
    records,
    duplicateLicenseIds,
    statusConflicts: statusNotes.filter(note => note.classification === "conflict").length,
    publication: "unpublished",
    ownerClaimEligible: false,
  };
}

export function californiaSourceReadiness() {
  return {
    publication: "unpublished" as const,
    persistsRecords: false as const,
    ownerClaimEligible: false as const,
    publicDirectoryPermitted: false as const,
    verified: {
      structurallyEligible: 21131,
      rcfeEligible: 12521,
      arfEligible: 8610,
      excluded: 1889,
      blankCategory: 1,
      otherLicenseCategory: 1887,
      shiftedRow: 1,
      confirmedStatusConflicts: CALIFORNIA_RECORDED_STATUS_CONFLICTS.length,
      inconclusiveTimedOutRequests: 7,
      authoritativeExportDate: null,
      coordinateColumns: false,
      disclosureUrlAdopted: false,
    },
    unresolvedBlockers: CALIFORNIA_PUBLICATION_BLOCKERS,
    optionalEnhancements: CALIFORNIA_OPTIONAL_ENHANCEMENTS,
  };
}

function normalizeCaliforniaRow(
  row: CaliforniaSourceRow,
  duplicateLicenseIds: readonly string[],
): CaliforniaNormalizedRecord {
  const license = row.facility_number ?? "";
  const category = row.facility_type ?? "";
  const status = row.facility_status ?? "";
  const state = row.facility_state ?? "";
  const findings: CaliforniaRowFinding[] = [];
  if (license.trim() === "") findings.push("missing-license");
  if ((row.facility_name ?? "").trim() === "") findings.push("missing-name");
  if ((row.facility_address ?? "").trim() === "") findings.push("missing-address");
  if (status.trim() === "") findings.push("missing-status");
  if (state.trim() === "") findings.push("missing-state");
  if (category.trim() === "") findings.push("blank-category");
  if (isShiftedRow(category, state, status)) findings.push("shifted-row");
  else if (category.trim() !== "" && !acceptedCategories(row.file).includes(category)) findings.push("other-license-category");
  if (state.trim() !== "" && state !== "CA" && !findings.includes("shifted-row")) findings.push("unexpected-state");
  if (status.trim() !== "" && !CALIFORNIA_ACCEPTED_STATUS_TEXT.includes(status as typeof CALIFORNIA_ACCEPTED_STATUS_TEXT[number]) && !findings.includes("shifted-row")) {
    findings.push("unrecognized-status");
  }
  if (license.trim() !== "" && duplicateLicenseIds.includes(license)) findings.push("duplicate-license");
  return {
    originalLicenseId: license,
    originalStatus: status,
    originalCategory: category,
    originalFileDate: row.file_date ?? "",
    originalAddress: row.facility_address ?? "",
    sourceUrl: row.source_url?.trim() || CALIFORNIA_SOURCE_URL,
    file: row.file,
    facilityId: null,
    acceptedName: null,
    acceptedAddress: null,
    acceptedLicense: null,
    exportDate: null,
    disclosureUrl: null,
    latitude: null,
    longitude: null,
    publication: "unpublished",
    ownerClaimEligible: false,
    findings: FINDING_ORDER.filter(finding => findings.includes(finding)),
  };
}

function isShiftedRow(category: string, state: string, status: string): boolean {
  return category.trim() === ""
    && state.trim() !== ""
    && state !== "CA"
    && !CALIFORNIA_ACCEPTED_STATUS_TEXT.includes(status as typeof CALIFORNIA_ACCEPTED_STATUS_TEXT[number]);
}

function acceptedCategories(file: CaliforniaSourceFile): readonly string[] {
  return file === "RCFE" ? CALIFORNIA_RCFE_ACCEPTED_CATEGORIES : CALIFORNIA_ARF_ACCEPTED_CATEGORIES;
}

function duplicateLicenses(rows: readonly CaliforniaSourceRow[]): string[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const license = row.facility_number ?? "";
    if (license.trim() === "") continue;
    counts.set(license, (counts.get(license) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([license]) => license).sort();
}
