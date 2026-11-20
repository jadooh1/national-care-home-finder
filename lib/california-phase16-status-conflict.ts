/**
 * California Phase 16 — preserved regression investigation of licensing-status conflict
 * `502701867` (DownloadStateData LICENSED vs FacilityDetail Pending Incomplete
 * Application). Compares authoritative status values, dates, facility identity,
 * and source provenance. Does not invent equivalence or resolution.
 * Facility remains unknown-ineligible / unpublished / unclaimable until
 * reliable evidence supports a different classification.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE16_STATUS_CONFLICT_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE16_STATUS_CONFLICT_FACILITY_NUMBER = "502701867";

export const CALIFORNIA_PHASE16_FACILITY_DETAIL_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/";

export const CALIFORNIA_PHASE16_FACILITY_DETAIL_PAGE =
  "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/502701867";

export const CALIFORNIA_PHASE16_DOWNLOAD_API =
  "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData";

export const CALIFORNIA_PHASE16_CCL_FEATURE_SERVER_QUERY =
  "https://services.arcgis.com/XLPEppdz2H9dOiqp/arcgis/rest/services/CDSS_CCL_Facilities/FeatureServer/0/query";

export type CaliforniaPhase16ConflictHypothesis =
  | "reporting-delay"
  | "record-reuse"
  | "substantive-inconsistency"
  | "download-mislabel-never-licensed"
  | "insufficient-evidence";

export type CaliforniaPhase16ConflictRelation =
  | "match"
  | "documented-coarsening"
  | "conflict"
  | "missing"
  | "inconclusive"
  | "invalid-id";

export type CaliforniaPhase16ConflictEligibility =
  | "active-candidate"
  | "active-restricted"
  | "pending-ineligible"
  | "closed-ineligible"
  | "withdrawn-ineligible"
  | "invalid-id-ineligible"
  | "unknown-ineligible";

export type CaliforniaPhase16ConflictResolution =
  | "resolved-match"
  | "resolved-documented-coarsening"
  | "unresolved-conflict-keep-unknown-ineligible"
  | "inconclusive-transport";

export type CaliforniaPhase16SourceSnapshot = {
  source:
    | "download-state-data"
    | "facility-detail"
    | "arcgis-ccl-facilities";
  observedOn: string | null;
  facilityNumber: string | null;
  facilityName: string | null;
  facilityAddress: string | null;
  facilityCity: string | null;
  facilityZip: string | null;
  facilityType: string | null;
  status: string | null;
  licenseFirstDate: string | null;
  licenseEffectiveDate: string | null;
  closedDate: string | null;
  lastVisitDate: string | null;
  capacity: string | null;
  httpStatus?: number | null;
  sha256OrQueryNote?: string | null;
  filenameIsoCandidate?: string | null;
};

export type CaliforniaPhase16IdentityComparison = {
  facilityNumberExact: boolean;
  nameExact: boolean;
  addressExact: boolean;
  cityExact: boolean;
  zipExact: boolean;
  typeExact: boolean;
  capacityExact: boolean;
  lastVisitDateExact: boolean;
  overallIdentityMatched: boolean;
  recordReuseSupported: boolean;
  rationale: string;
};

export type CaliforniaPhase16StatusConflictFinding = {
  facilityNumber: string;
  relation: CaliforniaPhase16ConflictRelation;
  eligibility: CaliforniaPhase16ConflictEligibility;
  resolution: CaliforniaPhase16ConflictResolution;
  evidenceKind: "facility-detail-verified" | "not-applicable";
  neverLicensedMarkersPresent: boolean;
  downloadStatus: string | null;
  liveStatus: string | null;
  downloadLicenseFirstDate: string | null;
  liveLicenseFirstDate: string | null;
  liveLicenseEffectiveDate: string | null;
  identity: CaliforniaPhase16IdentityComparison;
  gisHitCount: number;
  hypothesesConsidered: readonly CaliforniaPhase16ConflictHypothesis[];
  adoptedHypothesis: null;
  inventedEquivalence: false;
  publicationEligible: false;
  ownerClaimEligible: false;
  canPublish: false;
  canClaim: false;
  sources: {
    download: CaliforniaPhase16SourceSnapshot;
    facilityDetail: CaliforniaPhase16SourceSnapshot;
    arcgis: CaliforniaPhase16SourceSnapshot;
  };
  rationale: string;
  safeguards: {
    keepUnknownIneligibleUntilReliableEvidence: true;
    doNotAssumeLicensedEquivalence: true;
    doNotAssumePendingEquivalence: true;
    statewidePublicationBlocker: false;
    individualFacilityException: true;
  };
};

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function upper(value: string | null | undefined): string {
  return text(value).toUpperCase();
}

function normalizeIdentity(value: string | null | undefined): string {
  return text(value)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAddr(value: string | null | undefined): string {
  return normalizeIdentity(value)
    .replace(/\b(STREET|ST|AVENUE|AVE|BOULEVARD|BLVD|DRIVE|DR|ROAD|RD|LANE|LN|COURT|CT)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function californiaPhase16HasNeverLicensedMarkers(input: {
  downloadLicenseFirstDate?: string | null;
  liveLicenseFirstDate?: string | null;
  liveLicenseEffectiveDate?: string | null;
}): boolean {
  return text(input.downloadLicenseFirstDate) === ""
    && text(input.liveLicenseFirstDate) === ""
    && text(input.liveLicenseEffectiveDate) === "";
}

/**
 * Compare Download vs FacilityDetail identity fields. Exact ID + strong
 * name/address agreement rejects record-reuse as an explanation.
 */
export function compareCaliforniaPhase16ConflictIdentity(input: {
  download: {
    facilityNumber?: string | null;
    facilityName?: string | null;
    facilityAddress?: string | null;
    facilityCity?: string | null;
    facilityZip?: string | null;
    facilityType?: string | null;
    capacity?: string | null;
    lastVisitDate?: string | null;
  };
  facilityDetail: {
    facilityNumber?: string | null;
    facilityName?: string | null;
    facilityAddress?: string | null;
    facilityCity?: string | null;
    facilityZip?: string | null;
    facilityType?: string | null;
    capacity?: string | null;
    lastVisitDate?: string | null;
  };
}): CaliforniaPhase16IdentityComparison {
  const facilityNumberExact =
    text(input.download.facilityNumber) !== ""
    && text(input.download.facilityNumber) === text(input.facilityDetail.facilityNumber);
  const nameExact =
    normalizeIdentity(input.download.facilityName) !== ""
    && normalizeIdentity(input.download.facilityName)
      === normalizeIdentity(input.facilityDetail.facilityName);
  const addressExact =
    normalizeAddr(input.download.facilityAddress) !== ""
    && normalizeAddr(input.download.facilityAddress)
      === normalizeAddr(input.facilityDetail.facilityAddress);
  const cityExact =
    normalizeIdentity(input.download.facilityCity) !== ""
    && normalizeIdentity(input.download.facilityCity)
      === normalizeIdentity(input.facilityDetail.facilityCity);
  const zipExact =
    text(input.download.facilityZip).slice(0, 5) !== ""
    && text(input.download.facilityZip).slice(0, 5)
      === text(input.facilityDetail.facilityZip).slice(0, 5);
  const typeExact =
    upper(input.download.facilityType) !== ""
    && upper(input.download.facilityType) === upper(input.facilityDetail.facilityType);
  const capacityExact =
    text(input.download.capacity) !== ""
    && text(input.download.capacity) === text(input.facilityDetail.capacity);
  const lastVisitDateExact =
    text(input.download.lastVisitDate) !== ""
    && text(input.download.lastVisitDate) === text(input.facilityDetail.lastVisitDate);

  const overallIdentityMatched =
    facilityNumberExact
    && nameExact
    && addressExact
    && cityExact
    && zipExact;

  // Record reuse would show divergent identity under the same ID. Matching
  // identity across sources does not support reuse.
  const recordReuseSupported = facilityNumberExact && !overallIdentityMatched;

  return {
    facilityNumberExact,
    nameExact,
    addressExact,
    cityExact,
    zipExact,
    typeExact,
    capacityExact,
    lastVisitDateExact,
    overallIdentityMatched,
    recordReuseSupported,
    rationale: overallIdentityMatched
      ? "Exact facility number plus matching name/address/city/ZIP across DownloadStateData and FacilityDetail — record reuse is not supported."
      : facilityNumberExact
        ? "Facility numbers match but supporting identity fields diverge — record reuse remains possible and unresolved."
        : "Facility numbers do not match; identity comparison inconclusive for this conflict pair.",
  };
}

/**
 * Investigate the 502701867 LICENSED vs Pending Incomplete Application conflict.
 * Never invents status equivalence. Keeps unknown-ineligible / unpublishable.
 */
export function investigateCaliforniaPhase16StatusConflict(input: {
  observedOn?: string | null;
  download: {
    facilityNumber?: string | null;
    facilityName?: string | null;
    facilityAddress?: string | null;
    facilityCity?: string | null;
    facilityZip?: string | null;
    facilityType?: string | null;
    status?: string | null;
    licenseFirstDate?: string | null;
    closedDate?: string | null;
    lastVisitDate?: string | null;
    capacity?: string | null;
    httpStatus?: number | null;
    sha256?: string | null;
    filenameIsoCandidate?: string | null;
  };
  facilityDetail: {
    facilityNumber?: string | null;
    facilityName?: string | null;
    facilityAddress?: string | null;
    facilityCity?: string | null;
    facilityZip?: string | null;
    facilityType?: string | null;
    status?: string | null;
    licenseFirstDate?: string | null;
    licenseEffectiveDate?: string | null;
    closedDate?: string | null;
    lastVisitDate?: string | null;
    capacity?: string | null;
    httpStatus?: number | null;
    timedOut?: boolean;
    found?: boolean | null;
  };
  gisHitCount?: number;
}): CaliforniaPhase16StatusConflictFinding {
  const observedOn = input.observedOn ?? CALIFORNIA_PHASE16_STATUS_CONFLICT_OBSERVED_ON;
  const facilityNumber = CALIFORNIA_PHASE16_STATUS_CONFLICT_FACILITY_NUMBER;
  const downloadStatus = text(input.download.status) || null;
  const liveStatus = text(input.facilityDetail.status) || null;
  const downloadLicenseFirstDate = text(input.download.licenseFirstDate) || null;
  const liveLicenseFirstDate = text(input.facilityDetail.licenseFirstDate) || null;
  const liveLicenseEffectiveDate = text(input.facilityDetail.licenseEffectiveDate) || null;
  const neverLicensedMarkersPresent = californiaPhase16HasNeverLicensedMarkers({
    downloadLicenseFirstDate,
    liveLicenseFirstDate,
    liveLicenseEffectiveDate,
  });
  const identity = compareCaliforniaPhase16ConflictIdentity({
    download: {
      facilityNumber: input.download.facilityNumber ?? facilityNumber,
      facilityName: input.download.facilityName,
      facilityAddress: input.download.facilityAddress,
      facilityCity: input.download.facilityCity,
      facilityZip: input.download.facilityZip,
      facilityType: input.download.facilityType,
      capacity: input.download.capacity,
      lastVisitDate: input.download.lastVisitDate,
    },
    facilityDetail: {
      facilityNumber: input.facilityDetail.facilityNumber ?? facilityNumber,
      facilityName: input.facilityDetail.facilityName,
      facilityAddress: input.facilityDetail.facilityAddress,
      facilityCity: input.facilityDetail.facilityCity,
      facilityZip: input.facilityDetail.facilityZip,
      facilityType: input.facilityDetail.facilityType,
      capacity: input.facilityDetail.capacity,
      lastVisitDate: input.facilityDetail.lastVisitDate,
    },
  });
  const gisHitCount = Math.max(0, Math.floor(input.gisHitCount ?? 0));

  const sources = {
    download: {
      source: "download-state-data" as const,
      observedOn,
      facilityNumber: text(input.download.facilityNumber) || facilityNumber,
      facilityName: text(input.download.facilityName) || null,
      facilityAddress: text(input.download.facilityAddress) || null,
      facilityCity: text(input.download.facilityCity) || null,
      facilityZip: text(input.download.facilityZip) || null,
      facilityType: text(input.download.facilityType) || null,
      status: downloadStatus,
      licenseFirstDate: downloadLicenseFirstDate,
      licenseEffectiveDate: null,
      closedDate: text(input.download.closedDate) || null,
      lastVisitDate: text(input.download.lastVisitDate) || null,
      capacity: text(input.download.capacity) || null,
      httpStatus: input.download.httpStatus ?? null,
      sha256OrQueryNote: input.download.sha256 ?? null,
      filenameIsoCandidate: input.download.filenameIsoCandidate ?? null,
    },
    facilityDetail: {
      source: "facility-detail" as const,
      observedOn,
      facilityNumber: text(input.facilityDetail.facilityNumber) || facilityNumber,
      facilityName: text(input.facilityDetail.facilityName) || null,
      facilityAddress: text(input.facilityDetail.facilityAddress) || null,
      facilityCity: text(input.facilityDetail.facilityCity) || null,
      facilityZip: text(input.facilityDetail.facilityZip) || null,
      facilityType: text(input.facilityDetail.facilityType) || null,
      status: liveStatus,
      licenseFirstDate: liveLicenseFirstDate,
      licenseEffectiveDate: liveLicenseEffectiveDate,
      closedDate: text(input.facilityDetail.closedDate) || null,
      lastVisitDate: text(input.facilityDetail.lastVisitDate) || null,
      capacity: text(input.facilityDetail.capacity) || null,
      httpStatus: input.facilityDetail.httpStatus ?? null,
      sha256OrQueryNote: `${CALIFORNIA_PHASE16_FACILITY_DETAIL_API}${facilityNumber}`,
      filenameIsoCandidate: null,
    },
    arcgis: {
      source: "arcgis-ccl-facilities" as const,
      observedOn,
      facilityNumber,
      facilityName: null,
      facilityAddress: null,
      facilityCity: null,
      facilityZip: null,
      facilityType: null,
      status: null,
      licenseFirstDate: null,
      licenseEffectiveDate: null,
      closedDate: null,
      lastVisitDate: null,
      capacity: null,
      httpStatus: null,
      sha256OrQueryNote: `FAC_NBR=${facilityNumber}; hitCount=${gisHitCount}`,
      filenameIsoCandidate: null,
    },
  };

  if (
    input.facilityDetail.timedOut === true
    || input.facilityDetail.httpStatus === 0
  ) {
    return {
      facilityNumber,
      relation: "inconclusive",
      eligibility: "unknown-ineligible",
      resolution: "inconclusive-transport",
      evidenceKind: "not-applicable",
      neverLicensedMarkersPresent,
      downloadStatus,
      liveStatus,
      downloadLicenseFirstDate,
      liveLicenseFirstDate,
      liveLicenseEffectiveDate,
      identity,
      gisHitCount,
      hypothesesConsidered: ["insufficient-evidence"],
      adoptedHypothesis: null,
      inventedEquivalence: false,
      publicationEligible: false,
      ownerClaimEligible: false,
      canPublish: false,
      canClaim: false,
      sources,
      rationale:
        "FacilityDetail transport failure; conflict remains inconclusive. Keep unknown-ineligible; do not invent status equivalence.",
      safeguards: {
        keepUnknownIneligibleUntilReliableEvidence: true,
        doNotAssumeLicensedEquivalence: true,
        doNotAssumePendingEquivalence: true,
        statewidePublicationBlocker: false,
        individualFacilityException: true,
      },
    };
  }

  const downloadUpper = upper(downloadStatus);
  const liveUpper = upper(liveStatus);
  const licensedVsPendingIncomplete =
    downloadUpper === "LICENSED"
    && liveUpper === "PENDING INCOMPLETE APPLICATION";

  const hypothesesConsidered: CaliforniaPhase16ConflictHypothesis[] = [
    "reporting-delay",
    "record-reuse",
    "substantive-inconsistency",
    "download-mislabel-never-licensed",
  ];

  // Identity match rejects record-reuse. Empty license-first on a Download
  // LICENSED row plus live Pending Incomplete Application is a conflict, but
  // none of the hypotheses is adopted as a resolution without CDSS confirmation.
  let rationale =
    "DownloadStateData LICENSED conflicts with FacilityDetail Pending Incomplete Application. ";
  if (identity.overallIdentityMatched) {
    rationale +=
      "Facility identity matches across sources (same number/name/address/city/ZIP), so record reuse is not supported. ";
  }
  if (neverLicensedMarkersPresent) {
    rationale +=
      "Never-licensed markers are present (empty Download License First Date and empty FacilityDetail license dates), which is inconsistent with a verified Licensed status and compatible with a never-licensed pending application — but Download still labels LICENSED. ";
  }
  if (gisHitCount === 0) {
    rationale +=
      "ArcGIS CCL layer has no FAC_NBR hit, so GIS cannot corroborate either status. ";
  }
  rationale +=
    "Possible explanations include reporting delay between the weekly DownloadStateData snapshot and live FacilityDetail, or a substantive Download mislabel of a pending incomplete application. "
    + "Do not invent equivalence. Do not adopt Licensed or Pending as resolved. "
    + "Keep eligibility unknown-ineligible; facility cannot be published or claimed.";

  return {
    facilityNumber,
    relation: licensedVsPendingIncomplete || downloadUpper !== liveUpper
      ? "conflict"
      : "match",
    eligibility: "unknown-ineligible",
    resolution: "unresolved-conflict-keep-unknown-ineligible",
    evidenceKind: "facility-detail-verified",
    neverLicensedMarkersPresent,
    downloadStatus,
    liveStatus,
    downloadLicenseFirstDate,
    liveLicenseFirstDate,
    liveLicenseEffectiveDate,
    identity,
    gisHitCount,
    hypothesesConsidered,
    adoptedHypothesis: null,
    inventedEquivalence: false,
    publicationEligible: false,
    ownerClaimEligible: false,
    canPublish: false,
    canClaim: false,
    sources,
    rationale,
    safeguards: {
      keepUnknownIneligibleUntilReliableEvidence: true,
      doNotAssumeLicensedEquivalence: true,
      doNotAssumePendingEquivalence: true,
      statewidePublicationBlocker: false,
      individualFacilityException: true,
    },
  };
}

/**
 * Hard publication / claim gate for the conflicting facility. Always false
 * while the conflict remains unresolved.
 */
export function californiaPhase16ConflictFacilityAllowsPublication(
  finding: Pick<
    CaliforniaPhase16StatusConflictFinding,
    "facilityNumber" | "resolution" | "eligibility" | "canPublish"
  >,
): false {
  void finding;
  return false;
}

export function californiaPhase16ConflictFacilityAllowsOwnerClaim(
  finding: Pick<
    CaliforniaPhase16StatusConflictFinding,
    "facilityNumber" | "resolution" | "eligibility" | "canClaim"
  >,
): false {
  void finding;
  return false;
}

/** Phase 16 fixture-shaped baseline evidence for regression tests. */
export const CALIFORNIA_PHASE16_STATUS_CONFLICT_BASELINE_EVIDENCE = {
  facilityNumber: CALIFORNIA_PHASE16_STATUS_CONFLICT_FACILITY_NUMBER,
  file: "ARF" as const,
  download: {
    facilityNumber: "502701867",
    facilityName: "DORSAKU RESIDENTIAL",
    facilityAddress: "4373 VANGUARD DRIVE",
    facilityCity: "MODESTO",
    facilityZip: "95356",
    facilityType: "ADULT RESIDENTIAL",
    status: "LICENSED",
    licenseFirstDate: "",
    closedDate: "",
    lastVisitDate: "9/14/2026",
    capacity: "4",
    filenameIsoCandidate: "2026-11-15",
  },
  facilityDetail: {
    facilityNumber: "502701867",
    facilityName: "DORSAKU RESIDENTIAL",
    facilityAddress: "4373 VANGUARD DRIVE",
    facilityCity: "MODESTO",
    facilityZip: "95356",
    facilityType: "ADULT RESIDENTIAL",
    status: "Pending Incomplete Application",
    licenseFirstDate: "",
    licenseEffectiveDate: "",
    closedDate: "",
    lastVisitDate: "9/14/2026",
    capacity: "4",
    httpStatus: 200,
    found: true,
  },
  gisHitCount: 0,
} as const;
