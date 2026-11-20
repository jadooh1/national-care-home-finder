/**
 * California Phase 19 — limited verification pilot dossier + next-stage
 * recommendation. Pilot ≤250 is pre-approved. Staged statewide requires
 * separate approval and is never started here.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE19_PILOT_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE19_PILOT_AUTHORIZATION = {
  limitedPilotAuthorized: true as const,
  facilityCap: 250,
  harness: "california-phase13-disclosure-audit",
  concurrency: 1,
  minIntervalMs: 450,
  stagedStatewideAuthorized: false as const,
  stagedStatewideStarted: false as const,
  duplicateCdssEmailAllowed: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
} as const;

export type CaliforniaPhase19NextStageRecommendationId =
  | "request-staged-statewide-approval"
  | "run-additional-pilot-sessions"
  | "deny-further-crawl"
  | "hold-for-cdss-or-source-change";

export type CaliforniaPhase19NextStageRecommendation = {
  id: CaliforniaPhase19NextStageRecommendationId;
  requestStagedStatewide: boolean;
  startStagedStatewideNow: false;
  rationale: string;
  expectedCosts: {
    remainingFacilitiesApprox: number;
    probesPerFacility: number;
    totalProbesApprox: number;
    minWallHoursApprox: number;
    conservativeWallHoursApprox: number;
    sessionsAt250: number;
    note: string;
  };
  risks: readonly string[];
  safeguards: readonly string[];
};

export function estimateCaliforniaPhase19RemainingDuration(input?: {
  cumulativeVerifiedCount?: number;
  rosterDenominator?: number;
  minIntervalMs?: number;
  probesPerFacility?: number;
  sessionCap?: number;
}) {
  const cumulative = input?.cumulativeVerifiedCount ?? 462;
  const roster = input?.rosterDenominator ?? 15451;
  const remaining = Math.max(0, roster - cumulative);
  const minIntervalMs = input?.minIntervalMs ?? 450;
  const probesPerFacility = input?.probesPerFacility ?? 2;
  const sessionCap = input?.sessionCap ?? 250;
  const totalProbes = remaining * probesPerFacility;
  const minWallMs = totalProbes * minIntervalMs;
  return {
    remainingFacilitiesApprox: remaining,
    probesPerFacility,
    totalProbesApprox: totalProbes,
    minIntervalMs,
    minWallHoursApprox: Math.round((minWallMs / 3_600_000) * 100) / 100,
    conservativeWallHoursApprox:
      Math.round(((minWallMs * 1.25) / 3_600_000) * 100) / 100,
    sessionsAt250: Math.ceil(remaining / sessionCap),
    note:
      "Arithmetic from harness defaults + remaining queue. Not a CDSS SLA. Excludes operator pauses and elevated retry pressure.",
  };
}

/**
 * Evidence-based recommendation. Does not start statewide.
 * Prefer staged statewide only when pilot completed cleanly with low
 * inconclusive/conflict rates and no rate-limit / source-drift stop.
 */
export function recommendCaliforniaPhase19NextStage(input: {
  incrementalVerifiedCount: number;
  stopReason: string | null;
  inconclusiveCount?: number;
  conflictCount?: number;
  workingCount?: number;
  sampleSize?: number;
  downloadSha256MatchesBaseline?: boolean;
  consecutiveInconclusiveStop?: boolean;
  rateLimitedOrAccessRestricted?: boolean;
  cumulativeVerifiedCount?: number;
}): CaliforniaPhase19NextStageRecommendation {
  const duration = estimateCaliforniaPhase19RemainingDuration({
    cumulativeVerifiedCount: input.cumulativeVerifiedCount
      ?? (462 + input.incrementalVerifiedCount),
  });
  const safeguards = [
    "concurrency=1",
    "minIntervalMs>=450 including retries",
    "checkpoint every 10; --resume skips completedKeys",
    "stop on 8 consecutive inconclusive / 429-5xx burst / sha256 drift",
    "preserve exact license IDs including leading zeros",
    "no duplicate CDSS email",
    "no parallel multi-agent CDSS sessions",
    "exclusion offline-only until separate activation approval",
    "publication gate remains BLOCKED",
  ] as const;
  const risks = [
    "CDSS rate limits or access restrictions under longer continuous load",
    "Source sha256 drift mid-campaign requiring full re-baseline",
    "Status-conflict / missing-license-date rates may differ outside stratified pilot",
    "Operator fatigue across ~60 sessions without staging discipline",
    "Publication pressure before global blockers (ISO date, CDSS reply) clear",
  ] as const;

  const sampleSize = input.sampleSize ?? input.incrementalVerifiedCount;
  const inconclusiveRate = sampleSize > 0
    ? (input.inconclusiveCount ?? 0) / sampleSize
    : 1;
  const workingRate = sampleSize > 0
    ? (input.workingCount ?? 0) / sampleSize
    : 0;
  const hardStop =
    input.consecutiveInconclusiveStop === true
    || input.rateLimitedOrAccessRestricted === true
    || input.downloadSha256MatchesBaseline === false
    || input.stopReason === "consecutive-inconclusive";

  if (hardStop) {
    return {
      id: "hold-for-cdss-or-source-change",
      requestStagedStatewide: false,
      startStagedStatewideNow: false,
      rationale:
        "Pilot hit a hard stop (rate limit / access restriction / consecutive inconclusive / source sha256 drift). Do not request staged statewide until the stop condition is understood and cleared.",
      expectedCosts: duration,
      risks,
      safeguards,
    };
  }

  if (input.incrementalVerifiedCount < 200 || input.stopReason !== "queue-exhausted") {
    return {
      id: "run-additional-pilot-sessions",
      requestStagedStatewide: false,
      startStagedStatewideNow: false,
      rationale:
        `Pilot incomplete or below confidence threshold (verified=${input.incrementalVerifiedCount}, stopReason=${input.stopReason}). Resume additional ≤250 sessions before asking for staged statewide.`,
      expectedCosts: duration,
      risks,
      safeguards,
    };
  }

  if (inconclusiveRate > 0.05 || (input.conflictCount ?? 0) > 10 || workingRate < 0.9) {
    return {
      id: "run-additional-pilot-sessions",
      requestStagedStatewide: false,
      startStagedStatewideNow: false,
      rationale:
        `Pilot completed but exception/inconclusive rates are elevated (workingRate=${workingRate.toFixed(3)}, inconclusiveRate=${inconclusiveRate.toFixed(3)}, conflicts=${input.conflictCount ?? 0}). Run another bounded pilot/analysis pass before staged statewide.`,
      expectedCosts: duration,
      risks,
      safeguards,
    };
  }

  return {
    id: "request-staged-statewide-approval",
    requestStagedStatewide: true,
    startStagedStatewideNow: false,
    rationale:
      `Pilot completed cleanly (incremental=${input.incrementalVerifiedCount}, stopReason=queue-exhausted, workingRate=${workingRate.toFixed(3)}). Evidence supports requesting separate human approval for staged statewide crawl (~${duration.sessionsAt250} sessions @ 250). Do not start statewide in this phase.`,
    expectedCosts: duration,
    risks,
    safeguards,
  };
}

export function assembleCaliforniaPhase19PilotDossier(input: {
  observedOn?: string;
  incrementalVerifiedCount: number;
  cumulativeVerifiedCount: number;
  stopReason: string | null;
  disclosureSummary: Record<string, unknown>;
  statusSummary: Record<string, unknown>;
  exclusionSummary: Record<string, unknown>;
  quality: Record<string, unknown>;
  readiness: Record<string, unknown>;
  recommendation: CaliforniaPhase19NextStageRecommendation;
  auditHarness: Record<string, unknown>;
}) {
  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE19_PILOT_OBSERVED_ON,
    authorization: CALIFORNIA_PHASE19_PILOT_AUTHORIZATION,
    auditHarness: input.auditHarness,
    disclosure: input.disclosureSummary,
    status: input.statusSummary,
    exclusionOfflineClassification: input.exclusionSummary,
    quality: input.quality,
    readiness: input.readiness,
    recommendation: input.recommendation,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stagedStatewideStarted: false as const,
    exclusionActivatedInAppOrDb: false as const,
    cdssClarification: {
      status: "sent-awaiting-response" as const,
      duplicateInquiryAllowed: false as const,
    },
    notes: [
      "Distinguish Phase 19 new results from prior 462 baseline.",
      "Exclusion policy offline-only; government records unaltered.",
      "Do not start staged statewide without separate approval.",
      "Publication gate unchanged (BLOCKED).",
    ] as const,
  };
}

export function californiaPhase19AllowsPublication(): false {
  return false;
}

export function californiaPhase19StagedStatewideStarted(): false {
  return false;
}
