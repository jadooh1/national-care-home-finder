/**
 * Florida Tier 1 staged launch / rollback plan (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Does not publish Florida or send agency email.
 */

export const FLORIDA_TIER1_LAUNCH_OBSERVED_ON = "2026-11-21";

export const FLORIDA_TIER1_LAUNCH_PHASES = [
  {
    phase: 1,
    name: "Development Tier 1 preview (this PR)",
    actions: [
      "Enumerate offline Tier 1 candidates: LICENSED ALF with unique LicenseID, excluding LicenseNumber 7622 pair and blank-state row (2,251 / 3,025 full-dataset)",
      "Keep directoryContract(\"Florida\") unpublished and floridaDirectoryReady false",
      "Keep Oregon development/map-off/refresh-off and owner claims WA-only",
    ],
    publishesFlorida: false,
    goNoGo: "GO for development-only preview after CI",
  },
  {
    phase: 2,
    name: "AHCA freshness confirmation",
    actions: [
      "Send (human) clarification request for ISO export/version stamp matching the ALF embed",
      "Optionally confirm LicenseNumber 7622 collision and IN REVIEW semantics in writing",
      "Do not invent export dates from nightly-update claims or page Date headers",
    ],
    publishesFlorida: false,
    goNoGo: "STOP until authoritative ISO stamp or approved freshness policy exists",
  },
  {
    phase: 3,
    name: "Explicit publication approval checkpoint",
    actions: [
      "Human approves Florida public Tier 1 directory authorization",
      "Update directoryContract only after approval",
      "Run WA/OR/CA/owner-claim regressions and Florida acceptance",
    ],
    publishesFlorida: false,
    goNoGo: "Requires separate explicit approval — not authorized by this PR",
  },
] as const;

export const FLORIDA_TIER1_ROLLBACK = [
  {
    id: "keep-unpublished",
    action: "Leave directoryContract(\"Florida\") as unpublished (this PR does not change it)",
    owner: "ci",
  },
  {
    id: "remove-preview-route",
    action: "Revert /development/florida-tier1 if needed; no public /florida route exists",
    owner: "human",
  },
  {
    id: "preserve-oregon",
    action: "Confirm Oregon publication=development, mapHref null, oregonRefreshReady false",
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
export const FLORIDA_AHCA_CLARIFICATION_EMAIL_DRAFT = {
  doNotSend: true as const,
  toSuggested: "AHCA Assisted Living Unit / FloridaHealthFinder data steward (verify current contact)",
  subject:
    "Request for authoritative export date and identifier guidance — Assisted Living Facility roster",
  body: `Hello,

We are independently verifying Florida’s Assisted Living Facility (ALF) licensing roster as published on FloridaHealthFinder for a potential consumer directory listing (development review only; nothing is publicly launched from this request).

Could you please confirm:

1. Authoritative freshness
   - Is there an official ISO date or version stamp for the statewide ALF roster that corresponds to the FloridaHealthFinder ALF comparison/list embed (ClientCode 11)?
   - We do not treat the page Date header, “updated nightly” consumer language, HTTP clocks, or the Miami-Dade sample workbook title as the statewide ALF export date.

2. Identifiers
   - Please confirm that LicenseID is the stable facility key for Profile/?LID={LicenseID} links.
   - LicenseNumber 7622 currently appears on two different facilities (LicenseID 979 / FileNumber 11910431, LICENSED; and LicenseID 1005 / FileNumber 11910496, PROVISIONAL). How should consumers treat that collision?

3. LicenseStatus definitions for public listing
   - For a public consumer directory limited to currently licensed facilities, is “LICENSED” the correct include set?
   - Should “IN REVIEW”, “PROVISIONAL”, litigation-related statuses, “INACTIVE”, “SUSPENDED”, and “PENDING DENIED RENEWAL” be excluded from public listings?
   - IsClosed appears False even on INACTIVE/SUSPENDED rows in the list embed — should IsClosed be ignored for listing decisions?

4. Coordinates (optional for our basic listing)
   - Are the Latitude/Longitude fields on the list embed official licensing coordinates with a documented provenance, or should they be omitted from maps?

Thank you for any written guidance or a dated bulk file that matches the statewide ALF embed.

Regards,
`,
} as const;

export function buildFloridaTier1LaunchPlan() {
  return {
    observedOn: FLORIDA_TIER1_LAUNCH_OBSERVED_ON,
    phases: [...FLORIDA_TIER1_LAUNCH_PHASES],
    rollback: [...FLORIDA_TIER1_ROLLBACK],
    agencyEmailDraft: FLORIDA_AHCA_CLARIFICATION_EMAIL_DRAFT,
    allowsPublicationWithoutApproval: false as const,
    mergesToMain: false as const,
    supabaseWrites: false as const,
    emailSent: false as const,
  };
}
