/**
 * California Phase 17 — publication-readiness evidence after launch-readiness
 * dossier / decision matrix / freshness reassessment. Preserves Phase 10–16
 * baseline accounting and keeps the gate BLOCKED. Does not unlock publication.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE17_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase17BlockerSeverity = "launch-blocking" | "optional-enhancement";

export type CaliforniaPhase17ReadinessItem = {
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
    | "exceptions"
    | "status-conflict"
    | "disclosure-strategy"
    | "decision-matrix";
  status: "pass" | "fail" | "partial" | "not-applicable";
  severity: CaliforniaPhase17BlockerSeverity;
  summary: string;
};

export const CALIFORNIA_PHASE17_READINESS_ITEMS: readonly CaliforniaPhase17ReadinessItem[] = [
  {
    id: "authoritative-iso-export-date",
    area: "freshness",
    status: "fail",
    severity: "launch-blocking",
    summary:
      "No verified CDSS ISO export/version stamp for a specific DownloadStateData attachment. Live sha256 unchanged; filename/weekly FAQ remain non-authoritative. Gate stays BLOCKED.",
  },
  {
    id: "cdss-clarification-awaiting-response",
    area: "cdss-correspondence",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "CDSS clarification already sent; mailbox unavailable in this environment to confirm a reply. Status remains sent-awaiting-response. Do not send duplicate inquiries.",
  },
  {
    id: "licensing-status-eligibility-rules",
    area: "licensing-status",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Withdrawn controls and unknown-ineligible conflicts preserved. Roster-wide FacilityDetail status remains unverified (sample only).",
  },
  {
    id: "decision-matrix-prioritized",
    area: "decision-matrix",
    status: "pass",
    severity: "optional-enhancement",
    summary:
      "Phase 17 ranked decision matrix separates statewide blockers from facility-excludable exceptions with evidence, risk, and remediation owners.",
  },
  {
    id: "eligible-facility-types",
    area: "facility-types",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "RCFE and ARF eligible Facility Type strings remain defined; out-of-scope ARF types stay excluded.",
  },
  {
    id: "unique-valid-identifiers",
    area: "unique-ids",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Official 8–9 digit IDs preserved with leading zeros. Invalid IDs (e.g. 95354) remain fail-closed.",
  },
  {
    id: "capacity-field-integrity",
    area: "capacity",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Baseline preserved: 21 official blanks on PENDING excluded rows only (0 publication-candidate blanks).",
  },
  {
    id: "official-coordinates",
    area: "coordinates",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Baseline 15,423 verified / 28 unresolved. Not re-probed without new authoritative evidence; excludable from map publication.",
  },
  {
    id: "official-disclosure-links",
    area: "disclosure-links",
    status: "partial",
    severity: "launch-blocking",
    summary:
      "Cumulative 462/15,451 (~2.99%). Not roster-complete. Additional small samples do not meaningfully improve launch readiness.",
  },
  {
    id: "disclosure-strategy-pause-small-samples",
    area: "disclosure-strategy",
    status: "pass",
    severity: "optional-enhancement",
    summary:
      "Strategy: pause small incremental samples; propose rate-limited full-roster verification only after separate human approval. No uncontrolled statewide crawl performed.",
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
      "Sample verification cannot approve California publication. Never claim statewide coverage from a partial sample.",
  },
  {
    id: "exception-safeguards-preserved",
    area: "exceptions",
    status: "pass",
    severity: "launch-blocking",
    summary:
      "Withdrawn ineligible; 95354 refuse-closed; leading zeros preserved; 502701867 unknown-ineligible; 14 LICENSED-missing-date + sampled conflicts kept ineligible; 28 coords not re-probed; CDSS email not resent.",
  },
  {
    id: "status-conflict-502701867",
    area: "status-conflict",
    status: "partial",
    severity: "optional-enhancement",
    summary:
      "Individual facility exception remains unknown-ineligible / unpublishable / unclaimable. Facility-excludable, not a separate statewide blocker beyond roster status verification.",
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
    id: "public-portal-future-channel",
    area: "freshness",
    status: "not-applicable",
    severity: "optional-enhancement",
    summary:
      "CCLD Public Portal / FMS may eventually expose better public data channels; not usable as a DownloadStateData export date today.",
  },
] as const;

/** Stop conditions — all must be true before a human may consider GO. */
export const CALIFORNIA_PHASE17_PUBLICATION_STOP_GO = {
  publicationReady: false as const,
  recommendation: "STOP" as const,
  stopConditionsStillOpen: [
    "authoritative-iso-export-date-absent",
    "cdss-clarification-reply-unconfirmed",
    "roster-wide-facilitydetail-status-incomplete",
    "disclosure-link-coverage-not-roster-complete",
    "sample-verification-insufficient-for-publication",
  ] as const,
  goConditionsRequired: [
    "authoritative-iso-export-date-verified-or-human-approved-freshness-policy",
    "roster-wide-status-verification-complete-or-human-approved-exclusion-policy",
    "disclosure-links-verified-roster-complete-or-human-approved-exclusion-policy",
    "exception-facilities-excluded-under-fail-closed-rules",
    "exclusive-bucket-accounting-holds",
    "publication-gate-opened-only-by-explicit-human-approval",
  ] as const,
  agentMustNot: [
    "open-or-weaken-publication-gate",
    "publish-california",
    "send-duplicate-cdss-inquiry",
    "run-uncontrolled-statewide-crawl",
    "fabricate-coordinates-or-capacities",
    "merge-without-human-approval",
  ] as const,
} as const;

export const CALIFORNIA_PHASE17_HUMAN_DECISIONS_REQUIRED = [
  {
    id: "check-cdss-mailbox-and-interpret-reply",
    summary:
      "Human checks the authorized sending mailbox for a CDSS reply and records whether an authoritative ISO export channel was provided.",
  },
  {
    id: "approve-or-deny-full-roster-disclosure-status-crawl",
    summary:
      "Separate approval required before any large-scale rate-limited full-roster FacilityDetail / disclosure crawl (~15k remaining).",
  },
  {
    id: "approve-facility-exclusion-policy",
    summary:
      "Approve excluding LICENSED-missing-date rows, status-conflict samples, invalid IDs, withdrawn, and 28 unresolved-coord facilities from any future candidate set.",
  },
  {
    id: "approve-publication-gate-open-only-when-stop-go-met",
    summary:
      "Only a human may open the California publication gate after stop/go conditions are satisfied. Agents must keep gate BLOCKED.",
  },
] as const;

export const CALIFORNIA_PHASE17_READINESS_DECISION = {
  observedOn: CALIFORNIA_PHASE17_OBSERVED_ON,
  publicationReady: false,
  publication: "unpublished" as const,
  ownerClaimEligible: false,
  allowsPublication: false,
  freshnessRequirementSatisfied: false,
  authoritativeIsoExportDate: null as null,
  gate: "blocked" as const,
  cdssClarification: {
    status: "sent-awaiting-response" as const,
    mailboxCheckAvailable: false,
    cdssReplyConfirmed: false,
    duplicateInquiryAllowed: false,
  },
  baselinePreserved: {
    officialRecords: 24377,
    activeRestrictedCandidates: 15451,
    verifiedCoords: 15423,
    unresolvedCoords: 28,
    missingCapacitiesOnExcluded: 21,
  },
  disclosureAudit: {
    cumulativeVerifiedCount: 462,
    rosterDenominator: 15451,
    additionalSmallSamplesRecommended: false,
    fullRosterCrawlRequiresSeparateApproval: true,
    statewideCoverageClaimed: false,
  },
  exceptions: {
    preservesWithdrawnIneligible: true,
    refusesInvalid95354: true,
    preservesLeadingZeros: true,
    unresolvedCoordsBaseline: 28,
    statewideLicensedMissingDate: 14,
    sampledFindings: 21,
    allowsFabrication: false,
    avoidsRepeatingUnsuccessfulCoordChecks: true,
  },
  statusMapping: {
    inventedClosedStarEquivalence: false,
    treatsWithdrawnAsLicensed: false,
    rosterWideFacilityDetailComplete: false,
    statusConflict502701867: {
      relation: "conflict" as const,
      eligibility: "unknown-ineligible" as const,
      publicationEligible: false,
      ownerClaimEligible: false,
      statewidePublicationBlocker: false,
      individualFacilityException: true,
    },
  },
  stopGo: CALIFORNIA_PHASE17_PUBLICATION_STOP_GO,
  humanDecisionsRequired: CALIFORNIA_PHASE17_HUMAN_DECISIONS_REQUIRED,
  verdict:
    "California is NOT publication-ready. Keep unpublished. Gate BLOCKED. Phase 17 launch-readiness dossier prioritizes statewide blockers (ISO export date, roster status/disclosure verification) and facility-excludable exceptions without weakening safeguards.",
  launchBlockingFailures: CALIFORNIA_PHASE17_READINESS_ITEMS.filter(
    item => item.severity === "launch-blocking" && item.status !== "pass",
  ).map(item => item.id),
  optionalEnhancements: CALIFORNIA_PHASE17_READINESS_ITEMS.filter(
    item => item.severity === "optional-enhancement",
  ).map(item => item.id),
  items: CALIFORNIA_PHASE17_READINESS_ITEMS,
} as const;

export function evaluateCaliforniaPhase17Readiness() {
  return CALIFORNIA_PHASE17_READINESS_DECISION;
}

export function californiaPhase17AllowsPublication(): false {
  return false;
}
