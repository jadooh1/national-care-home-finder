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
  statusConflicts: null;
  currentLicenseStatusVerified: false;
  publication: "unpublished";
  ownerClaimEligible: false;
};
function normalizeHistorical(value: string): string | null {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? trimmed : null;
}
function normalizeGis(value: string | number | null): string | null {
  if (typeof value === "number") return Number.isSafeInteger(value) && value >= 0 ? String(value) : null;
  if (typeof value !== "string") return null;
  return normalizeHistorical(value);
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
  const lat = Number(latitude), lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
    && lat !== 0 && lon !== 0 ? "valid" : "invalid";
}
export function reconcileCaliforniaCclGis(
  historical: readonly CaliforniaCclHistoricalRow[],
  gis: readonly CaliforniaCclGisRow[],
): CaliforniaCclReconciliation {
  const historicalIds = historical.map(row => normalizeHistorical(row.facility_number)).filter((id): id is string => id !== null);
  const gisIds = gis.map(row => normalizeGis(row.FAC_NBR)).filter((id): id is string => id !== null);
  const historicalSet = new Set(historicalIds), gisSet = new Set(gisIds);
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
    statusConflicts: null,
    currentLicenseStatusVerified: false,
    publication: "unpublished",
    ownerClaimEligible: false,
  };
}
