/**
 * California Phase 22 — authoritative freshness evidence reassessment.
 * Distinguishes website update time, download filename stamp, and dataset
 * export time. Does not invent an ISO date. Does not send CDSS email.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE22_FRESHNESS_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE22_BASELINE_DOWNLOAD_SHA256 = {
  rcfe: "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
  arf: "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
} as const;

export type CaliforniaPhase22FreshnessChannelVerdict =
  | "rejected-non-authoritative"
  | "absent"
  | "accepted-authoritative-iso"
  | "accepted-policy-only-not-export-date"
  | "mailbox-unavailable"
  | "unchanged-baseline";

export type CaliforniaPhase22FreshnessChannel = {
  id: string;
  channel: string;
  sourceUrl: string | null;
  captureTimeUtc: string | null;
  observedValue: string | null;
  sha256: string | null;
  verdict: CaliforniaPhase22FreshnessChannelVerdict;
  rationale: string;
  /** Explicit clock class so callers never conflate stamps. */
  clockClass:
    | "dataset-export"
    | "download-filename-stamp"
    | "http-transport"
    | "website-static-asset"
    | "catalog-metadata"
    | "client-app-version"
    | "policy-cadence"
    | "agent-retrieval"
    | "mailbox"
    | "integrity-hash"
    | "none";
};

/**
 * Phase 22 freshness channels from live CDSS / catalog probes.
 * Exactly zero channels are accepted as an authoritative ISO export date.
 */
export const CALIFORNIA_PHASE22_FRESHNESS_CHANNELS: readonly CaliforniaPhase22FreshnessChannel[] =
  [
    {
      id: "download-sha256-vs-baseline",
      channel: "DownloadStateData body sha256 vs Phase 10–21 baseline",
      sourceUrl:
        "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData",
      captureTimeUtc: "2026-11-20T19:31:34.524Z",
      observedValue:
        "RCFE e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e; ARF f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe — unchanged",
      sha256: null,
      verdict: "unchanged-baseline",
      clockClass: "integrity-hash",
      rationale:
        "Live Phase 22 download matches baseline byte-for-byte; integrity evidence only, not an ISO export date.",
    },
    {
      id: "download-content-disposition-filename-mmddyyyy",
      channel: "DownloadStateData Content-Disposition filename stamp",
      sourceUrl:
        "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData",
      captureTimeUtc: "2026-11-20T19:31:34.524Z",
      observedValue:
        "ResidentialElderCareFacility11152026.csv / AdultResidentialFacilities11152026.csv → iso-candidate 2026-11-15 (rejected)",
      sha256: null,
      verdict: "rejected-non-authoritative",
      clockClass: "download-filename-stamp",
      rationale:
        "Filename MMDDYYYY is an attachment label only; distinct from dataset export time and website update time; never adopted as authoritative ISO.",
    },
    {
      id: "download-http-last-modified",
      channel: "DownloadStateData HTTP Last-Modified",
      sourceUrl:
        "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData",
      captureTimeUtc: "2026-11-20T19:31:34.524Z",
      observedValue: null,
      sha256: null,
      verdict: "absent",
      clockClass: "http-transport",
      rationale:
        "Response headers omit Last-Modified on RCFE and ARF downloads (header keys observed: cache-control, content-disposition, content-type, date, expires, pragma, set-cookie, strict-transport-security, transfer-encoding, vary, x-powered-by).",
    },
    {
      id: "download-http-etag",
      channel: "DownloadStateData HTTP ETag",
      sourceUrl:
        "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData",
      captureTimeUtc: "2026-11-20T19:31:34.524Z",
      observedValue: null,
      sha256: null,
      verdict: "absent",
      clockClass: "http-transport",
      rationale: "No ETag observed on DownloadStateData responses.",
    },
    {
      id: "download-http-date",
      channel: "DownloadStateData HTTP Date (response clock)",
      sourceUrl:
        "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData",
      captureTimeUtc: "2026-11-20T19:31:34.524Z",
      observedValue: "Fri, 20 Nov 2026 19:31:35 GMT (RCFE)",
      sha256: null,
      verdict: "rejected-non-authoritative",
      clockClass: "http-transport",
      rationale:
        "HTTP Date is the response generation clock, not a dataset export date.",
    },
    {
      id: "download-client-retrieval-timestamp",
      channel: "Local download / agent retrieval timestamp",
      sourceUrl: null,
      captureTimeUtc: "2026-11-20T19:31:34.524Z",
      observedValue: "2026-11-20T19:31:34.524Z (agent clock)",
      sha256: null,
      verdict: "rejected-non-authoritative",
      clockClass: "agent-retrieval",
      rationale:
        "Retrieval timestamp must never substitute for an authoritative export date.",
    },
    {
      id: "transparency-faq-weekly-update",
      channel:
        "Transparency FAQ Download Data: How often is the data updated?",
      sourceUrl:
        "https://www.ccld.dss.ca.gov/transparencyapi/api/FAQ?mode=Public&id=context",
      captureTimeUtc: "2026-11-20T19:30:28.996Z",
      observedValue:
        'Official FAQ answer under <downloaddata>: "The data is updated weekly."',
      sha256:
        "9976c280777757092855304d300d2cceed110e1cd6a3e5eb3f35763bc93a974c",
      verdict: "accepted-policy-only-not-export-date",
      clockClass: "policy-cadence",
      rationale:
        "Authoritative CDSS cadence statement, but weekly cadence alone does not identify the ISO export date of a specific DownloadStateData attachment.",
    },
    {
      id: "downloadstatedata-html-last-modified",
      channel: "downloadstatedata.html HTTP Last-Modified (website asset)",
      sourceUrl:
        "https://www.ccld.dss.ca.gov/carefacilitysearch/downloadstatedata.html",
      captureTimeUtc: "2026-11-20T19:30:28.996Z",
      observedValue: "Fri, 08 May 2026 03:01:06 GMT",
      sha256:
        "0cd9327f81ed71c9a42c63595517fab9c78f9193838276c0c37eab1f8da69d25",
      verdict: "rejected-non-authoritative",
      clockClass: "website-static-asset",
      rationale:
        "Website/static-page Last-Modified is distinct from DownloadStateData export time; do not treat as dataset as-of.",
    },
    {
      id: "downloadstatedata-html-calhhs-copy-note",
      channel: "downloadstatedata.html CalHHS Open Data Portal copy note",
      sourceUrl:
        "https://www.ccld.dss.ca.gov/carefacilitysearch/downloadstatedata.html",
      captureTimeUtc: "2026-11-20T19:30:28.996Z",
      observedValue:
        '"A copy of this data is regularly published to the CalHHS Open Data Portal"',
      sha256:
        "0cd9327f81ed71c9a42c63595517fab9c78f9193838276c0c37eab1f8da69d25",
      verdict: "rejected-non-authoritative",
      clockClass: "policy-cadence",
      rationale:
        "'Regularly' is not an ISO export date; CHHS/portal clocks remain non-authoritative for DownloadStateData.",
    },
    {
      id: "transparency-spa-client-version",
      channel: "Transparency SPA Config.js TVERSION / AppVersion",
      sourceUrl:
        "https://www.ccld.dss.ca.gov/carefacilitysearch/javascript/Config.js",
      captureTimeUtc: "2026-11-20T19:30:28.996Z",
      observedValue: 'TVERSION="11.18.0R"; AppVersion="1.0.1"',
      sha256:
        "dbda1847dfab9610742cc5494198d9584cd97fb99c06fe76c41f3d4e61849800",
      verdict: "rejected-non-authoritative",
      clockClass: "client-app-version",
      rationale:
        "Client application version stamps are not DownloadStateData roster export dates. Config.js Last-Modified Fri, 08 May 2026 03:01:33 GMT is a static asset clock.",
    },
    {
      id: "publish-data-ca-gov-catalog-metadata",
      channel:
        "publish.data.ca.gov Community Care Licensing Facilities package metadata",
      sourceUrl:
        "https://publish.data.ca.gov/api/3/action/package_show?id=community-care-licensing-facilities1",
      captureTimeUtc: "2026-11-20T19:30:53.000Z",
      observedValue:
        "metadata_modified 2026-11-11T00:54:27.606477 — catalog clock only",
      sha256: null,
      verdict: "rejected-non-authoritative",
      clockClass: "catalog-metadata",
      rationale:
        "Portal/catalog metadata clocks are not authoritative DownloadStateData export dates (Issue #131 boundary).",
    },
    {
      id: "openapi-swagger",
      channel: "Transparency API OpenAPI / swagger export-date field",
      sourceUrl:
        "https://www.ccld.dss.ca.gov/transparencyapi/swagger/v1/swagger.json",
      captureTimeUtc: "2026-11-20T19:30:53.000Z",
      observedValue: "HTTP 404",
      sha256: null,
      verdict: "absent",
      clockClass: "none",
      rationale: "No OpenAPI/swagger document available to carry an export stamp.",
    },
    {
      id: "cdss-clarification-mailbox-check",
      channel:
        "Authorized connected mailbox check for CDSS clarification reply",
      sourceUrl: null,
      captureTimeUtc: "2026-11-20T19:31:34.524Z",
      observedValue:
        "No authorized connected mailbox / email MCP available in this agent environment (secrets: VERCEL_TOKEN + NCHF_DEV_* only). Duplicate inquiry not sent.",
      sha256: null,
      verdict: "mailbox-unavailable",
      clockClass: "mailbox",
      rationale:
        "Cannot verify whether CDSS replied from this environment. Clarification status remains sent-awaiting-response. Do not send duplicate inquiries.",
    },
    {
      id: "official-iso-export-timestamp-channel",
      channel:
        "Official ISO export / version stamp channel for DownloadStateData",
      sourceUrl: null,
      captureTimeUtc: "2026-11-20T19:31:34.524Z",
      observedValue: null,
      sha256: null,
      verdict: "absent",
      clockClass: "dataset-export",
      rationale:
        "No verified authoritative ISO export date or source-issued version identifier for a specific DownloadStateData attachment. Global launch blocker unchanged.",
    },
  ] as const;

export const CALIFORNIA_PHASE22_FRESHNESS_REQUIREMENT = {
  requiresAuthoritativeIsoExportDate: true,
  acceptsFilenameMmddyyyyAlone: false,
  acceptsDownloadTimestampAlone: false,
  acceptsHttpDateAlone: false,
  acceptsHttpLastModifiedAlone: false,
  acceptsHttpEtagAlone: false,
  acceptsWeeklyUpdateFaqAlone: false,
  acceptsSpaClientVersionAlone: false,
  acceptsCalhhsCopyNoteAlone: false,
  acceptsPortalCatalogUpdateAlone: false,
  acceptsWebsiteStaticAssetLastModifiedAlone: false,
  acceptsMailboxAbsenceAsCleared: false,
  currentAuthoritativeIsoExportDate: null as null,
  officialUpdateCadenceStatement: "The data is updated weekly." as const,
  officialUpdateCadenceSatisfiesIsoExportRequirement: false,
  policy: "require-official-iso-export-channel" as const,
  distinctions: {
    websiteUpdateTime:
      "downloadstatedata.html Last-Modified Fri, 08 May 2026 03:01:06 GMT (static page asset)",
    downloadFilenameStamp: "11152026 → iso-candidate 2026-11-15 (rejected)",
    datasetExportIso: null,
  },
  gateBlockedReason:
    "No authoritative ISO export date verified for a specific DownloadStateData attachment; official FAQ weekly cadence is policy-only; filename/website/HTTP clocks remain non-authoritative; CDSS reply not observable from this environment; gate stays BLOCKED.",
} as const;

export const CALIFORNIA_PHASE22_CDSS_CLARIFICATION = {
  status: "sent-awaiting-response" as const,
  mailboxCheck: {
    attempted: true,
    available: false as const,
    result: "mailbox-unavailable" as const,
  },
  duplicateInquirySent: false as const,
  duplicateInquiryAllowed: false as const,
  note:
    "Agent environment cannot read the authorized sending mailbox. Human must confirm any CDSS reply. Do not resend.",
} as const;

export function evaluateCaliforniaPhase22Freshness() {
  const acceptedIso = CALIFORNIA_PHASE22_FRESHNESS_CHANNELS.filter(
    c => c.verdict === "accepted-authoritative-iso",
  );
  return {
    observedOn: CALIFORNIA_PHASE22_FRESHNESS_OBSERVED_ON,
    channels: CALIFORNIA_PHASE22_FRESHNESS_CHANNELS,
    requirement: CALIFORNIA_PHASE22_FRESHNESS_REQUIREMENT,
    cdssClarification: CALIFORNIA_PHASE22_CDSS_CLARIFICATION,
    authoritativeIsoExportDate: null as null,
    acceptedAuthoritativeIsoChannelCount: acceptedIso.length,
    globalBlockerUnchanged: true as const,
    gate: "blocked" as const,
  };
}
