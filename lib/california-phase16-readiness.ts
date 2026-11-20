/**
 * California Phase 16 — publication-readiness evidence update after automated exception
 * detection + expanded disclosure coverage. Preserves Phase
 * 10–14 baseline accounting and keeps the gate BLOCKED unless authoritative
 * data changes verified counts. Does not unlock publication. Distinguishes
 * statewide launch blockers from individual facility exceptions (502701867).
 *
 * Intentionally free of sibling runtime imports so Next.js typecheck and
 * Node --experimental-strip-types tests both resolve this module.
 */

export const CALIFORNIA_PHASE16_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase16BlockerSeverity = "launch-blocking" | "optional-enhancement";

export type CaliforniaPhase16ReadinessItem = {
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
    | "exceptions"
    | "status-conflict"
    | "exception-detection";
  status: "pass" | "fail" | "partial" | "not-applicable";
  severity: CaliforniaPhase16BlockerSeverity;
  summary: string;
};

/**
 * Phase 16 readiness matrix. Launch-blocking items keep California unpublished.
 * Automated exception detection and expanded disclosure coverage improve
 * evidence maturity but do not unlock publication.
 */
export const CALIFORNIA_PHASE16_READINESS_ITEMS: readonly CaliforniaPhase16ReadinessItem[] = [
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
      "Phase 16 retains five CLOSED→Application Withdrawn regression controls (withdrawn-ineligible) and keeps 502701867 as unknown-ineligible. Automated detectors flag status conflicts, missing license dates, and unsafe disclosure IDs. Roster-wide FacilityDetail status remains unverified.",
  },
  {
    id: "automated-exception-detection",
    area: "exception-detection",
    status: "pass",
    severity: "optional-enhancement",
    summary:
      "Deterministic detectors cover facility-ID malformations/mismatches/lost leading zeros, status conflicts, LICENSED-missing-initial-date, unsafe disclosure pages, and unexpected Download sha256 changes. Uncertain records stay ineligible; sample findings are not statewide.",
  },
  {
    id: "status-conflict-502701867",
    area: "status-conflict",
    status: "partial",
    severity: "optional-enhancement",
    summary:
      "Individual facility exception (regression): Download LICENSED vs FacilityDetail Pending Incomplete Application remains unresolved / unknown-ineligible / unpublishable / unclaimable. Automated detectors preserve this control. Not a separate statewide blocker beyond the existing roster-wide status verification gap.",
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
      "Official 8–9 digit IDs preserved with leading zeros. Invalid IDs (e.g. 95354) remain fail-closed; truncated leading-zero requests remain non-canonical.",
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
      "Baseline 15,423 verified official coords / 28 unresolved. Phase 16 does not re-probe all 28 unless genuinely new authoritative evidence appears; no fabrication/geocoding.",
  },
  {
    id: "official-disclosure-links",
    area: "disclosure-links",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Phase 16 expands the rate-limited resumable disclosure audit with an additional previously-unverified stratified batch from the Phase 15 cumulative 347/15,451 baseline. Exact incremental and cumulative denominators reported; not roster-complete coverage.",
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
      "Phase 13 checkpointed/rate-limited/retry harness reused for Phase 16 incremental batch with request/duration/consecutive-inconclusive stop conditions. Automated exception detection runs over sample + statewide sha256/missing-date checks.",
  },
  {
    id: "exception-safeguards-preserved",
    area: "exceptions",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "Five CLOSED→Application Withdrawn remain withdrawn-ineligible; 95354 refuse-closed; leading zeros preserved (015601219 exact); 502701867 unknown-ineligible; 28 unresolved coords unchanged without new authoritative evidence; no unsuccessful coord re-checks; CDSS email not resent.",
  },
  {
    id: "publication-and-owner-claim-safeguards",
    area: "safeguards",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "California remains unpublished; owner claims ineligible; californiaDirectoryReady() false; gate blocked without weakening safeguards. Conflicting facility 502701867 cannot be published or claimed.",
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
    id: "public-portal-future-channel",
    area: "freshness",
    status: "not-applicable",
    severity: "optional-enhancement",
    summary:
      "CCLD Public Portal / FMS may eventually expose better public data channels; not usable as a DownloadStateData export date today.",
  },
] as const;

export const CALIFORNIA_PHASE16_READINESS_DECISION = {
  observedOn: CALIFORNIA_PHASE16_OBSERVED_ON,
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
    statusConflict502701867: {
      relation: "conflict" as const,
      eligibility: "unknown-ineligible" as const,
      publicationEligible: false,
      ownerClaimEligible: false,
      statewidePublicationBlocker: false,
      individualFacilityException: true,
    },
  },
  disclosureAudit: {
    harnessReady: true,
    rosterDenominator: 15451,
    phase15CumulativeVerifiedCount: 347,
    stratifiedSampleOnly: true,
    statewideCoverageClaimed: false,
  },
  exceptions: {
    preservesWithdrawnIneligible: true,
    refusesInvalid95354: true,
    preservesLeadingZeros: true,
    unresolvedCoordsBaseline: 28,
    allowsFabrication: false,
    avoidsRepeatingUnsuccessfulCoordChecks: true,
  },
  verdict:
    "California is NOT publication-ready. Keep unpublished. Gate BLOCKED until an authoritative ISO export date and remaining launch blockers (including roster-complete disclosure/status evidence) are resolved. Phase 16 exception detection + expanded disclosure coverage do not unlock publication. Facility 502701867 remains an individual unknown-ineligible exception.",
  launchBlockingFailures: CALIFORNIA_PHASE16_READINESS_ITEMS.filter(
    item => item.severity === "launch-blocking" && item.status !== "pass",
  ).map(item => item.id),
  optionalEnhancements: CALIFORNIA_PHASE16_READINESS_ITEMS.filter(
    item => item.severity === "optional-enhancement",
  ).map(item => item.id),
  items: CALIFORNIA_PHASE16_READINESS_ITEMS,
} as const;

export function evaluateCaliforniaPhase16Readiness() {
  return CALIFORNIA_PHASE16_READINESS_DECISION;
}

export function californiaPhase16AllowsPublication(): false {
  return false;
}
