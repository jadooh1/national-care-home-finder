/**
 * California Phase 14 — investigation of exceptional disclosure-link and
 * coordinate records. Resolves only when authoritative official evidence
 * supports a conclusion. Never fabricates coordinates, license IDs, or
 * disclosure links. California stays unpublished.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE14_EXCEPTIONS_OBSERVED_ON = "2026-11-20";

const FACILITY_NUMBER = /^\d{8,9}$/;

export type CaliforniaPhase14LinkValidationClass =
  | "working"
  | "missing"
  | "ambiguous"
  | "invalid"
  | "inconclusive";

export type CaliforniaPhase14LinkValidationResult = {
  facilityNumber: string;
  classification: CaliforniaPhase14LinkValidationClass;
  identifierRelation:
    | "exact"
    | "leading-zero-canonicalization"
    | "mismatch"
    | "missing"
    | "not-applicable";
  liveFacilityNumber?: string | null;
  apiFound?: boolean | null;
  apiHttpStatus?: number | null;
  timedOut?: boolean;
  rationale: string;
  sampleIsStatewideConclusion: false;
};

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function collapseFacilityNumber(value: string): string {
  const id = text(value);
  if (!/^\d+$/.test(id)) return id;
  return id.replace(/^0+/, "") || "0";
}

function classifyDisclosureProbe(input: {
  facilityNumber: string;
  apiHttpStatus?: number | null;
  liveFacilityNumber?: string | null;
  apiFound?: boolean | null;
  timedOut?: boolean;
}): CaliforniaPhase14LinkValidationResult {
  const id = text(input.facilityNumber);
  if (!FACILITY_NUMBER.test(id)) {
    return {
      facilityNumber: id,
      classification: "invalid",
      identifierRelation: "not-applicable",
      rationale: "Facility number is not an official 8–9 digit CDSS identifier; generator refuses URLs (fail-closed).",
      sampleIsStatewideConclusion: false,
    };
  }
  if (input.timedOut === true || input.apiHttpStatus === 0) {
    return {
      facilityNumber: id,
      classification: "inconclusive",
      identifierRelation: "missing",
      rationale: "FacilityDetail request timed out or failed at the transport layer; link target inconclusive.",
      sampleIsStatewideConclusion: false,
    };
  }
  if (input.apiHttpStatus != null && input.apiHttpStatus !== 200) {
    return {
      facilityNumber: id,
      classification: "inconclusive",
      identifierRelation: "missing",
      rationale: `FacilityDetail HTTP ${input.apiHttpStatus}; cannot confirm disclosure target.`,
      sampleIsStatewideConclusion: false,
    };
  }
  if (input.apiFound === false || input.liveFacilityNumber == null || input.liveFacilityNumber === "") {
    return {
      facilityNumber: id,
      classification: "missing",
      identifierRelation: "missing",
      rationale: "FacilityDetail returned Facility Number Not Found (or empty).",
      sampleIsStatewideConclusion: false,
    };
  }
  const live = text(input.liveFacilityNumber);
  if (id === live) {
    return {
      facilityNumber: id,
      classification: "working",
      identifierRelation: "exact",
      liveFacilityNumber: live,
      apiFound: true,
      rationale: "FacilityDetail FACILITYNUMBER matches exactly.",
      sampleIsStatewideConclusion: false,
    };
  }
  if (collapseFacilityNumber(id) === collapseFacilityNumber(live) && id !== live) {
    return {
      facilityNumber: id,
      classification: "ambiguous",
      identifierRelation: "leading-zero-canonicalization",
      liveFacilityNumber: live,
      apiFound: true,
      rationale: "FacilityDetail canonicalized a leading-zero difference.",
      sampleIsStatewideConclusion: false,
    };
  }
  return {
    facilityNumber: id,
    classification: "ambiguous",
    identifierRelation: "mismatch",
    liveFacilityNumber: live,
    apiFound: true,
    rationale: "FacilityDetail FACILITYNUMBER does not match the requested license identifier.",
    sampleIsStatewideConclusion: false,
  };
}

export const CALIFORNIA_CCL_FEATURE_SERVER_QUERY =
  "https://services.arcgis.com/XLPEppdz2H9dOiqp/arcgis/rest/services/CDSS_CCL_Facilities/FeatureServer/0/query";

/** Phase 13 ambiguous truncated leading-zero negative control. */
export const CALIFORNIA_PHASE14_AMBIGUOUS_DISCLOSURE_CASE = {
  officialFacilityNumber: "015601219",
  truncatedRequest: "15601219",
  file: "RCFE" as const,
  downloadStatus: "ON PROBATION",
  phase13Classification: "ambiguous" as const,
  note:
    "Phase 13: truncated request 15601219 resolved live as 015601219 (leading-zero canonicalization).",
} as const;

/** Phase 13 invalid five-digit ID (generator refuse-closed). */
export const CALIFORNIA_PHASE14_INVALID_DISCLOSURE_CASE = {
  facilityNumber: "95354",
  file: "ARF" as const,
  downloadStatus: "PENDING",
  phase13Classification: "invalid" as const,
  note:
    "Not an official 8–9 digit CDSS identifier; disclosure URL generator refuses closed.",
} as const;

/**
 * Phase 9 unresolved candidate coordinates: 27 unmatched (+ divergent-ID
 * rejections) + 1 leading-zero identity rejection = 28.
 */
export const CALIFORNIA_PHASE14_UNRESOLVED_COORDINATE_CASES = [
  { facilityNumber: "345920416", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "365530238", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "365530117", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "347000691", file: "RCFE" as const, priorMatchKind: "unmatched" },
  { facilityNumber: "079200787", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "331880803", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "547209622", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "435202953", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "197609365", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "019200734", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "197610054", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "374604082", file: "RCFE" as const, priorMatchKind: "unmatched" },
  { facilityNumber: "079200750", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "331881453", file: "RCFE" as const, priorMatchKind: "unmatched" },
  { facilityNumber: "019200744", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "019200684", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "565850301", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "331881184", file: "RCFE" as const, priorMatchKind: "unmatched" },
  { facilityNumber: "019200753", file: "RCFE" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "502701867", file: "ARF" as const, priorMatchKind: "unmatched" },
  { facilityNumber: "198602394", file: "ARF" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "374604054", file: "ARF" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "315920188", file: "ARF" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "198600856", file: "ARF" as const, priorMatchKind: "unmatched" },
  { facilityNumber: "366425640", file: "ARF" as const, priorMatchKind: "unmatched" },
  { facilityNumber: "565850358", file: "ARF" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "198602399", file: "ARF" as const, priorMatchKind: "unmatched-address-or-name-divergent-id-rejected" },
  { facilityNumber: "011405838", file: "ARF" as const, priorMatchKind: "leading-zero-identity-rejected" },
] as const;

export type CaliforniaPhase14DisclosureExceptionResolution =
  | "resolved-exact-official-id-works"
  | "confirmed-ambiguous-truncated-request"
  | "confirmed-invalid-id-refuse-closed"
  | "unresolved-needs-authoritative-evidence"
  | "inconclusive-transport";

export type CaliforniaPhase14CoordinateExceptionResolution =
  | "resolved-exact-gis-id-with-valid-coords"
  | "resolved-leading-zero-identity-corroborated"
  | "confirmed-still-unmatched"
  | "confirmed-divergent-id-rejected"
  | "confirmed-leading-zero-identity-rejected"
  | "gis-coords-missing-or-invalid"
  | "facility-detail-missing"
  | "inconclusive-transport"
  | "unresolved-needs-authoritative-evidence";

export type CaliforniaPhase14DisclosureExceptionFinding = {
  kind: "ambiguous-truncated-leading-zero" | "invalid-id";
  officialFacilityNumber: string;
  requestFacilityNumber: string;
  truncatedProbe: CaliforniaPhase14LinkValidationResult | null;
  canonicalProbe: CaliforniaPhase14LinkValidationResult | null;
  resolution: CaliforniaPhase14DisclosureExceptionResolution;
  fabricatedLink: false;
  rationale: string;
};

export type CaliforniaPhase14GisProbeRow = {
  FAC_NBR?: string | number | null;
  FAC_LATITUDE?: string | null;
  FAC_LONGITUDE?: string | null;
  FAC_TYPE_DESC?: string | null;
  NAME?: string | null;
  RES_STREET_ADDR?: string | null;
  RES_CITY?: string | null;
  RES_ZIP_CODE?: string | number | null;
  PROGRAM_TYPE?: string | null;
};

export type CaliforniaPhase14CoordinateExceptionFinding = {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  priorMatchKind: string;
  facilityDetailFound: boolean | null;
  liveFacilityNumber: string | null;
  liveStatus: string | null;
  identifierRelation: "exact" | "leading-zero-canonicalization" | "mismatch" | "missing" | "not-applicable";
  gisHitCount: number;
  gisLicenseId: string | null;
  latitude: string | null;
  longitude: string | null;
  coordinatesValid: boolean;
  resolution: CaliforniaPhase14CoordinateExceptionResolution;
  fabricatedCoordinates: false;
  geocoded: false;
  rationale: string;
};

export function assessCaliforniaPhase14Coordinates(
  latitude: string | null | undefined,
  longitude: string | null | undefined,
): boolean {
  const lat = Number(text(latitude));
  const lon = Number(text(longitude));
  return Number.isFinite(lat)
    && Number.isFinite(lon)
    && lat >= -90
    && lat <= 90
    && lon >= -180
    && lon <= 180
    && !(lat === 0 && lon === 0);
}

export function californiaPhase14GisQueryUrl(facilityNumber: string): string {
  const collapsed = collapseFacilityNumber(facilityNumber);
  const params = new URLSearchParams({
    where: `FAC_NBR=${collapsed}`,
    outFields: [
      "FAC_NBR",
      "FAC_LATITUDE",
      "FAC_LONGITUDE",
      "FAC_TYPE_DESC",
      "NAME",
      "RES_STREET_ADDR",
      "RES_CITY",
      "RES_ZIP_CODE",
      "PROGRAM_TYPE",
    ].join(","),
    returnGeometry: "false",
    f: "json",
  });
  return `${CALIFORNIA_CCL_FEATURE_SERVER_QUERY}?${params}`;
}

/**
 * Investigate the Phase 13 ambiguous truncated leading-zero case using
 * supplied FacilityDetail probe outcomes (no fabrication).
 */
export function investigateCaliforniaPhase14AmbiguousDisclosure(input: {
  truncated: {
    apiHttpStatus?: number | null;
    liveFacilityNumber?: string | null;
    apiFound?: boolean | null;
    timedOut?: boolean;
  };
  canonical: {
    apiHttpStatus?: number | null;
    liveFacilityNumber?: string | null;
    apiFound?: boolean | null;
    timedOut?: boolean;
  };
}): CaliforniaPhase14DisclosureExceptionFinding {
  const truncatedProbe = classifyDisclosureProbe({
    facilityNumber: CALIFORNIA_PHASE14_AMBIGUOUS_DISCLOSURE_CASE.truncatedRequest,
    ...input.truncated,
  });
  const canonicalProbe = classifyDisclosureProbe({
    facilityNumber: CALIFORNIA_PHASE14_AMBIGUOUS_DISCLOSURE_CASE.officialFacilityNumber,
    ...input.canonical,
  });

  let resolution: CaliforniaPhase14DisclosureExceptionResolution =
    "unresolved-needs-authoritative-evidence";
  let rationale =
    "Insufficient official evidence to close the truncated-request exception.";

  if (
    truncatedProbe.classification === "inconclusive"
    || canonicalProbe.classification === "inconclusive"
  ) {
    resolution = "inconclusive-transport";
    rationale = "FacilityDetail transport failure prevented exception closure.";
  } else if (
    truncatedProbe.classification === "ambiguous"
    && canonicalProbe.classification === "working"
    && canonicalProbe.identifierRelation === "exact"
  ) {
    resolution = "resolved-exact-official-id-works";
    rationale =
      "Authoritative FacilityDetail confirms exact official ID 015601219 works; truncated 15601219 remains ambiguous/non-canonical. Publication links must use the exact official ID with leading zeros.";
  } else if (truncatedProbe.classification === "ambiguous") {
    resolution = "confirmed-ambiguous-truncated-request";
    rationale =
      "Truncated request remains ambiguous under leading-zero canonicalization; keep fail-closed for non-exact IDs.";
  }

  return {
    kind: "ambiguous-truncated-leading-zero",
    officialFacilityNumber:
      CALIFORNIA_PHASE14_AMBIGUOUS_DISCLOSURE_CASE.officialFacilityNumber,
    requestFacilityNumber:
      CALIFORNIA_PHASE14_AMBIGUOUS_DISCLOSURE_CASE.truncatedRequest,
    truncatedProbe,
    canonicalProbe,
    resolution,
    fabricatedLink: false,
    rationale,
  };
}

export function investigateCaliforniaPhase14InvalidDisclosure():
  CaliforniaPhase14DisclosureExceptionFinding {
  const probe = classifyDisclosureProbe({
    facilityNumber: CALIFORNIA_PHASE14_INVALID_DISCLOSURE_CASE.facilityNumber,
  });
  return {
    kind: "invalid-id",
    officialFacilityNumber: CALIFORNIA_PHASE14_INVALID_DISCLOSURE_CASE.facilityNumber,
    requestFacilityNumber: CALIFORNIA_PHASE14_INVALID_DISCLOSURE_CASE.facilityNumber,
    truncatedProbe: null,
    canonicalProbe: probe,
    resolution: "confirmed-invalid-id-refuse-closed",
    fabricatedLink: false,
    rationale:
      probe.classification === "invalid"
        ? "Confirmed: 95354 is not an 8–9 digit CDSS identifier; generator refuse-closed; no disclosure URL fabricated."
        : "Invalid ID remains fail-closed.",
  };
}

function relateIds(
  requested: string,
  live: string | null,
): CaliforniaPhase14CoordinateExceptionFinding["identifierRelation"] {
  const req = text(requested);
  if (!live) return "missing";
  if (req === live) return "exact";
  if (collapseFacilityNumber(req) === collapseFacilityNumber(live) && req !== live) {
    return "leading-zero-canonicalization";
  }
  return "mismatch";
}

/**
 * Classify one unresolved-coordinate exception from official FacilityDetail +
 * ArcGIS attribute evidence. Never invents coordinates.
 */
export function classifyCaliforniaPhase14CoordinateException(input: {
  facilityNumber: string;
  file: "RCFE" | "ARF";
  priorMatchKind: string;
  facilityDetail: {
    found: boolean | null;
    liveFacilityNumber: string | null;
    liveStatus: string | null;
    timedOut?: boolean;
  };
  gisRows: readonly CaliforniaPhase14GisProbeRow[];
  download?: {
    facilityName?: string | null;
    facilityAddress?: string | null;
    facilityCity?: string | null;
    facilityZip?: string | null;
    facilityType?: string | null;
  };
}): CaliforniaPhase14CoordinateExceptionFinding {
  const facilityNumber = text(input.facilityNumber);
  const identifierRelation = relateIds(
    facilityNumber,
    input.facilityDetail.liveFacilityNumber,
  );

  if (input.facilityDetail.timedOut) {
    return {
      facilityNumber,
      file: input.file,
      priorMatchKind: input.priorMatchKind,
      facilityDetailFound: null,
      liveFacilityNumber: null,
      liveStatus: null,
      identifierRelation: "missing",
      gisHitCount: 0,
      gisLicenseId: null,
      latitude: null,
      longitude: null,
      coordinatesValid: false,
      resolution: "inconclusive-transport",
      fabricatedCoordinates: false,
      geocoded: false,
      rationale: "FacilityDetail transport failure; coordinate exception left unresolved.",
    };
  }

  if (input.facilityDetail.found === false) {
    return {
      facilityNumber,
      file: input.file,
      priorMatchKind: input.priorMatchKind,
      facilityDetailFound: false,
      liveFacilityNumber: null,
      liveStatus: null,
      identifierRelation: "missing",
      gisHitCount: input.gisRows.length,
      gisLicenseId: null,
      latitude: null,
      longitude: null,
      coordinatesValid: false,
      resolution: "facility-detail-missing",
      fabricatedCoordinates: false,
      geocoded: false,
      rationale:
        "FacilityDetail did not find this license ID; cannot adopt GIS coords without authoritative identity.",
    };
  }

  const exactId = facilityNumber;
  const collapsed = collapseFacilityNumber(facilityNumber);
  const exactHits = input.gisRows.filter(row => text(String(row.FAC_NBR ?? "")) === exactId);
  const collapsedHits = input.gisRows.filter(
    row => collapseFacilityNumber(String(row.FAC_NBR ?? "")) === collapsed,
  );

  // Prefer exact string FAC_NBR (rare in ArcGIS integer field); else unique collapsed.
  let chosen: CaliforniaPhase14GisProbeRow | null = null;
  let resolution: CaliforniaPhase14CoordinateExceptionResolution =
    "confirmed-still-unmatched";
  let rationale =
    "No authoritative ArcGIS FAC_NBR match with valid coords; leave unresolved (no fabrication).";

  if (exactHits.length === 1) {
    chosen = exactHits[0];
    const lat = text(chosen.FAC_LATITUDE) || null;
    const lon = text(chosen.FAC_LONGITUDE) || null;
    const valid = assessCaliforniaPhase14Coordinates(lat, lon);
    if (valid) {
      resolution = "resolved-exact-gis-id-with-valid-coords";
      rationale =
        "Authoritative ArcGIS exact FAC_NBR match with valid official coordinates; identity corroborated by FacilityDetail.";
    } else {
      resolution = "gis-coords-missing-or-invalid";
      rationale = "Exact GIS FAC_NBR hit exists but coordinates missing/invalid; not adopted.";
    }
    return finishCoord(input, chosen, identifierRelation, resolution, rationale, exactHits.length);
  }

  if (exactHits.length > 1) {
    return finishCoord(
      input,
      null,
      identifierRelation,
      "unresolved-needs-authoritative-evidence",
      "Multiple exact GIS FAC_NBR hits; ambiguous — coords not adopted.",
      exactHits.length,
    );
  }

  if (collapsedHits.length === 1 && facilityNumber.startsWith("0")) {
    chosen = collapsedHits[0];
    const identityOk = corroborateLeadingZeroIdentity(input.download, chosen);
    const lat = text(chosen.FAC_LATITUDE) || null;
    const lon = text(chosen.FAC_LONGITUDE) || null;
    const valid = assessCaliforniaPhase14Coordinates(lat, lon);
    if (identityOk && valid && identifierRelation === "exact") {
      resolution = "resolved-leading-zero-identity-corroborated";
      rationale =
        "Unique collapsed GIS FAC_NBR with FacilityDetail exact identity and corroborating name/address/ZIP; official coords adopted.";
    } else if (!identityOk) {
      resolution = "confirmed-leading-zero-identity-rejected";
      rationale =
        "Collapsed GIS FAC_NBR hit lacks independent identity corroboration; coords remain rejected (Phase 9 policy preserved).";
    } else if (!valid) {
      resolution = "gis-coords-missing-or-invalid";
      rationale = "Leading-zero GIS hit lacks valid coordinates.";
    } else {
      resolution = "confirmed-leading-zero-identity-rejected";
      rationale =
        "FacilityDetail identity relation insufficient for leading-zero GIS adoption.";
    }
    return finishCoord(
      input,
      resolution.startsWith("resolved") ? chosen : null,
      identifierRelation,
      resolution,
      rationale,
      collapsedHits.length,
    );
  }

  if (collapsedHits.length >= 1 && input.priorMatchKind.includes("divergent")) {
    resolution = "confirmed-divergent-id-rejected";
    rationale =
      "GIS address/name hit with divergent FAC_NBR remains rejected; no fabricated ID remapping.";
    return finishCoord(input, null, identifierRelation, resolution, rationale, collapsedHits.length);
  }

  if (collapsedHits.length === 0) {
    resolution = "confirmed-still-unmatched";
    rationale = "No ArcGIS FAC_NBR hit for this download license ID; coords remain unresolved.";
  } else if (collapsedHits.length > 1) {
    resolution = "unresolved-needs-authoritative-evidence";
    rationale = "Multiple collapsed GIS hits; ambiguous — coords not adopted.";
  }

  return finishCoord(
    input,
    null,
    identifierRelation,
    resolution,
    rationale,
    collapsedHits.length,
  );
}

function corroborateLeadingZeroIdentity(
  download: CaliforniaPhase14CoordinateExceptionFinding extends never ? never : {
    facilityName?: string | null;
    facilityAddress?: string | null;
    facilityCity?: string | null;
    facilityZip?: string | null;
    facilityType?: string | null;
  } | undefined,
  gis: CaliforniaPhase14GisProbeRow,
): boolean {
  if (!download) return false;
  const dlName = normalizeName(download.facilityName);
  const gisName = normalizeName(gis.NAME);
  const dlAddr = normalizeAddr(download.facilityAddress);
  const gisAddr = normalizeAddr(gis.RES_STREET_ADDR);
  const dlZip = text(download.facilityZip).slice(0, 5);
  const gisZip = text(String(gis.RES_ZIP_CODE ?? "")).slice(0, 5);
  const nameOk = Boolean(dlName && gisName && (dlName === gisName || dlName.includes(gisName) || gisName.includes(dlName)));
  const addrOk = Boolean(dlAddr && gisAddr && (dlAddr === gisAddr || dlAddr.includes(gisAddr) || gisAddr.includes(dlAddr)));
  const zipOk = Boolean(dlZip && gisZip && dlZip === gisZip);
  // Require ZIP + (name or address) — same spirit as Phase 9 corroboration.
  return zipOk && (nameOk || addrOk);
}

function normalizeName(value: string | null | undefined): string {
  return text(value).toUpperCase().replace(/[^A-Z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeAddr(value: string | null | undefined): string {
  return text(value).toUpperCase()
    .replace(/\b(STREET|ST|AVENUE|AVE|BOULEVARD|BLVD|DRIVE|DR|ROAD|RD|LANE|LN|COURT|CT)\b/g, "")
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function finishCoord(
  input: {
    facilityNumber: string;
    file: "RCFE" | "ARF";
    priorMatchKind: string;
    facilityDetail: {
      found: boolean | null;
      liveFacilityNumber: string | null;
      liveStatus: string | null;
    };
  },
  chosen: CaliforniaPhase14GisProbeRow | null,
  identifierRelation: CaliforniaPhase14CoordinateExceptionFinding["identifierRelation"],
  resolution: CaliforniaPhase14CoordinateExceptionResolution,
  rationale: string,
  gisHitCount: number,
): CaliforniaPhase14CoordinateExceptionFinding {
  const lat = chosen ? text(chosen.FAC_LATITUDE) || null : null;
  const lon = chosen ? text(chosen.FAC_LONGITUDE) || null : null;
  const valid = assessCaliforniaPhase14Coordinates(lat, lon);
  const adopt = resolution.startsWith("resolved") && valid;
  return {
    facilityNumber: text(input.facilityNumber),
    file: input.file,
    priorMatchKind: input.priorMatchKind,
    facilityDetailFound: input.facilityDetail.found,
    liveFacilityNumber: input.facilityDetail.liveFacilityNumber,
    liveStatus: input.facilityDetail.liveStatus,
    identifierRelation,
    gisHitCount,
    gisLicenseId: chosen ? text(String(chosen.FAC_NBR ?? "")) || null : null,
    latitude: adopt ? lat : null,
    longitude: adopt ? lon : null,
    coordinatesValid: adopt,
    resolution,
    fabricatedCoordinates: false,
    geocoded: false,
    rationale,
  };
}

export type CaliforniaPhase14ExceptionSummary = {
  observedOn: string | null;
  disclosureExceptions: {
    investigated: number;
    resolvedExactOfficialIdWorks: number;
    confirmedAmbiguous: number;
    confirmedInvalidRefuseClosed: number;
    unresolved: number;
    inconclusive: number;
  };
  coordinateExceptions: {
    investigated: number;
    resolvedWithOfficialCoords: number;
    confirmedStillUnresolved: number;
    inconclusive: number;
    fabricatedCoordinates: 0;
    geocoded: 0;
    /** Baseline unresolved count preserved unless authoritative resolutions reduce it. */
    baselineUnresolved: 28;
    remainingUnresolvedAfterPhase14: number;
  };
  newlyDiscoveredIdentityMismatches: number;
  sampleIsStatewideConclusion: false;
  publication: "unpublished";
  ownerClaimEligible: false;
};

export function summarizeCaliforniaPhase14Exceptions(input: {
  observedOn?: string | null;
  disclosureFindings: readonly CaliforniaPhase14DisclosureExceptionFinding[];
  coordinateFindings: readonly CaliforniaPhase14CoordinateExceptionFinding[];
}): CaliforniaPhase14ExceptionSummary {
  const disclosureExceptions = {
    investigated: input.disclosureFindings.length,
    resolvedExactOfficialIdWorks: 0,
    confirmedAmbiguous: 0,
    confirmedInvalidRefuseClosed: 0,
    unresolved: 0,
    inconclusive: 0,
  };
  for (const row of input.disclosureFindings) {
    if (row.resolution === "resolved-exact-official-id-works") {
      disclosureExceptions.resolvedExactOfficialIdWorks += 1;
    } else if (row.resolution === "confirmed-ambiguous-truncated-request") {
      disclosureExceptions.confirmedAmbiguous += 1;
    } else if (row.resolution === "confirmed-invalid-id-refuse-closed") {
      disclosureExceptions.confirmedInvalidRefuseClosed += 1;
    } else if (row.resolution === "inconclusive-transport") {
      disclosureExceptions.inconclusive += 1;
    } else {
      disclosureExceptions.unresolved += 1;
    }
  }

  let resolvedWithOfficialCoords = 0;
  let confirmedStillUnresolved = 0;
  let inconclusive = 0;
  let newlyDiscoveredIdentityMismatches = 0;
  for (const row of input.coordinateFindings) {
    if (
      row.resolution === "resolved-exact-gis-id-with-valid-coords"
      || row.resolution === "resolved-leading-zero-identity-corroborated"
    ) {
      resolvedWithOfficialCoords += 1;
    } else if (row.resolution === "inconclusive-transport") {
      inconclusive += 1;
      confirmedStillUnresolved += 1;
    } else {
      confirmedStillUnresolved += 1;
    }
    if (
      row.identifierRelation === "mismatch"
      || row.identifierRelation === "leading-zero-canonicalization"
    ) {
      newlyDiscoveredIdentityMismatches += 1;
    }
  }

  const remainingUnresolvedAfterPhase14 = Math.max(
    0,
    28 - resolvedWithOfficialCoords,
  );

  return {
    observedOn: input.observedOn ?? null,
    disclosureExceptions,
    coordinateExceptions: {
      investigated: input.coordinateFindings.length,
      resolvedWithOfficialCoords,
      confirmedStillUnresolved,
      inconclusive,
      fabricatedCoordinates: 0,
      geocoded: 0,
      baselineUnresolved: 28,
      remainingUnresolvedAfterPhase14,
    },
    newlyDiscoveredIdentityMismatches,
    sampleIsStatewideConclusion: false,
    publication: "unpublished",
    ownerClaimEligible: false,
  };
}

export function californiaPhase14AllowsCoordinateFabrication(): false {
  return false;
}
