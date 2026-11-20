/**
 * California Phase 17 — launch-readiness dossier contract helpers.
 * Assembles stop/go and remediation sequence constants used by tests, fixtures,
 * and the read-only run script. Does not import sibling phase17 modules (keeps
 * Next.js typecheck and Node --experimental-strip-types both resolvable).
 * Gate stays BLOCKED. Does not unlock publication.
 */

export const CALIFORNIA_PHASE17_LAUNCH_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE17_REMEDIATION_SEQUENCE = [
  "1. Human checks authorized mailbox for CDSS clarification reply (do not resend).",
  "2. If reply provides authoritative ISO export/version channel, capture evidence; else keep freshness fail.",
  "3. Human approves or denies rate-limited full-roster disclosure+status crawl (separate approval).",
  "4. Apply facility-exclusion policy for LICENSED-missing-date, status conflicts, invalid IDs, withdrawn, and 28 unresolved coords.",
  "5. Re-validate exclusive-bucket accounting and Download sha256 after any source change.",
  "6. Only after stop/go conditions are met, human may approve opening the publication gate — agents must not open it.",
] as const;

export const CALIFORNIA_PHASE17_DOSSIER_SCOPE = {
  developmentOnly: true,
  californiaUnpublished: true,
  gate: "blocked" as const,
  allowsPublication: false as const,
  ownerClaimEligible: false as const,
  noProductionWrites: true,
  noSupabaseWrites: true,
  noCdssResend: true,
  noUncontrolledStatewideCrawl: true,
  noPublicationGateChange: true,
} as const;

export type CaliforniaPhase17DossierParts = {
  decisionMatrixSummary: {
    statewidePublicationBlockersOpen: readonly string[];
    facilityExcludableExceptions: readonly string[];
    humanApprovalsRequired: readonly string[];
  };
  freshness: {
    authoritativeIsoExportDate: string | null;
    downloadSha256MatchesBaseline: boolean;
    cdssReplyObserved: boolean;
    mailboxAvailable: boolean;
    gate: "blocked";
  };
  exceptions: {
    phase16SampledFindings: number;
    phase16StatewideLicensedMissingDate: number;
    preservesFailClosed: boolean;
    avoidsRepeatingUnsuccessfulCoordChecks: boolean;
  };
  disclosure: {
    cumulativeVerifiedCount: number;
    rosterDenominator: number;
    additionalSmallSamplesRecommended: boolean;
    fullRosterCrawlRequiresSeparateApproval: boolean;
    statewideCoverageClaimed: false;
  };
  accounting: {
    officialRecords: number;
    activeRestrictedCandidates: number;
    verifiedCoords: number;
    unresolvedCoords: number;
  };
  stopGo: {
    recommendation: "STOP" | "GO";
    publicationReady: false;
  };
  humanDecisionsRequired: readonly { id: string; summary: string }[];
};

/**
 * Build a JSON-serializable dossier shell from precomputed parts.
 * Callers supply summaries from the other phase17 modules / live probes.
 */
export function assembleCaliforniaPhase17LaunchDossier(parts: CaliforniaPhase17DossierParts) {
  return {
    phase: 17 as const,
    title: "California launch-readiness dossier",
    observedOn: CALIFORNIA_PHASE17_LAUNCH_OBSERVED_ON,
    issue: "https://github.com/jadooh1/national-care-home-finder/issues/131",
    priorPhase16Commit: "c35669300ce455a989e050014a95f6f349e76712",
    scope: CALIFORNIA_PHASE17_DOSSIER_SCOPE,
    verdict:
      "NOT publication-ready. Gate BLOCKED. Statewide blockers remain (authoritative ISO export date, roster-wide status/disclosure verification). Facility exceptions are excludable under fail-closed rules. CDSS reply not confirmed (mailbox unavailable). No duplicate inquiry sent.",
    decisionMatrix: parts.decisionMatrixSummary,
    freshness: parts.freshness,
    exceptions: parts.exceptions,
    disclosure: parts.disclosure,
    accounting: parts.accounting,
    stopGo: parts.stopGo,
    humanDecisionsRequired: parts.humanDecisionsRequired,
    remediationSequence: CALIFORNIA_PHASE17_REMEDIATION_SEQUENCE,
    allowsPublication: false as const,
    publicationReady: false as const,
    gate: "blocked" as const,
  };
}

export function californiaPhase17LaunchAllowsPublication(): false {
  return false;
}
