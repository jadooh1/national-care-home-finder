/**
 * California Phase 19 — publication-readiness evidence after the limited
 * verification pilot + offline exclusion classification. Gate stays BLOCKED.
 * Does not start staged statewide. Does not activate exclusions in app/DB.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE19_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase19BlockerSeverity = "launch-blocking" | "optional-enhancement";

export type CaliforniaPhase19ReadinessItem = {
  id: string;
  area:
    | "freshness"
    | "licensing-status"
    | "facility-types"
    | "unique-ids"
    | "capacity"
    | "coordinates"
    | "disclosure-links"
    | "accounting"
    | "verification-breadth"
    | "safeguards"
    | "cdss-correspondence"
    | "audit-harness"
    | "exclusion-policy"
    | "pilot";
  status: "pass" | "fail" | "partial" | "not-applicable";
  severity: CaliforniaPhase19BlockerSeverity;
  summary: string;
};

export const CALIFORNIA_PHASE19_READINESS_ITEMS: readonly CaliforniaPhase19ReadinessItem[] = [
  {
    id: "authoritative-iso-export-date",
    area: "freshness",
    status: "fail",
    severity: "launch-blocking",
    summary:
      "No verified CDSS ISO export/version stamp. Awaiting CDSS response; do not resend clarification.",
  },
  {
    id: "licensing-status-eligibility-rules",
    area: "licensing-status",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Pilot expands FacilityDetail status evidence under Phase 13 harness. Roster-wide status still incomplete. 502701867 remains unknown-ineligible.",
  },
  {
    id: "eligible-facility-types",
    area: "facility-types",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "RCFE and ARF eligible Facility Type strings remain defined; out-of-scope types stay excluded.",
  },
  {
    id: "unique-valid-identifiers",
    area: "unique-ids",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Official 8–9 digit IDs preserved with leading zeros. Invalid/truncated IDs remain fail-closed.",
  },
  {
    id: "capacity-field-integrity",
    area: "capacity",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Baseline preserved: 21 official blanks on PENDING excluded rows only. Official blanks never invented.",
  },
  {
    id: "coordinate-integrity",
    area: "coordinates",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "15,423 verified official coords / 28 unresolved. Unresolved stay map-suppressed; no fabricate/re-probe.",
  },
  {
    id: "disclosure-link-coverage",
    area: "disclosure-links",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Phase 19 pilot adds ≤250 previously-unverified disclosure probes on top of 462. Not roster-complete; statewideCoverageClaimed=false.",
  },
  {
    id: "verification-pilot-executed",
    area: "pilot",
    status: "pass",
    severity: "optional-enhancement",
    summary:
      "Approved limited pilot (≤250) executed with Phase 13 harness safeguards. Staged statewide not started.",
  },
  {
    id: "exclusion-offline-classification",
    area: "exclusion-policy",
    status: "pass",
    severity: "optional-enhancement",
    summary:
      "Phase 18 exclusion policy adopted for offline classification only. Not activated in application or database. Government records unaltered.",
  },
  {
    id: "exclusive-accounting",
    area: "accounting",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "Baseline 24,377 = 15,413 + 38 + 8,921 + 5 preserved unless live sha256 drift.",
  },
  {
    id: "verification-breadth",
    area: "verification-breadth",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Sample + pilot only. Remaining ~14,739+ still unverified. Do not claim statewide verification.",
  },
  {
    id: "cdss-clarification",
    area: "cdss-correspondence",
    status: "fail",
    severity: "launch-blocking",
    summary:
      "CDSS clarification still sent-awaiting-response. Duplicate inquiry forbidden.",
  },
  {
    id: "publication-safeguards",
    area: "safeguards",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "California unpublished; owner claims ineligible; gate blocked; no Design 2 / billing / auth / production writes.",
  },
  {
    id: "audit-harness",
    area: "audit-harness",
    status: "pass",
    severity: "optional-enhancement",
    summary:
      "Phase 13 harness: concurrency=1, minIntervalMs≥450, checkpoint/resume, retries, consecutive-inconclusive stop.",
  },
] as const;

export const CALIFORNIA_PHASE19_PUBLICATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  stagedStatewideStarted: false as const,
  exclusionActivatedInAppOrDb: false as const,
  rationale:
    "Pilot evidence improves sample maturity but global launch blockers remain (ISO export date, CDSS reply, roster-incomplete verification). Gate stays BLOCKED.",
} as const;

export const CALIFORNIA_PHASE19_READINESS_DECISION = {
  observedOn: CALIFORNIA_PHASE19_OBSERVED_ON,
  publication: "unpublished" as const,
  ownerClaimEligible: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  stopGo: CALIFORNIA_PHASE19_PUBLICATION_STOP_GO,
  items: CALIFORNIA_PHASE19_READINESS_ITEMS,
  baselinePreserved: {
    officialRecords: 24377,
    publicationCandidates: 15451,
    verifiedOfficialCoords: 15423,
    unresolvedCoords: 28,
    disclosureBaseline: 462,
    statewideLicensedMissingDate: 14,
    missingCapacitiesOnExcluded: 21,
    fabricatedCoords: 0,
    inventedCapacities: 0,
  },
  disclosureAudit: {
    phase16CumulativeVerifiedCount: 462,
    incrementalVerifiedCount: 0,
    cumulativeVerifiedCount: 462,
    rosterDenominator: 15451,
    statewideCoverageClaimed: false as const,
  },
  cdssClarification: "sent-awaiting-response" as const,
  duplicateInquiryAllowed: false as const,
} as const;

export function evaluateCaliforniaPhase19Readiness(input?: {
  incrementalVerifiedCount?: number;
  cumulativeVerifiedCount?: number;
}) {
  const incremental = input?.incrementalVerifiedCount ?? 0;
  const cumulative = input?.cumulativeVerifiedCount ?? (462 + incremental);
  return {
    ...CALIFORNIA_PHASE19_READINESS_DECISION,
    disclosureAudit: {
      ...CALIFORNIA_PHASE19_READINESS_DECISION.disclosureAudit,
      incrementalVerifiedCount: incremental,
      cumulativeVerifiedCount: cumulative,
    },
  };
}

export function californiaPhase19AllowsPublication(): false {
  return false;
}
