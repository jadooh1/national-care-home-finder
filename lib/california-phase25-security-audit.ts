/**
 * California Phase 25 — development-only security / unpublished-access audit.
 * Does not publish California. Does not activate exclusions.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE25_SECURITY_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase25AccessRole =
  | "anonymous"
  | "owner"
  | "administrator"
  | "system";

export type CaliforniaPhase25SecurityFinding = {
  id: string;
  surface:
    | "routes"
    | "apis"
    | "facility-pages"
    | "map"
    | "search"
    | "sitemap-robots"
    | "owner-claims"
    | "admin"
    | "metadata";
  title: string;
  rolesChecked: readonly CaliforniaPhase25AccessRole[];
  status: "pass" | "pass-with-note" | "blocked-test" | "risk-documented";
  evidence: string;
  unpublishedLeakPossible: false;
  remediation: string | null;
};

/**
 * Static/code-path security findings for unpublished California.
 * No live credentialed owner/admin probes in this agent environment —
 * those are documented as blocked-test with expected fail-closed contracts.
 */
export const CALIFORNIA_PHASE25_SECURITY_FINDINGS: readonly CaliforniaPhase25SecurityFinding[] =
  [
    {
      id: "no-public-california-directory-route",
      surface: "routes",
      title: "No public /california directory or facility route",
      rolesChecked: ["anonymous", "owner", "administrator"],
      status: "pass",
      evidence:
        "App routes under app/: washington/*, oregon/*, development/california only. No app/california. directoryContract('California').directoryPath=null.",
      unpublishedLeakPossible: false,
      remediation: null,
    },
    {
      id: "development-california-review-only",
      surface: "routes",
      title: "/development/california is unpublished review without facility listings",
      rolesChecked: ["anonymous"],
      status: "pass",
      evidence:
        "Page states California is unpublished; does not list facilities or profile links; no supabase/fetch/latitude/carefacilitysearch links.",
      unpublishedLeakPossible: false,
      remediation: null,
    },
    {
      id: "homepage-california-label-unpublished",
      surface: "search",
      title: "Homepage California card stays Unpublished (no directory href)",
      rolesChecked: ["anonymous"],
      status: "pass",
      evidence:
        "directoryHref('California', *) returns null; home grid renders Unpublished small text, not a Search link. Nav Find-a-Care-Home links only Washington.",
      unpublishedLeakPossible: false,
      remediation: null,
    },
    {
      id: "no-app-api-california-endpoints",
      surface: "apis",
      title: "No app/api routes expose California facility data",
      rolesChecked: ["anonymous", "system"],
      status: "pass",
      evidence:
        "Repository has no middleware.ts and no app/api tree. California modules are lib/ proposal fixtures only — not HTTP handlers.",
      unpublishedLeakPossible: false,
      remediation: null,
    },
    {
      id: "no-california-map-endpoint",
      surface: "map",
      title: "California map path remains null; mapHref refuse-closed",
      rolesChecked: ["anonymous"],
      status: "pass",
      evidence:
        "directoryContract('California').mapPath=null; mapHref('California')=null. Only /washington/map exists.",
      unpublishedLeakPossible: false,
      remediation: null,
    },
    {
      id: "sitemap-excludes-california",
      surface: "sitemap-robots",
      title: "Public sitemap paths are Washington-only; /development disallowed",
      rolesChecked: ["anonymous", "system"],
      status: "pass",
      evidence:
        "WASHINGTON_PUBLIC_PAGES only; profile paths /washington/{license}; PRIVATE_INDEX_PREFIXES includes /development. No /california sitemap entry generator.",
      unpublishedLeakPossible: false,
      remediation: null,
    },
    {
      id: "robots-disallow-development",
      surface: "sitemap-robots",
      title: "Robots disallow /development when indexing allowed",
      rolesChecked: ["system"],
      status: "pass",
      evidence:
        "robotsPolicy(true).disallow includes /development (covers /development/california).",
      unpublishedLeakPossible: false,
      remediation: null,
    },
    {
      id: "owner-claims-california-ineligible",
      surface: "owner-claims",
      title: "California owner claims remain ineligible while unpublished",
      rolesChecked: ["owner", "anonymous"],
      status: "pass-with-note",
      evidence:
        "californiaDirectoryReady()=false; Phase 23/24 readiness ownerClaimEligible=false; no California owner UI routes. Live owner-session probe not executed in this environment.",
      unpublishedLeakPossible: false,
      remediation:
        "Human may optionally re-verify owner UI with a signed-in owner account in a non-production preview; keep California claim entry closed.",
    },
    {
      id: "admin-no-california-publication-controls",
      surface: "admin",
      title: "Admin surfaces are WA listing/claim review — no California publish switch",
      rolesChecked: ["administrator"],
      status: "pass-with-note",
      evidence:
        "app/admin covers claims/listing-edits/feedback for existing WA flows. No California publication admin page. Credentialed admin probe blocked in this agent environment.",
      unpublishedLeakPossible: false,
      remediation:
        "Future gate-open must not add California publish controls without separate approval.",
    },
    {
      id: "offline-eligibility-not-public-visibility",
      surface: "metadata",
      title: "Offline otherwise-clear candidates do not grant public visibility",
      rolesChecked: ["anonymous", "system"],
      status: "pass",
      evidence:
        "Phase 23 otherwiseClearOfflineEstimate=15363 remains publicationEligible=false while gate blocked; no public CA facility pages exist to surface them.",
      unpublishedLeakPossible: false,
      remediation: null,
    },
    {
      id: "direct-url-guessing-no-ca-facility-pages",
      surface: "facility-pages",
      title: "Direct URL guessing cannot open California facility profiles",
      rolesChecked: ["anonymous"],
      status: "pass",
      evidence:
        "californiaProfileUrl()=null; no app/california/[id] route. Guessed /california/* would 404 at App Router level.",
      unpublishedLeakPossible: false,
      remediation: null,
    },
  ] as const;

export function summarizeCaliforniaPhase25SecurityFindings(
  findings: readonly CaliforniaPhase25SecurityFinding[] = CALIFORNIA_PHASE25_SECURITY_FINDINGS,
) {
  const byStatus: Record<string, number> = {};
  let leakFlags = 0;
  for (const f of findings) {
    byStatus[f.status] = (byStatus[f.status] ?? 0) + 1;
    if (f.unpublishedLeakPossible) leakFlags += 1;
  }
  return {
    total: findings.length,
    byStatus,
    unpublishedLeakPossibleCount: leakFlags,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function evaluateCaliforniaPhase25SecurityAudit() {
  return {
    observedOn: CALIFORNIA_PHASE25_SECURITY_OBSERVED_ON,
    findings: CALIFORNIA_PHASE25_SECURITY_FINDINGS,
    summary: summarizeCaliforniaPhase25SecurityFindings(),
    credentialedProbesExecuted: false as const,
    note:
      "Anonymous/code-path checks executed. Owner/admin live sessions not available in this agent environment; contracts remain fail-closed.",
  };
}
