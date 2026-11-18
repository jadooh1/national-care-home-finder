export const CALIFORNIA_EXPORT_DATE_PUBLISHED = false;
export const CALIFORNIA_DETAIL_API_DOCUMENTED_AS_FILE_STATUS_SOURCE = false;
export const CALIFORNIA_NAME_EVIDENCE = "insufficient" as const;
export const CALIFORNIA_STREET_EVIDENCE = "insufficient" as const;

export const CALIFORNIA_EVIDENCE_STOP = {
  repeatFacilityDetail: false,
  repeatDatastoreHttp500: false,
  repeatTimedOutRequests: false,
  repeatOpenDataDownload: false,
} as const;

export const CALIFORNIA_EXTERNAL_EVIDENCE_GAPS = [
  "no-iso-export-date-in-reviewed-catalog-metadata",
  "facility-detail-api-not-documented-as-file-status-source",
  "facility-name-has-no-official-acceptance-statement",
  "completed-street-response-was-not-classified-against-placeholders",
] as const;

export const CALIFORNIA_IMPLEMENTATION_EVIDENCE_GAPS = [] as const;

export function californiaEvidenceResolved(): false {
  return false;
}
