/**
 * California Tier 2 — development-only map coordinates.
 *
 * Matches the Tier 1 eligible CDSS roster (15,435) to official CDSS CCL ArcGIS
 * coordinates via Phase 8 exact licensing-ID matching (plus unique
 * leading-zero-collapsed GIS integer FAC_NBR representation). Never fabricates
 * or geocodes coordinates. CDSS DownloadStateData remains authoritative for
 * facility identity and attributes. Public California mapPath stays null.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Intentionally free of sibling runtime imports (Node test + Next compatible). */
const FACILITY_NUMBER = /^\d{8,9}$/;
const FACILITY_DETAIL_PREFIX =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/";

export const CALIFORNIA_TIER2_MAP_OBSERVED_ON = "2026-11-24";

export const CALIFORNIA_TIER2_MAP_SCOPE = {
  kind: "statewide-development-map" as const,
  californiaPublished: false as const,
  publicMapEnabled: false as const,
  publicMapPath: null,
  developmentMapPath: "/development/california/map" as const,
  developmentListingPath: "/development/california" as const,
  fixtureDir: "supabase/proposals/fixtures/california-tier2-map" as const,
  arcgisLayerUrl:
    "https://services.arcgis.com/XLPEppdz2H9dOiqp/arcgis/rest/services/CDSS_CCL_Facilities/FeatureServer/0",
  matchEngine:
    "lib/california-phase8-coordinates.ts#reconcileCaliforniaPhase8Coordinates",
  identityValidation:
    "lib/california-phase9-coordinates.ts#assessCaliforniaPhase9IdentityCorroboration",
  fabricatedCoordinates: 0 as const,
  geocoded: false as const,
  ownerFeaturesEnabled: false as const,
  /** After Phase 9 identity filter on leading-zero collapses (baseline 6a04300). */
  verifiedMapPointCount: 15418 as const,
  leadingZeroIdentityRejected: 1 as const,
} as const;

export type CaliforniaTier2MatchKind = "exact" | "leading-zero-collapsed-unique";

export type CaliforniaTier2MapPoint = {
  facilityNumber: string;
  latitude: number;
  longitude: number;
  name: string;
  category: "RCFE" | "ARF";
  city: string | null;
  postalCode: string | null;
  status: string;
  capacity: string | null;
  matchKind: CaliforniaTier2MatchKind;
  disclosureUrl: string | null;
  profilePath: string | null;
};

export type CaliforniaTier2MapCoverage = {
  observedOn: string;
  matchEngine: string;
  source: {
    pathway: string;
    layerUrl: string;
    gisRowsFetched: number;
    uniqueGisIds: number;
    duplicateGisIds: number;
    invalidGisIdentifiers: number;
    matchRule: string;
    mapPointPolicy: string;
    fabricatedCoordinates: number;
    geocoded: boolean;
    cdssAuthoritative: boolean;
  };
  roster: {
    listableCount: number;
    californiaPublished: boolean;
    sourceAsOfIso: string;
  };
  matching: {
    eligibleCount: number;
    exactMatchWithValidCoords: number;
    leadingZeroCollapsedUniqueWithValidCoords: number;
    usableOfficialCoords: number;
    unmatched: number;
    ambiguousRejected: number;
    gisCoordsMissingOrInvalid: number;
    invalidDownloadIds: number;
    exactValidCoverageRate: number;
    usableOfficialCoordsRate: number;
    leadingZeroIdentityVerified?: number;
    leadingZeroIdentityRejected?: number;
  };
  mapPoints: {
    count: number;
    exact: number;
    leadingZeroCollapsedUnique: number;
    developmentOnlyPath: string;
    publicMapPath: null;
    publicMapEnabled: false;
    leadingZeroIdentityVerified?: number;
    leadingZeroIdentityRejected?: number;
  };
  validation?: {
    observedOn: string;
    baselineCommit: string;
    method: string;
    rejectedIds: readonly string[];
    rejectedReason: string;
    stratifiedExactSamplePass: number;
    stratifiedExactSampleFail: number;
    unmatchedDocumented: number;
    verifiedOfficialCoords: number;
    verifiedOfficialCoordsRate: number;
    publicMapEnabled: false;
  };
  remainingBlockers: readonly string[];
};

export type CaliforniaTier2MapQuery = {
  q?: string;
  category?: string;
  city?: string;
  zip?: string;
  status?: string;
  /** Cap markers returned to the client map (default 800). */
  limit?: number;
};

export type CaliforniaTier2MapSearchResult = {
  coverage: CaliforniaTier2MapCoverage;
  totalMatched: number;
  returned: number;
  truncated: boolean;
  points: CaliforniaTier2MapPoint[];
  filterActive: boolean;
};

type CompactPoint = {
  n: string;
  lat: number;
  lon: number;
  name: string;
  cat: "RCFE" | "ARF";
  city: string | null;
  zip: string | null;
  status: string;
  cap: string | null;
  kind: "e" | "z";
};

const FIXTURE = join(
  process.cwd(),
  "supabase/proposals/fixtures/california-tier2-map",
);

let cachedCoverage: CaliforniaTier2MapCoverage | null = null;
let cachedPoints: CompactPoint[] | null = null;

function text(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function expandKind(kind: "e" | "z"): CaliforniaTier2MatchKind {
  return kind === "e" ? "exact" : "leading-zero-collapsed-unique";
}

export function loadCaliforniaTier2MapCoverage(): CaliforniaTier2MapCoverage {
  if (cachedCoverage) return cachedCoverage;
  cachedCoverage = JSON.parse(
    readFileSync(join(FIXTURE, "coverage.json"), "utf8"),
  ) as CaliforniaTier2MapCoverage;
  return cachedCoverage;
}

function loadCompactPoints(): CompactPoint[] {
  if (cachedPoints) return cachedPoints;
  cachedPoints = JSON.parse(
    readFileSync(join(FIXTURE, "points.json"), "utf8"),
  ) as CompactPoint[];
  return cachedPoints;
}

export function californiaTier2MapPath(): typeof CALIFORNIA_TIER2_MAP_SCOPE.developmentMapPath {
  return CALIFORNIA_TIER2_MAP_SCOPE.developmentMapPath;
}

export function californiaTier2PublicMapEnabled(): false {
  return false;
}

function disclosureUrlFor(facilityNumber: string): string | null {
  if (!FACILITY_NUMBER.test(facilityNumber)) return null;
  return `${FACILITY_DETAIL_PREFIX}${facilityNumber}`;
}

function developmentProfilePath(facilityNumber: string): string | null {
  if (!FACILITY_NUMBER.test(facilityNumber)) return null;
  return `/development/california/${facilityNumber}`;
}

export function toCaliforniaTier2MapPoint(row: CompactPoint): CaliforniaTier2MapPoint {
  return {
    facilityNumber: row.n,
    latitude: row.lat,
    longitude: row.lon,
    name: row.name,
    category: row.cat,
    city: row.city,
    postalCode: row.zip,
    status: row.status,
    capacity: row.cap,
    matchKind: expandKind(row.kind),
    disclosureUrl: disclosureUrlFor(row.n),
    profilePath: developmentProfilePath(row.n),
  };
}

function matchesQuery(row: CompactPoint, query: CaliforniaTier2MapQuery): boolean {
  const category = text(query.category).toUpperCase();
  if (category === "RCFE" || category === "ARF") {
    if (row.cat !== category) return false;
  }

  const status = text(query.status).toUpperCase();
  if (status && text(row.status).toUpperCase() !== status) return false;

  const zip = text(query.zip);
  if (zip) {
    if (!/^\d{5}$/.test(zip)) return false;
    if (text(row.zip) !== zip) return false;
  }

  const city = text(query.city).toLowerCase();
  if (city) {
    if (!text(row.city).toLowerCase().includes(city)) return false;
  }

  const q = text(query.q).toLowerCase();
  if (q) {
    const hay = [
      row.n,
      row.name,
      row.city ?? "",
      row.zip ?? "",
      row.status,
      row.cat,
    ]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }

  return true;
}

export function californiaTier2MapFilterActive(query: CaliforniaTier2MapQuery): boolean {
  return Boolean(
    text(query.q)
    || text(query.city)
    || (/^\d{5}$/.test(text(query.zip)) && text(query.zip))
    || text(query.category).toUpperCase() === "RCFE"
    || text(query.category).toUpperCase() === "ARF"
    || text(query.status),
  );
}

/**
 * Search verified map points. Without an active filter, returns coverage only
 * (no statewide marker dump) so the development page stays responsive.
 */
export function searchCaliforniaTier2MapPoints(
  query: CaliforniaTier2MapQuery = {},
): CaliforniaTier2MapSearchResult {
  const coverage = loadCaliforniaTier2MapCoverage();
  const filterActive = californiaTier2MapFilterActive(query);
  const limitRaw = Number(query.limit);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0
    ? Math.min(Math.floor(limitRaw), 2000)
    : 800;

  if (!filterActive) {
    return {
      coverage,
      totalMatched: coverage.mapPoints.count,
      returned: 0,
      truncated: false,
      points: [],
      filterActive: false,
    };
  }

  const matched: CaliforniaTier2MapPoint[] = [];
  let totalMatched = 0;
  for (const row of loadCompactPoints()) {
    if (!matchesQuery(row, query)) continue;
    totalMatched += 1;
    if (matched.length < limit) matched.push(toCaliforniaTier2MapPoint(row));
  }

  return {
    coverage,
    totalMatched,
    returned: matched.length,
    truncated: totalMatched > matched.length,
    points: matched,
    filterActive: true,
  };
}

export function californiaTier2MapCoverageSummary(): {
  eligible: number;
  exact: number;
  usable: number;
  unmatched: number;
  ambiguous: number;
  invalidOrMissing: number;
  exactRate: number;
  usableRate: number;
  leadingZeroIdentityVerified: number;
  leadingZeroIdentityRejected: number;
  publicMapEnabled: false;
} {
  const coverage = loadCaliforniaTier2MapCoverage();
  const c = coverage.matching;
  return {
    eligible: c.eligibleCount,
    exact: c.exactMatchWithValidCoords,
    usable: c.usableOfficialCoords,
    unmatched: c.unmatched,
    ambiguous: c.ambiguousRejected,
    invalidOrMissing: c.gisCoordsMissingOrInvalid,
    exactRate: c.exactValidCoverageRate,
    usableRate: c.usableOfficialCoordsRate,
    leadingZeroIdentityVerified: c.leadingZeroIdentityVerified ?? 0,
    leadingZeroIdentityRejected: c.leadingZeroIdentityRejected ?? 0,
    publicMapEnabled: false,
  };
}
