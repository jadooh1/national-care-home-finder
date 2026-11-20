/**
 * California Phase 26 — blocked-publication restriction rehearsal.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE26_RESTRICTIONS_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase26RestrictionSurface =
  | "directories"
  | "search"
  | "maps"
  | "facility-pages"
  | "apis"
  | "sitemaps"
  | "metadata-robots"
  | "owner-claims"
  | "wa-or-baseline";

export type CaliforniaPhase26RestrictionCheck = {
  id: string;
  surface: CaliforniaPhase26RestrictionSurface;
  title: string;
  status: "pass" | "pass-with-note";
  evidence: string;
  leakPossible: false;
};

export const CALIFORNIA_PHASE26_RESTRICTION_CHECKS: readonly CaliforniaPhase26RestrictionCheck[] =
  [
    {
      id: "no-public-california-directory",
      surface: "directories",
      title: "No public California directory route",
      status: "pass",
      evidence:
        "directoryContract('California').publication=unpublished; directoryPath=null; only /development/california review page (no facility list).",
      leakPossible: false,
    },
    {
      id: "homepage-search-unpublished",
      surface: "search",
      title: "Homepage California card stays Unpublished",
      status: "pass",
      evidence: "directoryHref('California', *)=null; nav Find-a-Care-Home links Washington only.",
      leakPossible: false,
    },
    {
      id: "no-california-map",
      surface: "maps",
      title: "California map path refuse-closed",
      status: "pass",
      evidence: "mapHref('California')=null; mapPath=null.",
      leakPossible: false,
    },
    {
      id: "no-california-facility-profiles",
      surface: "facility-pages",
      title: "No California facility profile pages",
      status: "pass",
      evidence: "californiaProfileUrl()=null; no app/california/[id]; guessed URLs 404.",
      leakPossible: false,
    },
    {
      id: "no-california-apis",
      surface: "apis",
      title: "No app/api California endpoints",
      status: "pass",
      evidence: "No middleware.ts; no app/api tree; California modules are lib/fixtures only.",
      leakPossible: false,
    },
    {
      id: "sitemap-excludes-california",
      surface: "sitemaps",
      title: "Sitemap paths are Washington-only",
      status: "pass",
      evidence: "WASHINGTON_PUBLIC_PAGES + /washington/{license}; no california paths.",
      leakPossible: false,
    },
    {
      id: "robots-disallow-development",
      surface: "metadata-robots",
      title: "Robots disallow /development when indexing allowed",
      status: "pass",
      evidence: "PRIVATE_INDEX_PREFIXES includes /development.",
      leakPossible: false,
    },
    {
      id: "owner-claims-ineligible",
      surface: "owner-claims",
      title: "California owner claims remain ineligible",
      status: "pass-with-note",
      evidence:
        "ownerClaimEligible=false while unpublished. Live credentialed owner session optional for humans.",
      leakPossible: false,
    },
    {
      id: "washington-oregon-unchanged",
      surface: "wa-or-baseline",
      title: "Washington public / Oregon development contracts unchanged",
      status: "pass",
      evidence:
        "Washington publication=public, directoryPath=/washington. Oregon publication=development. Listed counts 6278 / 1584.",
      leakPossible: false,
    },
  ] as const;

export function summarizeCaliforniaPhase26Restrictions(
  checks: readonly CaliforniaPhase26RestrictionCheck[] = CALIFORNIA_PHASE26_RESTRICTION_CHECKS,
) {
  const leakCount = checks.filter(c => c.leakPossible).length;
  return {
    total: checks.length,
    leakPossibleCount: leakCount,
    allPass: checks.every(c => c.status === "pass" || c.status === "pass-with-note") && leakCount === 0,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function evaluateCaliforniaPhase26PublicationRestrictions() {
  return {
    observedOn: CALIFORNIA_PHASE26_RESTRICTIONS_OBSERVED_ON,
    checks: CALIFORNIA_PHASE26_RESTRICTION_CHECKS,
    summary: summarizeCaliforniaPhase26Restrictions(),
    rehearsalMode: "blocked-publication" as const,
  };
}
