/**
 * California Phase 11 — publication-readiness evidence update after disclosure
 * link + licensing-status sample verification. Preserves Phase 10 baseline
 * accounting and keeps the gate BLOCKED. Does not weaken publication safeguards.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE11_OBSERVED_ON = "2026-11-19";

export type CaliforniaPhase11BlockerSeverity = "launch-blocking" | "optional-enhancement";

export type CaliforniaPhase11ReadinessItem = {
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
    | "safeguards"
    | "cdss-correspondence";
  status: "pass" | "fail" | "partial" | "not-applicable";
  severity: CaliforniaPhase11BlockerSeverity;
  summary: string;
};

/**
 * Phase 11 readiness matrix. Launch-blocking items keep California unpublished.
 * Sample disclosure/status gains remain partial — never a publication unlock.
 */
export const CALIFORNIA_PHASE11_READINESS_ITEMS: readonly CaliforniaPhase11ReadinessItem[] = [
  {
    id: "authoritative-iso-export-date",
    area: "freshness",
    status: "fail",
    severity: "launch-blocking",
    summary:
      "No verified CDSS ISO export/version stamp for a specific DownloadStateData attachment. Awaiting CDSS response to the already-sent clarification; weekly FAQ cadence remains policy-only.",
  },
  {
    id: "licensing-status-eligibility-rules",
    area: "licensing-status",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Phase 11 stratified FacilityDetail sample documents matches, CLOSED↔Application Withdrawn mapping-gaps, and exceptional invalid IDs against DownloadStateData. Roster-wide current status remains unverified; sample results are not statewide.",
  },
  {
    id: "eligible-facility-types",
    area: "facility-types",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "RCFE and ARF eligible Facility Type strings (including CCRC / EBSH / ARFPSHN / CCH-ARF) remain defined; out-of-scope ARF types stay excluded.",
  },
  {
    id: "unique-valid-identifiers",
    area: "unique-ids",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Official 8–9 digit IDs preserved with leading zeros in the disclosure link generator; invalid/exceptional IDs remain fail-closed.",
  },
  {
    id: "capacity-field-integrity",
    area: "capacity",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Baseline preserved: 21 official blanks on PENDING excluded rows only (0 publication-candidate blanks). Official blanks never invented.",
  },
  {
    id: "official-coordinates",
    area: "coordinates",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Baseline preserved: 15,423 verified official coords; 28 unresolved. No fabricated/geocoded coords.",
  },
  {
    id: "official-disclosure-links",
    area: "disclosure-links",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Canonical FacDetail page/API URL patterns identified for RCFE and ARF; read-only generator preserves exact IDs including leading zeros. Bounded sample validates working/missing/ambiguous/invalid links with exact denominators — not roster-complete coverage.",
  },
  {
    id: "exclusive-bucket-accounting",
    area: "accounting",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "Exclusive-bucket invariant preserved: 15,413 active + 38 restricted + 8,921 excluded + 5 exceptions = 24,377.",
  },
  {
    id: "sample-vs-roster-verification",
    area: "verification-breadth",
    status: "fail",
    severity: "launch-blocking",
    summary:
      "Phase 11 disclosure and status samples improve confidence but remain bounded. Sample verification cannot approve California publication.",
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
    id: "cdss-clarification-awaiting-response",
    area: "cdss-correspondence",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "CDSS clarification email already sent; awaiting authoritative ISO export-date response. Do not send duplicate inquiries.",
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

export const CALIFORNIA_PHASE11_READINESS_DECISION = {
  observedOn: CALIFORNIA_PHASE11_OBSERVED_ON,
  publicationReady: false,
  publication: "unpublished" as const,
  ownerClaimEligible: false,
  allowsPublication: false,
  freshnessRequirementSatisfied: false,
  authoritativeIsoExportDate: null as null,
  gate: "blocked" as const,
  cdssClarification: {
    status: "sent-awaiting-response" as const,
    duplicateInquiryAllowed: false,
  },
  baselinePreserved: {
    officialRecords: 24377,
    activeRestrictedCandidates: 15451,
    verifiedCoords: 15423,
    unresolvedCoords: 28,
    missingCapacitiesOnExcluded: 21,
  },
  verdict:
    "California is NOT publication-ready. Keep unpublished. Gate BLOCKED until an authoritative ISO export date and remaining launch blockers (including roster-complete disclosure/status evidence) are resolved. Phase 11 sample link/status work does not unlock publication.",
  launchBlockingFailures: CALIFORNIA_PHASE11_READINESS_ITEMS.filter(
    item => item.severity === "launch-blocking" && item.status !== "pass",
  ).map(item => item.id),
  optionalEnhancements: CALIFORNIA_PHASE11_READINESS_ITEMS.filter(
    item => item.severity === "optional-enhancement",
  ).map(item => item.id),
  items: CALIFORNIA_PHASE11_READINESS_ITEMS,
} as const;

export function evaluateCaliforniaPhase11Readiness() {
  return CALIFORNIA_PHASE11_READINESS_DECISION;
}

export function californiaPhase11AllowsPublication(): false {
  return false;
}
