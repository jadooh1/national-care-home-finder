/**
 * California Phase 21 — decision-ready launch-blocker reassessment after
 * exception reconciliation. Gate stays BLOCKED. No exclusion activation.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE21_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase21BlockerSeverity =
  | "launch-blocking"
  | "facility-excludable"
  | "optional-enhancement";

export type CaliforniaPhase21ReadinessItem = {
  id: string;
  area: string;
  status: "pass" | "fail" | "partial" | "not-applicable";
  severity: CaliforniaPhase21BlockerSeverity;
  summary: string;
};

export const CALIFORNIA_PHASE21_READINESS_ITEMS: readonly CaliforniaPhase21ReadinessItem[] = [
  {
    id: "authoritative-iso-export-date",
    area: "freshness",
    status: "fail",
    severity: "launch-blocking",
    summary:
      "No verified CDSS ISO export/version stamp for DownloadStateData. Filename/weekly FAQ remain non-authoritative. Global launch blocker unless independently resolved.",
  },
  {
    id: "cdss-clarification-reply",
    area: "cdss-correspondence",
    status: "fail",
    severity: "launch-blocking",
    summary:
      "Authorized mailbox is not readable from this agent environment. Status remains sent-awaiting-response. Do not send a duplicate CDSS inquiry. Human mailbox check still required.",
  },
  {
    id: "roster-facilitydetail-status",
    area: "licensing-status",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Roster FacilityDetail probes complete (15,451/15,451 under Phase 20). Remaining licensing discrepancies are facility-excludable offline; unresolved conflicts stay unknown-ineligible.",
  },
  {
    id: "disclosure-link-coverage",
    area: "disclosure-links",
    status: "partial",
    severity: "facility-excludable",
    summary:
      "Disclosure coverage complete except 2 HTTP 500 inconclusive IDs (investigated in Phase 21). Fail-closed offline exclusion until working.",
  },
  {
    id: "licensing-discrepancy-reconciliation",
    area: "exceptions",
    status: "pass",
    severity: "optional-enhancement",
    summary:
      "Phase 21 classifies the 71 Phase 20 conflicts + prior known conflicts into an offline exception ledger without activating exclusions.",
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
    id: "unique-valid-identifiers",
    area: "unique-ids",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Official 8–9 digit IDs preserved. Invalid control 95354 remains refuse-closed.",
  },
  {
    id: "exclusion-activation",
    area: "exclusion-policy",
    status: "fail",
    severity: "launch-blocking",
    summary:
      "Exclusion policy is adopted for offline classification only. Not activated in application or database. Separate human activation decision required before any publication path that relies on exclusions.",
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

export const CALIFORNIA_PHASE21_GLOBAL_LAUNCH_BLOCKERS = [
  "authoritative-iso-export-date",
  "cdss-clarification-reply",
  "exclusion-activation",
  "unique-valid-identifiers-policy-bound",
] as const;

export const CALIFORNIA_PHASE21_FACILITY_EXCEPTIONS = [
  "licensing-discrepancies-unknown-ineligible",
  "two-inconclusive-facilitydetail-ids",
  "fourteen-licensed-missing-date",
  "twenty-eight-unresolved-coordinates-map-only",
  "invalid-id-95354",
  "withdrawn-regression-controls",
] as const;

export const CALIFORNIA_PHASE21_PUBLICATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  exclusionActivatedInAppOrDb: false as const,
  rationale:
    "Facility-level exceptions are catalogued offline, but global launch blockers remain (ISO export date, unanswered CDSS clarification, exclusion not activated). Gate stays BLOCKED.",
} as const;

export const CALIFORNIA_PHASE21_READINESS_DECISION = {
  observedOn: CALIFORNIA_PHASE21_OBSERVED_ON,
  publication: "unpublished" as const,
  ownerClaimEligible: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  stopGo: CALIFORNIA_PHASE21_PUBLICATION_STOP_GO,
  items: CALIFORNIA_PHASE21_READINESS_ITEMS,
  globalLaunchBlockers: CALIFORNIA_PHASE21_GLOBAL_LAUNCH_BLOCKERS,
  facilityExceptions: CALIFORNIA_PHASE21_FACILITY_EXCEPTIONS,
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
} as const;

export function evaluateCaliforniaPhase21Readiness() {
  return CALIFORNIA_PHASE21_READINESS_DECISION;
}

export function californiaPhase21AllowsPublication(): false {
  return false;
}
