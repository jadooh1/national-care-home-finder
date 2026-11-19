/**
 * California Phase 4 — full licensing-data reconciliation (read-only).
 * Compares Transparency DownloadStateData against historical CHHS, ArcGIS,
 * and bounded FacilityDetail samples. Does not publish California.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE4_OBSERVED_ON = "2026-11-19";

export const CALIFORNIA_PHASE4_DOWNLOAD_PAGE =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?rewrite=downloaddata";
export const CALIFORNIA_PHASE4_DOWNLOAD_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData";
export const CALIFORNIA_PHASE4_DOWNLOAD_IDS = {
  rcfe: "ResidentialElderCareFacility",
  arf: "AdultResidentialFacilities",
} as const;

export const CALIFORNIA_PHASE4_CHHS = {
  packageUrl: "https://data.chhs.ca.gov/dataset/ccl-facilities",
  packageId: "46ffcbdf-4874-4cc1-92c2-fb715e3ad014",
  temporalCoverage: "Data as of 05252025",
  packageMetadataModified: "2025-11-06T23:26:08.051889",
  rcfeResourceId: "744d1583-f9eb-45b6-b0f8-b9a9dab936a6",
  arfResourceId: "9f5d1d00-6b24-4f44-a158-9cbe4b43f117",
  /** Observed raw file_date text in both historical CSVs on Phase 4. Not an ISO export date. */
  rawFileDate: "05252025",
  authoritativeIsoExportDate: null,
} as const;

export const CALIFORNIA_PHASE4_ARCGIS = {
  layerUrl:
    "https://services.arcgis.com/XLPEppdz2H9dOiqp/arcgis/rest/services/CDSS_CCL_Facilities/FeatureServer/0",
  statusDomainDocumented: false,
  statusCodesAccepted: false,
  integerFacNbrTruncatesLeadingZeros: true,
} as const;

/** Observed DownloadStateData attachment hashes from Phase 4 (same as Phase 3). */
export const CALIFORNIA_PHASE4_DOWNLOAD_OBSERVED = {
  rcfe: {
    filename: "ResidentialElderCareFacility11152026.csv",
    rowCount: 13337,
    bytes: 8635782,
    sha256: "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
    filenameIsoCandidate: "2026-11-15",
  },
  arf: {
    filename: "AdultResidentialFacilities11152026.csv",
    rowCount: 11040,
    bytes: 5434124,
    sha256: "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
    filenameIsoCandidate: "2026-11-15",
  },
  authoritativeIsoExportDate: null,
} as const;

export const CALIFORNIA_PHASE4_RCFE_PUBLISHABLE_TYPES = [
  "RESIDENTIAL CARE ELDERLY",
  "RCFE-CONTINUING CARE RETIREMENT COMMUNITY",
] as const;

export const CALIFORNIA_PHASE4_ARF_PUBLISHABLE_TYPES = [
  "ADULT RESIDENTIAL",
  "ENHANCED BEHAVIORAL SUPPORTS HOME - ARF",
  "ADULT RESIDENTIAL FACILITY FOR PERSONS WITH SPECIAL HEALTH CARE NEEDS",
  "COMMUNITY CRISIS HOME - ARF",
] as const;

export const CALIFORNIA_PHASE4_GIS_RCFE_TYPE_PREFIXES = [
  "RESIDENTIAL-ELDERLY",
  "RESIDENTIAL ELDERLY-",
] as const;

export const CALIFORNIA_PHASE4_GIS_ARF_TYPE_PREFIXES = [
  "ADULT RESIDENTIAL",
  "ARF-ENHANCED BEHAVIO",
  "ARFPSHN",
  "COMMUNITY CRISIS HOM",
] as const;

export const CALIFORNIA_PHASE4_PROVENANCE = {
  downloadPage: CALIFORNIA_PHASE4_DOWNLOAD_PAGE,
  downloadApi: CALIFORNIA_PHASE4_DOWNLOAD_API,
  downloadIds: CALIFORNIA_PHASE4_DOWNLOAD_IDS,
  chhs: CALIFORNIA_PHASE4_CHHS,
  arcgis: CALIFORNIA_PHASE4_ARCGIS,
  limitations: [
    "DownloadStateData filename MMDDYYYY stamps are not authoritative ISO export dates.",
    "Download CLOSED is coarser than FacilityDetail Closed* subtypes; Application Withdrawn conflicts.",
    "Historical CHHS file_date text (05252025) is not an ISO export date.",
    "ArcGIS integer FAC_NBR truncates leading zeros; STATUS integers remain undocumented.",
    "Download CSVs have no capacity or coordinate columns; capacity/coords must come from another verified source.",
    "ARF DownloadStateData includes non-residential categories (for example ADULT DAY PROGRAM).",
    "Sample FacilityDetail verification cannot approve roster-wide publication.",
    "California remains unpublished; owner claims stay ineligible.",
  ],
} as const;

export type CaliforniaPhase4File = "RCFE" | "ARF";

export type CaliforniaPhase4DownloadRow = {
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

export type CaliforniaPhase4HistoricalRow = {
  facilityNumber: string;
  facilityStatus: string;
  facilityType?: string;
  facilityAddress?: string;
  facilityCity?: string;
  facilityZip?: string;
  facilityCapacity?: string | number | null;
};

export type CaliforniaPhase4GisRow = {
  FAC_NBR: string | number | null;
  STATUS: number | null;
  FAC_TYPE_DESC: string | null;
  FAC_LATITUDE: string | null;
  FAC_LONGITUDE: string | null;
  CAPACITY?: number | null;
  RES_STREET_ADDR?: string | null;
  PROGRAM_TYPE?: string | null;
};

export type CaliforniaPhase4DownloadVsFacilityDetailRelation =
  | "match"
  | "conflict"
  | "missing-live"
  | "invalid-download-id";

export type CaliforniaPhase4AddressAnomalySummary = {
  exactIdDenominator: number;
  addressDifferences: number;
  cityDifferences: number;
  zipDifferences: number;
};

export type CaliforniaPhase4CapacityAnomalySummary = {
  comparedDenominator: number;
  capacityDifferences: number;
  historicalMissingFromGis: number;
  downloadHasCapacityColumn: false;
};

export type CaliforniaPhase4CategorySummary = {
  file: CaliforniaPhase4File;
  rowCount: number;
  publishableTypeRows: number;
  otherTypeRows: number;
  otherTypeCounts: Record<string, number>;
  blankTypeRows: number;
};

export type CaliforniaPhase4DownloadIntegrity = {
  file: CaliforniaPhase4File;
  rowCount: number;
  distinctFacilityNumbers: number;
  duplicateFacilityNumbers: string[];
  invalidFacilityNumbers: string[];
  leadingZeroFacilityNumbers: number;
  statusCounts: Record<string, number>;
  blankAddressRows: number;
  blankCityRows: number;
  blankZipRows: number;
  blankNameRows: number;
  zipEqualsFacilityNumberRows: number;
};

export type CaliforniaPhase4HistoricalComparison = {
  historicalRows: number;
  downloadRows: number;
  exactMatches: number;
  leadingZeroRepresentationMatches: number;
  historicalOnly: number;
  downloadOnly: number;
  statusConflictsOnExactMatches: number;
  licensedToNonLicensedOnExactMatches: number;
};

export type CaliforniaPhase4DownloadVsGis = {
  file: CaliforniaPhase4File;
  downloadDistinctIds: number;
  gisCategoryRows: number;
  gisDistinctIds: number;
  exactIdMatches: number;
  leadingZeroRepresentationMismatches: number;
  downloadMissingEvenCollapsed: number;
  downloadUnmatchedExact: number;
  duplicateGisIds: string[];
  invalidGisIdentifiers: number;
  validCoordinates: number;
  missingCoordinates: number;
  invalidCoordinates: number;
  blankStreetAddress: number;
  capacityPresent: number;
  capacityMissing: number;
};

export type CaliforniaPhase4FileReconciliation = {
  file: CaliforniaPhase4File;
  download: CaliforniaPhase4DownloadIntegrity;
  historicalComparison: CaliforniaPhase4HistoricalComparison;
  addressAnomalies: CaliforniaPhase4AddressAnomalySummary;
  capacityAnomalies: CaliforniaPhase4CapacityAnomalySummary;
  category: CaliforniaPhase4CategorySummary;
  vsGis: CaliforniaPhase4DownloadVsGis;
};

export type CaliforniaPhase4PublicationBlocker = {
  id: string;
  severity: "blocking";
  summary: string;
};

export const CALIFORNIA_PHASE4_PUBLICATION_BLOCKERS: readonly CaliforniaPhase4PublicationBlocker[] = [
  {
    id: "no-authoritative-iso-export-date",
    severity: "blocking",
    summary:
      "Neither DownloadStateData filename stamps nor CHHS file_date text is an authoritative ISO export date.",
  },
  {
    id: "roster-wide-current-status-unverified",
    severity: "blocking",
    summary:
      "FacilityDetail verification remains sample-bounded; roster-wide current status is not verified.",
  },
  {
    id: "closed-status-mapping-gaps",
    severity: "blocking",
    summary:
      "Download CLOSED can map to FacilityDetail Application Withdrawn; subtype mapping is unresolved.",
  },
  {
    id: "arf-category-gating-required",
    severity: "blocking",
    summary:
      "ARF DownloadStateData includes non-residential types (ADULT DAY PROGRAM, SOCIAL REHABILITATION FACILITY, and others).",
  },
  {
    id: "invalid-identifier-rejection",
    severity: "blocking",
    summary: "Invalid facility numbers such as 95354 must be rejected before any publication candidate set.",
  },
  {
    id: "capacity-and-coordinates-not-in-download",
    severity: "blocking",
    summary:
      "DownloadStateData has no capacity or coordinate columns; a verified alternate source is still required.",
  },
  {
    id: "arcgis-leading-zero-and-status-domain",
    severity: "blocking",
    summary:
      "ArcGIS FAC_NBR truncates leading zeros and STATUS integers remain undocumented; GIS is not the preferred current roster.",
  },
  {
    id: "sample-insufficient-for-publication",
    severity: "blocking",
    summary: "Stratified FacilityDetail samples cannot approve California publication.",
  },
] as const;

export const CALIFORNIA_PHASE4_PUBLICATION_GATE = {
  reliableSourceAndDate: false,
  verifiedCurrentStatusRosterWide: false,
  uniqueValidIdentifiers: false,
  correctRcfeArfCategories: false,
  reliableAddressesAndCapacity: false,
  verifiedDisclosureLinks: false,
  noWashingtonOregonRegressionsRequired: true,
  sampleVerificationSufficient: false,
  publication: "unpublished" as const,
  ownerClaimEligible: false,
  blockers: CALIFORNIA_PHASE4_PUBLICATION_BLOCKERS,
} as const;

const FACILITY_NUMBER = /^\d{8,9}$/;

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

function collapseFacilityNumber(value: string): string {
  return value.replace(/^0+/, "") || "0";
}

export function isCaliforniaPhase4FacilityNumber(value: string): boolean {
  return FACILITY_NUMBER.test(text(value));
}

export function padCaliforniaPhase4FacilityNumber(value: string): string {
  const id = text(value);
  if (/^\d+$/.test(id) && id.length > 0 && id.length < 9) return id.padStart(9, "0");
  return id;
}

function normalizeGisLicense(value: string | number | null): string | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? String(value) : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? trimmed : null;
}

function classifyGisFacilityType(
  facTypeDesc: string | null | undefined,
): "rcfe-like" | "arf-like" | "other" {
  const trimmed = (facTypeDesc ?? "").trim();
  if (CALIFORNIA_PHASE4_GIS_RCFE_TYPE_PREFIXES.some(prefix => trimmed.startsWith(prefix))) {
    return "rcfe-like";
  }
  if (CALIFORNIA_PHASE4_GIS_ARF_TYPE_PREFIXES.some(prefix => trimmed.startsWith(prefix))) {
    return "arf-like";
  }
  return "other";
}

function publishableTypesFor(file: CaliforniaPhase4File): readonly string[] {
  return file === "RCFE"
    ? CALIFORNIA_PHASE4_RCFE_PUBLISHABLE_TYPES
    : CALIFORNIA_PHASE4_ARF_PUBLISHABLE_TYPES;
}

export function summarizeCaliforniaPhase4DownloadIntegrity(
  file: CaliforniaPhase4File,
  rows: readonly CaliforniaPhase4DownloadRow[],
): CaliforniaPhase4DownloadIntegrity {
  const ids = rows.map(row => row.facilityNumber);
  const invalidFacilityNumbers = [...new Set(
    ids.filter(id => id !== "" && !isCaliforniaPhase4FacilityNumber(id)),
  )].sort();
  return {
    file,
    rowCount: rows.length,
    distinctFacilityNumbers: new Set(ids.filter(Boolean)).size,
    duplicateFacilityNumbers: duplicateIds(ids),
    invalidFacilityNumbers,
    leadingZeroFacilityNumbers: ids.filter(id => id.startsWith("0")).length,
    statusCounts: countBy(rows.map(row => row.facilityStatus || "(blank)")),
    blankAddressRows: rows.filter(row => row.facilityAddress === "").length,
    blankCityRows: rows.filter(row => row.facilityCity === "").length,
    blankZipRows: rows.filter(row => row.facilityZip === "").length,
    blankNameRows: rows.filter(row => row.facilityName === "").length,
    zipEqualsFacilityNumberRows: rows.filter(
      row => row.facilityNumber !== "" && row.facilityNumber === row.facilityZip,
    ).length,
  };
}

export function summarizeCaliforniaPhase4Category(
  file: CaliforniaPhase4File,
  rows: readonly CaliforniaPhase4DownloadRow[],
): CaliforniaPhase4CategorySummary {
  const allowed = new Set(publishableTypesFor(file));
  const otherTypeCounts: Record<string, number> = {};
  let publishableTypeRows = 0;
  let otherTypeRows = 0;
  let blankTypeRows = 0;
  for (const row of rows) {
    const type = text(row.facilityType) || "(blank)";
    if (type === "(blank)") blankTypeRows += 1;
    if (allowed.has(type)) {
      publishableTypeRows += 1;
    } else {
      otherTypeRows += 1;
      otherTypeCounts[type] = (otherTypeCounts[type] ?? 0) + 1;
    }
  }
  return {
    file,
    rowCount: rows.length,
    publishableTypeRows,
    otherTypeRows,
    otherTypeCounts,
    blankTypeRows,
  };
}

export function compareCaliforniaPhase4HistoricalToDownload(
  historical: readonly { facilityNumber: string; facilityStatus: string }[],
  download: readonly CaliforniaPhase4DownloadRow[],
): CaliforniaPhase4HistoricalComparison {
  const downloadById = new Map(download.map(row => [row.facilityNumber, row] as const));
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
    if (downloadIds.has(id)) {
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
      continue;
    }
    const padded = padCaliforniaPhase4FacilityNumber(id);
    if (padded !== id && downloadIds.has(padded)) {
      leadingZeroRepresentationMatches += 1;
      matchedDownloadIds.add(padded);
      continue;
    }
    historicalOnly += 1;
  }

  let downloadOnly = 0;
  for (const id of downloadIds) {
    if (historicalSet.has(id) || matchedDownloadIds.has(id)) continue;
    const collapsed = collapseFacilityNumber(id);
    const histHadCollapsed = [...historicalSet].some(histId => {
      if (histId === id) return true;
      return padCaliforniaPhase4FacilityNumber(histId) === id
        || ((collapseFacilityNumber(histId) === collapsed) && histId !== id);
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

export function compareCaliforniaPhase4Addresses(
  historical: readonly CaliforniaPhase4HistoricalRow[],
  download: readonly CaliforniaPhase4DownloadRow[],
): CaliforniaPhase4AddressAnomalySummary {
  const downloadById = new Map(download.map(row => [row.facilityNumber, row] as const));
  let exactIdDenominator = 0;
  let addressDifferences = 0;
  let cityDifferences = 0;
  let zipDifferences = 0;
  for (const row of historical) {
    const id = text(row.facilityNumber);
    const downloadRow = downloadById.get(id);
    if (!downloadRow) continue;
    exactIdDenominator += 1;
    if (text(row.facilityAddress).toUpperCase() !== downloadRow.facilityAddress.toUpperCase()) {
      addressDifferences += 1;
    }
    if (text(row.facilityCity).toUpperCase() !== downloadRow.facilityCity.toUpperCase()) {
      cityDifferences += 1;
    }
    if (text(row.facilityZip) !== downloadRow.facilityZip) {
      zipDifferences += 1;
    }
  }
  return { exactIdDenominator, addressDifferences, cityDifferences, zipDifferences };
}

function capacityNumber(value: string | number | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const raw = text(String(value ?? ""));
  if (!raw || !/^\d+$/.test(raw)) return null;
  return Number(raw);
}

function coordinateQuality(row: CaliforniaPhase4GisRow): "missing" | "invalid" | "valid" {
  const latitude = row.FAC_LATITUDE?.trim() ?? "";
  const longitude = row.FAC_LONGITUDE?.trim() ?? "";
  if (!latitude || !longitude) return "missing";
  const lat = Number(latitude);
  const lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
    && lat !== 0 && lon !== 0
    ? "valid"
    : "invalid";
}

export function compareCaliforniaPhase4Capacity(
  historical: readonly CaliforniaPhase4HistoricalRow[],
  gis: readonly CaliforniaPhase4GisRow[],
): CaliforniaPhase4CapacityAnomalySummary {
  const gisById = new Map<string, CaliforniaPhase4GisRow>();
  for (const row of gis) {
    const id = normalizeGisLicense(row.FAC_NBR);
    if (!id) continue;
    gisById.set(id, row);
    const padded = padCaliforniaPhase4FacilityNumber(id);
    if (padded !== id) gisById.set(padded, row);
  }
  let comparedDenominator = 0;
  let capacityDifferences = 0;
  let historicalMissingFromGis = 0;
  for (const row of historical) {
    const id = text(row.facilityNumber);
    const gisRow = gisById.get(id) ?? gisById.get(collapseFacilityNumber(id));
    if (!gisRow) {
      historicalMissingFromGis += 1;
      continue;
    }
    const historicalCapacity = capacityNumber(row.facilityCapacity);
    const gisCapacity = capacityNumber(gisRow.CAPACITY ?? null);
    if (historicalCapacity == null || gisCapacity == null) continue;
    comparedDenominator += 1;
    if (historicalCapacity !== gisCapacity) capacityDifferences += 1;
  }
  return {
    comparedDenominator,
    capacityDifferences,
    historicalMissingFromGis,
    downloadHasCapacityColumn: false,
  };
}

export function compareCaliforniaPhase4DownloadToGis(
  file: CaliforniaPhase4File,
  download: readonly CaliforniaPhase4DownloadRow[],
  gis: readonly CaliforniaPhase4GisRow[],
): CaliforniaPhase4DownloadVsGis {
  const wanted = file === "RCFE" ? "rcfe-like" : "arf-like";
  const gisCategory = gis.filter(row => classifyGisFacilityType(row.FAC_TYPE_DESC) === wanted);
  const downloadIds = new Set(download.map(row => row.facilityNumber).filter(Boolean));
  const gisIds = gisCategory
    .map(row => normalizeGisLicense(row.FAC_NBR))
    .filter((id): id is string => id !== null);
  const gisSet = new Set(gisIds);
  let exactIdMatches = 0;
  let leadingZeroRepresentationMismatches = 0;
  let downloadMissingEvenCollapsed = 0;
  let downloadUnmatchedExact = 0;
  for (const id of downloadIds) {
    if (gisSet.has(id)) {
      exactIdMatches += 1;
      continue;
    }
    downloadUnmatchedExact += 1;
    const collapsed = collapseFacilityNumber(id);
    if (gisSet.has(collapsed) && id !== collapsed) {
      leadingZeroRepresentationMismatches += 1;
    } else {
      downloadMissingEvenCollapsed += 1;
    }
  }
  const coords = { valid: 0, missing: 0, invalid: 0 };
  let blankStreetAddress = 0;
  let capacityPresent = 0;
  let capacityMissing = 0;
  for (const row of gisCategory) {
    coords[coordinateQuality(row)] += 1;
    if (!(row.RES_STREET_ADDR ?? "").trim()) blankStreetAddress += 1;
    if (row.CAPACITY == null) capacityMissing += 1;
    else capacityPresent += 1;
  }
  return {
    file,
    downloadDistinctIds: downloadIds.size,
    gisCategoryRows: gisCategory.length,
    gisDistinctIds: gisSet.size,
    exactIdMatches,
    leadingZeroRepresentationMismatches,
    downloadMissingEvenCollapsed,
    downloadUnmatchedExact,
    duplicateGisIds: duplicateIds(gisIds),
    invalidGisIdentifiers: gisCategory.length - gisIds.length,
    validCoordinates: coords.valid,
    missingCoordinates: coords.missing,
    invalidCoordinates: coords.invalid,
    blankStreetAddress,
    capacityPresent,
    capacityMissing,
  };
}

export function reconcileCaliforniaPhase4File(input: {
  file: CaliforniaPhase4File;
  download: readonly CaliforniaPhase4DownloadRow[];
  historical: readonly CaliforniaPhase4HistoricalRow[];
  gis: readonly CaliforniaPhase4GisRow[];
}): CaliforniaPhase4FileReconciliation {
  return {
    file: input.file,
    download: summarizeCaliforniaPhase4DownloadIntegrity(input.file, input.download),
    historicalComparison: compareCaliforniaPhase4HistoricalToDownload(
      input.historical.map(row => ({
        facilityNumber: row.facilityNumber,
        facilityStatus: row.facilityStatus,
      })),
      input.download,
    ),
    addressAnomalies: compareCaliforniaPhase4Addresses(input.historical, input.download),
    capacityAnomalies: compareCaliforniaPhase4Capacity(input.historical, input.gis),
    category: summarizeCaliforniaPhase4Category(input.file, input.download),
    vsGis: compareCaliforniaPhase4DownloadToGis(input.file, input.download, input.gis),
  };
}

export type CaliforniaPhase4CrossFileIntegrity = {
  rcfeArfFacilityNumberOverlap: string[];
  rcfeInvalidFacilityNumbers: string[];
  arfInvalidFacilityNumbers: string[];
  rcfeDuplicateFacilityNumbers: string[];
  arfDuplicateFacilityNumbers: string[];
};

export function summarizeCaliforniaPhase4CrossFileIntegrity(
  rcfe: readonly CaliforniaPhase4DownloadRow[],
  arf: readonly CaliforniaPhase4DownloadRow[],
): CaliforniaPhase4CrossFileIntegrity {
  const rcfeIds = rcfe.map(row => row.facilityNumber).filter(Boolean);
  const arfIds = arf.map(row => row.facilityNumber).filter(Boolean);
  const arfSet = new Set(arfIds);
  return {
    rcfeArfFacilityNumberOverlap: [...new Set(rcfeIds.filter(id => arfSet.has(id)))].sort(),
    rcfeInvalidFacilityNumbers: [...new Set(
      rcfeIds.filter(id => !isCaliforniaPhase4FacilityNumber(id)),
    )].sort(),
    arfInvalidFacilityNumbers: [...new Set(
      arfIds.filter(id => !isCaliforniaPhase4FacilityNumber(id)),
    )].sort(),
    rcfeDuplicateFacilityNumbers: duplicateIds(rcfeIds),
    arfDuplicateFacilityNumbers: duplicateIds(arfIds),
  };
}

export type CaliforniaPhase4FacilityDetailSampleRow = {
  facilityNumber: string;
  file: CaliforniaPhase4File;
  downloadStatus: string;
  stratum: string;
  relation: CaliforniaPhase4DownloadVsFacilityDetailRelation;
  liveStatus?: string | null;
};

export type CaliforniaPhase4FacilityDetailSampleSummary = {
  sampleSize: number;
  match: number;
  conflict: number;
  "missing-live": number;
  "invalid-download-id": number;
  sampleIsStatewideConclusion: false;
  publication: "unpublished";
  ownerClaimEligible: false;
};

export function relateCaliforniaPhase4DownloadToFacilityDetail(
  downloadStatus: string,
  liveStatus: string | null,
  options: { downloadFacilityNumber?: string } = {},
): CaliforniaPhase4DownloadVsFacilityDetailRelation {
  const downloadId = text(options.downloadFacilityNumber);
  if (downloadId && !isCaliforniaPhase4FacilityNumber(downloadId)) {
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

export function summarizeCaliforniaPhase4FacilityDetailSample(
  rows: readonly CaliforniaPhase4FacilityDetailSampleRow[],
): CaliforniaPhase4FacilityDetailSampleSummary {
  const counts = {
    match: 0,
    conflict: 0,
    "missing-live": 0,
    "invalid-download-id": 0,
  };
  for (const row of rows) {
    const relation = row.relation
      ?? relateCaliforniaPhase4DownloadToFacilityDetail(
        row.downloadStatus,
        row.liveStatus ?? null,
        { downloadFacilityNumber: row.facilityNumber },
      );
    counts[relation] += 1;
  }
  return {
    sampleSize: rows.length,
    ...counts,
    sampleIsStatewideConclusion: false,
    publication: "unpublished",
    ownerClaimEligible: false,
  };
}

export type CaliforniaPhase4Evidence = {
  observedOn: string;
  provenance: typeof CALIFORNIA_PHASE4_PROVENANCE;
  downloadObserved: typeof CALIFORNIA_PHASE4_DOWNLOAD_OBSERVED;
  filenameDatesAdopted: null;
  crossFile: CaliforniaPhase4CrossFileIntegrity;
  rcfe: CaliforniaPhase4FileReconciliation;
  arf: CaliforniaPhase4FileReconciliation;
  facilityDetailSample: CaliforniaPhase4FacilityDetailSampleSummary;
  gate: typeof CALIFORNIA_PHASE4_PUBLICATION_GATE;
  publication: "unpublished";
  ownerClaimEligible: false;
  gisTypePrefixes: {
    rcfe: typeof CALIFORNIA_PHASE4_GIS_RCFE_TYPE_PREFIXES;
    arf: typeof CALIFORNIA_PHASE4_GIS_ARF_TYPE_PREFIXES;
  };
};

export function buildCaliforniaPhase4Evidence(input: {
  observedOn?: string;
  rcfeDownload: readonly CaliforniaPhase4DownloadRow[];
  arfDownload: readonly CaliforniaPhase4DownloadRow[];
  rcfeHistorical: readonly CaliforniaPhase4HistoricalRow[];
  arfHistorical: readonly CaliforniaPhase4HistoricalRow[];
  gis: readonly CaliforniaPhase4GisRow[];
  facilityDetailSample: readonly CaliforniaPhase4FacilityDetailSampleRow[];
}): CaliforniaPhase4Evidence {
  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE4_OBSERVED_ON,
    provenance: CALIFORNIA_PHASE4_PROVENANCE,
    downloadObserved: CALIFORNIA_PHASE4_DOWNLOAD_OBSERVED,
    filenameDatesAdopted: null,
    crossFile: summarizeCaliforniaPhase4CrossFileIntegrity(
      input.rcfeDownload,
      input.arfDownload,
    ),
    rcfe: reconcileCaliforniaPhase4File({
      file: "RCFE",
      download: input.rcfeDownload,
      historical: input.rcfeHistorical,
      gis: input.gis,
    }),
    arf: reconcileCaliforniaPhase4File({
      file: "ARF",
      download: input.arfDownload,
      historical: input.arfHistorical,
      gis: input.gis,
    }),
    facilityDetailSample: summarizeCaliforniaPhase4FacilityDetailSample(
      input.facilityDetailSample,
    ),
    gate: CALIFORNIA_PHASE4_PUBLICATION_GATE,
    publication: "unpublished",
    ownerClaimEligible: false,
    gisTypePrefixes: {
      rcfe: CALIFORNIA_PHASE4_GIS_RCFE_TYPE_PREFIXES,
      arf: CALIFORNIA_PHASE4_GIS_ARF_TYPE_PREFIXES,
    },
  };
}

export function californiaPhase4AllowsPublication(
  evidence: Pick<CaliforniaPhase4Evidence, "gate" | "facilityDetailSample" | "publication">,
): false {
  void evidence;
  return false;
}
