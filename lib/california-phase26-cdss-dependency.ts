/**
 * California Phase 26 — CDSS / freshness dependency (no repeat investigation, no send).
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE26_CDSS_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE26_CDSS_STATUS = {
  authoritativeIsoExportDate: null,
  globalBlockerUnchanged: true as const,
  priorInquiryStatus: "sent-awaiting-response" as const,
  followUpDraftStatus: "draft-do-not-send" as const,
  duplicateInquiryAllowed: false as const,
  mailSentThisPhase: false as const,
  mailboxAccessibleThisEnvironment: false as const,
  newAuthoritativeEvidenceFound: false as const,
  exactEvidenceStillNeeded:
    "Source-issued ISO as-of date or authoritative dataset version stamp that uniquely identifies a DownloadStateData attachment (not filename MMDDYYYY, FAQ cadence, or website Last-Modified).",
} as const;

export function evaluateCaliforniaPhase26CdssDependency() {
  return {
    observedOn: CALIFORNIA_PHASE26_CDSS_OBSERVED_ON,
    ...CALIFORNIA_PHASE26_CDSS_STATUS,
    note:
      "Phase 24 already documented freshness channels and prepared a draft-do-not-send follow-up. Phase 26 does not resend, does not re-crawl, and does not invent ISO dates.",
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
  };
}
