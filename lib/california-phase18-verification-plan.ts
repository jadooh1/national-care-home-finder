/**
 * California Phase 18 — full-roster verification plan (approval-ready, not executed).
 * Evidence-based rate limits, duration estimates, concurrency, retry/backoff,
 * checkpointing, CDSS service protection, error stop thresholds, retention/audit.
 * Does NOT start any crawl. performNow=false until separate human authorization.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE18_VERIFICATION_OBSERVED_ON = "2026-11-20";

/** Prior sample evidence carried from Phases 13–16 / 17 dossier. */
export const CALIFORNIA_PHASE18_SAMPLE_EVIDENCE = {
  rosterDenominator: 15451,
  cumulativeVerifiedDisclosure: 462,
  remainingUnverifiedApprox: 15451 - 462,
  coverageFraction: 462 / 15451,
  coveragePercentApprox: 2.99,
  phase13SampleSize: 116,
  phase14Incremental: 117,
  phase15Incremental: 114,
  phase16Incremental: 115,
  phase16IncrementalAllWorking: true,
  statusSampleLargestN: 48,
  statewideCoverageClaimed: false as const,
  harness: "california-phase13-disclosure-audit (rate-limited, checkpointed, resumable)",
} as const;

/**
 * Phase 13 harness defaults — the only approved rate-limited pattern for
 * FacilityDetail / disclosure probes. Reused here as the plan baseline.
 */
export const CALIFORNIA_PHASE18_HARNESS_DEFAULTS = {
  minIntervalMs: 450,
  maxAttempts: 3,
  retryStatuses: [429, 500, 502, 503, 504] as const,
  backoffMs: [500, 1500, 3000] as const,
  checkpointEvery: 10,
  defaultMaxRequestsPerSession: 200,
  proposedPilotMaxRequestsPerSession: 250,
  defaultMaxDurationMs: 30 * 60 * 1000,
  maxConsecutiveInconclusive: 8,
  concurrency: 1,
  concurrencyRationale:
    "Sequential single-flight requests only. Parallel FacilityDetail fan-out is forbidden without a separate CDSS-safe concurrency approval.",
} as const;

/**
 * Duration / request estimates derived from sample evidence and harness defaults.
 * Pure arithmetic — does not contact CDSS.
 */
export function estimateCaliforniaPhase18FullRosterDuration(input?: {
  remaining?: number;
  minIntervalMs?: number;
  maxRequestsPerSession?: number;
  probesPerFacility?: number;
}) {
  const remaining = input?.remaining
    ?? CALIFORNIA_PHASE18_SAMPLE_EVIDENCE.remainingUnverifiedApprox;
  const minIntervalMs = input?.minIntervalMs
    ?? CALIFORNIA_PHASE18_HARNESS_DEFAULTS.minIntervalMs;
  const maxRequestsPerSession = input?.maxRequestsPerSession
    ?? CALIFORNIA_PHASE18_HARNESS_DEFAULTS.proposedPilotMaxRequestsPerSession;
  /** Disclosure page + FacilityDetail API status check per facility. */
  const probesPerFacility = input?.probesPerFacility ?? 2;

  const totalProbes = remaining * probesPerFacility;
  const minWallMs = totalProbes * minIntervalMs;
  const sessionsAtCap = Math.ceil(remaining / maxRequestsPerSession);
  const sessionsAtDefault200 = Math.ceil(
    remaining / CALIFORNIA_PHASE18_HARNESS_DEFAULTS.defaultMaxRequestsPerSession,
  );

  return {
    remainingFacilities: remaining,
    probesPerFacility,
    totalProbes,
    minIntervalMs,
    maxRequestsPerSession,
    /** Lower bound assuming zero retries and zero operator overhead. */
    minWallMs,
    minWallHoursApprox: Math.round((minWallMs / 3_600_000) * 100) / 100,
    /** Conservative bound: +25% for retries, checkpoint I/O, operator pauses. */
    conservativeWallMs: Math.ceil(minWallMs * 1.25),
    conservativeWallHoursApprox:
      Math.round(((minWallMs * 1.25) / 3_600_000) * 100) / 100,
    estimatedSessionsAtCap: sessionsAtCap,
    estimatedSessionsAtDefault200: sessionsAtDefault200,
    sampleEvidenceBasis: {
      verifiedSoFar: CALIFORNIA_PHASE18_SAMPLE_EVIDENCE.cumulativeVerifiedDisclosure,
      roster: CALIFORNIA_PHASE18_SAMPLE_EVIDENCE.rosterDenominator,
      note:
        "Estimates scale from prior stratified samples (462/15451). Sample latency is not a guaranteed CDSS SLA.",
    },
  };
}

export type CaliforniaPhase18VerificationOptionId =
  | "limited-pilot"
  | "staged-statewide"
  | "full-roster-single-campaign"
  | "deny-crawl-keep-sample-only";

export type CaliforniaPhase18VerificationOption = {
  id: CaliforniaPhase18VerificationOptionId;
  title: string;
  authorizedNow: false;
  performNow: false;
  requiresSeparateHumanApproval: true;
  facilityCap: number | null;
  sessionCap: number;
  description: string;
  cdssServiceProtection: readonly string[];
};

export const CALIFORNIA_PHASE18_VERIFICATION_OPTIONS: readonly CaliforniaPhase18VerificationOption[] = [
  {
    id: "limited-pilot",
    title: "Limited pilot (recommended first step if crawl is authorized)",
    authorizedNow: false,
    performNow: false,
    requiresSeparateHumanApproval: true,
    facilityCap: 500,
    sessionCap: 250,
    description:
      "Verify ~500 previously-unverified candidates (≈3% of remaining) with Phase 13 harness defaults. Prove error rates, stop thresholds, and checkpoint recovery before any staged statewide expansion.",
    cdssServiceProtection: [
      "concurrency=1",
      "minIntervalMs>=450",
      "stop after 8 consecutive inconclusive",
      "respect 429/5xx backoff",
      "session duration <= 30 minutes unless operator extends",
    ],
  },
  {
    id: "staged-statewide",
    title: "Staged statewide (after successful pilot)",
    authorizedNow: false,
    performNow: false,
    requiresSeparateHumanApproval: true,
    facilityCap: null,
    sessionCap: 250,
    description:
      "Resume from checkpoint across ~60 sessions at 250 facilities/session until remaining queue is exhausted. Each stage requires operator presence and the same CDSS protection rules. Do not claim statewideCoverageClaimed until queue-exhausted with verified results.",
    cdssServiceProtection: [
      "concurrency=1",
      "minIntervalMs>=450",
      "checkpoint every 10 probes; --resume skips completedKeys",
      "pause on elevated 429/5xx rate",
      "never run multiple agents against CDSS concurrently",
    ],
  },
  {
    id: "full-roster-single-campaign",
    title: "Single continuous full-roster campaign (not recommended initially)",
    authorizedNow: false,
    performNow: false,
    requiresSeparateHumanApproval: true,
    facilityCap: null,
    sessionCap: 15451,
    description:
      "Would raise max-requests to cover remaining roster in fewer long sessions. Higher CDSS load risk and weaker operator checkpoints. Prefer staged-statewide after pilot.",
    cdssServiceProtection: [
      "still concurrency=1",
      "still minIntervalMs>=450",
      "still stop thresholds apply",
      "human must accept longer continuous load",
    ],
  },
  {
    id: "deny-crawl-keep-sample-only",
    title: "Deny crawl; keep sample-only + exclusion policy",
    authorizedNow: false,
    performNow: false,
    requiresSeparateHumanApproval: true,
    facilityCap: 0,
    sessionCap: 0,
    description:
      "Do not authorize any further FacilityDetail crawl. Publication remains blocked unless humans adopt an exclusion-until-verified policy covering unverified status/disclosure candidates (separate approval).",
    cdssServiceProtection: [
      "no additional CDSS FacilityDetail traffic",
      "preserve 462-sample evidence only",
    ],
  },
] as const;

export const CALIFORNIA_PHASE18_RETRY_BACKOFF = {
  maxAttempts: CALIFORNIA_PHASE18_HARNESS_DEFAULTS.maxAttempts,
  backoffMs: CALIFORNIA_PHASE18_HARNESS_DEFAULTS.backoffMs,
  retryStatuses: CALIFORNIA_PHASE18_HARNESS_DEFAULTS.retryStatuses,
  onExhaustedAttempts: "mark-inconclusive-and-continue-or-stop-per-threshold" as const,
} as const;

export const CALIFORNIA_PHASE18_CHECKPOINT_RECOVERY = {
  checkpointEvery: CALIFORNIA_PHASE18_HARNESS_DEFAULTS.checkpointEvery,
  resumeFlag: "--resume",
  skipsCompletedKeys: true,
  persists: [
    "completedKeys",
    "classCounts",
    "lastFacilityNumber",
    "stopReason",
    "sessionRequestCount",
  ] as const,
  recoveryRule:
    "On crash or session end, reload checkpoint JSON and skip completedKeys. Never re-probe successful keys. Never invent missing results.",
  idempotent: true,
} as const;

export const CALIFORNIA_PHASE18_ERROR_STOP_THRESHOLDS = {
  maxConsecutiveInconclusive:
    CALIFORNIA_PHASE18_HARNESS_DEFAULTS.maxConsecutiveInconclusive,
  stopOnHttp429Burst: true,
  stopOnSha256DriftVsBaseline: true,
  stopOnInvalidIdGeneratorRegression: true,
  operatorMustReviewBeforeResume: true,
  neverAutoOpenPublicationGate: true,
} as const;

export const CALIFORNIA_PHASE18_CDSS_SERVICE_PROTECTION = {
  concurrency: 1,
  minIntervalMs: 450,
  noUncontrolledStatewideCrawl: true,
  noParallelAgentSessions: true,
  noDuplicateCdssEmail: true,
  politeUserAgentOnly: true,
  respectRetryAfterIfPresent: true,
  doNotProbeUnresolvedCoords: true,
  readOnly: true,
} as const;

export const CALIFORNIA_PHASE18_RETENTION_AUDIT = {
  retainCheckpointArtifacts: true,
  retainPerFacilityClassifications: true,
  retainStopReasonsAndTimestamps: true,
  retainDownloadSha256AtSessionStart: true,
  doNotAlterAuthoritativeGovernmentRecords: true,
  auditEvidenceRequiredForAnyFuturePublicationClaim: true,
  retentionNote:
    "Keep session outputs under a dated audit directory. Do not overwrite prior phase fixtures. Evidence must support exact facility ID, classification, HTTP status, and checkpoint resume points.",
} as const;

export const CALIFORNIA_PHASE18_VERIFICATION_PLAN = {
  observedOn: CALIFORNIA_PHASE18_VERIFICATION_OBSERVED_ON,
  title: "California full-roster verification plan (draft for approval)",
  performNow: false as const,
  crawlStarted: false as const,
  authorizedNow: false as const,
  requiresSeparateHumanApproval: true as const,
  sampleEvidence: CALIFORNIA_PHASE18_SAMPLE_EVIDENCE,
  harnessDefaults: CALIFORNIA_PHASE18_HARNESS_DEFAULTS,
  durationEstimate: estimateCaliforniaPhase18FullRosterDuration(),
  options: CALIFORNIA_PHASE18_VERIFICATION_OPTIONS,
  recommendedOptionIfCrawlAuthorized: "limited-pilot" as const,
  recommendedFollowOnAfterPilot: "staged-statewide" as const,
  retryBackoff: CALIFORNIA_PHASE18_RETRY_BACKOFF,
  checkpointRecovery: CALIFORNIA_PHASE18_CHECKPOINT_RECOVERY,
  errorStopThresholds: CALIFORNIA_PHASE18_ERROR_STOP_THRESHOLDS,
  cdssServiceProtection: CALIFORNIA_PHASE18_CDSS_SERVICE_PROTECTION,
  retentionAudit: CALIFORNIA_PHASE18_RETENTION_AUDIT,
  hardRules: [
    "Do not start the crawl in Phase 18.",
    "Do not send CDSS mail.",
    "Do not open or weaken the publication gate.",
    "Preserve leading zeros; refuse non 8–9 digit IDs.",
    "Do not re-probe 28 unresolved coordinates without new authoritative evidence.",
    "Do not claim statewideCoverageClaimed until remaining queue is exhausted with verified results.",
    "Keep California unpublished throughout any future authorized crawl.",
  ] as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
} as const;

export function evaluateCaliforniaPhase18VerificationPlan() {
  return {
    ...CALIFORNIA_PHASE18_VERIFICATION_PLAN,
    durationEstimate: estimateCaliforniaPhase18FullRosterDuration(),
  };
}

export function californiaPhase18AllowsCrawlWithoutApproval(): false {
  return false;
}

export function californiaPhase18CrawlStarted(): false {
  return false;
}
