/**
 * California Phase 9 — official-data freshness policy (read-only).
 * Deepens Phase 7–8 probes of CDSS Transparency / CCLD / open-data surfaces.
 * Gate stays BLOCKED unless a verified authoritative ISO export date exists.
 */

export const CALIFORNIA_PHASE9_FRESHNESS_OBSERVED_ON = "2026-11-19";

export type CaliforniaPhase9FreshnessChannelVerdict =
  | "rejected-non-authoritative"
  | "absent"
  | "accepted-authoritative-iso";

export type CaliforniaPhase9FreshnessChannel = {
  id: string;
  channel: string;
  observedValue: string | null;
  verdict: CaliforniaPhase9FreshnessChannelVerdict;
  rationale: string;
};

/**
 * Phase 9 freshness channels. Continues Phase 8 and adds CCLD Data page,
 * Facility Search welcome copy, nested FacilityDetail inspection, and
 * publish.data.ca.gov / CHHS DCAT clocks. No accepted authoritative ISO.
 */
export const CALIFORNIA_PHASE9_FRESHNESS_CHANNELS: readonly CaliforniaPhase9FreshnessChannel[] = [
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
    id: "download-http-etag",
    channel: "DownloadStateData HTTP ETag",
    observedValue: null,
    verdict: "absent",
    rationale: "No ETag observed on DownloadStateData responses in Phase 9 probes.",
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
    id: "facilitydetail-nested-export-timestamp",
    channel: "FacilityDetail nested JSON export/version timestamp fields",
    observedValue:
      "FacilityDetail exposes CAPACITY/STATUS/license+visit dates; no roster export ISO",
    verdict: "absent",
    rationale:
      "Nested FacilityDetail payload has facility-level dates only; no bulk-export or dataset-version field.",
  },
  {
    id: "transparency-openapi-swagger",
    channel: "Transparency API OpenAPI / swagger discovery",
    observedValue: "api root / swagger.json → HTTP 404",
    verdict: "absent",
    rationale:
      "No public OpenAPI document describing an export-date or dataset-version endpoint.",
  },
  {
    id: "transparency-download-page-html",
    channel: "Transparency Download Data page HTML",
    observedValue: "no authoritative ISO export-date statement observed",
    verdict: "absent",
    rationale:
      "Page instructs users to download statewide CSV groups; it does not publish an official export ISO date.",
  },
  {
    id: "ccld-pin-24-01-transparency-site",
    channel: "CCLD Transparency Site PIN 24-01 documentation",
    observedValue:
      "describes Download Data / Facility Detail / five-year retention; no ISO export field",
    verdict: "absent",
    rationale:
      "Official PIN describes site features and retention; it does not document a bulk-export ISO timestamp.",
  },
  {
    id: "cdss-ccld-data-page",
    channel: "CDSS CCLD Data page (annual facility/capacity reports)",
    observedValue:
      "annual Facility and Capacity Data PDFs from June 2017; not DownloadStateData export dates",
    verdict: "rejected-non-authoritative",
    rationale:
      "Annual aggregate PDF reports are not the live Transparency DownloadStateData roster export date.",
  },
  {
    id: "cdss-facility-search-welcome",
    channel: "CDSS Facility Search welcome / five-year retention copy",
    observedValue: "five years of facility information; no bulk export ISO date",
    verdict: "absent",
    rationale:
      "Welcome copy documents retention and search features, not an authoritative export timestamp.",
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
    id: "chhs-package-metadata-dcat",
    channel: "CHHS CKAN / DCAT package metadata_modified and dcat_modified",
    observedValue: "package metadata / DCAT clocks present",
    verdict: "rejected-non-authoritative",
    rationale:
      "CKAN/DCAT catalog clocks are portal metadata, not DownloadStateData export dates.",
  },
  {
    id: "gis-data-last-edit",
    channel: "ArcGIS FeatureServer editingInfo dataLastEditDate",
    observedValue: "layer editingInfo / dataLastEditDate present on service",
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
      "No official CDSS channel returned a verified ISO export date for DownloadStateData in Phase 7–9 probes.",
  },
] as const;

export const CALIFORNIA_PHASE9_FRESHNESS_REQUIREMENT = {
  requiresAuthoritativeIsoExportDate: true,
  acceptsFilenameMmddyyyyAlone: false,
  acceptsDownloadTimestampAlone: false,
  acceptsHttpDateAlone: false,
  acceptsHttpLastModifiedAlone: false,
  acceptsHttpEtagAlone: false,
  acceptsChhsFileDateTextAlone: false,
  acceptsChhsPackageMetadataAlone: false,
  acceptsGisDataLastEditAlone: false,
  acceptsPortalCatalogUpdateAlone: false,
  acceptsAnnualCcldPdfReportsAlone: false,
  currentAuthoritativeIsoExportDate: null as null,
  gateBlockedReason:
    "No authoritative ISO export date verified on any official CDSS channel; publication gate stays blocked.",
} as const;

export type CaliforniaPhase9FreshnessRecommendation = {
  keepGateBlocked: true;
  authoritativeIsoExportDate: null;
  policy:
    | "require-official-iso-export-channel";
  summary: string;
  acceptedEvidence: string[];
  rejectedEvidence: string[];
  nextHumanActions: string[];
};

export const CALIFORNIA_PHASE9_FRESHNESS_RECOMMENDATION: CaliforniaPhase9FreshnessRecommendation = {
  keepGateBlocked: true,
  authoritativeIsoExportDate: null,
  policy: "require-official-iso-export-channel",
  summary:
    "Evidence-based recommendation: keep the California publication gate BLOCKED until CDSS publishes a verified authoritative ISO export date (or equivalent version stamp) for DownloadStateData. Filename MMDDYYYY (observed 2026-11-15), retrieval timestamps, HTTP clocks, CHHS/DCAT metadata, GIS editingInfo, portal catalog updates, annual CCLD PDF reports, and FacilityDetail license/visit dates are all non-authoritative for roster freshness.",
  acceptedEvidence: [
    "DownloadStateData remains the strongest statewide roster channel for RCFE/ARF.",
    "Filename stamp yields a non-authoritative ISO candidate (2026-11-15) that must stay labeled as such.",
    "PIN 24-01 and Facility Search welcome document site features and ~five-year retention, not an export ISO field.",
  ],
  rejectedEvidence: [
    "Filename MMDDYYYY alone",
    "Agent/client retrieval timestamp",
    "HTTP Date / Last-Modified / ETag",
    "CHHS file_date text and CKAN/DCAT package clocks",
    "ArcGIS dataLastEditDate / editingInfo",
    "publish.data.ca.gov catalog resource timestamps",
    "Annual CCLD Facility and Capacity PDF reports",
    "FacilityDetail license/visit/closed dates",
  ],
  nextHumanActions: [
    "Ask CDSS / CCL webmaster whether DownloadStateData exposes an official export ISO date or dataset version (API field, header, or documented schedule).",
    "If CDSS confirms a channel, capture the evidence and only then reconsider the freshness gate.",
    "Until then, keep California unpublished and owner-claim-ineligible.",
  ],
};

export type CaliforniaPhase9FreshnessEvaluation = {
  observedOn: string;
  authoritativeIsoExportDate: null;
  satisfied: false;
  acceptedChannels: number;
  rejectedChannels: number;
  absentChannels: number;
  channels: readonly CaliforniaPhase9FreshnessChannel[];
  reason: string;
  gate: "blocked";
  distinguishesFilenameFromExportDate: true;
  distinguishesRetrievalTimestampFromExportDate: true;
  recommendation: CaliforniaPhase9FreshnessRecommendation;
};

export function evaluateCaliforniaPhase9Freshness(
  options: { observedOn?: string } = {},
): CaliforniaPhase9FreshnessEvaluation {
  const channels = CALIFORNIA_PHASE9_FRESHNESS_CHANNELS;
  return {
    observedOn: options.observedOn ?? CALIFORNIA_PHASE9_FRESHNESS_OBSERVED_ON,
    authoritativeIsoExportDate: null,
    satisfied: false,
    acceptedChannels: channels.filter(c => c.verdict === "accepted-authoritative-iso").length,
    rejectedChannels: channels.filter(c => c.verdict === "rejected-non-authoritative").length,
    absentChannels: channels.filter(c => c.verdict === "absent").length,
    channels,
    reason: CALIFORNIA_PHASE9_FRESHNESS_REQUIREMENT.gateBlockedReason,
    gate: "blocked",
    distinguishesFilenameFromExportDate: true,
    distinguishesRetrievalTimestampFromExportDate: true,
    recommendation: CALIFORNIA_PHASE9_FRESHNESS_RECOMMENDATION,
  };
}

/**
 * Adopt only a verified official ISO export timestamp. Filenames, retrieval
 * timestamps, HTTP clocks, CHHS text, GIS/portal clocks, and annual PDFs never
 * qualify.
 */
export function adoptCaliforniaPhase9AuthoritativeExportDate(
  candidate: string | null | undefined,
  options: {
    source?:
      | "download-filename-mmddyyyy"
      | "download-retrieval-timestamp"
      | "http-date"
      | "http-last-modified"
      | "http-etag"
      | "chhs-file-date-text"
      | "chhs-package-metadata"
      | "gis-data-last-edit"
      | "portal-catalog-update"
      | "annual-ccld-pdf-report"
      | "facilitydetail-license-or-visit-date"
      | "official-iso-export-timestamp";
  } = {},
): string | null {
  const value = String(candidate ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  if (options.source !== "official-iso-export-timestamp") return null;
  return value;
}
