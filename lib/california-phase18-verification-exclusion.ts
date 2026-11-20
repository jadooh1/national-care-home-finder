/**
 * California Phase 18 — verification plan + exclusion policy dossier helpers.
 * Assembles approval-ready plan, draft policy, readiness, and approval options.
 * Does not start crawl, activate policy, open gate, or send CDSS mail.
 *
 * Intentionally free of sibling runtime imports (keeps Next.js typecheck and
 * Node --experimental-strip-types both resolvable).
 */

export const CALIFORNIA_PHASE18_DOSSIER_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE18_REMEDIATION_SEQUENCE = [
  "1. Human decides crawl authorization: limited pilot, staged statewide, or deny (Phase 18 does not crawl).",
  "2. Human adopts, defers, or rejects the draft facility-exclusion policy (Phase 18 does not activate).",
  "3. Human checks authorized mailbox for CDSS clarification reply (do not resend).",
  "4. If crawl authorized: execute only under Phase 13 harness defaults with checkpoint/resume and CDSS protection.",
  "5. Apply adopted exclusion rules for conflicts, invalid IDs, missing license evidence, unresolved coords, bad disclosure, closed/pending/withdrawn — without altering government source records.",
  "6. Re-validate exclusive-bucket accounting and Download sha256 after any source change.",
  "7. Only in a later phase, after stop/go conditions are met, a human may approve opening the publication gate — Phase 18 does not request that approval.",
] as const;

export const CALIFORNIA_PHASE18_DOSSIER_SCOPE = {
  developmentOnly: true,
  californiaUnpublished: true,
  gate: "blocked" as const,
  allowsPublication: false as const,
  ownerClaimEligible: false as const,
  noProductionWrites: true,
  noSupabaseWrites: true,
  noCdssResend: true,
  noStatewideCrawl: true,
  noPilotCrawl: true,
  noPublicationGateChange: true,
  noPublicationGateOpenRequest: true,
  exclusionPolicyActivated: false as const,
} as const;

export type CaliforniaPhase18DossierParts = {
  verificationPlan: {
    performNow: false;
    crawlStarted: false;
    requiresSeparateHumanApproval: true;
    remainingFacilitiesApprox: number;
    recommendedOptionIfCrawlAuthorized: string;
    minWallHoursApprox: number;
    conservativeWallHoursApprox: number;
    estimatedSessionsAtCap: number;
  };
  exclusionPolicy: {
    status: "draft-for-approval";
    activated: false;
    adopted: false;
    ruleCount: number;
    preservesAuthoritativeRecordsUnaltered: true;
  };
  approvalOptions: {
    requestsPublicationGateOpen: false;
    crawlAuthorized: false;
    exclusionPolicyAdopted: false;
    optionIds: readonly string[];
  };
  accounting: {
    officialRecords: number;
    activeRestrictedCandidates: number;
    verifiedCoords: number;
    unresolvedCoords: number;
    disclosureSamples: number;
    statewideMissingLicenseDateFlags: number;
  };
  globalLaunchBlockers: readonly string[];
  facilitySpecificExceptions: readonly string[];
  stopGo: {
    recommendation: "STOP" | "GO";
    publicationReady: false;
  };
  humanDecisionsRequired: readonly { id: string; summary: string }[];
};

/**
 * Build a JSON-serializable dossier shell from precomputed parts.
 */
export function assembleCaliforniaPhase18VerificationExclusionDossier(
  parts: CaliforniaPhase18DossierParts,
) {
  return {
    phase: 18 as const,
    title: "California verification plan and facility-exclusion policy",
    observedOn: CALIFORNIA_PHASE18_DOSSIER_OBSERVED_ON,
    issue: "https://github.com/jadooh1/national-care-home-finder/issues/131",
    priorPhase17Commit: "8de92b7f999bc09af0a6207a87e479828d9fc01e",
    scope: CALIFORNIA_PHASE18_DOSSIER_SCOPE,
    verdict:
      "NOT publication-ready. Gate BLOCKED (STOP). Full-roster verification plan drafted but crawl not started. Exclusion policy drafted but not activated. CDSS clarification still unanswered. Two human decisions ready: crawl authorization; exclusion-policy adoption. Phase 18 does not request opening the publication gate.",
    verificationPlan: parts.verificationPlan,
    exclusionPolicy: parts.exclusionPolicy,
    approvalOptions: parts.approvalOptions,
    accounting: parts.accounting,
    globalLaunchBlockers: parts.globalLaunchBlockers,
    facilitySpecificExceptions: parts.facilitySpecificExceptions,
    stopGo: parts.stopGo,
    humanDecisionsRequired: parts.humanDecisionsRequired,
    remediationSequence: CALIFORNIA_PHASE18_REMEDIATION_SEQUENCE,
    allowsPublication: false as const,
    publicationReady: false as const,
    gate: "blocked" as const,
    crawlStarted: false as const,
    exclusionPolicyActivated: false as const,
    requestsPublicationGateOpen: false as const,
  };
}

export function californiaPhase18VerificationExclusionAllowsPublication(): false {
  return false;
}
