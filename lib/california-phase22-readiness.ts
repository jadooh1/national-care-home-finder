/**
 * California Phase 22 — launch-blocker evidence readiness decision.
 * Gate stays BLOCKED. STOP. No exclusion activation. No statewide re-crawl.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE22_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase22BlockerSeverity =
  | "launch-blocking"
  | "facility-excludable"
  | "optional-enhancement";

export type CaliforniaPhase22ReadinessItem = {
  id: string;
  area: string;
  status: "pass" | "fail" | "partial" | "not-applicable" | "adopted-not-activated";
  severity: CaliforniaPhase22BlockerSeverity;
  summary: string;
};

export const CALIFORNIA_PHASE22_READINESS_ITEMS: readonly CaliforniaPhase22ReadinessItem[] =
  [
    {
      id: "authoritative-iso-export-date",
      area: "freshness",
      status: "fail",
      severity: "launch-blocking",
      summary:
        "No verified CDSS ISO export/version stamp for DownloadStateData. Filename/weekly FAQ/website Last-Modified/catalog clocks remain non-authoritative. Global launch blocker unchanged.",
    },
    {
      id: "cdss-clarification-reply",
      area: "cdss-correspondence",
      status: "fail",
      severity: "launch-blocking",
      summary:
        "Authorized mailbox is not readable from this agent environment. Status remains sent-awaiting-response. Do not send a duplicate CDSS inquiry.",
    },
    {
      id: "exclusion-activation",
      area: "exclusion-policy",
      status: "adopted-not-activated",
      severity: "launch-blocking",
      summary:
        "Exclusion policy adopted for offline classification only. Not activated in application or database.",
    },
    {
      id: "unique-valid-identifiers-policy-bound",
      area: "unique-ids",
      status: "partial",
      severity: "launch-blocking",
      summary:
        "Live scan: 0 duplicates; leading zeros preserved; 95354 refuse-closed. Launch integrity claims remain policy-bound pending human approval.",
    },
    {
      id: "capacity-field-integrity",
      area: "capacity",
      status: "partial",
      severity: "launch-blocking",
      summary:
        "21 PENDING excluded blanks; 0 candidate blanks; 0 invented. Capacity integrity for launch claims remains policy-bound.",
    },
    {
      id: "source-licensing-terms",
      area: "source-licensing",
      status: "fail",
      severity: "launch-blocking",
      summary:
        "Source licensing/terms acceptance for publication is a human prerequisite; not asserted by Phase 22.",
    },
    {
      id: "qa-signoff",
      area: "qa",
      status: "fail",
      severity: "launch-blocking",
      summary:
        "Human QA / launch sign-off remains required; automated suites do not clear this blocker.",
    },
    {
      id: "provisional-license-conflicts",
      area: "licensing-status",
      status: "fail",
      severity: "facility-excludable",
      summary:
        "Five LICENSED↔Provisional License conflicts reconfirmed; unknown-ineligible; raw pairs preserved.",
    },
    {
      id: "coordinate-integrity",
      area: "coordinates",
      status: "partial",
      severity: "facility-excludable",
      summary:
        "15,423 verified official coords / 28 unresolved remain map-suppressed. No fabricate/re-probe.",
    },
    {
      id: "roster-verification-complete",
      area: "licensing-status",
      status: "pass",
      severity: "optional-enhancement",
      summary:
        "Phase 20 roster FacilityDetail/disclosure coverage complete (15,451/15,451). Phase 22 did not redo statewide crawl.",
    },
    {
      id: "publication-safeguards",
      area: "safeguards",
      status: "pass",
      severity: "launch-blocking",
      summary:
        "California unpublished; owner claims ineligible; gate blocked; no Design 2 / billing / auth / production writes.",
    },
  ] as const;

export const CALIFORNIA_PHASE22_GLOBAL_LAUNCH_BLOCKERS = [
  "authoritative-iso-export-date",
  "cdss-clarification-reply",
  "exclusion-activation",
  "unique-valid-identifiers-policy-bound",
  "source-licensing-terms",
  "qa-signoff",
] as const;

export const CALIFORNIA_PHASE22_FACILITY_EXCEPTIONS = [
  "five-provisional-license-conflicts",
  "licensed-pending-increase-overlays",
  "prior-control-502701867",
  "fourteen-licensed-missing-date",
  "twenty-eight-unresolved-coordinates-map-only",
  "invalid-id-95354",
  "withdrawn-regression-controls",
] as const;

export const CALIFORNIA_PHASE22_PUBLICATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  exclusionActivatedInAppOrDb: false as const,
  statewideCrawlRepeated: false as const,
  duplicateCdssInquirySent: false as const,
  rationale:
    "Authoritative ISO export date still absent; CDSS clarification unanswered (mailbox unavailable); exclusion not activated; unique-ID/capacity/source-licensing/QA remain statewide prerequisites. Facility exceptions are catalogued offline and do not clear global blockers. Gate stays BLOCKED. STOP.",
} as const;

export const CALIFORNIA_PHASE22_NEXT_APPROVALS_ONLY = [
  {
    id: "mailbox-check-cdss-reply",
    action: "Human checks authorized mailbox for CDSS export-date reply (do not resend).",
  },
  {
    id: "adopt-iso-export-channel",
    action:
      "If CDSS provides an authoritative ISO/version stamp, capture evidence and evaluate freshness channel.",
  },
  {
    id: "provisional-license-mapping",
    action:
      "Decide how to treat Provisional License under Download LICENSED (keep unknown-ineligible vs approved mapping).",
  },
  {
    id: "licensed-pending-increase-mapping",
    action:
      "Approve or reject publication mapping for Licensed/Pending Increase (currently fail-closed).",
  },
  {
    id: "activate-exclusion-policy",
    action:
      "Separate approval to activate offline exclusion policy in app/DB (not requested in Phase 22).",
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
    action:
      "Any later gate-open request is out of scope until blockers clear; requires explicit human approval.",
  },
] as const;

export const CALIFORNIA_PHASE22_READINESS_DECISION = {
  observedOn: CALIFORNIA_PHASE22_OBSERVED_ON,
  publication: "unpublished" as const,
  ownerClaimEligible: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  stopGo: CALIFORNIA_PHASE22_PUBLICATION_STOP_GO,
  items: CALIFORNIA_PHASE22_READINESS_ITEMS,
  globalLaunchBlockers: CALIFORNIA_PHASE22_GLOBAL_LAUNCH_BLOCKERS,
  facilityExceptions: CALIFORNIA_PHASE22_FACILITY_EXCEPTIONS,
  nextApprovalsOnly: CALIFORNIA_PHASE22_NEXT_APPROVALS_ONLY,
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
} as const;

export function evaluateCaliforniaPhase22Readiness() {
  return CALIFORNIA_PHASE22_READINESS_DECISION;
}

export function californiaPhase22AllowsPublication(): false {
  return false;
}
