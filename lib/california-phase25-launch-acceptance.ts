/**
 * California Phase 25 — launch acceptance rehearsal (preview-safe only).
 * Documents passing / blocked tests, risks, rollback, remaining approvals.
 * Does not deploy to production.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE25_ACCEPTANCE_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase25AcceptanceItem = {
  id: string;
  title: string;
  result: "pass" | "blocked" | "documented-risk" | "future-approval";
  evidence: string;
  productionDeployed: false;
};

export const CALIFORNIA_PHASE25_ACCEPTANCE_ITEMS: readonly CaliforniaPhase25AcceptanceItem[] =
  [
    {
      id: "gate-blocked",
      title: "Publication gate remains BLOCKED",
      result: "pass",
      evidence: "californiaDirectoryReady()=false; allowsPublication=false; STOP.",
      productionDeployed: false,
    },
    {
      id: "unpublished-access-audit",
      title: "Unpublished California not reachable via public surfaces",
      result: "pass",
      evidence:
        "No /california routes; homepage Unpublished; sitemap/robots exclude development; no CA map/API.",
      productionDeployed: false,
    },
    {
      id: "eligibility-regression",
      title: "Phase 23/24 eligibility counts regress",
      result: "pass",
      evidence: "15,451 / 88 / 15,363 / 28 / 27 verified; offline ≠ public visibility.",
      productionDeployed: false,
    },
    {
      id: "source-data-security",
      title: "ID / escaping / disclosure / coord / capacity safeguards",
      result: "pass",
      evidence: "All Phase 25 source-security checks pass; no development defects requiring code fix found.",
      productionDeployed: false,
    },
    {
      id: "credentialed-owner-admin-live",
      title: "Live owner/admin session probes",
      result: "blocked",
      evidence:
        "No authorized credentialed sessions in this agent environment. Contracts remain fail-closed; optional human preview.",
      productionDeployed: false,
    },
    {
      id: "exclusion-activation",
      title: "Exclusion policy activation",
      result: "future-approval",
      evidence: "Adopted offline only; activatedInApplicationOrDatabase=false.",
      productionDeployed: false,
    },
    {
      id: "authoritative-freshness",
      title: "Authoritative ISO export date",
      result: "documented-risk",
      evidence:
        "Still absent (Phase 24). Global launch blocker. CDSS follow-up draft unsent.",
      productionDeployed: false,
    },
    {
      id: "production-deploy",
      title: "Production deploy / gate-open",
      result: "future-approval",
      evidence: "Out of scope. Agents must not deploy or open gate.",
      productionDeployed: false,
    },
  ] as const;

export const CALIFORNIA_PHASE25_ROLLBACK_PROCEDURES = {
  title: "Future California launch rollback (rehearsal notes)",
  steps: [
    "Set California directory publication back to unpublished (gate blocked).",
    "Disable California owner-claim eligibility if enabled.",
    "Keep offline eligibility matrix and audit evidence intact.",
    "Prefer fail-closed suppressions over silent re-publish.",
    "Confirm WA/OR publication contracts unchanged.",
    "Re-enter STOP until go-criteria are re-satisfied.",
  ],
  verification: [
    "californiaDirectoryReady() === false",
    "directoryContract('California').publication === 'unpublished'",
    "directoryHref('California', *) === null",
    "mapHref('California') === null",
  ],
} as const;

export const CALIFORNIA_PHASE25_REMAINING_APPROVALS = [
  "Mailbox check for CDSS reply / optional follow-up send",
  "Authoritative ISO export channel adoption",
  "Exclusion matrix activation in app/DB",
  "Provisional / Pending Increase mapping decisions",
  "Source licensing / public disclosures",
  "Human QA sign-off on preview",
  "Separate production / gate-open approval",
] as const;

export function evaluateCaliforniaPhase25LaunchAcceptance() {
  const byResult: Record<string, number> = {};
  for (const item of CALIFORNIA_PHASE25_ACCEPTANCE_ITEMS) {
    byResult[item.result] = (byResult[item.result] ?? 0) + 1;
  }
  return {
    observedOn: CALIFORNIA_PHASE25_ACCEPTANCE_OBSERVED_ON,
    items: CALIFORNIA_PHASE25_ACCEPTANCE_ITEMS,
    byResult,
    rollback: CALIFORNIA_PHASE25_ROLLBACK_PROCEDURES,
    remainingApprovals: CALIFORNIA_PHASE25_REMAINING_APPROVALS,
    productionDeployed: false as const,
    stopGo: "STOP" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}
