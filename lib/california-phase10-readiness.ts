/**
 * California Phase 10 — final publication-readiness assessment (read-only).
 * Distinguishes launch-blocking blockers from optional enhancements.
 * Does not weaken publication safeguards. California remains unpublished.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE10_OBSERVED_ON = "2026-11-19";

export type CaliforniaPhase10BlockerSeverity = "launch-blocking" | "optional-enhancement";

export type CaliforniaPhase10ReadinessItem = {
  id: string;
  area:
    | "freshness"
    | "licensing-status"
    | "facility-types"
    | "unique-ids"
    | "capacity"
    | "coordinates"
    | "disclosure-links"
    | "accounting"
    | "verification-breadth"
    | "safeguards";
  status: "pass" | "fail" | "partial" | "not-applicable";
  severity: CaliforniaPhase10BlockerSeverity;
  summary: string;
};

/**
 * Concise readiness matrix. Launch-blocking items keep California unpublished.
 * Optional enhancements must not be treated as publication unlocks.
 */
export const CALIFORNIA_PHASE10_READINESS_ITEMS: readonly CaliforniaPhase10ReadinessItem[] = [
  {
    id: "authoritative-iso-export-date",
    area: "freshness",
    status: "fail",
    severity: "launch-blocking",
    summary:
      "No verified CDSS ISO export/version stamp for a specific DownloadStateData attachment. Official FAQ weekly cadence is policy-only and does not unlock publication.",
  },
  {
    id: "licensing-status-eligibility-rules",
    area: "licensing-status",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Download LICENSED / ON PROBATION eligibility rules are defined, but CLOSED↔Application Withdrawn subtype mapping remains unresolved and roster-wide FacilityDetail status is sample-bounded.",
  },
  {
    id: "eligible-facility-types",
    area: "facility-types",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "RCFE and ARF eligible Facility Type strings (including CCRC / EBSH / ARFPSHN / CCH-ARF) are defined; out-of-scope ARF types are excluded.",
  },
  {
    id: "unique-valid-identifiers",
    area: "unique-ids",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Official 8–9 digit IDs preserved with leading zeros; invalid/exceptional IDs remain fail-closed and must not bypass the gate.",
  },
  {
    id: "capacity-field-integrity",
    area: "capacity",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Facility Capacity column present and parsed; 21 official blanks documented on PENDING excluded rows only (0 publication-candidate blanks). Official blanks never invented.",
  },
  {
    id: "official-coordinates",
    area: "coordinates",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "DownloadStateData has no lat/long. 15,423 candidates have verified official ArcGIS coords (14,059 exact + 1,364 identity-corroborated); 28 unresolved (27 unmatched + 1 leading-zero identity rejection). No fabricated/geocoded coords.",
  },
  {
    id: "official-disclosure-links",
    area: "disclosure-links",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "FacilityDetail page prefix and API are known, but verified per-facility disclosure-link coverage is not roster-complete for publication.",
  },
  {
    id: "exclusive-bucket-accounting",
    area: "accounting",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "Exclusive-bucket invariant holds: 15,413 active + 38 restricted + 8,921 excluded + 5 exceptions = 24,377.",
  },
  {
    id: "sample-vs-roster-verification",
    area: "verification-breadth",
    status: "fail",
    severity: "launch-blocking",
    summary:
      "Bounded FacilityDetail samples and Phase quality accounting cannot approve California publication.",
  },
  {
    id: "publication-and-owner-claim-safeguards",
    area: "safeguards",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "California remains unpublished; owner claims ineligible; californiaDirectoryReady() false; gate blocked without weakening safeguards.",
  },
  {
    id: "resolve-remaining-28-coords",
    area: "coordinates",
    status: "fail",
    severity: "optional-enhancement",
    summary:
      "Resolving the 28 unmatched/rejected candidate coords would improve coverage but is secondary to the freshness ISO requirement and must not use fabricated geocoding.",
  },
  {
    id: "public-portal-future-channel",
    area: "freshness",
    status: "not-applicable",
    severity: "optional-enhancement",
    summary:
      "CCLD Public Portal / FMS may eventually expose better public data channels; not usable as a DownloadStateData export date today.",
  },
] as const;

export const CALIFORNIA_PHASE10_READINESS_DECISION = {
  observedOn: CALIFORNIA_PHASE10_OBSERVED_ON,
  publicationReady: false,
  publication: "unpublished" as const,
  ownerClaimEligible: false,
  allowsPublication: false,
  freshnessRequirementSatisfied: false,
  authoritativeIsoExportDate: null as null,
  gate: "blocked" as const,
  verdict:
    "California is NOT publication-ready. Keep unpublished. Gate BLOCKED until an authoritative ISO export date (or equivalent source-issued version stamp) is verified for DownloadStateData.",
  launchBlockingFailures: CALIFORNIA_PHASE10_READINESS_ITEMS.filter(
    item => item.severity === "launch-blocking" && item.status !== "pass",
  ).map(item => item.id),
  optionalEnhancements: CALIFORNIA_PHASE10_READINESS_ITEMS.filter(
    item => item.severity === "optional-enhancement",
  ).map(item => item.id),
  items: CALIFORNIA_PHASE10_READINESS_ITEMS,
} as const;

export function evaluateCaliforniaPhase10Readiness() {
  return CALIFORNIA_PHASE10_READINESS_DECISION;
}

export function californiaPhase10AllowsPublication(): false {
  return false;
}
