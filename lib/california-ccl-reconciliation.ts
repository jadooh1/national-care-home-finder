/** Pure, read-only comparison of historic California CCL rows and GIS layer rows. */

export type CaliforniaCclHistoricalRow = {
  facility_number: string;
  facility_status: string;
};

export type CaliforniaCclGisRow = {
  FAC_NBR: string | number | null;
  STATUS: number | null;
  FAC_TYPE_DESC: string | null;
  FAC_LATITUDE: string | null;
  FAC_LONGITUDE: string | null;
  PROGRAM_TYPE?: string | null;
};

export type CaliforniaCclReconciliation = {
  historicalRows: number;
  gisRows: number;
  historicalDistinctLicenses: number;
  gisDistinctLicenses: number;
  matchedLicenses: number;
  missingFromGis: string[];
  gisOnly: string[];
  duplicateHistorical: string[];
  duplicateGis: string[];
  invalidGisIdentifiers: number;
  missingGisCoordinates: number;
  invalidGisCoordinates: number;
  /** Historical IDs absent as exact strings but present if ArcGIS integer truncation is collapsed. Not treated as matches. */
  leadingZeroRepresentationMismatches: string[];
  statusConflicts: null;
  currentLicenseStatusVerified: false;
  publication: "unpublished";
  ownerClaimEligible: false;
};

/** Observed ArcGIS FAC_TYPE_DESC prefixes for RCFE-like rows after trim. Truncation and trailing spaces remain in the source. */
export const CALIFORNIA_GIS_RCFE_TYPE_PREFIXES = [
  "RESIDENTIAL-ELDERLY",
  "RESIDENTIAL ELDERLY-",
] as const;

/** Observed ArcGIS FAC_TYPE_DESC prefixes for ARF-like rows after trim. Truncation and trailing spaces remain in the source. */
export const CALIFORNIA_GIS_ARF_TYPE_PREFIXES = [
  "ADULT RESIDENTIAL",
  "ARF-ENHANCED BEHAVIO",
  "ARFPSHN",
  "COMMUNITY CRISIS HOM",
] as const;

export function normalizeCaliforniaHistoricalLicense(value: string): string | null {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? trimmed : null;
}

export function normalizeCaliforniaGisLicense(value: string | number | null): string | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? String(value) : null;
  }
  if (typeof value !== "string") return null;
  return normalizeCaliforniaHistoricalLicense(value);
}

export function classifyCaliforniaGisFacilityType(
  facTypeDesc: string | null | undefined,
): "rcfe-like" | "arf-like" | "other" {
  const trimmed = (facTypeDesc ?? "").trim();
  if (CALIFORNIA_GIS_RCFE_TYPE_PREFIXES.some(prefix => trimmed.startsWith(prefix))) return "rcfe-like";
  if (CALIFORNIA_GIS_ARF_TYPE_PREFIXES.some(prefix => trimmed.startsWith(prefix))) return "arf-like";
  return "other";
}

function duplicateIds(values: readonly string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].filter(([, n]) => n > 1).map(([id]) => id).sort();
}

function coordinates(row: CaliforniaCclGisRow): "missing" | "invalid" | "valid" {
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

function leadingZeroMismatches(historicalSet: Set<string>, gisSet: Set<string>): string[] {
  const mismatches: string[] = [];
  for (const id of historicalSet) {
    if (gisSet.has(id) || !id.startsWith("0")) continue;
    const collapsed = id.replace(/^0+/, "") || "0";
    if (gisSet.has(collapsed)) mismatches.push(id);
  }
  return mismatches.sort();
}

export function reconcileCaliforniaCclGis(
  historical: readonly CaliforniaCclHistoricalRow[],
  gis: readonly CaliforniaCclGisRow[],
): CaliforniaCclReconciliation {
  const historicalIds = historical
    .map(row => normalizeCaliforniaHistoricalLicense(row.facility_number))
    .filter((id): id is string => id !== null);
  const gisIds = gis
    .map(row => normalizeCaliforniaGisLicense(row.FAC_NBR))
    .filter((id): id is string => id !== null);
  const historicalSet = new Set(historicalIds);
  const gisSet = new Set(gisIds);
  return {
    historicalRows: historical.length,
    gisRows: gis.length,
    historicalDistinctLicenses: historicalSet.size,
    gisDistinctLicenses: gisSet.size,
    matchedLicenses: [...historicalSet].filter(id => gisSet.has(id)).length,
    missingFromGis: [...historicalSet].filter(id => !gisSet.has(id)).sort(),
    gisOnly: [...gisSet].filter(id => !historicalSet.has(id)).sort(),
    duplicateHistorical: duplicateIds(historicalIds),
    duplicateGis: duplicateIds(gisIds),
    invalidGisIdentifiers: gis.length - gisIds.length,
    missingGisCoordinates: gis.filter(row => coordinates(row) === "missing").length,
    invalidGisCoordinates: gis.filter(row => coordinates(row) === "invalid").length,
    leadingZeroRepresentationMismatches: leadingZeroMismatches(historicalSet, gisSet),
    statusConflicts: null,
    currentLicenseStatusVerified: false,
    publication: "unpublished",
    ownerClaimEligible: false,
  };
}
