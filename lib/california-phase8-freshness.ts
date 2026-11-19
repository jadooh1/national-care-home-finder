/**
 * California Phase 8 — official-data freshness reassessment (read-only).
 * Distinguishes official export dates from filenames and retrieval timestamps.
 * Gate stays BLOCKED unless a verified authoritative ISO export date exists.
 */

export const CALIFORNIA_PHASE8_FRESHNESS_OBSERVED_ON = "2026-11-19";

export type CaliforniaPhase8FreshnessChannelVerdict =
  | "rejected-non-authoritative"
  | "absent"
  | "accepted-authoritative-iso";

export type CaliforniaPhase8FreshnessChannel = {
  id: string;
  channel: string;
  observedValue: string | null;
  verdict: CaliforniaPhase8FreshnessChannelVerdict;
  rationale: string;
};

/**
 * Phase 8 freshness channels. Continues Phase 7 probes and adds deeper CDSS
 * documentation / metadata checks. No channel currently yields an accepted
 * authoritative ISO export date.
 */
export const CALIFORNIA_PHASE8_FRESHNESS_CHANNELS: readonly CaliforniaPhase8FreshnessChannel[] = [
  {
    id: "download-content-disposition-filename-mmddyyyy",
    channel: "DownloadStateData Content-Disposition filename stamp",
    observedValue: "11152026 → iso-candidate 2026-11-15",
    verdict: "rejected-non-authoritative",
    rationale:
      "Filename MMDDYYYY is an attachment label only; not an official ISO export timestamp.",
  },
  {
    id: "download-http-last-modified",
    channel: "DownloadStateData HTTP Last-Modified",
    observedValue: null,
    verdict: "absent",
    rationale: "Response headers omit Last-Modified on RCFE and ARF downloads.",
  },
  {
    id: "download-http-date",
    channel: "DownloadStateData HTTP Date (response clock)",
    observedValue: "present (response generation clock)",
    verdict: "rejected-non-authoritative",
    rationale: "HTTP Date is the response generation clock, not a dataset export date.",
  },
  {
    id: "download-csv-file-date-column",
    channel: "DownloadStateData CSV file_date column",
    observedValue: null,
    verdict: "absent",
    rationale: "CSV header has no file_date column (unlike historical CHHS dumps).",
  },
  {
    id: "download-client-retrieval-timestamp",
    channel: "Local download / agent retrieval timestamp",
    observedValue: null,
    verdict: "rejected-non-authoritative",
    rationale:
      "Retrieval timestamp must never substitute for an authoritative export date.",
  },
  {
    id: "facilitydetail-export-timestamp",
    channel: "FacilityDetail JSON export/version timestamp fields",
    observedValue: null,
    verdict: "absent",
    rationale:
      "FacilityDetail exposes license/visit dates and CAPACITY/STATUS but no roster export-date field.",
  },
  {
    id: "transparency-openapi-swagger",
    channel: "Transparency API OpenAPI / swagger discovery",
    observedValue: "swagger.json / openapi.json / api/Help → HTTP 404",
    verdict: "absent",
    rationale:
      "No public OpenAPI document describing an export-date or dataset-version endpoint.",
  },
  {
    id: "ccld-pin-24-01-transparency-site",
    channel: "CCLD Transparency Site PIN 24-01 documentation",
    observedValue: "describes Download Data / Facility Detail; no ISO export date field",
    verdict: "absent",
    rationale:
      "Official PIN describes site features and five-year retention; it does not document a bulk-export ISO timestamp.",
  },
  {
    id: "ccld-download-data-page-copy",
    channel: "Transparency Download Data page visible copy / help text",
    observedValue: "no authoritative ISO export-date statement observed",
    verdict: "absent",
    rationale:
      "Page instructs users to download statewide CSV groups; it does not publish an official export ISO date for the attachment.",
  },
  {
    id: "chhs-file-date-text",
    channel: "Historical CHHS open-data file_date text",
    observedValue: "05252025",
    verdict: "rejected-non-authoritative",
    rationale:
      "CHHS raw file_date text is not an ISO export date and is not the live DownloadStateData channel.",
  },
  {
    id: "chhs-package-metadata-modified",
    channel: "CHHS CKAN package metadata_modified / temporal coverage",
    observedValue: "package metadata clocks / 'Data as of 05252025' prose",
    verdict: "rejected-non-authoritative",
    rationale:
      "CKAN metadata_modified and temporal-coverage prose are catalog clocks, not DownloadStateData export dates.",
  },
  {
    id: "gis-data-last-edit",
    channel: "ArcGIS FeatureServer dataLastEdit / editingInfo",
    observedValue: "layer editingInfo / dataLastEdit present on service",
    verdict: "rejected-non-authoritative",
    rationale:
      "GIS edit clocks are not DownloadStateData export dates and must not unlock publication.",
  },
  {
    id: "publish-data-ca-catalog-update",
    channel: "publish.data.ca.gov CCL facilities catalog / resource update",
    observedValue: "portal resource metadata update timestamps",
    verdict: "rejected-non-authoritative",
    rationale:
      "Open-data portal catalog updates are not authoritative facility-roster export dates.",
  },
  {
    id: "official-iso-export-timestamp-channel",
    channel: "Verified official CDSS ISO export-timestamp channel",
    observedValue: null,
    verdict: "absent",
    rationale:
      "No official CDSS channel returned a verified ISO export date for DownloadStateData in Phase 7–8 probes.",
  },
] as const;

export const CALIFORNIA_PHASE8_FRESHNESS_REQUIREMENT = {
  requiresAuthoritativeIsoExportDate: true,
  acceptsFilenameMmddyyyyAlone: false,
  acceptsDownloadTimestampAlone: false,
  acceptsHttpDateAlone: false,
  acceptsHttpLastModifiedAlone: false,
  acceptsChhsFileDateTextAlone: false,
  acceptsChhsPackageMetadataAlone: false,
  acceptsGisDataLastEditAlone: false,
  acceptsPortalCatalogUpdateAlone: false,
  currentAuthoritativeIsoExportDate: null as null,
  gateBlockedReason:
    "No authoritative ISO export date verified on any official CDSS channel; publication gate stays blocked.",
} as const;

export type CaliforniaPhase8FreshnessEvaluation = {
  observedOn: string;
  authoritativeIsoExportDate: null;
  satisfied: false;
  acceptedChannels: number;
  rejectedChannels: number;
  absentChannels: number;
  channels: readonly CaliforniaPhase8FreshnessChannel[];
  reason: string;
  gate: "blocked";
  distinguishesFilenameFromExportDate: true;
  distinguishesRetrievalTimestampFromExportDate: true;
};

export function evaluateCaliforniaPhase8Freshness(
  options: { observedOn?: string } = {},
): CaliforniaPhase8FreshnessEvaluation {
  const channels = CALIFORNIA_PHASE8_FRESHNESS_CHANNELS;
  return {
    observedOn: options.observedOn ?? CALIFORNIA_PHASE8_FRESHNESS_OBSERVED_ON,
    authoritativeIsoExportDate: null,
    satisfied: false,
    acceptedChannels: channels.filter(c => c.verdict === "accepted-authoritative-iso").length,
    rejectedChannels: channels.filter(c => c.verdict === "rejected-non-authoritative").length,
    absentChannels: channels.filter(c => c.verdict === "absent").length,
    channels,
    reason: CALIFORNIA_PHASE8_FRESHNESS_REQUIREMENT.gateBlockedReason,
    gate: "blocked",
    distinguishesFilenameFromExportDate: true,
    distinguishesRetrievalTimestampFromExportDate: true,
  };
}

/**
 * Adopt only a verified official ISO export timestamp. Filenames, retrieval
 * timestamps, HTTP clocks, CHHS text, and GIS/portal clocks never qualify.
 */
export function adoptCaliforniaPhase8AuthoritativeExportDate(
  candidate: string | null | undefined,
  options: {
    source?:
      | "download-filename-mmddyyyy"
      | "download-retrieval-timestamp"
      | "http-date"
      | "http-last-modified"
      | "chhs-file-date-text"
      | "chhs-package-metadata"
      | "gis-data-last-edit"
      | "portal-catalog-update"
      | "official-iso-export-timestamp";
  } = {},
): string | null {
  const value = String(candidate ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  if (options.source !== "official-iso-export-timestamp") return null;
  return value;
}
