/**
 * California Phase 18 — separate human approval options (recommendations only).
 * Does NOT request permission to open California's publication gate.
 * Does NOT start a crawl. Does NOT activate the exclusion policy.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE18_APPROVAL_OBSERVED_ON = "2026-11-20";

export type CaliforniaPhase18ApprovalDecision =
  | "authorize-limited-pilot"
  | "authorize-staged-statewide"
  | "deny-crawl"
  | "adopt-exclusion-policy"
  | "defer-exclusion-policy"
  | "reject-exclusion-policy";

export type CaliforniaPhase18ApprovalOption = {
  id: string;
  decisionFamily:
    | "crawl-authorization"
    | "exclusion-policy-adoption"
    | "publication-preconditions";
  title: string;
  recommendation: string;
  recommendedChoice: string;
  alternatives: readonly string[];
  requestsPublicationGateOpen: false;
  actionableByAgent: false;
  humanOnly: true;
};

/**
 * Three separate decision families. Publication-gate opening is listed only as
 * a future precondition checklist — Phase 18 does not request gate approval.
 */
export const CALIFORNIA_PHASE18_APPROVAL_OPTIONS: readonly CaliforniaPhase18ApprovalOption[] = [
  {
    id: "crawl-authorization",
    decisionFamily: "crawl-authorization",
    title: "Authorize limited pilot vs staged statewide crawl?",
    recommendation:
      "If any crawl is authorized, start with a limited pilot (≤500 previously-unverified facilities) under Phase 13 harness defaults (concurrency=1, minIntervalMs≥450, checkpoint/resume, error stop thresholds). Authorize staged statewide only after pilot error rates and recovery are acceptable. Alternatively deny further crawl and rely on exclusion-until-verified.",
    recommendedChoice: "authorize-limited-pilot-first-then-staged-statewide-if-pilot-ok",
    alternatives: [
      "authorize-limited-pilot",
      "authorize-staged-statewide",
      "deny-crawl-keep-sample-only",
    ],
    requestsPublicationGateOpen: false,
    actionableByAgent: false,
    humanOnly: true,
  },
  {
    id: "exclusion-policy-adoption",
    decisionFamily: "exclusion-policy-adoption",
    title: "Adopt proposed facility-exclusion policy?",
    recommendation:
      "Adopt the Phase 18 draft exclusion policy (complete listing exclusion vs map/disclosure/owner-claim feature suppression) for unverified/conflicting status, invalid IDs, missing license evidence, unresolved coords, bad disclosure links, and closed/pending/withdrawn. Keep activated=false until explicit adoption; preserve fail-closed and unaltered government records.",
    recommendedChoice: "adopt-exclusion-policy",
    alternatives: [
      "adopt-exclusion-policy",
      "defer-exclusion-policy",
      "reject-exclusion-policy-with-written-rationale",
    ],
    requestsPublicationGateOpen: false,
    actionableByAgent: false,
    humanOnly: true,
  },
  {
    id: "publication-preconditions",
    decisionFamily: "publication-preconditions",
    title: "Conditions before any future publication approval?",
    recommendation:
      "Do not request opening the publication gate in Phase 18. Record preconditions only: authoritative ISO export date (or approved freshness policy); CDSS reply interpreted; roster status/disclosure verified or exclusion policy covering gaps; exception facilities excluded under fail-closed rules; exclusive-bucket accounting holds; explicit human gate-open approval in a later phase.",
    recommendedChoice: "record-preconditions-do-not-request-gate-open",
    alternatives: [
      "record-preconditions-only",
      // Explicitly not offered: request-publication-gate-open
    ],
    requestsPublicationGateOpen: false,
    actionableByAgent: false,
    humanOnly: true,
  },
] as const;

export const CALIFORNIA_PHASE18_PUBLICATION_PRECONDITIONS = [
  "authoritative-iso-export-date-verified-or-human-approved-freshness-policy",
  "cdss-clarification-reply-interpreted",
  "roster-wide-status-verification-complete-or-adopted-exclusion-policy",
  "disclosure-links-verified-roster-complete-or-adopted-exclusion-policy",
  "exception-facilities-excluded-under-fail-closed-rules",
  "exclusive-bucket-accounting-holds",
  "publication-gate-opened-only-by-explicit-human-approval-in-a-later-phase",
] as const;

export const CALIFORNIA_PHASE18_APPROVAL_PACKAGE = {
  observedOn: CALIFORNIA_PHASE18_APPROVAL_OBSERVED_ON,
  title: "California Phase 18 approval options (recommendations only)",
  options: CALIFORNIA_PHASE18_APPROVAL_OPTIONS,
  publicationPreconditions: CALIFORNIA_PHASE18_PUBLICATION_PRECONDITIONS,
  requestsPublicationGateOpen: false as const,
  crawlAuthorized: false as const,
  exclusionPolicyAdopted: false as const,
  allowsPublication: false as const,
  gate: "blocked" as const,
  agentMustNot: [
    "start-statewide-or-pilot-crawl",
    "activate-exclusion-policy-without-adoption",
    "open-or-weaken-publication-gate",
    "send-duplicate-cdss-inquiry",
    "request-permission-to-open-publication-gate-in-this-phase",
  ] as const,
} as const;

export function evaluateCaliforniaPhase18ApprovalOptions() {
  return CALIFORNIA_PHASE18_APPROVAL_PACKAGE;
}

export function californiaPhase18RequestsPublicationGateOpen(): false {
  return false;
}
