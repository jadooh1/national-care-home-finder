/**
 * California Phase 24 — authoritative freshness blocker documentation.
 * Does not invent ISO dates. Does not send CDSS email.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE24_FRESHNESS_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE24_BASELINE_DOWNLOAD_SHA256 = {
  rcfe: "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
  arf: "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
} as const;

export type CaliforniaPhase24FreshnessVerdict =
  | "absent"
  | "rejected-non-authoritative"
  | "accepted-policy-only-not-export-date"
  | "mailbox-unavailable"
  | "unchanged-baseline";

export type CaliforniaPhase24FreshnessFinding = {
  id: string;
  channel: string;
  sourceUrl: string | null;
  observedValue: string | null;
  verdict: CaliforniaPhase24FreshnessVerdict;
  rationale: string;
};

export const CALIFORNIA_PHASE24_FRESHNESS_FINDINGS: readonly CaliforniaPhase24FreshnessFinding[] =
  [
    {
      id: "official-iso-export-channel",
      channel: "Official ISO export / version stamp for DownloadStateData",
      sourceUrl: null,
      observedValue: null,
      verdict: "absent",
      rationale:
        "No source-issued ISO as-of date or authoritative dataset version verified for a specific DownloadStateData attachment. Global launch blocker unchanged.",
    },
    {
      id: "download-filename-mmddyyyy",
      channel: "Content-Disposition filename stamp",
      sourceUrl:
        "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData",
      observedValue: "11152026 → iso-candidate 2026-11-15 (rejected)",
      verdict: "rejected-non-authoritative",
      rationale: "Filename stamp is not an official export date.",
    },
    {
      id: "faq-weekly-cadence",
      channel: "Transparency FAQ Download Data update cadence",
      sourceUrl:
        "https://www.ccld.dss.ca.gov/transparencyapi/api/FAQ?mode=Public&id=context",
      observedValue: '\"The data is updated weekly.\"',
      verdict: "accepted-policy-only-not-export-date",
      rationale: "Authoritative cadence only; does not identify export as-of for an attachment.",
    },
    {
      id: "website-last-modified",
      channel: "downloadstatedata.html Last-Modified",
      sourceUrl:
        "https://www.ccld.dss.ca.gov/carefacilitysearch/downloadstatedata.html",
      observedValue: "Fri, 08 May 2026 03:01:06 GMT (static asset)",
      verdict: "rejected-non-authoritative",
      rationale: "Website asset clock ≠ dataset export time.",
    },
    {
      id: "download-sha256-baseline",
      channel: "DownloadStateData sha256 vs Phase 10–23 baseline",
      sourceUrl:
        "https://www.ccld.dss.ca.gov/transparencyapi/api/DownloadStateData",
      observedValue:
        "RCFE/ARF sha256 unchanged vs Phase 10–23 baseline (integrity only)",
      verdict: "unchanged-baseline",
      rationale: "Integrity evidence, not an ISO export date.",
    },
    {
      id: "cdss-inquiry-mailbox",
      channel: "Authorized mailbox check for prior CDSS clarification reply",
      sourceUrl: null,
      observedValue:
        "Mailbox unavailable in agent environment; prior inquiry remains sent-awaiting-response; duplicate not sent",
      verdict: "mailbox-unavailable",
      rationale:
        "Cannot confirm reply from this environment. Do not send a duplicate of the already-sent inquiry.",
    },
  ] as const;

export const CALIFORNIA_PHASE24_FRESHNESS_REQUIREMENT = {
  requiresAuthoritativeIsoExportDate: true as const,
  acceptsFilenameMmddyyyyAlone: false as const,
  acceptsWebsiteLastModifiedAlone: false as const,
  acceptsWeeklyFaqAlone: false as const,
  acceptsHttpTransportClocksAlone: false as const,
  acceptsCatalogMetadataAlone: false as const,
  currentAuthoritativeIsoExportDate: null as null,
  policy: "require-official-iso-export-channel" as const,
  globalBlockerUnchanged: true as const,
  gate: "blocked" as const,
} as const;

/**
 * Concise follow-up clarification draft for human approval only.
 * Prior Phase 10 inquiry was already sent — this draft is NOT a duplicate send.
 * Status remains draft-do-not-send until a human decides to send a follow-up.
 */
export const CALIFORNIA_PHASE24_CDSS_CLARIFICATION_FOLLOWUP_DRAFT = {
  status: "draft-do-not-send" as const,
  priorInquiryStatus: "sent-awaiting-response" as const,
  duplicateOfPriorInquiry: false as const,
  sendRequiresHumanApproval: true as const,
  toSuggested: ["cclwebmaster@dss.ca.gov", "opendata@cdss.ca.gov"] as const,
  subject:
    "Follow-up (if approved): authoritative as-of / version stamp for CCLD DownloadStateData",
  body: [
    "Hello CCLD Transparency / CDSS Open Data team,",
    "",
    "This is a concise follow-up to our earlier clarification request about the public CCLD Transparency DownloadStateData CSV exports (RCFE and Adult Residential Facilities).",
    "",
    "We still cannot locate a source-issued ISO as-of date or authoritative dataset version for a specific DownloadStateData attachment. We do not treat filename MMDDYYYY stamps, website Last-Modified, HTTP Date, weekly FAQ cadence, or open-data catalog clocks as the export date.",
    "",
    "If available, please point us to the exact field, header, or published statement that provides the authoritative as-of date or version for each RCFE/ARF statewide download.",
    "",
    "Thank you,",
    "National Care Home Finder (development research only; California remains unpublished)",
  ].join("\n"),
  asksFor: [
    "Exact channel for authoritative DownloadStateData as-of date or version stamp",
    "Confirmation if no machine-readable stamp exists and what human-readable as-of may be cited",
  ],
  mustNotTreatAsAuthoritativeUntilConfirmed: [
    "Filename MMDDYYYY",
    "HTTP Date / Last-Modified / ETag",
    "Weekly FAQ cadence alone",
    "Website static-asset Last-Modified",
    "publish.data.ca.gov / CHHS catalog clocks",
    "SPA TVERSION / AppVersion",
    "Agent retrieval timestamp",
  ],
  note:
    "Do not send without human approval. Prefer checking the authorized mailbox for a reply to the original inquiry before any follow-up send.",
} as const;

export function evaluateCaliforniaPhase24Freshness() {
  const acceptedIso = CALIFORNIA_PHASE24_FRESHNESS_FINDINGS.filter(
    f => f.verdict === "absent" && f.id === "official-iso-export-channel",
  );
  return {
    observedOn: CALIFORNIA_PHASE24_FRESHNESS_OBSERVED_ON,
    findings: CALIFORNIA_PHASE24_FRESHNESS_FINDINGS,
    requirement: CALIFORNIA_PHASE24_FRESHNESS_REQUIREMENT,
    authoritativeIsoExportDate: null as null,
    baselineSha256: CALIFORNIA_PHASE24_BASELINE_DOWNLOAD_SHA256,
    cdssClarification: {
      status: "sent-awaiting-response" as const,
      mailboxCheckAvailable: false as const,
      duplicateInquirySent: false as const,
      duplicateInquiryAllowed: false as const,
      followUpDraft: CALIFORNIA_PHASE24_CDSS_CLARIFICATION_FOLLOWUP_DRAFT,
    },
    officialIsoChannelAbsent: acceptedIso.length === 1,
    globalBlockerUnchanged: true as const,
    gate: "blocked" as const,
  };
}
