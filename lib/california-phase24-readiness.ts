/**
 * California Phase 24 — decision-ready freshness + launch-dependency readiness.
 * Gate BLOCKED. STOP. No exclusion activation. No CDSS send. No statewide crawl.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE24_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE24_GLOBAL_LAUNCH_BLOCKERS = [
  "authoritative-iso-export-date",
  "cdss-clarification-reply",
  "exclusion-activation",
  "status-mapping-approvals",
  "source-licensing-public-disclosures",
  "qa-and-separate-production-approval",
] as const;

export const CALIFORNIA_PHASE24_NEXT_APPROVALS_ONLY = [
  {
    id: "mailbox-check-cdss-reply",
    action: "Human checks authorized mailbox for CDSS reply (do not resend original).",
  },
  {
    id: "optional-followup-send",
    action:
      "If no reply, human may approve sending the Phase 24 follow-up draft — agents must not send.",
  },
  {
    id: "adopt-iso-export-channel",
    action: "If CDSS provides ISO/version stamp, capture evidence and clear freshness blocker.",
  },
  {
    id: "activate-exclusions-and-mappings",
    action:
      "Approve Provisional / Pending Increase mappings and activate offline matrix in app/DB.",
  },
  {
    id: "public-disclosures-and-terms",
    action: "Confirm source licensing/terms and public attribution readiness.",
  },
  {
    id: "qa-and-gate-open",
    action: "Human QA sign-off then separate explicit production / gate-open approval.",
  },
] as const;

export const CALIFORNIA_PHASE24_PUBLICATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  exclusionActivatedInAppOrDb: false as const,
  statewideCrawlRepeated: false as const,
  duplicateCdssInquirySent: false as const,
  clarificationFollowUpDraftStatus: "draft-do-not-send" as const,
  rationale:
    "Authoritative freshness blocker remains unresolved; follow-up CDSS draft is prepared but not sent; Phase 23 counts reconciled; launch dependencies still require future authorization. STOP.",
} as const;

export const CALIFORNIA_PHASE24_READINESS_DECISION = {
  observedOn: CALIFORNIA_PHASE24_OBSERVED_ON,
  phase: 24 as const,
  title: "California Phase 24 freshness blocker + launch-dependency decisions",
  publication: "unpublished" as const,
  ownerClaimEligible: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  stopGo: CALIFORNIA_PHASE24_PUBLICATION_STOP_GO,
  globalLaunchBlockers: CALIFORNIA_PHASE24_GLOBAL_LAUNCH_BLOCKERS,
  nextApprovalsOnly: CALIFORNIA_PHASE24_NEXT_APPROVALS_ONLY,
  baselinePreserved: {
    officialRecords: 24377,
    publicationCandidates: 15451,
    verifiedOfficialCoords: 15423,
    unresolvedCoords: 28,
    listingExclusionsInCandidates: 88,
    otherwiseClearOffline: 15363,
    mapOnlySuppressions: 27,
  },
  cdssClarification: {
    status: "sent-awaiting-response" as const,
    mailboxCheckAvailable: false as const,
    duplicateInquiryAllowed: false as const,
    followUpDraftStatus: "draft-do-not-send" as const,
  },
  phase23CountsReconciled: true as const,
  authoritativeIsoExportDate: null,
  statewideRosterVerificationComplete: true as const,
} as const;

export function evaluateCaliforniaPhase24Readiness() {
  return CALIFORNIA_PHASE24_READINESS_DECISION;
}

export function californiaPhase24AllowsPublication(): false {
  return false;
}
