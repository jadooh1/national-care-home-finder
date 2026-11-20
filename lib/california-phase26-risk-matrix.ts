/**
 * California Phase 26 — remaining-risk matrix for future launch.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE26_RISK_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase26Risk = {
  id: string;
  area: string;
  severity: "blocker" | "high" | "medium" | "accepted-control";
  blocksGo: boolean;
  mitigation: string;
  owner: "external" | "human-approval" | "development";
};

export const CALIFORNIA_PHASE26_RISKS: readonly CaliforniaPhase26Risk[] = [
  {
    id: "authoritative-freshness",
    area: "Source freshness",
    severity: "blocker",
    blocksGo: true,
    mitigation: "Obtain ISO/version stamp or CDSS reply; do not invent dates.",
    owner: "external",
  },
  {
    id: "cdss-reply",
    area: "CDSS clarification",
    severity: "blocker",
    blocksGo: true,
    mitigation: "Mailbox check first; follow-up draft remains draft-do-not-send.",
    owner: "human-approval",
  },
  {
    id: "exclusion-activation",
    area: "Eligibility policy",
    severity: "blocker",
    blocksGo: true,
    mitigation: "Activate offline matrix only after explicit approval.",
    owner: "human-approval",
  },
  {
    id: "status-mappings",
    area: "Provisional / Pending Increase",
    severity: "blocker",
    blocksGo: true,
    mitigation: "Human mapping decisions before any public listing.",
    owner: "human-approval",
  },
  {
    id: "source-licensing",
    area: "Public disclosures / terms",
    severity: "high",
    blocksGo: true,
    mitigation: "Confirm attribution and licensing copy for publication.",
    owner: "human-approval",
  },
  {
    id: "unresolved-coords",
    area: "Map coverage",
    severity: "medium",
    blocksGo: false,
    mitigation: "27 map-only suppressions; listing eligibility separate from map.",
    owner: "development",
  },
  {
    id: "credentialed-probes",
    area: "Owner/admin live sessions",
    severity: "accepted-control",
    blocksGo: false,
    mitigation: "Contracts fail-closed; optional human preview probe.",
    owner: "development",
  },
  {
    id: "production-gate-open",
    area: "Production deploy",
    severity: "blocker",
    blocksGo: true,
    mitigation: "Separate explicit production / gate-open approval required.",
    owner: "human-approval",
  },
] as const;

export function evaluateCaliforniaPhase26RiskMatrix() {
  const blockers = CALIFORNIA_PHASE26_RISKS.filter(r => r.blocksGo);
  return {
    observedOn: CALIFORNIA_PHASE26_RISK_OBSERVED_ON,
    risks: CALIFORNIA_PHASE26_RISKS,
    blockerCount: blockers.length,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
  };
}
