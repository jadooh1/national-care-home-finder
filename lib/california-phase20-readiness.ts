/**
 * California Phase 20 — publication-readiness evidence after staged
 * verification + offline exclusion classification. Gate stays BLOCKED.
 * Does not activate exclusions in app/DB. Does not publish California.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE20_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase20BlockerSeverity = "launch-blocking" | "optional-enhancement";

export type CaliforniaPhase20ReadinessItem = {
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
    | "staged-verification";
  status: "pass" | "fail" | "partial" | "not-applicable";
  severity: CaliforniaPhase20BlockerSeverity;
  summary: string;
};

export const CALIFORNIA_PHASE20_PUBLICATION_STOP_GO = {
  decision: "STOP" as const,
  gate: "blocked" as const,
  allowsPublication: false as const,
  rationale:
    "Phase 20 executes authorized staged disclosure verification only. Global launch blockers (ISO export date, CDSS clarification, exclusion activation) remain open. Gate stays BLOCKED.",
};

export const CALIFORNIA_PHASE20_READINESS_ITEMS: readonly CaliforniaPhase20ReadinessItem[] = [
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
      "Staged FacilityDetail status evidence expands under Phase 13 harness. Known conflicts remain unknown-ineligible.",
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
      "Phase 20 staged crawl adds up to 14,744 previously-unverified disclosure probes on top of 707. Claim roster-complete only when authorized queue exhausted.",
  },
  {
    id: "staged-verification-authorized",
    area: "staged-verification",
    status: "pass",
    severity: "optional-enhancement",
    summary:
      "User authorized staged statewide crawl ≤14,744 additional unique facilities in batches ≤250.",
  },
  {
    id: "audit-harness-safeguards",
    area: "audit-harness",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "Phase 13 harness: concurrency=1, minIntervalMs=450, checkpoint/resume, auto-stop on 429/403/sustained 5xx/consecutive inconclusive.",
  },
  {
    id: "exclusion-offline-only",
    area: "exclusion-policy",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "Phase 18 exclusion policy applied offline only. Not activated in app/DB.",
  },
  {
    id: "cdss-clarification",
    area: "cdss-correspondence",
    status: "fail",
    severity: "launch-blocking",
    summary:
      "CDSS clarification still sent-awaiting-response. Duplicate inquiry not allowed.",
  },
  {
    id: "accounting-invariant",
    area: "accounting",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "Exclusive-bucket accounting baseline preserved (24,377 rows; 15,451 candidates).",
  },
  {
    id: "safeguards-publication-gate",
    area: "safeguards",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "Publication gate remains BLOCKED. No California publication, owner-claim, Design 2, billing, or auth changes.",
  },
];

export function californiaPhase20AllowsPublication(): false {
  return false;
}

export function evaluateCaliforniaPhase20Readiness(input?: {
  incrementalVerifiedCount?: number;
  cumulativeVerifiedCount?: number;
  statewideRosterVerificationComplete?: boolean;
}) {
  const incremental = input?.incrementalVerifiedCount ?? 0;
  const cumulative = input?.cumulativeVerifiedCount ?? (707 + incremental);
  const complete = input?.statewideRosterVerificationComplete === true;

  return {
    observedOn: CALIFORNIA_PHASE20_OBSERVED_ON,
    items: CALIFORNIA_PHASE20_READINESS_ITEMS,
    stopGo: CALIFORNIA_PHASE20_PUBLICATION_STOP_GO,
    allowsPublication: false as const,
    gate: "blocked" as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    baselinePreserved: true as const,
    disclosureAudit: {
      coverageBaseline: 707,
      incrementalVerifiedCount: incremental,
      cumulativeVerifiedCount: cumulative,
      rosterDenominator: 15451,
      statewideRosterVerificationComplete: complete,
      statewideCoverageClaimed: complete,
    },
    activeRestrictedCandidates: 15451,
    unresolvedCoords: 28,
    verifiedCoords: 15423,
    cdssClarification: "sent-awaiting-response" as const,
    exclusionActivatedInAppOrDb: false as const,
  };
}
