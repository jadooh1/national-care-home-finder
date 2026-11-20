/**
 * California Phase 12 — publication-readiness evidence update after status
 * mapping interpretation and expanded disclosure verification. Preserves
 * Phase 10/11 baseline accounting and keeps the gate BLOCKED.
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE12_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase12BlockerSeverity = "launch-blocking" | "optional-enhancement";

export type CaliforniaPhase12ReadinessItem = {
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
  severity: CaliforniaPhase12BlockerSeverity;
  summary: string;
};

/**
 * Phase 12 readiness matrix. Launch-blocking items keep California unpublished.
 * Documented CLOSED↔Application Withdrawn coarsening and expanded disclosure
 * samples remain partial — never a publication unlock.
 */
export const CALIFORNIA_PHASE12_READINESS_ITEMS: readonly CaliforniaPhase12ReadinessItem[] = [
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
      "Phase 12 verifies Download CLOSED→FacilityDetail Application Withdrawn as documented coarsening (PIN 4-value domain + Title 22 §80029 + never-licensed date markers) for the five Phase 11 gap IDs. Not Closed* equivalence; withdrawn-ineligible. Roster-wide FacilityDetail status remains unverified.",
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
      "Expanded stratified FacDetail disclosure sample with exact denominators across licensed/probationary/closed/pending/withdrawn/leading-zero/exceptions. Not roster-complete coverage.",
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
      "Phase 12 mapping interpretation and expanded disclosure samples improve confidence but remain bounded. Sample verification cannot approve California publication.",
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

export const CALIFORNIA_PHASE12_READINESS_DECISION = {
  observedOn: CALIFORNIA_PHASE12_OBSERVED_ON,
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
    phase11GapsResolvedAsDocumentedCoarsening: true,
    inventedClosedStarEquivalence: false,
    treatsWithdrawnAsLicensed: false,
    rosterWideFacilityDetailComplete: false,
  },
  verdict:
    "California is NOT publication-ready. Keep unpublished. Gate BLOCKED until an authoritative ISO export date and remaining launch blockers (including roster-complete disclosure/status evidence) are resolved. Phase 12 documented coarsening + expanded samples do not unlock publication.",
  launchBlockingFailures: CALIFORNIA_PHASE12_READINESS_ITEMS.filter(
    item => item.severity === "launch-blocking" && item.status !== "pass",
  ).map(item => item.id),
  optionalEnhancements: CALIFORNIA_PHASE12_READINESS_ITEMS.filter(
    item => item.severity === "optional-enhancement",
  ).map(item => item.id),
  items: CALIFORNIA_PHASE12_READINESS_ITEMS,
} as const;

export function evaluateCaliforniaPhase12Readiness() {
  return CALIFORNIA_PHASE12_READINESS_DECISION;
}

export function californiaPhase12AllowsPublication(): false {
  return false;
}
