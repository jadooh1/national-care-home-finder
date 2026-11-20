/**
 * California Phase 23 — final development-only readiness decision.
 * Gate BLOCKED. STOP. No exclusion activation. No statewide re-crawl.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE23_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE23_GLOBAL_LAUNCH_BLOCKERS = [
  "authoritative-iso-export-date",
  "cdss-clarification-reply",
  "exclusion-activation",
  "unique-valid-identifiers-policy-bound",
  "source-licensing-terms",
  "qa-signoff",
] as const;

export const CALIFORNIA_PHASE23_FACILITY_EXCEPTIONS = [
  "five-provisional-license-conflicts",
  "sixty-six-licensed-pending-increase-overlays",
  "prior-controls-including-502701867",
  "fourteen-licensed-missing-date",
  "twenty-eight-unresolved-coordinates-map-only",
  "invalid-id-95354",
  "withdrawn-regression-controls",
] as const;

export const CALIFORNIA_PHASE23_NEXT_APPROVALS_ONLY = [
  {
    id: "mailbox-check-cdss-reply",
    action: "Human checks authorized mailbox for CDSS export-date reply (do not resend).",
  },
  {
    id: "adopt-iso-export-channel",
    action: "Capture and adopt authoritative ISO/version stamp if CDSS reply provides one.",
  },
  {
    id: "provisional-and-pending-increase-mappings",
    action: "Approve or reject publication mappings for Provisional License and Licensed/Pending Increase.",
  },
  {
    id: "activate-exclusion-policy",
    action: "Separate approval to activate offline eligibility matrix / exclusions in app/DB.",
  },
  {
    id: "source-licensing-terms",
    action: "Confirm source licensing/terms acceptance before any publication path.",
  },
  {
    id: "qa-launch-signoff",
    action: "Human QA sign-off after other statewide blockers clear.",
  },
  {
    id: "gate-open-request",
    action: "Explicit human approval to open the California publication gate (out of scope here).",
  },
] as const;

export const CALIFORNIA_PHASE23_PUBLICATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  exclusionActivatedInAppOrDb: false as const,
  statewideCrawlRepeated: false as const,
  duplicateCdssInquirySent: false as const,
  rationale:
    "Final offline eligibility matrix and launch controls are prepared, but statewide blockers remain (ISO export date, CDSS reply, exclusion activation, source licensing, QA). Facility exceptions do not clear the gate. STOP.",
} as const;

export const CALIFORNIA_PHASE23_READINESS_DECISION = {
  observedOn: CALIFORNIA_PHASE23_OBSERVED_ON,
  phase: 23 as const,
  title: "California Phase 23 final development-only launch-readiness package",
  publication: "unpublished" as const,
  ownerClaimEligible: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  stopGo: CALIFORNIA_PHASE23_PUBLICATION_STOP_GO,
  globalLaunchBlockers: CALIFORNIA_PHASE23_GLOBAL_LAUNCH_BLOCKERS,
  facilityExceptions: CALIFORNIA_PHASE23_FACILITY_EXCEPTIONS,
  nextApprovalsOnly: CALIFORNIA_PHASE23_NEXT_APPROVALS_ONLY,
  baselinePreserved: {
    officialRecords: 24377,
    publicationCandidates: 15451,
    verifiedOfficialCoords: 15423,
    unresolvedCoords: 28,
    cumulativeDisclosureVerified: 15451,
    statewideLicensedMissingDate: 14,
    missingCapacitiesOnExcluded: 21,
    fabricatedCoords: 0,
    inventedCapacities: 0,
  },
  cdssClarification: {
    status: "sent-awaiting-response" as const,
    mailboxCheckAvailable: false as const,
    duplicateInquiryAllowed: false as const,
    note:
      "Agent environment cannot read the authorized sending mailbox. Human must confirm any CDSS reply. Do not resend.",
  },
  statewideRosterVerificationComplete: true as const,
  authoritativeIsoExportDate: null,
  eligibilityMatrixPreparedOffline: true as const,
  launchControlsPrepared: true as const,
} as const;

export function evaluateCaliforniaPhase23Readiness() {
  return CALIFORNIA_PHASE23_READINESS_DECISION;
}

export function californiaPhase23AllowsPublication(): false {
  return false;
}
