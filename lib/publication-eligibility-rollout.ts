/**
 * Staged rollout / rollback plan for the tiered publication framework.
 * Development-only. Intentionally free of sibling runtime imports.
 *
 * No state becomes public without separate explicit approval.
 */

export const PUBLICATION_ROLLOUT_OBSERVED_ON = "2026-11-21";

export type LaunchCandidateVerdict =
  | "already-public-baseline"
  | "development-preview-only"
  | "unpublished-stop"
  | "blocked";

export type LaunchCandidateAssessment = {
  state: string;
  verdict: LaunchCandidateVerdict;
  realisticNextRole: string;
  evidenceStrength: "high" | "medium" | "low";
  requiredSourceConfirmations: readonly string[];
  publicationApprovalRequired: true;
  reason: string;
};

/**
 * First realistic launch candidate among researched states, based on verified
 * evidence — not a publication authorization.
 *
 * Ranking logic (honest):
 * 1. Washington is already public (baseline; not a new launch).
 * 2. Oregon is the only non-WA state with an existing authorized development
 *    directory surface — nearest staged preview candidate, still STOP for public.
 * 3. Among unpublished Class B rosters, Florida has the strongest combination of
 *    stable ID, address, status field, and verified facility disclosure prefix,
 *    but remains STOP until ISO export + status mapping + coordinate provenance.
 */
export const FIRST_REALISTIC_LAUNCH_CANDIDATE = {
  state: "Oregon",
  role: "staged-development-preview-continuation",
  notAPublicLaunchAuthorization: true as const,
  why:
    "Oregon already has a host-gated development directory with verified ODHS profile disclosure and Open status filtering. It is the nearest realistic next operational surface under existing authorization. It is not ready for public launch (no ISO export, street withheld, map disabled).",
  strongestUnpublishedFollowOn: {
    state: "Florida",
    role: "future-tier1-candidate-after-source-confirmations",
    notAPublicLaunchAuthorization: true as const,
    why:
      "FloridaHealthFinder ALF embed shows 3,025 rows with identifiers, addresses, LicenseStatus, capacity, and verified Profile/?LID= disclosure — the strongest unpublished Tier 1 precursor among researched states — but ISO export, status publication mapping, and coordinate provenance remain open (STOP).",
  },
} as const;

export const LAUNCH_CANDIDATE_ASSESSMENTS: readonly LaunchCandidateAssessment[] = [
  {
    state: "Washington",
    verdict: "already-public-baseline",
    realisticNextRole: "Preserve production directory and map.",
    evidenceStrength: "high",
    requiredSourceConfirmations: [],
    publicationApprovalRequired: true,
    reason: "Already public; framework must not regress WA behavior.",
  },
  {
    state: "Oregon",
    verdict: "development-preview-only",
    realisticNextRole: "Continue development preview; seek ISO export + street policy.",
    evidenceStrength: "high",
    requiredSourceConfirmations: [
      "Authoritative ISO export/version stamp for ODHS provider export",
      "Written rule whether street may enter a Tier 1 listing surface",
      "Reaffirm map remains disabled until licensing coordinates exist",
    ],
    publicationApprovalRequired: true,
    reason: FIRST_REALISTIC_LAUNCH_CANDIDATE.why,
  },
  {
    state: "Florida",
    verdict: "unpublished-stop",
    realisticNextRole: "Strongest unpublished Tier 1 precursor after confirmations.",
    evidenceStrength: "high",
    requiredSourceConfirmations: [
      "AHCA ISO export/version stamp matching FloridaHealthFinder ALF embed",
      "LicenseStatus → publication mapping (IsClosed=false insufficient)",
      "Coordinate provenance decision (list-embed vs licensing)",
      "ALF / AFCH / specialty category rules",
    ],
    publicationApprovalRequired: true,
    reason: FIRST_REALISTIC_LAUNCH_CANDIDATE.strongestUnpublishedFollowOn.why,
  },
  {
    state: "California",
    verdict: "blocked",
    realisticNextRole: "Remain BLOCKED; exclusions stay inactive.",
    evidenceStrength: "high",
    requiredSourceConfirmations: [
      "Authoritative ISO export",
      "Separate human approval to unblock publication gate",
      "Exclusion policy activation approval (separate)",
    ],
    publicationApprovalRequired: true,
    reason: "California publication gate BLOCKED; no CDSS recrawl in this work.",
  },
  {
    state: "Tennessee",
    verdict: "unpublished-stop",
    realisticNextRole: "ACLF Tier 1 precursor after freshness + disclosure.",
    evidenceStrength: "medium",
    requiredSourceConfirmations: [
      "ISO export/version stamp",
      "lic_no disclosure URL",
      "Licensed vs On Probation vs LLC Licensed rules",
    ],
    publicationApprovalRequired: true,
    reason: "Strong ID/address/status; freshness and disclosure open.",
  },
  {
    state: "South Carolina",
    verdict: "unpublished-stop",
    realisticNextRole: "Preserve CRCF evidence; no launch.",
    evidenceStrength: "medium",
    requiredSourceConfirmations: [
      "ISO export/version stamp",
      "LICENSE_NBR disclosure URL",
      "Coordinate provenance rules",
    ],
    publicationApprovalRequired: true,
    reason: "SC evidence preserved; STOP.",
  },
  {
    state: "Kentucky",
    verdict: "unpublished-stop",
    realisticNextRole: "Preserve ALC evidence; resolve LICENSE # integrity.",
    evidenceStrength: "medium",
    requiredSourceConfirmations: [
      "ISO export/version stamp",
      "Blank/duplicate LICENSE # rules",
      "Pending Renewal operating-status clarification",
    ],
    publicationApprovalRequired: true,
    reason: "KY evidence preserved; STOP.",
  },
  {
    state: "North Carolina",
    verdict: "unpublished-stop",
    realisticNextRole: "Resolve status domain before Tier 1.",
    evidenceStrength: "medium",
    requiredSourceConfirmations: [
      "Per-row status domain",
      "ISO export",
      "Disclosure prefix",
    ],
    publicationApprovalRequired: true,
    reason: "Status/disclosure gaps.",
  },
  {
    state: "Massachusetts",
    verdict: "unpublished-stop",
    realisticNextRole: "Establish stable regulatory identifier.",
    evidenceStrength: "low",
    requiredSourceConfirmations: [
      "Stable license/facility identifier field",
      "ISO export",
      "Licensing coordinate provenance",
    ],
    publicationApprovalRequired: true,
    reason: "Identifier gap blocks Tier 1.",
  },
] as const;

export const PUBLICATION_ROLLOUT_PHASES = [
  {
    phase: 1,
    name: "Framework land (this PR)",
    actions: [
      "Ship evaluator, profiles, fixture hard-cases, readiness report, development preview",
      "Keep directoryContract unchanged (WA public, OR development, others unpublished)",
      "Keep owner claims WA-only; CA blocked; exclusions inactive",
    ],
    goNoGo: "GO for development-only merge after CI",
    publishesStates: false,
  },
  {
    phase: 2,
    name: "Oregon development preview hardening",
    actions: [
      "Obtain ODHS ISO export/version stamp",
      "Decide street-field policy for any future Tier 1 surface",
      "Keep map disabled",
      "Preview acceptance tests on development host only",
    ],
    goNoGo: "STOP for public; GO for continued development only with approval",
    publishesStates: false,
  },
  {
    phase: 3,
    name: "Florida unpublished Tier 1 dry-run (offline)",
    actions: [
      "Obtain AHCA ISO export matching ALF embed",
      "Freeze LicenseStatus publication mapping",
      "Run full-dataset offline evaluator; label scope full-dataset",
      "Do not flip directoryContract",
    ],
    goNoGo: "STOP until separate publication approval",
    publishesStates: false,
  },
  {
    phase: 4,
    name: "Explicit publication approval checkpoint",
    actions: [
      "Human approves exact state + tier surface",
      "Update directoryContract only for that state",
      "Run preview acceptance + WA/OR/CA regression suite",
      "Publish only after approval; no Supabase writes from agent",
    ],
    goNoGo: "Requires separate explicit approval",
    publishesStates: false,
  },
] as const;

export const PUBLICATION_ROLLBACK_CHECKLIST = [
  {
    id: "revert-directory-contract",
    action: "Set directoryContract publication back to unpublished/development as applicable",
    owner: "human",
  },
  {
    id: "disable-public-routes",
    action: "Remove or withhold any newly added public state routes; keep /development/* only",
    owner: "human",
  },
  {
    id: "preserve-wa-or",
    action: "Confirm Washington public directory/map and Oregon development host gate still pass regressions",
    owner: "ci",
  },
  {
    id: "keep-ca-blocked",
    action: "Confirm californiaDirectoryReady false and exclusion policy activated false",
    owner: "ci",
  },
  {
    id: "owner-claims",
    action: "Confirm ENABLED_OWNER_FACILITY_STATES remains [WA] only",
    owner: "ci",
  },
  {
    id: "no-supabase-rollback-needed-for-framework",
    action: "Framework ships with applied:false schema proposal; no DB rollback unless a later migration was applied",
    owner: "human",
  },
] as const;

export function buildPublicationRolloutPlan() {
  return {
    observedOn: PUBLICATION_ROLLOUT_OBSERVED_ON,
    firstRealisticLaunchCandidate: FIRST_REALISTIC_LAUNCH_CANDIDATE,
    assessments: [...LAUNCH_CANDIDATE_ASSESSMENTS],
    phases: [...PUBLICATION_ROLLOUT_PHASES],
    rollback: [...PUBLICATION_ROLLBACK_CHECKLIST],
    allowsPublicationWithoutApproval: false as const,
    mergesToMain: false as const,
    supabaseWrites: false as const,
  };
}
