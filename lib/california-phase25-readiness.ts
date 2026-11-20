/**
 * California Phase 25 — launch readiness (still BLOCKED).
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE25_READINESS_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE25_GLOBAL_LAUNCH_BLOCKERS = [
  "authoritative-iso-export-date",
  "cdss-clarification-reply",
  "exclusion-activation",
  "status-mapping-approvals",
  "source-licensing-public-disclosures",
  "qa-and-separate-production-approval",
] as const;

export const CALIFORNIA_PHASE25_PUBLICATION_STOP_GO = {
  decision: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  californiaDirectoryReady: false as const,
  ownerClaimEligible: false as const,
  exclusionsActivated: false as const,
  crawlExecuted: false as const,
  cdssMailSent: false as const,
  productionWrites: false as const,
  gate: "blocked" as const,
  reason:
    "Phase 25 QA/security rehearsal complete under BLOCKED gate. Freshness and activation blockers remain. STOP.",
} as const;

export type CaliforniaPhase25Readiness = {
  observedOn: string;
  californiaDirectoryReady: false;
  publication: "unpublished";
  ownerClaimEligible: false;
  exclusionsActivated: false;
  crawlExecuted: false;
  cdssMailSent: false;
  productionWrites: false;
  qualityPass: boolean;
  allowsPublication: false;
  gate: "blocked";
  stopGo: "STOP";
  blockers: readonly string[];
};

export function evaluateCaliforniaPhase25Readiness(
  qualityPass = true,
): CaliforniaPhase25Readiness {
  return {
    observedOn: CALIFORNIA_PHASE25_READINESS_OBSERVED_ON,
    californiaDirectoryReady: false,
    publication: "unpublished",
    ownerClaimEligible: false,
    exclusionsActivated: false,
    crawlExecuted: false,
    cdssMailSent: false,
    productionWrites: false,
    qualityPass,
    allowsPublication: false,
    gate: "blocked",
    stopGo: "STOP",
    blockers: [...CALIFORNIA_PHASE25_GLOBAL_LAUNCH_BLOCKERS],
  };
}
