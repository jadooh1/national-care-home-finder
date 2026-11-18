export const CALIFORNIA_FRESHNESS_OBSERVED_ON = "2026-11-13";

export const CALIFORNIA_OPEN_DATA_PACKAGE = "ccl-facilities";
export const CALIFORNIA_OPEN_DATA_ACCRUAL_PERIODICITY = "other";
export const CALIFORNIA_OPEN_DATA_TEMPORAL_COVERAGE = "Data as of 05252025";

export const CALIFORNIA_GIS_PACKAGE = "community-care-licensing-facilities";
export const CALIFORNIA_GIS_ACCRUAL_PERIODICITY = "other";
export const CALIFORNIA_GIS_TEMPORAL_COVERAGE = "Other";
export const CALIFORNIA_GIS_LAYER_NAME = "Master_CCL_County_Intersect_2023";
export const CALIFORNIA_GIS_DATA_LAST_EDIT = "2026-11-12T16:42:49.900Z";
export const CALIFORNIA_GIS_HAS_STATIC_DATA = true;
export const CALIFORNIA_GIS_STATUS_FIELD = "STATUS";
export const CALIFORNIA_GIS_STATUS_TYPE = "integer";
export const CALIFORNIA_GIS_STATUS_DOMAIN_PUBLISHED = false;

export const CALIFORNIA_AUTHORITATIVE_EXPORT_DATE = null;
export const CALIFORNIA_CONFIRMED_STATUS_CONFLICTS = 2;
export const CALIFORNIA_INCONCLUSIVE_TIMED_OUT_REQUESTS = 7;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type CaliforniaReadinessClass =
  | "verified-source-evidence"
  | "historical-or-stale"
  | "confirmed-status-conflict"
  | "missing-or-inconclusive"
  | "publication-blocker";

export const CALIFORNIA_READINESS_EVIDENCE = [
  {
    id: "open-data-package-has-no-documented-cadence",
    value: CALIFORNIA_OPEN_DATA_ACCRUAL_PERIODICITY,
    className: "verified-source-evidence",
  },
  {
    id: "open-data-temporal-coverage-is-file-date-text",
    value: CALIFORNIA_OPEN_DATA_TEMPORAL_COVERAGE,
    className: "historical-or-stale",
  },
  {
    id: "gis-service-edit-clock",
    value: CALIFORNIA_GIS_DATA_LAST_EDIT,
    className: "historical-or-stale",
  },
  {
    id: "gis-layer-name",
    value: CALIFORNIA_GIS_LAYER_NAME,
    className: "historical-or-stale",
  },
  {
    id: "two-open-data-licensed-rows-have-live-closure-text",
    value: String(CALIFORNIA_CONFIRMED_STATUS_CONFLICTS),
    className: "confirmed-status-conflict",
  },
  {
    id: "seven-live-requests-timed-out",
    value: String(CALIFORNIA_INCONCLUSIVE_TIMED_OUT_REQUESTS),
    className: "missing-or-inconclusive",
  },
  {
    id: "gis-status-code-has-no-published-domain",
    value: CALIFORNIA_GIS_STATUS_TYPE,
    className: "missing-or-inconclusive",
  },
  {
    id: "eight-digit-live-check-was-not-completed",
    value: "ccrc-live-check-incomplete",
    className: "missing-or-inconclusive",
  },
  {
    id: "no-authoritative-export-date",
    value: "unpublished",
    className: "publication-blocker",
  },
] as const satisfies readonly {
  id: string;
  value: string;
  className: CaliforniaReadinessClass;
}[];

export function adoptCaliforniaExportDate(candidate: string | null): null {
  if (candidate == null || ISO_DATE.test(candidate)) return null;
  return null;
}

export function historicalLicensedIsCurrentlyActive(): false {
  return false;
}

export function mayRepresentCaliforniaRecordAsCurrentlyActive(input: {
  openDataStatus: string;
  liveStatus: string | null;
  identifierMatched: boolean;
  httpStatus: number | null;
}): boolean {
  if (adoptCaliforniaExportDate(CALIFORNIA_AUTHORITATIVE_EXPORT_DATE) == null) return false;
  return input.openDataStatus === "LICENSED"
    && input.httpStatus === 200
    && input.identifierMatched
    && input.liveStatus === "Licensed";
}

export function californiaPublicationReadiness() {
  return {
    publication: "unpublished" as const,
    observedOn: CALIFORNIA_FRESHNESS_OBSERVED_ON,
    authoritativeExportDate: CALIFORNIA_AUTHORITATIVE_EXPORT_DATE,
    updateFrequencyDocumented: false,
    bulkStatusVocabularyPublished: CALIFORNIA_GIS_STATUS_DOMAIN_PUBLISHED,
    gisDataIsStatic: CALIFORNIA_GIS_HAS_STATIC_DATA,
    historicalLicensedIsCurrentlyActive: historicalLicensedIsCurrentlyActive(),
    confirmedStatusConflicts: CALIFORNIA_CONFIRMED_STATUS_CONFLICTS,
    inconclusiveTimedOutRequests: CALIFORNIA_INCONCLUSIVE_TIMED_OUT_REQUESTS,
    publicDirectoryPermitted: false as const,
  };
}
