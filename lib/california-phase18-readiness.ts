/**
 * California Phase 18 — decision-ready readiness report.
 * Preserves Phase 10–17 baseline accounting. Separates global launch blockers
 * from facility-specific exceptions. Gate stays BLOCKED. No crawl. No policy activation.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE18_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase18BlockerSeverity =
  | "global-launch-blocker"
  | "facility-specific-exception"
  | "optional-enhancement";

export type CaliforniaPhase18ReadinessItem = {
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
    | "verification-plan"
    | "exclusion-policy"
    | "approval-options";
  status: "pass" | "fail" | "partial" | "not-applicable";
  severity: CaliforniaPhase18BlockerSeverity;
  summary: string;
};

export const CALIFORNIA_PHASE18_READINESS_ITEMS: readonly CaliforniaPhase18ReadinessItem[] = [
  {
    id: "authoritative-iso-export-date",
    area: "freshness",
    status: "fail",
    severity: "global-launch-blocker",
    summary:
      "No verified CDSS ISO export/version stamp for DownloadStateData. Filename/weekly FAQ remain non-authoritative. Global launch blocker.",
  },
  {
    id: "cdss-clarification-awaiting-response",
    area: "cdss-correspondence",
    status: "partial",
    severity: "global-launch-blocker",
    summary:
      "CDSS clarification still unanswered (sent-awaiting-response). Do not send duplicate inquiries. Global launch blocker tied to freshness.",
  },
  {
    id: "licensing-status-eligibility-rules",
    area: "licensing-status",
    status: "partial",
    severity: "global-launch-blocker",
    summary:
      "Withdrawn controls and unknown-ineligible conflicts preserved. Roster-wide FacilityDetail status remains unverified (sample only).",
  },
  {
    id: "official-disclosure-links",
    area: "disclosure-links",
    status: "partial",
    severity: "global-launch-blocker",
    summary:
      "Cumulative 462/15,451 (~2.99%). Not roster-complete. Full-roster plan drafted; crawl not started.",
  },
  {
    id: "sample-vs-roster-verification",
    area: "verification-breadth",
    status: "fail",
    severity: "global-launch-blocker",
    summary:
      "Sample verification cannot approve California publication. Never claim statewide coverage from a partial sample.",
  },
  {
    id: "unique-valid-identifiers",
    area: "unique-ids",
    status: "partial",
    severity: "global-launch-blocker",
    summary:
      "Official 8–9 digit IDs preserved with leading zeros. Invalid IDs remain fail-closed. Policy draft covers mismatched IDs.",
  },
  {
    id: "capacity-field-integrity",
    area: "capacity",
    status: "partial",
    severity: "global-launch-blocker",
    summary:
      "Baseline preserved: 21 official blanks on PENDING excluded rows only (0 publication-candidate blanks).",
  },
  {
    id: "eligible-facility-types",
    area: "facility-types",
    status: "pass",
    severity: "global-launch-blocker",
    summary:
      "RCFE and ARF eligible Facility Type strings remain defined; out-of-scope ARF types stay excluded.",
  },
  {
    id: "exclusive-bucket-accounting",
    area: "accounting",
    status: "pass",
    severity: "global-launch-blocker",
    summary:
      "Exclusive-bucket invariant preserved: 15,413 active + 38 restricted + 8,921 excluded + 5 exceptions = 24,377.",
  },
  {
    id: "publication-and-owner-claim-safeguards",
    area: "safeguards",
    status: "pass",
    severity: "global-launch-blocker",
    summary:
      "California remains unpublished; owner claims ineligible; gate blocked; Phase 18 does not request gate open.",
  },
  {
    id: "official-coordinates",
    area: "coordinates",
    status: "partial",
    severity: "facility-specific-exception",
    summary:
      "Baseline 15,423 verified / 28 unresolved. Feature-suppression-map under draft exclusion policy. Not re-probed.",
  },
  {
    id: "licensed-missing-initial-date-statewide",
    area: "exceptions",
    status: "partial",
    severity: "facility-specific-exception",
    summary:
      "14 statewide LICENSED-missing-date flags remain unknown-ineligible. Covered by draft exclusion policy (not activated).",
  },
  {
    id: "status-conflict-502701867",
    area: "status-conflict",
    status: "partial",
    severity: "facility-specific-exception",
    summary:
      "Individual facility exception remains unknown-ineligible / unpublishable / unclaimable.",
  },
  {
    id: "exception-safeguards-preserved",
    area: "exceptions",
    status: "pass",
    severity: "facility-specific-exception",
    summary:
      "Withdrawn ineligible; 95354 refuse-closed; leading zeros preserved; 28 coords not re-probed; CDSS email not resent; crawl not started.",
  },
  {
    id: "verification-plan-drafted",
    area: "verification-plan",
    status: "pass",
    severity: "optional-enhancement",
    summary:
      "Approval-ready full-roster verification plan drafted with estimates, rate limits, concurrency=1, retry/backoff, checkpointing, CDSS protection, stop thresholds, retention. performNow=false.",
  },
  {
    id: "exclusion-policy-drafted",
    area: "exclusion-policy",
    status: "pass",
    severity: "optional-enhancement",
    summary:
      "Draft facility-exclusion policy ready for adoption decision. activated=false. Distinguishes complete listing exclusion vs feature suppression.",
  },
  {
    id: "approval-options-separated",
    area: "approval-options",
    status: "pass",
    severity: "optional-enhancement",
    summary:
      "Separate recommendations: crawl authorization (pilot vs staged), exclusion-policy adoption, publication preconditions. Does not request gate open.",
  },
] as const;

/** Stop conditions — all must be true before a human may consider GO. */
export const CALIFORNIA_PHASE18_PUBLICATION_STOP_GO = {
  publicationReady: false as const,
  recommendation: "STOP" as const,
  stopConditionsStillOpen: [
    "authoritative-iso-export-date-absent",
    "cdss-clarification-reply-unanswered",
    "roster-wide-facilitydetail-status-incomplete",
    "disclosure-link-coverage-not-roster-complete",
    "sample-verification-insufficient-for-publication",
    "exclusion-policy-not-yet-adopted",
    "full-roster-verification-not-authorized-or-complete",
  ] as const,
  goConditionsRequired: [
    "authoritative-iso-export-date-verified-or-human-approved-freshness-policy",
    "roster-wide-status-verification-complete-or-human-adopted-exclusion-policy",
    "disclosure-links-verified-roster-complete-or-human-adopted-exclusion-policy",
    "exception-facilities-excluded-under-fail-closed-rules",
    "exclusive-bucket-accounting-holds",
    "publication-gate-opened-only-by-explicit-human-approval",
  ] as const,
  agentMustNot: [
    "open-or-weaken-publication-gate",
    "publish-california",
    "send-duplicate-cdss-inquiry",
    "start-statewide-or-pilot-crawl",
    "activate-exclusion-policy-without-adoption",
    "fabricate-coordinates-or-capacities",
    "request-permission-to-open-publication-gate-in-this-phase",
    "merge-without-human-approval",
  ] as const,
} as const;

export const CALIFORNIA_PHASE18_HUMAN_DECISIONS_REQUIRED = [
  {
    id: "authorize-limited-pilot-vs-staged-statewide-crawl",
    summary:
      "Authorize limited pilot, staged statewide, or deny further crawl. Phase 18 does not start any crawl.",
  },
  {
    id: "adopt-proposed-exclusion-policy",
    summary:
      "Adopt, defer, or reject the draft facility-exclusion policy. Phase 18 does not activate it.",
  },
  {
    id: "confirm-publication-preconditions-without-gate-request",
    summary:
      "Confirm conditions that must hold before any future publication approval. Do not treat this as a request to open the gate.",
  },
] as const;

export const CALIFORNIA_PHASE18_GLOBAL_LAUNCH_BLOCKERS = [
  "authoritative-iso-export-date",
  "cdss-clarification-awaiting-response",
  "licensing-status-eligibility-rules",
  "official-disclosure-links",
  "sample-vs-roster-verification",
  "unique-valid-identifiers",
  "capacity-field-integrity",
] as const;

export const CALIFORNIA_PHASE18_FACILITY_SPECIFIC_EXCEPTIONS = [
  "official-coordinates",
  "licensed-missing-initial-date-statewide",
  "status-conflict-502701867",
] as const;

export const CALIFORNIA_PHASE18_READINESS_DECISION = {
  observedOn: CALIFORNIA_PHASE18_OBSERVED_ON,
  publicationReady: false,
  publication: "unpublished" as const,
  ownerClaimEligible: false,
  allowsPublication: false,
  freshnessRequirementSatisfied: false,
  authoritativeIsoExportDate: null as null,
  gate: "blocked" as const,
  crawlStarted: false as const,
  exclusionPolicyActivated: false as const,
  exclusionPolicyAdopted: false as const,
  requestsPublicationGateOpen: false as const,
  cdssClarification: {
    status: "sent-awaiting-response" as const,
    replyReceived: false,
    duplicateInquiryAllowed: false,
  },
  baselinePreserved: {
    officialRecords: 24377,
    activeRestrictedCandidates: 15451,
    verifiedCoords: 15423,
    unresolvedCoords: 28,
    missingCapacitiesOnExcluded: 21,
    disclosureSamples: 462,
    statewideMissingLicenseDateFlags: 14,
  },
  globalLaunchBlockers: CALIFORNIA_PHASE18_GLOBAL_LAUNCH_BLOCKERS,
  facilitySpecificExceptions: CALIFORNIA_PHASE18_FACILITY_SPECIFIC_EXCEPTIONS,
  disclosureAudit: {
    cumulativeVerifiedCount: 462,
    rosterDenominator: 15451,
    fullRosterPlanDrafted: true,
    crawlStarted: false,
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
      globalLaunchBlocker: false,
      facilitySpecificException: true,
    },
  },
  stopGo: CALIFORNIA_PHASE18_PUBLICATION_STOP_GO,
  humanDecisionsRequired: CALIFORNIA_PHASE18_HUMAN_DECISIONS_REQUIRED,
  verdict:
    "California is NOT publication-ready. Keep unpublished. Gate BLOCKED (STOP). Phase 18 delivers an approval-ready full-roster verification plan and a draft exclusion policy without starting a crawl, activating policy, or requesting gate open. CDSS clarification still unanswered. Global launch blockers remain separate from facility-specific exceptions.",
  launchBlockingFailures: CALIFORNIA_PHASE18_READINESS_ITEMS.filter(
    item => item.severity === "global-launch-blocker" && item.status !== "pass",
  ).map(item => item.id),
  facilitySpecificOpen: CALIFORNIA_PHASE18_READINESS_ITEMS.filter(
    item => item.severity === "facility-specific-exception" && item.status !== "pass",
  ).map(item => item.id),
  optionalEnhancements: CALIFORNIA_PHASE18_READINESS_ITEMS.filter(
    item => item.severity === "optional-enhancement",
  ).map(item => item.id),
  items: CALIFORNIA_PHASE18_READINESS_ITEMS,
} as const;

export function evaluateCaliforniaPhase18Readiness() {
  return CALIFORNIA_PHASE18_READINESS_DECISION;
}

export function californiaPhase18AllowsPublication(): false {
  return false;
}
