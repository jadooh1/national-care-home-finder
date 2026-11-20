/**
 * California Phase 14 — publication-readiness evidence update after expanded
 * disclosure coverage + exception investigation. Preserves Phase 10–13
 * baseline accounting and keeps the gate BLOCKED unless authoritative data
 * changes verified counts. Does not unlock publication.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE14_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase14BlockerSeverity = "launch-blocking" | "optional-enhancement";

export type CaliforniaPhase14ReadinessItem = {
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
    | "audit-harness"
    | "exceptions";
  status: "pass" | "fail" | "partial" | "not-applicable";
  severity: CaliforniaPhase14BlockerSeverity;
  summary: string;
};

/**
 * Phase 14 readiness matrix. Launch-blocking items keep California unpublished.
 * Expanded disclosure coverage + exception probes improve evidence maturity
 * but do not unlock publication.
 */
export const CALIFORNIA_PHASE14_READINESS_ITEMS: readonly CaliforniaPhase14ReadinessItem[] = [
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
      "Phase 14 strengthens FacilityDetail status sampling on a bounded additional set and retains five CLOSED→Application Withdrawn regression controls (withdrawn-ineligible). Roster-wide FacilityDetail status remains unverified. Download-only CLOSED empty-License-First-Date counts are not official status evidence.",
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
      "Official 8–9 digit IDs preserved with leading zeros. Phase 14 reconfirms truncated leading-zero requests are non-canonical and invalid IDs (e.g. 95354) remain fail-closed.",
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
      "Baseline 15,423 verified official coords / 28 unresolved unless Phase 14 adopts authoritative ArcGIS+FacilityDetail resolutions (never fabricated/geocoded). Remaining unresolved stay excluded from publication coords.",
  },
  {
    id: "official-disclosure-links",
    area: "disclosure-links",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Phase 14 expands the Phase 13 rate-limited resumable disclosure audit with an additional previously-unverified stratified batch. Exact incremental and cumulative denominators reported vs 15,451; not roster-complete coverage.",
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
      "Expanded stratified samples improve confidence but remain bounded. Sample verification cannot approve California publication. Never claim statewide coverage from a partial sample.",
  },
  {
    id: "resumable-disclosure-audit-harness",
    area: "audit-harness",
    status: "pass",
    severity: "optional-enhancement",
    summary:
      "Phase 13 checkpointed/rate-limited/retry harness reused for Phase 14 incremental batch with request/duration/consecutive-inconclusive stop conditions.",
  },
  {
    id: "exception-investigation",
    area: "exceptions",
    status: "partial",
    severity: "optional-enhancement",
    summary:
      "Phase 14 investigates ambiguous/invalid disclosure cases and the 28 unresolved candidate coordinates with official FacilityDetail + ArcGIS evidence only. Resolutions require authoritative matches; no fabrication.",
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
    status: "partial",
    severity: "optional-enhancement",
    summary:
      "Phase 14 re-probes the 28 unmatched/rejected candidate coords with FacilityDetail + targeted ArcGIS queries. Only authoritative resolutions reduce the unresolved count; no fabricated geocoding.",
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

export const CALIFORNIA_PHASE14_READINESS_DECISION = {
  observedOn: CALIFORNIA_PHASE14_OBSERVED_ON,
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
    phase13BaselineVerifiedCount: 116,
    stratifiedSampleOnly: true,
    statewideCoverageClaimed: false,
  },
  exceptions: {
    investigatesAmbiguousAndInvalidDisclosure: true,
    investigatesUnresolvedCoordinates: true,
    allowsFabrication: false,
  },
  verdict:
    "California is NOT publication-ready. Keep unpublished. Gate BLOCKED until an authoritative ISO export date and remaining launch blockers (including roster-complete disclosure/status evidence) are resolved. Phase 14 expanded coverage + exception probes do not unlock publication.",
  launchBlockingFailures: CALIFORNIA_PHASE14_READINESS_ITEMS.filter(
    item => item.severity === "launch-blocking" && item.status !== "pass",
  ).map(item => item.id),
  optionalEnhancements: CALIFORNIA_PHASE14_READINESS_ITEMS.filter(
    item => item.severity === "optional-enhancement",
  ).map(item => item.id),
  items: CALIFORNIA_PHASE14_READINESS_ITEMS,
} as const;

export function evaluateCaliforniaPhase14Readiness() {
  return CALIFORNIA_PHASE14_READINESS_DECISION;
}

export function californiaPhase14AllowsPublication(): false {
  return false;
}

/**
 * Apply authoritative coordinate resolutions to the readiness baseline copy.
 * Never increases verified coords without a matching decrease in unresolved.
 * Fabrication is forbidden — callers must only pass officially resolved counts.
 */
export function withCaliforniaPhase14CoordinateResolution(input: {
  resolvedWithOfficialCoords: number;
}): {
  verifiedCoords: number;
  unresolvedCoords: number;
  fabricatedCoordinates: 0;
} {
  const resolved = Math.max(0, Math.min(28, Math.floor(input.resolvedWithOfficialCoords)));
  return {
    verifiedCoords: 15423 + resolved,
    unresolvedCoords: 28 - resolved,
    fabricatedCoordinates: 0,
  };
}
