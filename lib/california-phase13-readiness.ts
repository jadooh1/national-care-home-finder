/**
 * California Phase 13 — publication-readiness evidence update after scalable
 * disclosure audit harness + expanded status verification. Preserves
 * Phase 10–12 baseline accounting and keeps the gate BLOCKED.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE13_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase13BlockerSeverity = "launch-blocking" | "optional-enhancement";

export type CaliforniaPhase13ReadinessItem = {
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
    | "cdss-correspondence"
    | "audit-harness";
  status: "pass" | "fail" | "partial" | "not-applicable";
  severity: CaliforniaPhase13BlockerSeverity;
  summary: string;
};

/**
 * Phase 13 readiness matrix. Launch-blocking items keep California unpublished.
 * Larger stratified samples + resumable audit harness improve process maturity
 * but do not unlock publication.
 */
export const CALIFORNIA_PHASE13_READINESS_ITEMS: readonly CaliforniaPhase13ReadinessItem[] = [
  {
    id: "authoritative-iso-export-date",
    area: "freshness",
    status: "fail",
    severity: "launch-blocking",
    summary:
      "No verified CDSS ISO export/version stamp for a specific DownloadStateData attachment. Awaiting CDSS response to the already-sent clarification; weekly FAQ cadence remains policy-only. Do not resend.",
  },
  {
    id: "licensing-status-eligibility-rules",
    area: "licensing-status",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Phase 13 expands FacilityDetail status sampling across licensed/probationary/closed/pending/exceptional strata and retains five CLOSED→Application Withdrawn regression controls (withdrawn-ineligible). Roster-wide FacilityDetail status remains unverified. Download-only CLOSED empty-License-First-Date counts are not official status evidence.",
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
      "Official 8–9 digit IDs preserved with leading zeros in the disclosure link generator and audit harness; invalid/exceptional IDs remain fail-closed.",
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
      "Phase 13 ships a resumable, rate-limited disclosure audit harness for the 15,451 publication candidates and begins with a predefined larger stratified sample (target N=120). Exact denominators reported; not roster-complete coverage.",
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
      "Larger stratified samples and a scalable audit process improve confidence but remain bounded. Sample verification cannot approve California publication. Never claim statewide coverage from a partial sample.",
  },
  {
    id: "resumable-disclosure-audit-harness",
    area: "audit-harness",
    status: "pass",
    severity: "optional-enhancement",
    summary:
      "Checkpointed, rate-limited, retry/backoff audit runner with request/duration/consecutive-inconclusive stop conditions is available for continued roster verification without uncontrolled crawls.",
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

export const CALIFORNIA_PHASE13_READINESS_DECISION = {
  observedOn: CALIFORNIA_PHASE13_OBSERVED_ON,
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
  statusMapping: {
    phase11GapsRetainedAsRegressionControls: true,
    inventedClosedStarEquivalence: false,
    treatsWithdrawnAsLicensed: false,
    rosterWideFacilityDetailComplete: false,
    distinguishesFacilityDetailFromDownloadOnly: true,
  },
  disclosureAudit: {
    harnessReady: true,
    rosterDenominator: 15451,
    stratifiedSampleOnly: true,
    statewideCoverageClaimed: false,
  },
  verdict:
    "California is NOT publication-ready. Keep unpublished. Gate BLOCKED until an authoritative ISO export date and remaining launch blockers (including roster-complete disclosure/status evidence) are resolved. Phase 13 audit harness + larger stratified samples do not unlock publication.",
  launchBlockingFailures: CALIFORNIA_PHASE13_READINESS_ITEMS.filter(
    item => item.severity === "launch-blocking" && item.status !== "pass",
  ).map(item => item.id),
  optionalEnhancements: CALIFORNIA_PHASE13_READINESS_ITEMS.filter(
    item => item.severity === "optional-enhancement",
  ).map(item => item.id),
  items: CALIFORNIA_PHASE13_READINESS_ITEMS,
} as const;

export function evaluateCaliforniaPhase13Readiness() {
  return CALIFORNIA_PHASE13_READINESS_DECISION;
}

export function californiaPhase13AllowsPublication(): false {
  return false;
}
