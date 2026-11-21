/**
 * Ohio Tier 1 staged launch / rollback plan (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Does not publish Ohio or send agency email.
 */

export const OHIO_TIER1_LAUNCH_OBSERVED_ON = "2026-11-21";

export const OHIO_TIER1_LAUNCH_PHASES = [
  {
    phase: 1,
    name: "Development Tier 1 preview (this PR)",
    actions: [
      "Enumerate offline Tier 1 candidates: ACTIVE L12 RCF with unique FACID (801 / 1,152)",
      "Keep directoryContract(\"Ohio\") unpublished and ohioDirectoryReady false",
      "Preserve Florida offline 2,251 candidates and Oregon development/map-off",
      "Keep owner claims WA-only; do not touch NC/DE/WA publication surfaces",
    ],
    publishesOhio: false,
    goNoGo: "GO for development-only preview after CI",
  },
  {
    phase: 2,
    name: "ODH freshness + status freeze",
    actions: [
      "Human sends clarification for ISO export/version stamp matching Facility Listing extract",
      "Freeze ACTIVE-only include set (or expand only with written ODH/status approval)",
      "Optionally confirm stable disclosure URL outside session search",
      "Do not invent export dates from ArcGIS, PDF clocks, or ~720 program copy",
    ],
    publishesOhio: false,
    goNoGo: "STOP until authoritative ISO stamp or approved freshness policy exists",
  },
  {
    phase: 3,
    name: "Explicit publication approval checkpoint",
    actions: [
      "Human approves Ohio public Tier 1 directory authorization",
      "Update directoryContract only after approval",
      "Run WA/OR/FL/CA/owner-claim regressions and Ohio acceptance",
    ],
    publishesOhio: false,
    goNoGo: "Requires separate explicit approval — not authorized by this PR",
  },
] as const;

export const OHIO_TIER1_ROLLBACK = [
  {
    id: "keep-unpublished",
    action: "Leave directoryContract(\"Ohio\") unpublished (this PR does not change it)",
    owner: "ci",
  },
  {
    id: "remove-preview-route",
    action: "Revert /development/ohio-tier1 and /development/next-state-readiness if needed",
    owner: "human",
  },
  {
    id: "preserve-florida-oregon",
    action: "Confirm Florida unpublished + offline counts intact; Oregon development/map-off",
    owner: "ci",
  },
  {
    id: "preserve-wa-owner-claims",
    action: "Confirm ENABLED_OWNER_FACILITY_STATES remains [WA] only",
    owner: "ci",
  },
  {
    id: "no-supabase-rollback",
    action: "No migration applied — no database rollback",
    owner: "human",
  },
] as const;

/**
 * Draft only — do not send from the agent.
 */
export const OHIO_ODH_CLARIFICATION_EMAIL_DRAFT = {
  doNotSend: true as const,
  toSuggested:
    "Ohio Department of Health Bureau of Regulatory Operations / public information requests (verify current contact)",
  subject:
    "Request for authoritative export date — Residential Care Facility Listing extract",
  body: `Hello,

We are independently verifying Ohio’s Residential Care / Assisted Living Facility Listing extract from the ODH EID Health Care Provider & Information Extract for a development-only consumer directory review. Nothing is publicly launched from this request.

Could you please confirm:

1. Authoritative freshness
   - Is there an official ISO date or version stamp for the statewide Facility Listing CSV when filtered to provider type Residential Care or Assisted Living (State of Ohio License)?
   - We do not treat PDF filename timestamps, HTTP clocks, ArcGIS OneSource “updated every 2 months” / dataLastEditDate, or the program-page approximate facility count as the export date.

2. Identifiers and disclosure
   - Please confirm FACID (OHL#####) is the stable unique facility key for the listing.
   - Is there a stable public URL pattern for a facility’s State License detail page that does not require an interactive search session (FACID or STATEID query parameters currently fail outside session)?

3. Status domain for public listing
   - For a public consumer directory limited to currently operating facilities, is OPERSTDESC “ACTIVE” the correct include set?
   - Should “ACTIVE - PENDING RENEWAL”, “PENDING”, and “CLOSED-*” be excluded?

Thank you for any written guidance or a dated bulk file that matches the Facility Listing extract.

Regards,
`,
} as const;

export function buildOhioTier1LaunchPlan() {
  return {
    observedOn: OHIO_TIER1_LAUNCH_OBSERVED_ON,
    phases: [...OHIO_TIER1_LAUNCH_PHASES],
    rollback: [...OHIO_TIER1_ROLLBACK],
    agencyEmailDraft: OHIO_ODH_CLARIFICATION_EMAIL_DRAFT,
    allowsPublicationWithoutApproval: false as const,
    mergesToMain: false as const,
    supabaseWrites: false as const,
    emailSent: false as const,
  };
}
