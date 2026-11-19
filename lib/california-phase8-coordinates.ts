/**
 * California Phase 8 — official ArcGIS coordinate matching (read-only).
 * Matches DownloadStateData facilities to CDSS CCL ArcGIS coordinates using
 * exact licensing IDs. Preserves leading zeros on download IDs; rejects
 * ambiguous matches. Never fabricates coordinates or uses unverified geocoding.
 */

export const CALIFORNIA_PHASE8_COORDINATES_OBSERVED_ON = "2026-11-19";

export const CALIFORNIA_PHASE8_ARCGIS_LAYER_URL =
  "https://services.arcgis.com/XLPEppdz2H9dOiqp/arcgis/rest/services/CDSS_CCL_Facilities/FeatureServer/0";

export type CaliforniaPhase8CoordinateMatchKind =
  | "exact"
  | "leading-zero-collapsed-unique"
  | "ambiguous-duplicate-gis"
  | "ambiguous-collapsed-collision"
  | "unmatched"
  | "invalid-download-id"
  | "gis-coords-missing"
  | "gis-coords-invalid";

export type CaliforniaPhase8GisCoordinateRow = {
  FAC_NBR: string | number | null;
  FAC_LATITUDE?: string | null;
  FAC_LONGITUDE?: string | null;
  FAC_TYPE_DESC?: string | null;
};

export type CaliforniaPhase8CoordinateCandidate = {
  facilityNumber: string;
  outcome: "active-candidate" | "restricted-candidate";
  file: "RCFE" | "ARF";
};

export type CaliforniaPhase8CoordinateMatch = {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  outcome: "active-candidate" | "restricted-candidate";
  matchKind: CaliforniaPhase8CoordinateMatchKind;
  gisLicenseId: string | null;
  latitude: string | null;
  longitude: string | null;
  coordinatesValid: boolean;
  /** Download leading zeros are preserved on facilityNumber; never rewritten. */
  leadingZerosPreserved: true;
  fabricated: false;
  geocoded: false;
};

export type CaliforniaPhase8CoordinateCoverage = {
  candidateCount: number;
  activeCandidateCount: number;
  restrictedCandidateCount: number;
  exactMatchWithValidCoords: number;
  leadingZeroCollapsedUniqueWithValidCoords: number;
  ambiguousRejected: number;
  unmatched: number;
  invalidDownloadIds: number;
  gisCoordsMissingOrInvalid: number;
  /** Exact-ID valid-coordinate coverage over all candidates. */
  exactValidCoverageRate: number;
  /**
   * Exact + unique leading-zero-collapsed valid coords. Leading-zero collapsed
   * matches are reported but are not treated as exact licensing-ID matches.
   */
  usableOfficialCoordsRate: number;
  fabricatedCoordinates: 0;
  unverifiedGeocodingUsed: 0;
};

function text(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value).trim();
}

function collapseFacilityNumber(value: string): string {
  const id = text(value);
  if (!/^\d+$/.test(id)) return id;
  return id.replace(/^0+/, "") || "0";
}

function normalizeGisLicense(value: string | number | null | undefined): string | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value >= 0 ? String(value) : null;
  }
  const id = text(value);
  return /^\d+$/.test(id) ? id : null;
}

export function assessCaliforniaPhase8GisCoordinates(
  latitude: string | null | undefined,
  longitude: string | null | undefined,
): "missing" | "invalid" | "valid" {
  const latRaw = text(latitude);
  const lonRaw = text(longitude);
  if (!latRaw || !lonRaw) return "missing";
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  return Number.isFinite(lat)
    && Number.isFinite(lon)
    && lat >= -90
    && lat <= 90
    && lon >= -180
    && lon <= 180
    && !(lat === 0 && lon === 0)
    ? "valid"
    : "invalid";
}

export function isCaliforniaPhase8LicensingId(value: string): boolean {
  return /^\d{8,9}$/.test(text(value));
}

type GisIndexEntry = {
  gisLicenseId: string;
  latitude: string | null;
  longitude: string | null;
  coordinateQuality: "missing" | "invalid" | "valid";
};

/**
 * Build an exact-ID GIS index. Duplicate FAC_NBR values mark the id ambiguous.
 */
export function indexCaliforniaPhase8GisCoordinates(
  gis: readonly CaliforniaPhase8GisCoordinateRow[],
): {
  byExactId: Map<string, GisIndexEntry[]>;
  duplicateGisIds: string[];
  invalidGisIdentifiers: number;
} {
  const byExactId = new Map<string, GisIndexEntry[]>();
  let invalidGisIdentifiers = 0;
  for (const row of gis) {
    const id = normalizeGisLicense(row.FAC_NBR ?? null);
    if (!id) {
      invalidGisIdentifiers += 1;
      continue;
    }
    const latitude = text(row.FAC_LATITUDE) || null;
    const longitude = text(row.FAC_LONGITUDE) || null;
    const list = byExactId.get(id) ?? [];
    list.push({
      gisLicenseId: id,
      latitude,
      longitude,
      coordinateQuality: assessCaliforniaPhase8GisCoordinates(latitude, longitude),
    });
    byExactId.set(id, list);
  }
  const duplicateGisIds = [...byExactId.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([id]) => id)
    .sort();
  return { byExactId, duplicateGisIds, invalidGisIdentifiers };
}

function finishMatch(
  candidate: CaliforniaPhase8CoordinateCandidate,
  matchKind: CaliforniaPhase8CoordinateMatchKind,
  entry: GisIndexEntry | null,
): CaliforniaPhase8CoordinateMatch {
  const coordinatesValid = entry?.coordinateQuality === "valid";
  let kind = matchKind;
  if (
    entry
    && (matchKind === "exact" || matchKind === "leading-zero-collapsed-unique")
  ) {
    if (entry.coordinateQuality === "missing") kind = "gis-coords-missing";
    else if (entry.coordinateQuality === "invalid") kind = "gis-coords-invalid";
  }
  return {
    facilityNumber: candidate.facilityNumber,
    file: candidate.file,
    outcome: candidate.outcome,
    matchKind: kind,
    gisLicenseId: entry?.gisLicenseId ?? null,
    latitude: coordinatesValid ? entry?.latitude ?? null : null,
    longitude: coordinatesValid ? entry?.longitude ?? null : null,
    coordinatesValid: kind === "exact" || kind === "leading-zero-collapsed-unique"
      ? coordinatesValid
      : false,
    leadingZerosPreserved: true,
    fabricated: false,
    geocoded: false,
  };
}

/**
 * Match one candidate to official ArcGIS coordinates.
 * Exact licensing-ID string equality is required for `exact`.
 * Leading-zero download IDs may uniquely collapse to a GIS integer id; that
 * path is reported separately and rejected when ambiguous.
 */
export function matchCaliforniaPhase8Coordinates(
  candidate: CaliforniaPhase8CoordinateCandidate,
  gisIndex: ReturnType<typeof indexCaliforniaPhase8GisCoordinates>,
): CaliforniaPhase8CoordinateMatch {
  const id = text(candidate.facilityNumber);
  if (!isCaliforniaPhase8LicensingId(id)) {
    return finishMatch(candidate, "invalid-download-id", null);
  }

  const exactRows = gisIndex.byExactId.get(id) ?? [];
  if (exactRows.length > 1) {
    return finishMatch(candidate, "ambiguous-duplicate-gis", null);
  }
  if (exactRows.length === 1) {
    return finishMatch(candidate, "exact", exactRows[0] ?? null);
  }

  // No exact string match. Attempt unique leading-zero collapse only.
  if (!id.startsWith("0")) {
    return finishMatch(candidate, "unmatched", null);
  }
  const collapsed = collapseFacilityNumber(id);
  if (collapsed === id) {
    return finishMatch(candidate, "unmatched", null);
  }
  const collapsedRows = gisIndex.byExactId.get(collapsed) ?? [];
  if (collapsedRows.length === 0) {
    return finishMatch(candidate, "unmatched", null);
  }
  if (collapsedRows.length > 1) {
    return finishMatch(candidate, "ambiguous-duplicate-gis", null);
  }

  // Ambiguous if another distinct download-like id could claim the same GIS row
  // via a different leading-zero form. Callers pass only candidates; collision
  // across the candidate set is resolved in reconcileCaliforniaPhase8Coordinates.
  return finishMatch(
    candidate,
    "leading-zero-collapsed-unique",
    collapsedRows[0] ?? null,
  );
}

export function reconcileCaliforniaPhase8Coordinates(input: {
  candidates: readonly CaliforniaPhase8CoordinateCandidate[];
  gis: readonly CaliforniaPhase8GisCoordinateRow[];
}): {
  matches: CaliforniaPhase8CoordinateMatch[];
  coverage: CaliforniaPhase8CoordinateCoverage;
  gisIndex: ReturnType<typeof indexCaliforniaPhase8GisCoordinates>;
} {
  const gisIndex = indexCaliforniaPhase8GisCoordinates(input.gis);
  const provisional = input.candidates.map(candidate =>
    matchCaliforniaPhase8Coordinates(candidate, gisIndex),
  );

  // Detect collapsed-ID collisions: multiple leading-zero candidates mapping to
  // the same GIS license id → reject all as ambiguous.
  const collapsedClaims = new Map<string, string[]>();
  for (const match of provisional) {
    if (match.matchKind !== "leading-zero-collapsed-unique") continue;
    if (!match.gisLicenseId) continue;
    const list = collapsedClaims.get(match.gisLicenseId) ?? [];
    list.push(match.facilityNumber);
    collapsedClaims.set(match.gisLicenseId, list);
  }
  const ambiguousCollapsed = new Set<string>();
  for (const [, claimants] of collapsedClaims) {
    if (claimants.length > 1) {
      for (const id of claimants) ambiguousCollapsed.add(id);
    }
  }

  // Also reject leading-zero collapse when an exact-string download id already
  // owns that GIS id among candidates (collision with non-padded form).
  const exactOwnerGisIds = new Set(
    provisional
      .filter(m => m.matchKind === "exact" && m.gisLicenseId)
      .map(m => m.gisLicenseId as string),
  );

  const matches = provisional.map(match => {
    if (match.matchKind !== "leading-zero-collapsed-unique") return match;
    if (ambiguousCollapsed.has(match.facilityNumber)) {
      return {
        ...match,
        matchKind: "ambiguous-collapsed-collision" as const,
        latitude: null,
        longitude: null,
        coordinatesValid: false,
      };
    }
    if (match.gisLicenseId && exactOwnerGisIds.has(match.gisLicenseId)) {
      return {
        ...match,
        matchKind: "ambiguous-collapsed-collision" as const,
        latitude: null,
        longitude: null,
        coordinatesValid: false,
      };
    }
    return match;
  });

  const activeCandidateCount = input.candidates.filter(
    c => c.outcome === "active-candidate",
  ).length;
  const restrictedCandidateCount = input.candidates.filter(
    c => c.outcome === "restricted-candidate",
  ).length;
  const candidateCount = input.candidates.length;

  let exactMatchWithValidCoords = 0;
  let leadingZeroCollapsedUniqueWithValidCoords = 0;
  let ambiguousRejected = 0;
  let unmatched = 0;
  let invalidDownloadIds = 0;
  let gisCoordsMissingOrInvalid = 0;

  for (const match of matches) {
    if (match.matchKind === "exact" && match.coordinatesValid) {
      exactMatchWithValidCoords += 1;
    } else if (
      match.matchKind === "leading-zero-collapsed-unique"
      && match.coordinatesValid
    ) {
      leadingZeroCollapsedUniqueWithValidCoords += 1;
    } else if (
      match.matchKind === "ambiguous-duplicate-gis"
      || match.matchKind === "ambiguous-collapsed-collision"
    ) {
      ambiguousRejected += 1;
    } else if (match.matchKind === "unmatched") {
      unmatched += 1;
    } else if (match.matchKind === "invalid-download-id") {
      invalidDownloadIds += 1;
    } else if (
      match.matchKind === "gis-coords-missing"
      || match.matchKind === "gis-coords-invalid"
    ) {
      gisCoordsMissingOrInvalid += 1;
    }
  }

  const exactValidCoverageRate = candidateCount === 0
    ? 0
    : exactMatchWithValidCoords / candidateCount;
  const usableOfficialCoordsRate = candidateCount === 0
    ? 0
    : (exactMatchWithValidCoords + leadingZeroCollapsedUniqueWithValidCoords)
      / candidateCount;

  return {
    matches,
    coverage: {
      candidateCount,
      activeCandidateCount,
      restrictedCandidateCount,
      exactMatchWithValidCoords,
      leadingZeroCollapsedUniqueWithValidCoords,
      ambiguousRejected,
      unmatched,
      invalidDownloadIds,
      gisCoordsMissingOrInvalid,
      exactValidCoverageRate,
      usableOfficialCoordsRate,
      fabricatedCoordinates: 0,
      unverifiedGeocodingUsed: 0,
    },
    gisIndex,
  };
}

/** Coverage split for active vs restricted candidate cohorts. */
export function splitCaliforniaPhase8CoordinateCoverage(
  matches: readonly CaliforniaPhase8CoordinateMatch[],
): {
  active: CaliforniaPhase8CoordinateCoverage;
  restricted: CaliforniaPhase8CoordinateCoverage;
} {
  const activeCandidates = matches
    .filter(m => m.outcome === "active-candidate")
    .map(m => ({
      facilityNumber: m.facilityNumber,
      outcome: m.outcome,
      file: m.file,
    }));
  const restrictedCandidates = matches
    .filter(m => m.outcome === "restricted-candidate")
    .map(m => ({
      facilityNumber: m.facilityNumber,
      outcome: m.outcome,
      file: m.file,
    }));

  // Re-derive coverage counts from already-resolved match kinds.
  function coverageFor(
    cohort: readonly CaliforniaPhase8CoordinateMatch[],
    outcome: "active-candidate" | "restricted-candidate",
  ): CaliforniaPhase8CoordinateCoverage {
    const candidateCount = cohort.length;
    let exactMatchWithValidCoords = 0;
    let leadingZeroCollapsedUniqueWithValidCoords = 0;
    let ambiguousRejected = 0;
    let unmatched = 0;
    let invalidDownloadIds = 0;
    let gisCoordsMissingOrInvalid = 0;
    for (const match of cohort) {
      if (match.matchKind === "exact" && match.coordinatesValid) {
        exactMatchWithValidCoords += 1;
      } else if (
        match.matchKind === "leading-zero-collapsed-unique"
        && match.coordinatesValid
      ) {
        leadingZeroCollapsedUniqueWithValidCoords += 1;
      } else if (
        match.matchKind === "ambiguous-duplicate-gis"
        || match.matchKind === "ambiguous-collapsed-collision"
      ) {
        ambiguousRejected += 1;
      } else if (match.matchKind === "unmatched") {
        unmatched += 1;
      } else if (match.matchKind === "invalid-download-id") {
        invalidDownloadIds += 1;
      } else if (
        match.matchKind === "gis-coords-missing"
        || match.matchKind === "gis-coords-invalid"
      ) {
        gisCoordsMissingOrInvalid += 1;
      }
    }
    return {
      candidateCount,
      activeCandidateCount: outcome === "active-candidate" ? candidateCount : 0,
      restrictedCandidateCount:
        outcome === "restricted-candidate" ? candidateCount : 0,
      exactMatchWithValidCoords,
      leadingZeroCollapsedUniqueWithValidCoords,
      ambiguousRejected,
      unmatched,
      invalidDownloadIds,
      gisCoordsMissingOrInvalid,
      exactValidCoverageRate:
        candidateCount === 0 ? 0 : exactMatchWithValidCoords / candidateCount,
      usableOfficialCoordsRate: candidateCount === 0
        ? 0
        : (exactMatchWithValidCoords + leadingZeroCollapsedUniqueWithValidCoords)
          / candidateCount,
      fabricatedCoordinates: 0,
      unverifiedGeocodingUsed: 0,
    };
  }

  void activeCandidates;
  void restrictedCandidates;
  return {
    active: coverageFor(
      matches.filter(m => m.outcome === "active-candidate"),
      "active-candidate",
    ),
    restricted: coverageFor(
      matches.filter(m => m.outcome === "restricted-candidate"),
      "restricted-candidate",
    ),
  };
}
