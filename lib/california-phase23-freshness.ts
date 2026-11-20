/**
 * California Phase 23 — freshness reaffirmation for final readiness package.
 * Does not invent ISO dates. Does not send CDSS email.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE23_FRESHNESS_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE23_BASELINE_DOWNLOAD_SHA256 = {
  rcfe: "e7de752883225faec4d5b0d73007cad48b9039370219514f40e84881f348728e",
  arf: "f2cf8a87d0b91534564136c52b02dcd4827a39369504c064f190201981889fbe",
} as const;

export const CALIFORNIA_PHASE23_FRESHNESS_REAFFIRMATION = {
  observedOn: CALIFORNIA_PHASE23_FRESHNESS_OBSERVED_ON,
  priorPhaseEvidence: "phase22",
  authoritativeIsoExportDate: null as null,
  acceptsFilenameMmddyyyyAlone: false as const,
  acceptsWebsiteLastModifiedAlone: false as const,
  acceptsWeeklyFaqAlone: false as const,
  acceptsCatalogMetadataAlone: false as const,
  acceptsHttpTransportClocksAlone: false as const,
  filenameIsoCandidateRejected: "2026-11-15",
  officialUpdateCadenceStatement: "The data is updated weekly.",
  officialUpdateCadenceSatisfiesIsoExportRequirement: false as const,
  downloadSha256Baseline: CALIFORNIA_PHASE23_BASELINE_DOWNLOAD_SHA256,
  cdssClarification: {
    status: "sent-awaiting-response" as const,
    mailboxCheckAvailable: false as const,
    duplicateInquiryAllowed: false as const,
    duplicateInquirySent: false as const,
  },
  globalBlockerUnchanged: true as const,
  gate: "blocked" as const,
  policy: "require-official-iso-export-channel" as const,
  note:
    "Phase 23 reaffirms Phase 22 channel verdicts. No authoritative ISO export/version stamp for DownloadStateData. Do not resend CDSS inquiry.",
} as const;

export function evaluateCaliforniaPhase23Freshness() {
  return CALIFORNIA_PHASE23_FRESHNESS_REAFFIRMATION;
}
