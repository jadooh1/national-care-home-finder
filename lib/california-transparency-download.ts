/**
 * Read-only California CDSS Transparency Site DownloadStateData verification.
 * Does not persist rows, publish California, or adopt non-ISO filename dates.
 */

export const CALIFORNIA_TRANSPARENCY_DOWNLOAD_PAGE =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?rewrite=downloaddata";

export const CALIFORNIA_TRANSPARENCY_DOWNLOAD_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData";

export const CALIFORNIA_TRANSPARENCY_DOWNLOAD_IDS = {
  rcfe: "ResidentialElderCareFacility",
  arf: "AdultResidentialFacilities",
} as const;

export type CaliforniaTransparencyDownloadFile = "RCFE" | "ARF";

export const CALIFORNIA_TRANSPARENCY_DOWNLOAD_CORE_FIELDS = [
  "Facility Type",
  "Facility Number",
  "Facility Name",
  "Facility Address",
  "Facility City",
  "Facility State",
  "Facility Zip",
  "Facility Status",
  "License First Date",
  "Closed Date",
  "Last Visit Date",
] as const;

export const CALIFORNIA_TRANSPARENCY_DOWNLOAD_STATUSES = [
  "LICENSED",
  "CLOSED",
  "PENDING",
  "ON PROBATION",
] as const;

export type CaliforniaTransparencyDownloadStatus =
  (typeof CALIFORNIA_TRANSPARENCY_DOWNLOAD_STATUSES)[number];

/** Official CDSS facility numbers are 8–9 digit strings and may keep a leading zero. */
const FACILITY_NUMBER = /^\d{8,9}$/;
const FILENAME_DATE = /(\d{8})(?:\.csv)?$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const CALIFORNIA_TRANSPARENCY_DOWNLOAD_PROVENANCE = {
  page: CALIFORNIA_TRANSPARENCY_DOWNLOAD_PAGE,
  endpoint: CALIFORNIA_TRANSPARENCY_DOWNLOAD_API,
  downloadIds: CALIFORNIA_TRANSPARENCY_DOWNLOAD_IDS,
  coreFields: CALIFORNIA_TRANSPARENCY_DOWNLOAD_CORE_FIELDS,
  statusDomain: CALIFORNIA_TRANSPARENCY_DOWNLOAD_STATUSES,
  clientVersionObserved: "11.18.0R",
  limitations: [
    "DownloadStateData returns statewide CSV attachments per facility group; it is not FacilityDetail and does not provide fine-grained Closed subtypes.",
    "Content-Disposition filenames embed an MMDDYYYY stamp (for example ResidentialElderCareFacility11152026.csv). That stamp is not an authoritative ISO export date.",
    "CSV bodies observed in Phase 3 have no file_date column, unlike the historical CHHS open-data dumps.",
    "CLOSED in the download can correspond to FacilityDetail labels other than Closed* (for example Application Withdrawn).",
    "ARF downloads include non-residential categories such as ADULT DAY PROGRAM; publication categories remain separately gated.",
    "Corrupt or shifted rows can appear (observed Facility Number 95354 matching the ZIP).",
    "Closed-facility retention appears bounded (~five years on the Transparency Site); older historical CLOSED rows may be absent.",
    "GIS integer FAC_NBR still truncates leading zeros; download strings keep them.",
  ],
} as const;

export const CALIFORNIA_TRANSPARENCY_DOWNLOAD_PUBLICATION_GATE = {
  providesBulkRcfeArfRoster: true,
  preservesLeadingZeroFacilityNumbers: true,
  includesClosedFacilities: true,
  authoritativeIsoExportDate: false,
  facilityDetailSubtypeParity: false,
  sampleVerificationSufficient: false,
  publication: "unpublished" as const,
  ownerClaimEligible: false,
  notes: [
    "Bulk DownloadStateData is the strongest statewide roster candidate found so far, but filename dates stay non-ISO and CLOSED is coarse.",
    "Publication still requires an adopted authoritative ISO export date, category gates, invalid-ID handling, and unresolved status-mapping rules against FacilityDetail.",
  ],
} as const;

export type CaliforniaTransparencyDownloadRow = {
  facilityType: string;
  facilityNumber: string;
  facilityName: string;
  facilityAddress: string;
  facilityCity: string;
  facilityState: string;
  facilityZip: string;
  facilityStatus: string;
  licenseFirstDate: string;
  closedDate: string;
  lastVisitDate: string;
};

export type CaliforniaTransparencyDownloadFilenameDate = {
  raw: string | null;
  month: number | null;
  day: number | null;
  year: number | null;
  isoCandidate: string | null;
  authoritativeIsoExportDate: null;
};

export type CaliforniaTransparencyDownloadRosterSummary = {
  file: CaliforniaTransparencyDownloadFile;
  rowCount: number;
  distinctFacilityNumbers: number;
  duplicateFacilityNumbers: string[];
  statusCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  leadingZeroFacilityNumbers: number;
  invalidFacilityNumbers: string[];
  blankFacilityTypes: number;
  closedWithClosedDate: number;
  closedMissingClosedDate: number;
};

export type CaliforniaDownloadVsFacilityDetailRelation =
  | "match"
  | "conflict"
  | "missing-live"
  | "invalid-download-id";

export type CaliforniaHistoricalVsDownloadRelation =
  | "exact"
  | "leading-zero-representation"
  | "historical-only"
  | "download-only";

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function countBy(values: readonly string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function duplicateIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (!id) continue;
    if (seen.has(id)) duplicates.add(id);
    else seen.add(id);
  }
  return [...duplicates].sort();
}

export function californiaTransparencyDownloadUrl(
  downloadId: string,
  guid: string,
): string {
  const params = new URLSearchParams({ id: downloadId, GUID: guid });
  return `${CALIFORNIA_TRANSPARENCY_DOWNLOAD_API}?${params.toString()}`;
}

export function californiaTransparencyConfigHeader(input: {
  guid: string;
  version?: string;
  deviceReady?: 0 | 1;
  docProtocol?: "http:" | "https:";
}): string {
  return JSON.stringify({
    Version: input.version ?? CALIFORNIA_TRANSPARENCY_DOWNLOAD_PROVENANCE.clientVersionObserved,
    deviceReady: input.deviceReady ?? 0,
    GUID: input.guid,
    DocProtocol: input.docProtocol ?? "https:",
  });
}

/**
 * Parse the MMDDYYYY stamp from a DownloadStateData Content-Disposition filename.
 * Never adopts the result as an authoritative ISO export date.
 */
export function parseCaliforniaTransparencyDownloadFilenameDate(
  contentDispositionOrFilename: string | null | undefined,
): CaliforniaTransparencyDownloadFilenameDate {
  const rawText = text(contentDispositionOrFilename);
  if (!rawText) {
    return {
      raw: null,
      month: null,
      day: null,
      year: null,
      isoCandidate: null,
      authoritativeIsoExportDate: null,
    };
  }
  const filenameMatch = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(rawText);
  const filename = text(filenameMatch?.[1] ?? rawText).replace(/"/g, "");
  const stampMatch = FILENAME_DATE.exec(filename);
  const raw = stampMatch?.[1] ?? null;
  if (!raw || raw.length !== 8) {
    return {
      raw,
      month: null,
      day: null,
      year: null,
      isoCandidate: null,
      authoritativeIsoExportDate: null,
    };
  }
  const month = Number(raw.slice(0, 2));
  const day = Number(raw.slice(2, 4));
  const year = Number(raw.slice(4, 8));
  const valid =
    Number.isInteger(month)
    && Number.isInteger(day)
    && Number.isInteger(year)
    && month >= 1
    && month <= 12
    && day >= 1
    && day <= 31
    && year >= 2000
    && year <= 2100;
  const isoCandidate = valid
    ? `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    : null;
  if (isoCandidate && !ISO_DATE.test(isoCandidate)) {
    return {
      raw,
      month,
      day,
      year,
      isoCandidate: null,
      authoritativeIsoExportDate: null,
    };
  }
  return {
    raw,
    month: valid ? month : null,
    day: valid ? day : null,
    year: valid ? year : null,
    isoCandidate,
    authoritativeIsoExportDate: null,
  };
}

export function adoptCaliforniaTransparencyDownloadExportDate(
  filenameDate: CaliforniaTransparencyDownloadFilenameDate,
): null {
  void filenameDate;
  return null;
}

export function parseCaliforniaTransparencyDownloadCsv(
  csvText: string,
): CaliforniaTransparencyDownloadRow[] {
  const lines = csvText.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0] ?? "");
  const index = Object.fromEntries(headers.map((header, i) => [header, i]));
  const rows: CaliforniaTransparencyDownloadRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const get = (name: (typeof CALIFORNIA_TRANSPARENCY_DOWNLOAD_CORE_FIELDS)[number]) =>
      text(cells[index[name] ?? -1]);
    rows.push({
      facilityType: get("Facility Type"),
      facilityNumber: get("Facility Number"),
      facilityName: get("Facility Name"),
      facilityAddress: get("Facility Address"),
      facilityCity: get("Facility City"),
      facilityState: get("Facility State"),
      facilityZip: get("Facility Zip"),
      facilityStatus: get("Facility Status"),
      licenseFirstDate: get("License First Date"),
      closedDate: get("Closed Date"),
      lastVisitDate: get("Last Visit Date"),
    });
  }
  return rows;
}

/** Minimal RFC4180-style CSV line parser for quoted CDSS downloads. */
export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i] ?? "";
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}

export function isCaliforniaTransparencyFacilityNumber(value: string): boolean {
  return FACILITY_NUMBER.test(text(value));
}

export function summarizeCaliforniaTransparencyDownloadRoster(
  file: CaliforniaTransparencyDownloadFile,
  rows: readonly CaliforniaTransparencyDownloadRow[],
): CaliforniaTransparencyDownloadRosterSummary {
  const ids = rows.map(row => row.facilityNumber);
  const invalidFacilityNumbers = [...new Set(
    ids.filter(id => id !== "" && !isCaliforniaTransparencyFacilityNumber(id)),
  )].sort();
  const closedRows = rows.filter(row => row.facilityStatus.toUpperCase() === "CLOSED");
  return {
    file,
    rowCount: rows.length,
    distinctFacilityNumbers: new Set(ids.filter(Boolean)).size,
    duplicateFacilityNumbers: duplicateIds(ids),
    statusCounts: countBy(rows.map(row => row.facilityStatus || "(blank)")),
    typeCounts: countBy(rows.map(row => row.facilityType || "(blank)")),
    leadingZeroFacilityNumbers: ids.filter(id => id.startsWith("0")).length,
    invalidFacilityNumbers,
    blankFacilityTypes: rows.filter(row => row.facilityType === "").length,
    closedWithClosedDate: closedRows.filter(row => row.closedDate !== "").length,
    closedMissingClosedDate: closedRows.filter(row => row.closedDate === "").length,
  };
}

/**
 * Coarse mapping between DownloadStateData Facility Status and FacilityDetail STATUS.
 * CLOSED matches any Closed* live label only; Application Withdrawn is a conflict.
 */
export function relateCaliforniaDownloadStatusToFacilityDetail(
  downloadStatus: string,
  liveStatus: string | null,
  options: { downloadFacilityNumber?: string; liveFacilityNumber?: string | null } = {},
): CaliforniaDownloadVsFacilityDetailRelation {
  const downloadId = text(options.downloadFacilityNumber);
  if (downloadId && !isCaliforniaTransparencyFacilityNumber(downloadId)) {
    return "invalid-download-id";
  }
  if (!liveStatus || text(liveStatus) === "") return "missing-live";
  const download = text(downloadStatus).toUpperCase();
  const live = text(liveStatus).toLowerCase();
  if (download === "LICENSED" && live === "licensed") return "match";
  if (download === "CLOSED" && live.startsWith("closed")) return "match";
  if (download === "PENDING" && live === "pending") return "match";
  if (download === "ON PROBATION" && live.includes("probation")) return "match";
  return "conflict";
}

export function padCaliforniaFacilityNumberCandidate(value: string): string {
  const id = text(value);
  if (/^\d+$/.test(id) && id.length > 0 && id.length < 9) return id.padStart(9, "0");
  return id;
}

export function relateCaliforniaHistoricalIdToDownload(
  historicalId: string,
  downloadIds: ReadonlySet<string>,
): CaliforniaHistoricalVsDownloadRelation {
  const id = text(historicalId);
  if (downloadIds.has(id)) return "exact";
  const padded = padCaliforniaFacilityNumberCandidate(id);
  if (padded !== id && downloadIds.has(padded)) return "leading-zero-representation";
  return "historical-only";
}

export type CaliforniaTransparencyDownloadComparison = {
  historicalRows: number;
  downloadRows: number;
  exactMatches: number;
  leadingZeroRepresentationMatches: number;
  historicalOnly: number;
  downloadOnly: number;
  statusConflictsOnExactMatches: number;
  licensedToNonLicensedOnExactMatches: number;
};

export function compareCaliforniaHistoricalToTransparencyDownload(
  historical: readonly { facilityNumber: string; facilityStatus: string }[],
  download: readonly CaliforniaTransparencyDownloadRow[],
): CaliforniaTransparencyDownloadComparison {
  const downloadById = new Map(
    download.map(row => [row.facilityNumber, row] as const),
  );
  const downloadIds = new Set(downloadById.keys());
  const historicalIds = historical.map(row => text(row.facilityNumber));
  const historicalSet = new Set(historicalIds);

  let exactMatches = 0;
  let leadingZeroRepresentationMatches = 0;
  let historicalOnly = 0;
  let statusConflictsOnExactMatches = 0;
  let licensedToNonLicensedOnExactMatches = 0;

  const matchedDownloadIds = new Set<string>();
  for (const row of historical) {
    const id = text(row.facilityNumber);
    const relation = relateCaliforniaHistoricalIdToDownload(id, downloadIds);
    if (relation === "exact") {
      exactMatches += 1;
      matchedDownloadIds.add(id);
      const downloadRow = downloadById.get(id);
      const histStatus = text(row.facilityStatus).toUpperCase();
      const dlStatus = text(downloadRow?.facilityStatus).toUpperCase();
      if (histStatus !== dlStatus) {
        statusConflictsOnExactMatches += 1;
        if (histStatus === "LICENSED" && dlStatus !== "LICENSED") {
          licensedToNonLicensedOnExactMatches += 1;
        }
      }
    } else if (relation === "leading-zero-representation") {
      leadingZeroRepresentationMatches += 1;
      matchedDownloadIds.add(padCaliforniaFacilityNumberCandidate(id));
    } else {
      historicalOnly += 1;
    }
  }

  let downloadOnly = 0;
  for (const id of downloadIds) {
    if (historicalSet.has(id) || matchedDownloadIds.has(id)) continue;
    // A padded historical id may have matched this download id already.
    const collapsed = id.replace(/^0+/, "") || "0";
    const histHadCollapsed = [...historicalSet].some(histId => {
      if (histId === id) return true;
      return padCaliforniaFacilityNumberCandidate(histId) === id
        || ((histId.replace(/^0+/, "") || "0") === collapsed && histId !== id);
    });
    if (histHadCollapsed) continue;
    downloadOnly += 1;
  }

  return {
    historicalRows: historical.length,
    downloadRows: download.length,
    exactMatches,
    leadingZeroRepresentationMatches,
    historicalOnly,
    downloadOnly,
    statusConflictsOnExactMatches,
    licensedToNonLicensedOnExactMatches,
  };
}

export type CaliforniaTransparencyDownloadEvidence = {
  filenameDate: CaliforniaTransparencyDownloadFilenameDate;
  adoptedExportDate: null;
  roster: CaliforniaTransparencyDownloadRosterSummary;
  publication: "unpublished";
  ownerClaimEligible: false;
  gate: typeof CALIFORNIA_TRANSPARENCY_DOWNLOAD_PUBLICATION_GATE;
  provenance: typeof CALIFORNIA_TRANSPARENCY_DOWNLOAD_PROVENANCE;
};

export function buildCaliforniaTransparencyDownloadEvidence(input: {
  file: CaliforniaTransparencyDownloadFile;
  contentDispositionOrFilename: string | null | undefined;
  rows: readonly CaliforniaTransparencyDownloadRow[];
}): CaliforniaTransparencyDownloadEvidence {
  const filenameDate = parseCaliforniaTransparencyDownloadFilenameDate(
    input.contentDispositionOrFilename,
  );
  return {
    filenameDate,
    adoptedExportDate: adoptCaliforniaTransparencyDownloadExportDate(filenameDate),
    roster: summarizeCaliforniaTransparencyDownloadRoster(input.file, input.rows),
    publication: "unpublished",
    ownerClaimEligible: false,
    gate: CALIFORNIA_TRANSPARENCY_DOWNLOAD_PUBLICATION_GATE,
    provenance: CALIFORNIA_TRANSPARENCY_DOWNLOAD_PROVENANCE,
  };
}
