/**
 * California Phase 9 — coordinate discrepancy resolution (read-only).
 * Takes Phase 8 exact / leading-zero ArcGIS matches and independently
 * corroborates leading-zero collapses using facility type family, name,
 * address, city, and ZIP from official DownloadStateData + ArcGIS attributes.
 * Accepts corrected matches only when identity is uniquely corroborated.
 * Rejects ambiguous cases. Never fabricates coordinates or geocodes.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module. Callers
 * supply Phase 8 match/coverage results.
 */

export const CALIFORNIA_PHASE9_COORDINATES_OBSERVED_ON = "2026-11-19";

export type CaliforniaPhase9CoordinateMatchKind =
  | "exact"
  | "leading-zero-identity-verified"
  | "leading-zero-identity-rejected"
  | "ambiguous-duplicate-gis"
  | "ambiguous-collapsed-collision"
  | "unmatched"
  | "unmatched-address-or-name-divergent-id-rejected"
  | "invalid-download-id"
  | "gis-coords-missing"
  | "gis-coords-invalid";

export type CaliforniaPhase9Phase8MatchKind =
  | "exact"
  | "leading-zero-collapsed-unique"
  | "ambiguous-duplicate-gis"
  | "ambiguous-collapsed-collision"
  | "unmatched"
  | "invalid-download-id"
  | "gis-coords-missing"
  | "gis-coords-invalid";

export type CaliforniaPhase9DownloadIdentityRow = {
  facilityNumber: string;
  facilityType?: string | null;
  facilityName?: string | null;
  facilityAddress?: string | null;
  facilityCity?: string | null;
  facilityZip?: string | null;
};

export type CaliforniaPhase9GisIdentityRow = {
  FAC_NBR: string | number | null;
  FAC_LATITUDE?: string | null;
  FAC_LONGITUDE?: string | null;
  FAC_TYPE_DESC?: string | null;
  NAME?: string | null;
  RES_STREET_ADDR?: string | null;
  RES_CITY?: string | null;
  RES_ZIP_CODE?: string | number | null;
  PROGRAM_TYPE?: string | null;
};

export type CaliforniaPhase9Phase8Match = {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  outcome: "active-candidate" | "restricted-candidate";
  matchKind: CaliforniaPhase9Phase8MatchKind;
  gisLicenseId: string | null;
  latitude: string | null;
  longitude: string | null;
  coordinatesValid: boolean;
};

export type CaliforniaPhase9Phase8Coverage = {
  candidateCount: number;
  activeCandidateCount: number;
  restrictedCandidateCount: number;
  exactMatchWithValidCoords: number;
  leadingZeroCollapsedUniqueWithValidCoords: number;
  ambiguousRejected: number;
  unmatched: number;
  invalidDownloadIds: number;
  gisCoordsMissingOrInvalid: number;
  exactValidCoverageRate: number;
  usableOfficialCoordsRate: number;
  fabricatedCoordinates: 0;
  unverifiedGeocodingUsed: 0;
};

export type CaliforniaPhase9IdentitySignals = {
  typeFamilyMatch: boolean;
  nameCompatible: boolean;
  addressCompatible: boolean;
  cityMatch: boolean;
  zipMatch: boolean;
  downloadTypeFamily: string;
  gisTypeFamily: string;
};

export type CaliforniaPhase9CoordinateMatch = {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  outcome: "active-candidate" | "restricted-candidate";
  matchKind: CaliforniaPhase9CoordinateMatchKind;
  gisLicenseId: string | null;
  latitude: string | null;
  longitude: string | null;
  coordinatesValid: boolean;
  leadingZerosPreserved: true;
  fabricated: false;
  geocoded: false;
  /** Present for leading-zero verification outcomes. */
  identity?: CaliforniaPhase9IdentitySignals;
  phase8MatchKind: CaliforniaPhase9Phase8MatchKind;
};

export type CaliforniaPhase9CoordinateCoverage = {
  candidateCount: number;
  activeCandidateCount: number;
  restrictedCandidateCount: number;
  /** Exact licensing-ID string match with valid official coords. */
  exactMatchWithValidCoords: number;
  /** Phase 8 leading-zero unique collapses that remain after Phase 9 filter. */
  leadingZeroCollapsedUniqueWithValidCoords: number;
  /** Leading-zero collapses independently corroborated and accepted. */
  newlyVerifiedIdentityCorroborated: number;
  /** Leading-zero collapses rejected for weak/ambiguous identity. */
  leadingZeroIdentityRejected: number;
  ambiguousRejected: number;
  unmatched: number;
  unmatchedDivergentIdRejected: number;
  invalidDownloadIds: number;
  gisCoordsMissingOrInvalid: number;
  exactValidCoverageRate: number;
  newlyVerifiedCoverageRate: number;
  /**
   * Exact + newly verified identity-corroborated leading-zero matches.
   * Does not include unverified leading-zero collapses.
   */
  verifiedOfficialCoordsRate: number;
  /**
   * Exact + all unique leading-zero collapses (Phase 8 usable rate), retained
   * for comparison. Prefer verifiedOfficialCoordsRate for publication gates.
   */
  phase8UsableOfficialCoordsRate: number;
  fabricatedCoordinates: 0;
  unverifiedGeocodingUsed: 0;
};

function text(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeName(value: string | number | null | undefined): string {
  return text(value)
    .toUpperCase()
    .replace(/[.,'"()&]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\bINC\b|\bLLC\b|\bLP\b|\bCORP\b|\bCO\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAddress(value: string | number | null | undefined): string {
  return text(value)
    .toUpperCase()
    .replace(/[.,#]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\bSTREET\b/g, "ST")
    .replace(/\bAVENUE\b/g, "AVE")
    .replace(/\bBOULEVARD\b/g, "BLVD")
    .replace(/\bDRIVE\b/g, "DR")
    .replace(/\bROAD\b/g, "RD")
    .replace(/\bLANE\b/g, "LN")
    .replace(/\bCOURT\b/g, "CT")
    .replace(/\bPLACE\b/g, "PL")
    .replace(/\bAPARTMENT\b/g, "APT")
    .replace(/\bSUITE\b/g, "STE");
}

function normalizeZip(value: string | number | null | undefined): string {
  return text(value).replace(/[^0-9]/g, "").slice(0, 5);
}

/**
 * Map official facility-type strings into comparable families.
 * RCFE includes CCRC / residential-elderly GIS truncations.
 * ARF includes adult residential, ARFPSHN, and community crisis home variants.
 */
export function californiaPhase9FacilityTypeFamily(
  value: string | number | null | undefined,
): "rcfe" | "arf" | "other" | "unknown" {
  const t = text(value).toUpperCase();
  if (!t) return "unknown";
  if (
    t.includes("RESIDENTIAL CARE ELDERLY")
    || t.includes("RESIDENTIAL ELDERLY")
    || t.includes("RESIDENTIAL-ELDERLY")
    || t.includes("CONTINUING CARE RETIREMENT")
    || /\bRCFE\b/.test(t)
    || /\bCCRC\b/.test(t)
  ) {
    return "rcfe";
  }
  if (
    t.includes("ADULT RESIDENTIAL")
    || t.includes("COMMUNITY CRISIS HOM")
    || t.includes("CRISIS HOME")
    || t.includes("ARFPSHN")
    || t.includes("SPECIAL HEALTH CARE NEEDS")
    || /\bARF\b/.test(t)
  ) {
    return "arf";
  }
  return "other";
}

export function californiaPhase9NamesCompatible(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const ta = new Set(na.split(" ").filter(Boolean));
  const tb = new Set(nb.split(" ").filter(Boolean));
  let inter = 0;
  for (const token of ta) if (tb.has(token)) inter += 1;
  const denom = Math.max(ta.size, tb.size);
  return denom > 0 && inter / denom >= 0.8;
}

export function californiaPhase9AddressesCompatible(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): boolean {
  const aa = normalizeAddress(a);
  const bb = normalizeAddress(b);
  if (!aa || !bb) return false;
  if (aa === bb) return true;
  const compact = (s: string) => s.replace(/\s+/g, "");
  if (compact(aa) === compact(bb)) return true;
  return aa.startsWith(bb) || bb.startsWith(aa);
}

export function assessCaliforniaPhase9IdentityCorroboration(
  download: CaliforniaPhase9DownloadIdentityRow,
  gis: CaliforniaPhase9GisIdentityRow,
): CaliforniaPhase9IdentitySignals & { corroborated: boolean } {
  const downloadTypeFamily = californiaPhase9FacilityTypeFamily(download.facilityType);
  const gisTypeFamily = californiaPhase9FacilityTypeFamily(gis.FAC_TYPE_DESC);
  const typeFamilyMatch =
    downloadTypeFamily !== "unknown"
    && downloadTypeFamily !== "other"
    && downloadTypeFamily === gisTypeFamily;
  const nameCompatible = californiaPhase9NamesCompatible(
    download.facilityName,
    gis.NAME,
  );
  const addressCompatible = californiaPhase9AddressesCompatible(
    download.facilityAddress,
    gis.RES_STREET_ADDR,
  );
  const cityMatch = normalizeName(download.facilityCity) === normalizeName(gis.RES_CITY)
    && Boolean(normalizeName(download.facilityCity));
  const zipMatch = normalizeZip(download.facilityZip) === normalizeZip(gis.RES_ZIP_CODE)
    && Boolean(normalizeZip(download.facilityZip));

  // Unique collapsed licensing ID is a prerequisite supplied by the caller.
  // Independent corroboration requires compatible type family plus either:
  //   name + (address or ZIP), or address + ZIP.
  const corroborated = typeFamilyMatch && (
    (nameCompatible && (addressCompatible || zipMatch))
    || (addressCompatible && zipMatch)
  );

  return {
    typeFamilyMatch,
    nameCompatible,
    addressCompatible,
    cityMatch,
    zipMatch,
    downloadTypeFamily,
    gisTypeFamily,
    corroborated,
  };
}

function collapseFacilityNumber(value: string): string {
  const id = text(value);
  if (!/^\d+$/.test(id)) return id;
  return id.replace(/^0+/, "") || "0";
}

function indexGisIdentity(
  gis: readonly CaliforniaPhase9GisIdentityRow[],
): Map<string, CaliforniaPhase9GisIdentityRow[]> {
  const byExactId = new Map<string, CaliforniaPhase9GisIdentityRow[]>();
  for (const row of gis) {
    const id = text(row.FAC_NBR);
    if (!id || !/^\d+$/.test(id)) continue;
    const list = byExactId.get(id) ?? [];
    list.push(row);
    byExactId.set(id, list);
  }
  return byExactId;
}

function emptyCoverage(): CaliforniaPhase9CoordinateCoverage {
  return {
    candidateCount: 0,
    activeCandidateCount: 0,
    restrictedCandidateCount: 0,
    exactMatchWithValidCoords: 0,
    leadingZeroCollapsedUniqueWithValidCoords: 0,
    newlyVerifiedIdentityCorroborated: 0,
    leadingZeroIdentityRejected: 0,
    ambiguousRejected: 0,
    unmatched: 0,
    unmatchedDivergentIdRejected: 0,
    invalidDownloadIds: 0,
    gisCoordsMissingOrInvalid: 0,
    exactValidCoverageRate: 0,
    newlyVerifiedCoverageRate: 0,
    verifiedOfficialCoordsRate: 0,
    phase8UsableOfficialCoordsRate: 0,
    fabricatedCoordinates: 0,
    unverifiedGeocodingUsed: 0,
  };
}

function coverageFromMatches(
  matches: readonly CaliforniaPhase9CoordinateMatch[],
  phase8Coverage: CaliforniaPhase9Phase8Coverage,
): CaliforniaPhase9CoordinateCoverage {
  const coverage = emptyCoverage();
  coverage.candidateCount = matches.length;
  coverage.activeCandidateCount = matches.filter(m => m.outcome === "active-candidate").length;
  coverage.restrictedCandidateCount = matches.filter(
    m => m.outcome === "restricted-candidate",
  ).length;
  coverage.leadingZeroCollapsedUniqueWithValidCoords =
    phase8Coverage.leadingZeroCollapsedUniqueWithValidCoords;
  coverage.phase8UsableOfficialCoordsRate = phase8Coverage.usableOfficialCoordsRate;

  for (const match of matches) {
    if (match.matchKind === "exact" && match.coordinatesValid) {
      coverage.exactMatchWithValidCoords += 1;
    } else if (
      match.matchKind === "leading-zero-identity-verified"
      && match.coordinatesValid
    ) {
      coverage.newlyVerifiedIdentityCorroborated += 1;
    } else if (match.matchKind === "leading-zero-identity-rejected") {
      coverage.leadingZeroIdentityRejected += 1;
    } else if (
      match.matchKind === "ambiguous-duplicate-gis"
      || match.matchKind === "ambiguous-collapsed-collision"
    ) {
      coverage.ambiguousRejected += 1;
    } else if (match.matchKind === "unmatched") {
      coverage.unmatched += 1;
    } else if (match.matchKind === "unmatched-address-or-name-divergent-id-rejected") {
      coverage.unmatchedDivergentIdRejected += 1;
      coverage.unmatched += 1;
    } else if (match.matchKind === "invalid-download-id") {
      coverage.invalidDownloadIds += 1;
    } else if (
      match.matchKind === "gis-coords-missing"
      || match.matchKind === "gis-coords-invalid"
    ) {
      coverage.gisCoordsMissingOrInvalid += 1;
    }
  }

  const n = coverage.candidateCount;
  coverage.exactValidCoverageRate = n === 0 ? 0 : coverage.exactMatchWithValidCoords / n;
  coverage.newlyVerifiedCoverageRate = n === 0
    ? 0
    : coverage.newlyVerifiedIdentityCorroborated / n;
  coverage.verifiedOfficialCoordsRate = n === 0
    ? 0
    : (coverage.exactMatchWithValidCoords + coverage.newlyVerifiedIdentityCorroborated)
      / n;
  return coverage;
}

/**
 * Classify unmatched candidates that have a unique exact address+ZIP or
 * exact-name+ZIP hit against a GIS row whose licensing ID does not collapse
 * to the download ID. Those remain unmatched (coords not accepted) but are
 * labeled for audit. Prefix-only / city-only hits are ignored to avoid
 * false-positive divergent-ID labels.
 */
function classifyUnmatchedDivergentId(
  match: CaliforniaPhase9Phase8Match,
  download: CaliforniaPhase9DownloadIdentityRow | undefined,
  gisRows: readonly CaliforniaPhase9GisIdentityRow[],
): CaliforniaPhase9CoordinateMatchKind {
  if (!download) return "unmatched";
  const addr = normalizeAddress(download.facilityAddress);
  const zip = normalizeZip(download.facilityZip);
  const name = normalizeName(download.facilityName);
  const family = californiaPhase9FacilityTypeFamily(download.facilityType);
  if ((!addr && !name) || !zip) return "unmatched";
  if (family === "unknown" || family === "other") return "unmatched";

  const addressHits: CaliforniaPhase9GisIdentityRow[] = [];
  const nameHits: CaliforniaPhase9GisIdentityRow[] = [];
  for (const row of gisRows) {
    const gisFamily = californiaPhase9FacilityTypeFamily(row.FAC_TYPE_DESC);
    if (family !== gisFamily) continue;
    const gisZip = normalizeZip(row.RES_ZIP_CODE);
    if (gisZip !== zip) continue;
    const gisAddr = normalizeAddress(row.RES_STREET_ADDR);
    // Exact normalized address equality only (no prefix / city-only).
    if (addr && gisAddr && addr === gisAddr) addressHits.push(row);
    if (name && normalizeName(row.NAME) === name) nameHits.push(row);
  }

  const collapsed = collapseFacilityNumber(match.facilityNumber);
  const divergent = (row: CaliforniaPhase9GisIdentityRow) =>
    collapseFacilityNumber(text(row.FAC_NBR)) !== collapsed;

  if (addressHits.length === 1 && divergent(addressHits[0]!)) {
    return "unmatched-address-or-name-divergent-id-rejected";
  }
  if (nameHits.length === 1 && divergent(nameHits[0]!)) {
    return "unmatched-address-or-name-divergent-id-rejected";
  }
  return "unmatched";
}

/**
 * Resolve Phase 9 coordinate matches from Phase 8 reconciliation plus
 * independent identity corroboration for leading-zero collapses.
 */
export function reconcileCaliforniaPhase9Coordinates(input: {
  phase8Matches: readonly CaliforniaPhase9Phase8Match[];
  phase8Coverage: CaliforniaPhase9Phase8Coverage;
  gis: readonly CaliforniaPhase9GisIdentityRow[];
  downloadById: ReadonlyMap<string, CaliforniaPhase9DownloadIdentityRow>;
}): {
  matches: CaliforniaPhase9CoordinateMatch[];
  coverage: CaliforniaPhase9CoordinateCoverage;
} {
  const gisById = indexGisIdentity(input.gis);

  const matches: CaliforniaPhase9CoordinateMatch[] = input.phase8Matches.map(match => {
    const base = {
      facilityNumber: match.facilityNumber,
      file: match.file,
      outcome: match.outcome,
      gisLicenseId: match.gisLicenseId,
      latitude: match.latitude,
      longitude: match.longitude,
      coordinatesValid: match.coordinatesValid,
      leadingZerosPreserved: true as const,
      fabricated: false as const,
      geocoded: false as const,
      phase8MatchKind: match.matchKind,
    };

    if (match.matchKind === "exact") {
      return { ...base, matchKind: "exact" as const };
    }
    if (
      match.matchKind === "ambiguous-duplicate-gis"
      || match.matchKind === "ambiguous-collapsed-collision"
      || match.matchKind === "invalid-download-id"
      || match.matchKind === "gis-coords-missing"
      || match.matchKind === "gis-coords-invalid"
    ) {
      return { ...base, matchKind: match.matchKind };
    }
    if (match.matchKind === "unmatched") {
      const kind = classifyUnmatchedDivergentId(
        match,
        input.downloadById.get(match.facilityNumber),
        input.gis,
      );
      return {
        ...base,
        matchKind: kind,
        latitude: null,
        longitude: null,
        coordinatesValid: false,
      };
    }
    if (match.matchKind !== "leading-zero-collapsed-unique") {
      return { ...base, matchKind: "unmatched" as const };
    }

    // Leading-zero unique collapse: require independent identity corroboration.
    const download = input.downloadById.get(match.facilityNumber);
    const gisRows = match.gisLicenseId
      ? gisById.get(match.gisLicenseId) ?? []
      : [];
    if (!download || gisRows.length !== 1 || !match.coordinatesValid) {
      return {
        ...base,
        matchKind: "leading-zero-identity-rejected" as const,
        latitude: null,
        longitude: null,
        coordinatesValid: false,
        identity: download && gisRows[0]
          ? (() => {
              const { corroborated: _c, ...identity } =
                assessCaliforniaPhase9IdentityCorroboration(download, gisRows[0]);
              return identity;
            })()
          : {
              typeFamilyMatch: false,
              nameCompatible: false,
              addressCompatible: false,
              cityMatch: false,
              zipMatch: false,
              downloadTypeFamily: "unknown",
              gisTypeFamily: "unknown",
            },
      };
    }
    const assessment = assessCaliforniaPhase9IdentityCorroboration(download, gisRows[0]!);
    if (assessment.corroborated) {
      const { corroborated: _c, ...identity } = assessment;
      return {
        ...base,
        matchKind: "leading-zero-identity-verified" as const,
        coordinatesValid: true,
        identity,
      };
    }
    const { corroborated: _c, ...identity } = assessment;
    return {
      ...base,
      matchKind: "leading-zero-identity-rejected" as const,
      latitude: null,
      longitude: null,
      coordinatesValid: false,
      identity,
    };
  });

  return {
    matches,
    coverage: coverageFromMatches(matches, input.phase8Coverage),
  };
}

export function splitCaliforniaPhase9CoordinateCoverage(
  matches: readonly CaliforniaPhase9CoordinateMatch[],
  phase8ActiveCoverage: CaliforniaPhase9Phase8Coverage,
  phase8RestrictedCoverage: CaliforniaPhase9Phase8Coverage,
): {
  active: CaliforniaPhase9CoordinateCoverage;
  restricted: CaliforniaPhase9CoordinateCoverage;
} {
  return {
    active: coverageFromMatches(
      matches.filter(m => m.outcome === "active-candidate"),
      phase8ActiveCoverage,
    ),
    restricted: coverageFromMatches(
      matches.filter(m => m.outcome === "restricted-candidate"),
      phase8RestrictedCoverage,
    ),
  };
}
