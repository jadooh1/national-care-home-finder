/**
 * California Phase 17 — disclosure-audit strategy evaluation.
 * Reviews cumulative 462/15451 coverage and whether further small samples help.
 * Proposes a safe rate-limited full-roster plan requiring separate approval.
 * Does not perform uncontrolled statewide requests.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE17_DISCLOSURE_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE17_DISCLOSURE_COVERAGE = {
  rosterDenominator: 15451,
  phase15CumulativeVerifiedCount: 347,
  phase16IncrementalVerifiedCount: 115,
  cumulativeVerifiedCount: 462,
  coverageFraction: 462 / 15451,
  coveragePercentApprox: 2.99,
  statewideCoverageClaimed: false as const,
  phase16IncrementalAllWorking: true,
  phase16StopReason: "queue-exhausted" as const,
} as const;

export type CaliforniaPhase17DisclosureStrategyDecision =
  | "pause-small-incremental-samples"
  | "continue-small-incremental-samples"
  | "run-full-roster-now-without-approval";

export const CALIFORNIA_PHASE17_DISCLOSURE_STRATEGY = {
  observedOn: CALIFORNIA_PHASE17_DISCLOSURE_OBSERVED_ON,
  coverage: CALIFORNIA_PHASE17_DISCLOSURE_COVERAGE,
  additionalSmallSamplesMeaningfullyImproveLaunchReadiness: false,
  decision: "pause-small-incremental-samples" as CaliforniaPhase17DisclosureStrategyDecision,
  rationale: [
    "Cumulative coverage is ~2.99% (462/15451). Another ~100–250 facility sample adds <2 percentage points and cannot clear the roster-complete disclosure blocker.",
    "Phase 16 incremental batch was 115/115 working — generator/link patterns look stable, so more small samples mainly repeat confidence rather than unlock publication.",
    "Launch readiness is blocked first by authoritative ISO export date and roster-wide status verification; disclosure sampling does not satisfy those gates.",
    "Uncontrolled statewide FacilityDetail crawling is forbidden without separate human approval.",
  ],
  proposedFullRosterPlan: {
    requiresSeparateHumanApproval: true,
    approvalRequiredBeforeAnyLargeScaleCrawl: true,
    performNow: false,
    harness: "california-phase13-disclosure-audit (rate-limited, checkpointed, resumable)",
    defaults: {
      minIntervalMs: 450,
      maxAttempts: 3,
      backoffMs: [500, 1500, 3000] as const,
      checkpointEvery: 10,
      maxRequestsPerSession: 250,
      maxDurationMs: 30 * 60 * 1000,
      stopAfterConsecutiveInconclusive: 8,
    },
    estimatedSessionsAt250Cap: Math.ceil((15451 - 462) / 250),
    remainingFacilitiesApprox: 15451 - 462,
    rules: [
      "Resume from checkpoint; skip completedKeys.",
      "Preserve leading zeros; refuse non 8–9 digit IDs.",
      "Do not re-probe 28 unresolved coordinates without new authoritative evidence.",
      "Do not send CDSS email.",
      "Do not claim statewideCoverageClaimed until remaining queue is exhausted with verified results.",
      "Keep California unpublished and gate BLOCKED throughout the crawl.",
    ],
  },
  interimPublicationPolicy: {
    unverifiedDisclosureCandidates: "exclude-until-verified",
    allowsPublicationWithPartialSample: false,
    statewideCoverageClaimed: false,
  },
} as const;

export function evaluateCaliforniaPhase17DisclosureStrategy() {
  return {
    ...CALIFORNIA_PHASE17_DISCLOSURE_STRATEGY,
    allowsUncontrolledStatewideRequests: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function californiaPhase17ClaimsStatewideDisclosureCoverage(): false {
  return false;
}

export function californiaPhase17AllowsFullRosterCrawlWithoutApproval(): false {
  return false;
}
