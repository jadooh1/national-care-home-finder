/**
 * California Phase 7 — authoritative export-date / freshness channel audit.
 * Read-only investigation of official CDSS metadata, docs, and API surfaces.
 * Never substitutes filename date or download timestamp for an authoritative ISO
 * export date. Gate stays blocked when no verified channel exists.
 */

export const CALIFORNIA_PHASE7_FRESHNESS_OBSERVED_ON = "2026-11-19";

export type CaliforniaPhase7FreshnessChannelVerdict =
  | "rejected-non-authoritative"
  | "absent"
  | "accepted-authoritative-iso";

export type CaliforniaPhase7FreshnessChannel = {
  id: string;
  channel: string;
  observedValue: string | null;
  verdict: CaliforniaPhase7FreshnessChannelVerdict;
  rationale: string;
};

/**
 * Evidence from Phase 7 live probes of DownloadStateData, FacilityDetail,
 * Transparency download page, OpenAPI/swagger discovery, CCLD PIN 24-01,
 * CHHS open-data, and CA GIS open-data catalog metadata.
 */
export const CALIFORNIA_PHASE7_FRESHNESS_CHANNELS: readonly CaliforniaPhase7FreshnessChannel[] = [
  {
    id: "download-content-disposition-filename-mmddyyyy",
    channel: "DownloadStateData Content-Disposition filename stamp",
    observedValue: "11152026 → iso-candidate 2026-11-15",
    verdict: "rejected-non-authoritative",
    rationale:
      "Filename MMDDYYYY is a download attachment label only; not an official ISO export timestamp channel.",
  },
  {
    id: "download-http-last-modified",
    channel: "DownloadStateData HTTP Last-Modified",
    observedValue: null,
    verdict: "absent",
    rationale: "Response headers omit Last-Modified on both RCFE and ARF downloads.",
  },
  {
    id: "download-http-date",
    channel: "DownloadStateData HTTP Date (response clock)",
    observedValue: "present (response generation clock)",
    verdict: "rejected-non-authoritative",
    rationale:
      "HTTP Date is the response generation clock, not a dataset export date.",
  },
  {
    id: "download-csv-file-date-column",
    channel: "DownloadStateData CSV file_date column",
    observedValue: null,
    verdict: "absent",
    rationale: "CSV header has no file_date column (unlike historical CHHS dumps).",
  },
  {
    id: "download-client-timestamp",
    channel: "Local download / agent observation timestamp",
    observedValue: null,
    verdict: "rejected-non-authoritative",
    rationale:
      "Client download time must never substitute for an authoritative export date.",
  },
  {
    id: "facilitydetail-export-timestamp",
    channel: "FacilityDetail JSON export/version timestamp fields",
    observedValue: null,
    verdict: "absent",
    rationale:
      "FacilityDetail payload exposes license/visit dates and CAPACITY/STATUS but no export-date or roster-version field.",
  },
  {
    id: "transparency-openapi-swagger",
    channel: "Transparency API OpenAPI / swagger discovery",
    observedValue: "swagger.json / openapi.json / api/Help → HTTP 404",
    verdict: "absent",
    rationale:
      "No public OpenAPI document describing an export-date or dataset-version endpoint was found.",
  },
  {
    id: "ccld-pin-24-01-transparency-site",
    channel: "CCLD Transparency Site PIN 24-01 documentation",
    observedValue: "describes Download Data / Facility Detail; no ISO export date field",
    verdict: "absent",
    rationale:
      "Official PIN describes site features and five-year retention; it does not document an authoritative bulk-export ISO timestamp.",
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
    id: "gis-data-last-edit",
    channel: "ArcGIS / publish.data.ca.gov layer edit / catalog update clocks",
    observedValue: "portal/resource update timestamps (e.g. 2026-09-30 / dataLastEdit)",
    verdict: "rejected-non-authoritative",
    rationale:
      "Catalog update and GIS dataLastEdit clocks are not DownloadStateData export dates.",
  },
  {
    id: "official-iso-export-timestamp-channel",
    channel: "Verified official CDSS ISO export-timestamp channel",
    observedValue: null,
    verdict: "absent",
    rationale:
      "No official CDSS channel returned a verified ISO export date for DownloadStateData in Phase 7 probes.",
  },
] as const;

export const CALIFORNIA_PHASE7_FRESHNESS_REQUIREMENT = {
  requiresAuthoritativeIsoExportDate: true,
  acceptsFilenameMmddyyyyAlone: false,
  acceptsDownloadTimestampAlone: false,
  acceptsHttpDateAlone: false,
  acceptsHttpLastModifiedAlone: false,
  acceptsChhsFileDateTextAlone: false,
  acceptsGisDataLastEditAlone: false,
  acceptsPortalCatalogUpdateAlone: false,
  currentAuthoritativeIsoExportDate: null as null,
  gateBlockedReason:
    "No authoritative ISO export date verified on any official CDSS channel; publication gate stays blocked.",
} as const;

export type CaliforniaPhase7FreshnessEvaluation = {
  observedOn: string;
  authoritativeIsoExportDate: null;
  satisfied: false;
  acceptedChannels: number;
  rejectedChannels: number;
  absentChannels: number;
  channels: readonly CaliforniaPhase7FreshnessChannel[];
  reason: string;
  gate: "blocked";
};

export function evaluateCaliforniaPhase7Freshness(
  options: { observedOn?: string } = {},
): CaliforniaPhase7FreshnessEvaluation {
  const channels = CALIFORNIA_PHASE7_FRESHNESS_CHANNELS;
  const acceptedChannels = channels.filter(
    c => c.verdict === "accepted-authoritative-iso",
  ).length;
  const rejectedChannels = channels.filter(
    c => c.verdict === "rejected-non-authoritative",
  ).length;
  const absentChannels = channels.filter(c => c.verdict === "absent").length;
  return {
    observedOn: options.observedOn ?? CALIFORNIA_PHASE7_FRESHNESS_OBSERVED_ON,
    authoritativeIsoExportDate: null,
    satisfied: false,
    acceptedChannels,
    rejectedChannels,
    absentChannels,
    channels,
    reason: CALIFORNIA_PHASE7_FRESHNESS_REQUIREMENT.gateBlockedReason,
    gate: "blocked",
  };
}

/**
 * Adopt only a verified official ISO export timestamp. Filename stamps,
 * download timestamps, HTTP clocks, CHHS text, and GIS edit clocks never qualify.
 */
export function adoptCaliforniaPhase7AuthoritativeExportDate(
  candidate: string | null | undefined,
  options: {
    source?:
      | "download-filename-mmddyyyy"
      | "download-timestamp"
      | "http-date"
      | "http-last-modified"
      | "chhs-file-date-text"
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
