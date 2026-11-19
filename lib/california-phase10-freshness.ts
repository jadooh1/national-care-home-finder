/**
 * California Phase 10 — conclusive official-data freshness investigation (read-only).
 * Continues Phase 7–9 probes. Discovers the official Transparency FAQ weekly-update
 * statement, SPA client version stamps, Download Data CalHHS-copy note, and Public
 * Portal modernization docs. None of these yield a verified authoritative ISO export
 * date for a specific DownloadStateData attachment, so the publication gate stays
 * BLOCKED.
 */

export const CALIFORNIA_PHASE10_FRESHNESS_OBSERVED_ON = "2026-11-19";

export type CaliforniaPhase10FreshnessChannelVerdict =
  | "rejected-non-authoritative"
  | "absent"
  | "accepted-authoritative-iso"
  | "accepted-policy-only-not-export-date";

export type CaliforniaPhase10FreshnessChannel = {
  id: string;
  channel: string;
  sourceUrl: string | null;
  observedValue: string | null;
  verdict: CaliforniaPhase10FreshnessChannelVerdict;
  rationale: string;
};

/**
 * Phase 10 freshness channels. Carries forward Phase 9 rejects/absents and adds
 * newly probed official surfaces. Exactly zero channels are accepted as an
 * authoritative ISO export date for DownloadStateData.
 */
export const CALIFORNIA_PHASE10_FRESHNESS_CHANNELS: readonly CaliforniaPhase10FreshnessChannel[] = [
  {
    id: "download-content-disposition-filename-mmddyyyy",
    channel: "DownloadStateData Content-Disposition filename stamp",
    sourceUrl:
      "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData",
    observedValue: "11152026 → iso-candidate 2026-11-15 (sha256 unchanged vs Phase 9)",
    verdict: "rejected-non-authoritative",
    rationale:
      "Filename MMDDYYYY is an attachment label only; not an official ISO export timestamp.",
  },
  {
    id: "download-http-last-modified",
    channel: "DownloadStateData HTTP Last-Modified",
    sourceUrl:
      "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData",
    observedValue: null,
    verdict: "absent",
    rationale: "Response headers omit Last-Modified on RCFE and ARF downloads.",
  },
  {
    id: "download-http-date",
    channel: "DownloadStateData HTTP Date (response clock)",
    sourceUrl:
      "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData",
    observedValue: "present (response generation clock)",
    verdict: "rejected-non-authoritative",
    rationale: "HTTP Date is the response generation clock, not a dataset export date.",
  },
  {
    id: "download-http-etag",
    channel: "DownloadStateData HTTP ETag",
    sourceUrl:
      "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData",
    observedValue: null,
    verdict: "absent",
    rationale: "No ETag observed on DownloadStateData responses in Phase 9–10 probes.",
  },
  {
    id: "download-http-cache-control",
    channel: "DownloadStateData Cache-Control / Pragma / Expires",
    sourceUrl:
      "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData",
    observedValue: "no-cache; pragma no-cache; expires -1",
    verdict: "rejected-non-authoritative",
    rationale:
      "Cache directives describe transport caching, not an authoritative export ISO date.",
  },
  {
    id: "download-csv-file-date-column",
    channel: "DownloadStateData CSV file_date / export-date columns",
    sourceUrl:
      "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData",
    observedValue: null,
    verdict: "absent",
    rationale:
      "CSV header has License/Closed/Visit/Complaint date columns only; no file_date or export-date column.",
  },
  {
    id: "download-client-retrieval-timestamp",
    channel: "Local download / agent retrieval timestamp",
    sourceUrl: null,
    observedValue: null,
    verdict: "rejected-non-authoritative",
    rationale:
      "Retrieval timestamp must never substitute for an authoritative export date.",
  },
  {
    id: "transparency-faq-weekly-update",
    channel: "Transparency FAQ Download Data: How often is the data updated?",
    sourceUrl:
      "https://www.ccld.dss.ca.gov/transparencyapi/api/FAQ?mode=Public&id=context",
    observedValue:
      'Official FAQ answer under <downloaddata>: "The data is updated weekly."',
    verdict: "accepted-policy-only-not-export-date",
    rationale:
      "Authoritative CDSS cadence statement for the Transparency Download Data surface, but weekly cadence alone does not identify the ISO export date of a specific DownloadStateData attachment.",
  },
  {
    id: "downloadstatedata-html-calhhs-copy-note",
    channel: "downloadstatedata.html CalHHS Open Data Portal copy note",
    sourceUrl:
      "https://www.ccld.dss.ca.gov/carefacilitysearch/downloadstatedata.html",
    observedValue:
      '"A copy of this data is regularly published to the CalHHS Open Data Portal"',
    verdict: "rejected-non-authoritative",
    rationale:
      "Confirms CHHS is a regularly published copy of Transparency data; 'regularly' is not an ISO export date and CHHS clocks remain non-authoritative for DownloadStateData.",
  },
  {
    id: "transparency-spa-client-version",
    channel: "Transparency SPA Config.js TVERSION / AppVersion",
    sourceUrl:
      "https://www.ccld.dss.ca.gov/carefacilitysearch/javascript/Config.js",
    observedValue: 'TVERSION="11.18.0R"; AppVersion="1.0.1"',
    verdict: "rejected-non-authoritative",
    rationale:
      "Client application version stamps are not DownloadStateData roster export dates.",
  },
  {
    id: "transparency-spa-shell-last-modified",
    channel: "Transparency SPA HTML / template Last-Modified",
    sourceUrl: "https://www.ccld.dss.ca.gov/carefacilitysearch/",
    observedValue: "Fri, 08 May 2026 03:01:06 GMT (static shell / templates)",
    verdict: "rejected-non-authoritative",
    rationale:
      "Static web-asset Last-Modified is unrelated to the CSV roster export date.",
  },
  {
    id: "facilitydetail-nested-export-timestamp",
    channel: "FacilityDetail nested JSON export/version timestamp fields",
    sourceUrl:
      "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
    observedValue:
      "FacilityDetail exposes CAPACITY/STATUS/license+visit dates; no roster export ISO",
    verdict: "absent",
    rationale:
      "Nested FacilityDetail payload has facility-level dates only; no bulk-export or dataset-version field.",
  },
  {
    id: "transparency-openapi-swagger",
    channel: "Transparency API OpenAPI / swagger discovery",
    sourceUrl: "https://www.ccld.dss.ca.gov/transparencyapi/",
    observedValue: "api root / swagger.json / openapi.json / api/Help → HTTP 404",
    verdict: "absent",
    rationale:
      "No public OpenAPI document describing an export-date or dataset-version endpoint.",
  },
  {
    id: "ccld-pin-24-01-transparency-site",
    channel: "CCLD Transparency Site PIN 24-01 documentation",
    sourceUrl:
      "https://www.cdss.ca.gov/inforesources/community-care-licensing/policy/provider-information-notices/adult-senior-care",
    observedValue:
      "describes Download Data / Facility Detail / five-year retention; no ISO export field",
    verdict: "absent",
    rationale:
      "Official PIN describes site features and retention; it does not document a bulk-export ISO timestamp.",
  },
  {
    id: "ccld-public-portal-pin-26-10",
    channel: "CCLD Public Portal Project / PIN 26-10-CCLD",
    sourceUrl:
      "https://www.cdss.ca.gov/inforesources/cdss-programs/community-care-licensing/ccld-public-portal-project",
    observedValue:
      "Provider/public portal modernization; release schedule through Summer 2027; no DownloadStateData export ISO",
    verdict: "rejected-non-authoritative",
    rationale:
      "Public Portal / FMS modernization docs do not publish a DownloadStateData export date or version stamp.",
  },
  {
    id: "cdss-ccld-data-page",
    channel: "CDSS CCLD Data page (annual facility/capacity reports)",
    sourceUrl:
      "https://www.cdss.ca.gov/inforesources/cdss-programs/community-care-licensing/ccld-data",
    observedValue:
      "annual Facility and Capacity Data PDFs from June 2017; not DownloadStateData export dates",
    verdict: "rejected-non-authoritative",
    rationale:
      "Annual aggregate PDF reports are not the live Transparency DownloadStateData roster export date.",
  },
  {
    id: "cdss-facility-search-welcome",
    channel: "CDSS Facility Search welcome / five-year retention copy",
    sourceUrl:
      "https://www.cdss.ca.gov/inforesources/community-care-licensing/facility-search-welcome",
    observedValue: "five years of facility information; no bulk export ISO date",
    verdict: "absent",
    rationale:
      "Welcome copy documents retention and search features, not an authoritative export timestamp.",
  },
  {
    id: "chhs-file-date-text",
    channel: "Historical CHHS open-data file_date / temporal coverage text",
    sourceUrl: "https://data.chhs.ca.gov/dataset/ccl-facilities",
    observedValue: "Data as of 05252025 / file_date text 05252025",
    verdict: "rejected-non-authoritative",
    rationale:
      "CHHS raw file_date text is not an ISO export date and is a regularly published copy, not live DownloadStateData.",
  },
  {
    id: "chhs-package-metadata-dcat",
    channel: "CHHS CKAN / DCAT package metadata_modified and dcat_modified",
    sourceUrl: "https://data.chhs.ca.gov/api/3/action/package_show?id=ccl-facilities",
    observedValue: "package metadata_modified 2025-11-06T23:26:08Z",
    verdict: "rejected-non-authoritative",
    rationale:
      "CKAN/DCAT catalog clocks are portal metadata, not DownloadStateData export dates.",
  },
  {
    id: "gis-data-last-edit",
    channel: "ArcGIS FeatureServer editingInfo dataLastEditDate",
    sourceUrl: null,
    observedValue: "layer editingInfo / dataLastEditDate present on service",
    verdict: "rejected-non-authoritative",
    rationale:
      "GIS edit clocks are not DownloadStateData export dates and must not unlock publication.",
  },
  {
    id: "publish-data-ca-catalog-update",
    channel: "publish.data.ca.gov CCL facilities catalog / resource update",
    sourceUrl:
      "https://publish.data.ca.gov/api/3/action/package_show?id=community-care-licensing-facilities",
    observedValue:
      "accrualPeriodicity=irregular; metadata_modified 2026-11-11T00:54:29Z",
    verdict: "rejected-non-authoritative",
    rationale:
      "Open-data portal catalog updates are not authoritative facility-roster export dates.",
  },
  {
    id: "official-iso-export-timestamp-channel",
    channel: "Verified official CDSS ISO export-timestamp channel",
    sourceUrl: null,
    observedValue: null,
    verdict: "absent",
    rationale:
      "No official CDSS channel returned a verified ISO export date for a specific DownloadStateData attachment in Phase 7–10 probes.",
  },
] as const;

export const CALIFORNIA_PHASE10_FRESHNESS_REQUIREMENT = {
  requiresAuthoritativeIsoExportDate: true,
  acceptsFilenameMmddyyyyAlone: false,
  acceptsDownloadTimestampAlone: false,
  acceptsHttpDateAlone: false,
  acceptsHttpLastModifiedAlone: false,
  acceptsHttpEtagAlone: false,
  acceptsHttpCacheControlAlone: false,
  acceptsWeeklyUpdateFaqAlone: false,
  acceptsSpaClientVersionAlone: false,
  acceptsSpaShellLastModifiedAlone: false,
  acceptsCalhhsCopyNoteAlone: false,
  acceptsChhsFileDateTextAlone: false,
  acceptsChhsPackageMetadataAlone: false,
  acceptsGisDataLastEditAlone: false,
  acceptsPortalCatalogUpdateAlone: false,
  acceptsAnnualCcldPdfReportsAlone: false,
  acceptsPublicPortalScheduleAlone: false,
  currentAuthoritativeIsoExportDate: null as null,
  officialUpdateCadenceStatement: "The data is updated weekly." as const,
  officialUpdateCadenceSatisfiesIsoExportRequirement: false,
  gateBlockedReason:
    "No authoritative ISO export date verified for a specific DownloadStateData attachment; official FAQ weekly cadence is policy-only and does not unlock the publication gate.",
} as const;

export type CaliforniaPhase10CdssClarificationRequest = {
  status: "draft-do-not-send";
  toSuggested: string[];
  subject: string;
  body: string;
  asksFor: string[];
  mustNotTreatAsAuthoritativeUntilConfirmed: string[];
};

/**
 * Draft CDSS clarification request. Do NOT send without human approval.
 */
export const CALIFORNIA_PHASE10_CDSS_CLARIFICATION_REQUEST_DRAFT: CaliforniaPhase10CdssClarificationRequest =
  {
    status: "draft-do-not-send",
    toSuggested: ["cclwebmaster@dss.ca.gov", "opendata@cdss.ca.gov"],
    subject:
      "Clarification request: authoritative export date for CCLD Transparency DownloadStateData",
    body: [
      "Hello CCLD Transparency / CDSS Open Data team,",
      "",
      "We use the public CCLD Transparency Site Download Data feature (DownloadStateData CSV exports for Residential Care Facilities for the Elderly and Adult Residential Facilities) as a read-only reference for California facility licensing research. We keep California unpublished until we can cite an authoritative export or version stamp for each bulk download.",
      "",
      "We observed the official Transparency FAQ answer under Download Data: \"How often is the data updated?\" → \"The data is updated weekly.\" We also see Content-Disposition filenames such as ResidentialElderCareFacility11152026.csv, but we do not treat filename MMDDYYYY stamps, HTTP Date, retrieval timestamps, CHHS/open-data portal clocks, ArcGIS editingInfo, or SPA client versions as authoritative export dates.",
      "",
      "Could you please clarify:",
      "1) Does DownloadStateData expose an official ISO export date, dataset version, or equivalent source-issued stamp (API field, response header, documented schedule with verifiable as-of date, or other channel)?",
      "2) If yes, what is the exact field/header/document to use for RCFE and ARF statewide downloads?",
      "3) If no machine-readable stamp exists, is there an authoritative human-readable as-of date CDSS publishes for each weekly refresh that we may cite?",
      "",
      "Thank you for any guidance.",
      "",
      "— National Care Home Finder (development research only; no production publication of California data)",
    ].join("\n"),
    asksFor: [
      "Authoritative ISO export date or dataset version for DownloadStateData RCFE/ARF attachments",
      "Exact channel (API field, header, or documented as-of statement)",
      "Whether weekly FAQ cadence maps to a citable as-of date for each refresh",
    ],
    mustNotTreatAsAuthoritativeUntilConfirmed: [
      "Filename MMDDYYYY",
      "HTTP Date / Last-Modified / ETag / Cache-Control",
      "Agent retrieval timestamp",
      "CHHS file_date text and CKAN/DCAT clocks",
      "publish.data.ca.gov catalog timestamps",
      "ArcGIS dataLastEditDate",
      "SPA TVERSION / AppVersion",
      "SPA HTML Last-Modified",
      "Weekly FAQ cadence alone",
      "Public Portal / FMS release schedule",
    ],
  };

export type CaliforniaPhase10FreshnessRecommendation = {
  keepGateBlocked: true;
  authoritativeIsoExportDate: null;
  officialWeeklyCadenceDocumented: true;
  weeklyCadenceUnlocksPublication: false;
  policy: "require-official-iso-export-channel";
  summary: string;
  acceptedEvidence: string[];
  rejectedEvidence: string[];
  nextHumanActions: string[];
  cdssRequestDraftReady: true;
  cdssRequestSendRequiresHumanApproval: true;
};

export const CALIFORNIA_PHASE10_FRESHNESS_RECOMMENDATION: CaliforniaPhase10FreshnessRecommendation =
  {
    keepGateBlocked: true,
    authoritativeIsoExportDate: null,
    officialWeeklyCadenceDocumented: true,
    weeklyCadenceUnlocksPublication: false,
    policy: "require-official-iso-export-channel",
    summary:
      "Phase 10 conclusive finding: CDSS officially states Transparency Download Data is updated weekly (FAQ), and downloadstatedata.html notes a regularly published CalHHS copy. Neither statement, nor filename MMDDYYYY (2026-11-15), SPA client versions, HTTP/portal/GIS clocks, or Public Portal docs, provides a verified authoritative ISO export date for a specific DownloadStateData attachment. Keep the publication gate BLOCKED under require-official-iso-export-channel. A draft clarification to cclwebmaster@dss.ca.gov / opendata@cdss.ca.gov is prepared and must not be sent without human approval.",
    acceptedEvidence: [
      "DownloadStateData remains the strongest statewide roster channel for RCFE/ARF (sha256 unchanged vs Phase 9).",
      'Official FAQ Download Data answer: "The data is updated weekly." (policy cadence only).',
      "downloadstatedata.html states a copy is regularly published to CalHHS Open Data Portal.",
      "PIN 24-01 and Facility Search welcome document site features and ~five-year retention.",
    ],
    rejectedEvidence: [
      "Filename MMDDYYYY alone (ISO candidate 2026-11-15)",
      "Weekly FAQ cadence as a substitute for a specific export ISO date",
      "Agent/client retrieval timestamp",
      "HTTP Date / Last-Modified / ETag / Cache-Control",
      "SPA TVERSION/AppVersion and HTML Last-Modified",
      "CHHS file_date text and CKAN/DCAT package clocks",
      "ArcGIS dataLastEditDate / editingInfo",
      "publish.data.ca.gov catalog resource timestamps",
      "Annual CCLD Facility and Capacity PDF reports",
      "FacilityDetail license/visit/closed dates",
      "CCLD Public Portal / PIN 26-10 release schedule",
    ],
    nextHumanActions: [
      "Review and, if approved, send the drafted CDSS clarification request (do not send from this agent task).",
      "If CDSS confirms a channel, capture the evidence and only then reconsider the freshness gate.",
      "Until then, keep California unpublished and owner-claim-ineligible.",
    ],
    cdssRequestDraftReady: true,
    cdssRequestSendRequiresHumanApproval: true,
  };

export type CaliforniaPhase10FreshnessEvaluation = {
  observedOn: string;
  authoritativeIsoExportDate: null;
  satisfied: false;
  acceptedAuthoritativeIsoChannels: number;
  acceptedPolicyOnlyChannels: number;
  rejectedChannels: number;
  absentChannels: number;
  channels: readonly CaliforniaPhase10FreshnessChannel[];
  reason: string;
  gate: "blocked";
  distinguishesFilenameFromExportDate: true;
  distinguishesRetrievalTimestampFromExportDate: true;
  distinguishesWeeklyCadenceFromExportDate: true;
  recommendation: CaliforniaPhase10FreshnessRecommendation;
  cdssClarificationRequest: CaliforniaPhase10CdssClarificationRequest;
};

export function evaluateCaliforniaPhase10Freshness(
  options: { observedOn?: string } = {},
): CaliforniaPhase10FreshnessEvaluation {
  const channels = CALIFORNIA_PHASE10_FRESHNESS_CHANNELS;
  return {
    observedOn: options.observedOn ?? CALIFORNIA_PHASE10_FRESHNESS_OBSERVED_ON,
    authoritativeIsoExportDate: null,
    satisfied: false,
    acceptedAuthoritativeIsoChannels: channels.filter(
      c => c.verdict === "accepted-authoritative-iso",
    ).length,
    acceptedPolicyOnlyChannels: channels.filter(
      c => c.verdict === "accepted-policy-only-not-export-date",
    ).length,
    rejectedChannels: channels.filter(
      c => c.verdict === "rejected-non-authoritative",
    ).length,
    absentChannels: channels.filter(c => c.verdict === "absent").length,
    channels,
    reason: CALIFORNIA_PHASE10_FRESHNESS_REQUIREMENT.gateBlockedReason,
    gate: "blocked",
    distinguishesFilenameFromExportDate: true,
    distinguishesRetrievalTimestampFromExportDate: true,
    distinguishesWeeklyCadenceFromExportDate: true,
    recommendation: CALIFORNIA_PHASE10_FRESHNESS_RECOMMENDATION,
    cdssClarificationRequest: CALIFORNIA_PHASE10_CDSS_CLARIFICATION_REQUEST_DRAFT,
  };
}

/**
 * Adopt only a verified official ISO export timestamp. Filenames, retrieval
 * timestamps, HTTP clocks, weekly FAQ cadence, SPA versions, CHHS text,
 * GIS/portal clocks, Public Portal schedules, and annual PDFs never qualify.
 */
export function adoptCaliforniaPhase10AuthoritativeExportDate(
  candidate: string | null | undefined,
  options: {
    source?:
      | "download-filename-mmddyyyy"
      | "download-retrieval-timestamp"
      | "http-date"
      | "http-last-modified"
      | "http-etag"
      | "http-cache-control"
      | "transparency-faq-weekly-update"
      | "spa-client-version"
      | "spa-shell-last-modified"
      | "calhhs-copy-note"
      | "chhs-file-date-text"
      | "chhs-package-metadata"
      | "gis-data-last-edit"
      | "portal-catalog-update"
      | "annual-ccld-pdf-report"
      | "facilitydetail-license-or-visit-date"
      | "public-portal-schedule"
      | "official-iso-export-timestamp";
  } = {},
): string | null {
  const value = String(candidate ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  if (options.source !== "official-iso-export-timestamp") return null;
  return value;
}
