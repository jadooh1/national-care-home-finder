/**
 * California Phase 24 — prioritized launch-dependency checklist.
 * Separates development-only work from actions requiring future authorization.
 * Does not deploy or publish California.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE24_DEPENDENCIES_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase24DependencyLane =
  | "development-only"
  | "requires-future-authorization"
  | "blocked-awaiting-external";

export type CaliforniaPhase24LaunchDependency = {
  id: string;
  rank: number;
  area:
    | "freshness"
    | "policy-activation"
    | "development-qa"
    | "public-disclosures"
    | "rollback-readiness"
    | "production-approval";
  title: string;
  lane: CaliforniaPhase24DependencyLane;
  blocksGo: boolean;
  status:
    | "open"
    | "partial"
    | "ready-offline"
    | "blocked-awaiting-external"
    | "draft-do-not-send";
  evidence: string;
  nextAction: string;
};

export const CALIFORNIA_PHASE24_LAUNCH_DEPENDENCIES: readonly CaliforniaPhase24LaunchDependency[] =
  [
    {
      id: "authoritative-freshness",
      rank: 1,
      area: "freshness",
      title: "Authoritative DownloadStateData ISO export / version stamp",
      lane: "blocked-awaiting-external",
      blocksGo: true,
      status: "blocked-awaiting-external",
      evidence:
        "Phase 24: official ISO channel still absent. Filename/FAQ/website/HTTP/catalog clocks rejected. Prior CDSS inquiry sent-awaiting-response; mailbox unavailable.",
      nextAction:
        "Human mailbox check; if no reply, optionally approve sending the Phase 24 follow-up draft (agents must not send).",
    },
    {
      id: "cdss-followup-draft",
      rank: 2,
      area: "freshness",
      title: "CDSS clarification follow-up draft (do not send)",
      lane: "requires-future-authorization",
      blocksGo: true,
      status: "draft-do-not-send",
      evidence:
        "Concise follow-up draft prepared in Phase 24 fixtures. Prior inquiry already sent — this is not an automatic resend.",
      nextAction:
        "Human decides whether to send follow-up after mailbox check; never agent-send.",
    },
    {
      id: "exclusion-policy-activation",
      rank: 3,
      area: "policy-activation",
      title: "Activate offline eligibility matrix / exclusion policy in app/DB",
      lane: "requires-future-authorization",
      blocksGo: true,
      status: "ready-offline",
      evidence:
        "Phase 23 matrix prepared offline (88 listing exclusions / 27 map-only / 15,363 otherwise-clear). activatedInApplicationOrDatabase=false.",
      nextAction:
        "Separate human approval to wire listing/map/disclosure suppressions into product layers without altering government fields.",
    },
    {
      id: "status-mapping-approvals",
      rank: 4,
      area: "policy-activation",
      title: "Provisional License and Licensed/Pending Increase mapping decisions",
      lane: "requires-future-authorization",
      blocksGo: true,
      status: "open",
      evidence:
        "5 Provisional + 66 Pending Increase overlays remain unknown-ineligible offline.",
      nextAction:
        "Human approve or reject publication mappings; keep fail-closed until then.",
    },
    {
      id: "development-qa",
      rank: 5,
      area: "development-qa",
      title: "Development QA of unpublished California surfaces",
      lane: "development-only",
      blocksGo: true,
      status: "partial",
      evidence:
        "Automated Phase suites + build validate contracts; product QA sign-off still required before GO.",
      nextAction:
        "Human QA on /development/california, disclosure links, map suppression behavior once exclusions are activation-ready.",
    },
    {
      id: "public-disclosures",
      rank: 6,
      area: "public-disclosures",
      title: "Public disclosure / attribution / source-terms readiness",
      lane: "requires-future-authorization",
      blocksGo: true,
      status: "open",
      evidence:
        "Roster disclosure verification complete (15,451/15,451). Source licensing/terms acceptance not asserted by agents.",
      nextAction:
        "Human confirm CDSS/Transparency terms and any required public attribution before publication.",
    },
    {
      id: "rollback-readiness",
      rank: 7,
      area: "rollback-readiness",
      title: "Rollback plan ready before any future launch",
      lane: "development-only",
      blocksGo: false,
      status: "ready-offline",
      evidence:
        "Phase 23 rollback plan documents unpublished restore, owner-claim disable, audit preservation, WA/OR unchanged.",
      nextAction:
        "Keep rollback checklist attached to any future gate-open request; rehearse unpublished restore in development if desired.",
    },
    {
      id: "separate-production-approval",
      rank: 8,
      area: "production-approval",
      title: "Separate production / gate-open approval",
      lane: "requires-future-authorization",
      blocksGo: true,
      status: "open",
      evidence:
        "California unpublished; californiaDirectoryReady()=false; agents must not open the gate or deploy production.",
      nextAction:
        "Explicit human production approval after all blocking dependencies clear — out of Phase 24 scope.",
    },
  ] as const;

export const CALIFORNIA_PHASE24_STOP_GO = {
  recommendation: "STOP" as const,
  publicationReady: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  rationale:
    "Authoritative freshness remains unresolved; exclusion activation and other statewide dependencies require future authorization. STOP.",
} as const;

export function summarizeCaliforniaPhase24LaunchDependencies(
  rows: readonly CaliforniaPhase24LaunchDependency[] = CALIFORNIA_PHASE24_LAUNCH_DEPENDENCIES,
) {
  const byLane: Record<string, number> = {};
  let blockingOpen = 0;
  for (const row of rows) {
    byLane[row.lane] = (byLane[row.lane] ?? 0) + 1;
    if (row.blocksGo && row.status !== "ready-offline") blockingOpen += 1;
  }
  return {
    total: rows.length,
    byLane,
    blockingDependenciesNotReady: blockingOpen,
    futureAuthorizationRequired: rows.filter(
      r => r.lane === "requires-future-authorization",
    ).length,
    stopGo: CALIFORNIA_PHASE24_STOP_GO,
  };
}

export function evaluateCaliforniaPhase24LaunchDependencies() {
  return {
    observedOn: CALIFORNIA_PHASE24_DEPENDENCIES_OBSERVED_ON,
    dependencies: CALIFORNIA_PHASE24_LAUNCH_DEPENDENCIES,
    summary: summarizeCaliforniaPhase24LaunchDependencies(),
    allowsPublication: false as const,
    gate: "blocked" as const,
    deployedOrPublished: false as const,
  };
}
