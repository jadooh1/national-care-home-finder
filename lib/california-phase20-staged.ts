/**
 * California Phase 20 — staged statewide verification authorization +
 * progress dossier. Staged crawl ≤14,744 is pre-approved. Batches ≤250.
 * Gate stays BLOCKED. Exclusions offline-only. No CDSS duplicate email.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE20_STAGED_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE20_STAGED_AUTHORIZATION = {
  stagedStatewideAuthorized: true as const,
  stagedStatewideStarted: true as const,
  facilityCapPerBatch: 250,
  authorizedAdditionalUnique: 14744,
  coverageBaseline: 707,
  rosterDenominator: 15451,
  harness: "california-phase13-disclosure-audit",
  concurrency: 1,
  minIntervalMs: 450,
  duplicateCdssEmailAllowed: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  exclusionActivatedInAppOrDb: false as const,
} as const;

export type CaliforniaPhase20BatchProgress = {
  batchIndex: number;
  planned: number;
  completed: number;
  working: number;
  missing: number;
  ambiguous: number;
  invalid: number;
  inconclusive: number;
  stopReason: string | null;
  elapsedMs: number;
};

export type CaliforniaPhase20StagedProgress = {
  coverageBaseline: number;
  newlyVerified: number;
  cumulativeVerified: number;
  remainingApprox: number;
  rosterDenominator: number;
  authorizedAdditional: number;
  batchesCompleted: number;
  batchProgress: CaliforniaPhase20BatchProgress[];
  disclosureFailures: {
    missing: number;
    ambiguous: number;
    invalid: number;
    inconclusive: number;
  };
  licensingConflicts: number;
  rateLimitOrAccessStops: number;
  hardStopReason: string | null;
  statewideRosterVerificationComplete: boolean;
  statewideCoverageClaimed: boolean;
};

export function estimateCaliforniaPhase20RemainingDuration(input?: {
  remainingFacilities?: number;
  minIntervalMs?: number;
  probesPerFacility?: number;
  sessionCap?: number;
}) {
  const remaining = input?.remainingFacilities ?? 14744;
  const minIntervalMs = input?.minIntervalMs ?? 450;
  const probesPerFacility = input?.probesPerFacility ?? 1;
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

export function assembleCaliforniaPhase20StagedProgress(input: {
  newlyVerified: number;
  disclosureFailures?: Partial<CaliforniaPhase20StagedProgress["disclosureFailures"]>;
  licensingConflicts?: number;
  rateLimitOrAccessStops?: number;
  hardStopReason?: string | null;
  batchProgress?: CaliforniaPhase20BatchProgress[];
  queueExhausted?: boolean;
}): CaliforniaPhase20StagedProgress {
  const newlyVerified = input.newlyVerified;
  const cumulativeVerified = 707 + newlyVerified;
  const rosterDenominator = 15451;
  const remainingApprox = Math.max(0, rosterDenominator - cumulativeVerified);
  const complete =
    input.queueExhausted === true && cumulativeVerified >= rosterDenominator;
  return {
    coverageBaseline: 707,
    newlyVerified,
    cumulativeVerified,
    remainingApprox,
    rosterDenominator,
    authorizedAdditional: 14744,
    batchesCompleted: input.batchProgress?.length ?? 0,
    batchProgress: input.batchProgress ?? [],
    disclosureFailures: {
      missing: input.disclosureFailures?.missing ?? 0,
      ambiguous: input.disclosureFailures?.ambiguous ?? 0,
      invalid: input.disclosureFailures?.invalid ?? 0,
      inconclusive: input.disclosureFailures?.inconclusive ?? 0,
    },
    licensingConflicts: input.licensingConflicts ?? 0,
    rateLimitOrAccessStops: input.rateLimitOrAccessStops ?? 0,
    hardStopReason: input.hardStopReason ?? null,
    statewideRosterVerificationComplete: complete,
    statewideCoverageClaimed: complete,
  };
}

export function assembleCaliforniaPhase20StagedDossier(input: {
  observedOn?: string;
  progress: CaliforniaPhase20StagedProgress;
  disclosureSummary: Record<string, unknown>;
  statusSummary: Record<string, unknown>;
  exclusionSummary: Record<string, unknown>;
  quality: Record<string, unknown>;
  readiness: Record<string, unknown>;
  auditHarness: Record<string, unknown>;
  downloadSha256MatchesBaseline: boolean;
}) {
  return {
    observedOn: input.observedOn ?? CALIFORNIA_PHASE20_STAGED_OBSERVED_ON,
    authorization: CALIFORNIA_PHASE20_STAGED_AUTHORIZATION,
    progress: input.progress,
    auditHarness: input.auditHarness,
    disclosure: input.disclosureSummary,
    status: input.statusSummary,
    exclusionOfflineClassification: input.exclusionSummary,
    quality: input.quality,
    readiness: input.readiness,
    downloadSha256MatchesBaseline: input.downloadSha256MatchesBaseline,
    allowsPublication: false as const,
    gate: "blocked" as const,
    publication: "unpublished" as const,
    ownerClaimEligible: false as const,
    exclusionActivatedInAppOrDb: false as const,
    cdssClarification: "sent-awaiting-response" as const,
    notes: [
      "Preserve known licensing conflicts, invalid IDs, withdrawn apps, and 28 unresolved coords.",
      "Do not activate exclusions in app/DB.",
      "Do not send duplicate CDSS email.",
      "Publication gate remains BLOCKED regardless of roster verification progress.",
    ],
  };
}

export function californiaPhase20StagedStatewideAuthorized(): true {
  return true;
}

export function californiaPhase20StagedStatewideStarted(): true {
  return true;
}
