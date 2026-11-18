export const WASHINGTON_COORDINATE_BOUNDS = {
  latitude: [45, 50],
  longitude: [-125, -116],
} as const;

export const OREGON_COORDINATE_BOUNDS = {
  latitude: [41.99, 46.3],
  longitude: [-124.7, -116.46],
} as const;

const SOURCE_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type RefreshState = "Washington" | "Oregon";
export type CoordinateStatus = "absent" | "invalid" | "valid";

export type RefreshAuditRecord = {
  state: RefreshState;
  retrievedOn: string | null;
  sourceRows: number;
  duplicateIds: readonly string[];
  coordinateStatus: CoordinateStatus;
  mapReady: boolean;
  refreshReady: false;
  written: false;
};

const BOUNDS = {
  Washington: WASHINGTON_COORDINATE_BOUNDS,
  Oregon: OREGON_COORDINATE_BOUNDS,
} as const;

export function verifiedSourceDate(recorded: string | null, offered: string | null): string | null {
  if (recorded == null || offered !== recorded || !SOURCE_DATE.test(recorded)) return null;
  return recorded;
}

export function duplicateSourceIds(sourceIds: readonly string[]): string[] {
  const counts = new Map<string, number>();
  for (const sourceId of sourceIds) counts.set(sourceId, (counts.get(sourceId) ?? 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([sourceId]) => sourceId).sort();
}

export function headerHasOfficialCoordinates(header: readonly string[]): boolean {
  return header.includes("Latitude") && header.includes("Longitude");
}

export function classifyCoordinate(
  state: RefreshState,
  latitude: string | null | undefined,
  longitude: string | null | undefined,
): CoordinateStatus {
  const latitudeText = (latitude ?? "").trim();
  const longitudeText = (longitude ?? "").trim();
  if (!latitudeText && !longitudeText) return "absent";
  if (!/^-?\d+(?:\.\d+)?$/.test(latitudeText) || !/^-?\d+(?:\.\d+)?$/.test(longitudeText)) return "invalid";
  const latitudeValue = Number(latitudeText);
  const longitudeValue = Number(longitudeText);
  const bounds = BOUNDS[state];
  if (
    latitudeValue < bounds.latitude[0]
    || latitudeValue > bounds.latitude[1]
    || longitudeValue < bounds.longitude[0]
    || longitudeValue > bounds.longitude[1]
  ) return "invalid";
  return "valid";
}

export function assessStateRefresh(input: {
  state: RefreshState;
  recordedRetrievedOn: string | null;
  offeredRetrievedOn: string | null;
  header: readonly string[];
  sourceIds: readonly string[];
  coordinates: readonly { latitude: string | null; longitude: string | null }[];
}): RefreshAuditRecord {
  const retrievedOn = verifiedSourceDate(input.recordedRetrievedOn, input.offeredRetrievedOn);
  const duplicateIds = duplicateSourceIds(input.sourceIds);
  const officialColumns = headerHasOfficialCoordinates(input.header);
  let coordinateStatus: CoordinateStatus = "absent";
  if (officialColumns) {
    const statuses = input.coordinates.map(point => classifyCoordinate(input.state, point.latitude, point.longitude));
    if (statuses.length > 0 && statuses.every(status => status === "valid")) coordinateStatus = "valid";
    else if (statuses.some(status => status !== "absent")) coordinateStatus = "invalid";
  }
  return {
    state: input.state,
    retrievedOn,
    sourceRows: input.sourceIds.length,
    duplicateIds,
    coordinateStatus,
    mapReady: officialColumns && coordinateStatus === "valid" && duplicateIds.length === 0 && retrievedOn != null,
    refreshReady: false,
    written: false,
  };
}
