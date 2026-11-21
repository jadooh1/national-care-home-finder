/**
 * Oregon / Florida acceptance matrix for the nationwide publication framework.
 * Development-only. Intentionally free of sibling runtime imports.
 *
 * Encodes verified acceptance decisions after PR #190. Does not publish states
 * or write to Supabase.
 */

export const PUBLICATION_ACCEPTANCE_OBSERVED_ON = "2026-11-21";
export const PUBLICATION_ACCEPTANCE_BASE_COMMIT =
  "e4a5335914b5492df488d5de47b5913207354881";

export type AcceptanceVerdict = "pass" | "fail" | "blocked" | "not-applicable";

export type AcceptanceRow = {
  id: string;
  state: "Oregon" | "Florida" | "Framework" | "Access";
  requirement: string;
  verdict: AcceptanceVerdict;
  evidence: string;
  approvalRequired: boolean;
};

export const PUBLICATION_ACCEPTANCE_MATRIX: readonly AcceptanceRow[] = [
  {
    id: "access-dev-prefix-disallowed",
    state: "Access",
    requirement:
      "/development/publication-eligibility cannot be production-indexed via robots/sitemap",
    verdict: "pass",
    evidence:
      "PRIVATE_INDEX_PREFIXES includes /development; robotsPolicy(true).disallow spreads it; sitemap is Washington-only; development layout uses unindexedMetadata",
    approvalRequired: false,
  },
  {
    id: "access-page-noindex-metadata",
    state: "Access",
    requirement: "Development eligibility page inherits noindex/nofollow metadata",
    verdict: "pass",
    evidence: "app/development/layout.tsx → unindexedMetadata(\"Development directory\")",
    approvalRequired: false,
  },
  {
    id: "access-static-no-supabase-writes",
    state: "Access",
    requirement: "Eligibility dashboard does not write Supabase or mutate directory contracts",
    verdict: "pass",
    evidence:
      "Page imports readiness/rollout constants only; no client mutations; rollout.supabaseWrites=false",
    approvalRequired: false,
  },
  {
    id: "or-directory-development",
    state: "Oregon",
    requirement: "Oregon remains development-authorized, not public",
    verdict: "pass",
    evidence: "directoryContract(\"Oregon\").publication === \"development\"",
    approvalRequired: false,
  },
  {
    id: "or-map-disabled",
    state: "Oregon",
    requirement: "Oregon mapping stays disabled",
    verdict: "pass",
    evidence: "mapPath null; mapHref(\"Oregon\") null; oregonMapDisabled true",
    approvalRequired: false,
  },
  {
    id: "or-refresh-disabled",
    state: "Oregon",
    requirement: "Oregon refresh stays disabled",
    verdict: "pass",
    evidence: "oregonRefreshReady() === false",
    approvalRequired: false,
  },
  {
    id: "or-owner-claims-disabled",
    state: "Oregon",
    requirement: "Oregon owner claims remain disabled",
    verdict: "pass",
    evidence: "ENABLED_OWNER_FACILITY_STATES = [\"WA\"] only; profile ownerClaimsEnabled false",
    approvalRequired: false,
  },
  {
    id: "or-street-withheld-tier0",
    state: "Oregon",
    requirement: "Framework Tier 1 requires usable street; OR withheld street → Tier 0",
    verdict: "pass",
    evidence: "Fixture or-development-no-street → tier 0; finalPublicVisibility false",
    approvalRequired: false,
  },
  {
    id: "or-iso-export-absent",
    state: "Oregon",
    requirement: "Oregon has no authoritative ISO export date",
    verdict: "blocked",
    evidence: "officialExportDateIso null; retrievedOn null; rejected filename/GIS clocks",
    approvalRequired: true,
  },
  {
    id: "or-public-launch",
    state: "Oregon",
    requirement: "Oregon public launch readiness",
    verdict: "blocked",
    evidence:
      "STOP for public; nearest staged development-preview candidate only; separate approval required",
    approvalRequired: true,
  },
  {
    id: "fl-identifiers",
    state: "Florida",
    requirement: "Florida ALF roster has stable LicenseID / FileNumber identifiers",
    verdict: "pass",
    evidence: "3025 ALF rows; unique LicenseID/FileNumber 3025; Profile/?LID= verified",
    approvalRequired: false,
  },
  {
    id: "fl-status-mapping",
    state: "Florida",
    requirement: "Florida LicenseStatus publication mapping is explicit and safe",
    verdict: "blocked",
    evidence:
      "LicenseStatus present but publication mapping open; IsClosed=false insufficient (investigation blocker)",
    approvalRequired: true,
  },
  {
    id: "fl-disclosure-prefix",
    state: "Florida",
    requirement: "Official facility profile disclosure prefix verified",
    verdict: "pass",
    evidence: "quality.healthfinder.fl.gov Facility-Provider Profile/?LID= verified",
    approvalRequired: false,
  },
  {
    id: "fl-freshness",
    state: "Florida",
    requirement: "Authoritative ISO export / freshness evidence",
    verdict: "blocked",
    evidence:
      "recordedExportDate null; nightly-update claim / Miami-Dade sample stamp / page date rejected",
    approvalRequired: true,
  },
  {
    id: "fl-coordinates",
    state: "Florida",
    requirement: "Map coordinate provenance is licensing-grade",
    verdict: "blocked",
    evidence:
      "coordinatePairs 3025 present but coordinatesAreLicensingCoordinates false; georeferenced Tier 2 blocked",
    approvalRequired: true,
  },
  {
    id: "fl-publication-eligible-zero",
    state: "Florida",
    requirement: "Florida publicationEligible remains 0; directory unpublished",
    verdict: "pass",
    evidence:
      "FLORIDA_ELIGIBILITY_COUNTS.publicationEligible=0; floridaDirectoryReady false; stopGo STOP",
    approvalRequired: false,
  },
  {
    id: "fl-tier1-offline-no-auto-publish",
    state: "Florida",
    requirement:
      "Offline Tier 1 eligibility with ISO still cannot set finalPublicVisibility while unpublished",
    verdict: "pass",
    evidence:
      "Fixtures fl-geocode-mismatch / unpublished listingEligible true → finalPublicVisibility false",
    approvalRequired: false,
  },
  {
    id: "fl-public-launch",
    state: "Florida",
    requirement: "Florida public launch readiness",
    verdict: "blocked",
    evidence:
      "Strongest unpublished Tier 1 precursor; STOP until ISO + status mapping + coord provenance + approval",
    approvalRequired: true,
  },
  {
    id: "framework-never-auto-publish",
    state: "Framework",
    requirement: "Eligibility never automatically authorizes publication",
    verdict: "pass",
    evidence:
      "finalPublicVisibility requires stateAuthorization public; allowsPublicationWithoutApproval false; directoryContract unchanged by evaluator",
    approvalRequired: false,
  },
  {
    id: "framework-hard-cases",
    state: "Framework",
    requirement:
      "Invalid IDs, duplicates, missing city/address, uncertain status, stale freshness, category conflict, missing optional fields fail closed",
    verdict: "pass",
    evidence:
      "12 hard-case fixtures including KY blank/dup, TN probation, NC missing city, MA category mismatch, FL capacity optional",
    approvalRequired: false,
  },
] as const;

export const PUBLICATION_ACCEPTANCE_LAUNCH_RECOMMENDATION = {
  oregon: {
    decision: "STOP" as const,
    publicLaunch: false as const,
    continueDevelopmentPreview: true as const,
    reason:
      "Oregon may continue as the existing host-gated development directory. Framework Tier 1 is not met (street withheld, no ISO export). Map and refresh stay disabled. Separate approval required before any public authorization change.",
  },
  florida: {
    decision: "STOP" as const,
    publicLaunch: false as const,
    continueDevelopmentPreview: false as const,
    reason:
      "Florida has strong identifiers, addresses, capacity, and verified Profile/?LID= disclosure, but remains unpublished STOP until AHCA ISO export, LicenseStatus publication mapping, and licensing coordinate provenance are confirmed, plus explicit publication approval.",
  },
  overall: {
    decision: "STOP" as const,
    newPublicStatesAuthorized: false as const,
    approvalCheckpointRequired: true as const,
  },
} as const;

export const PUBLICATION_ACCEPTANCE_PREVIEW_ROLLBACK = {
  preview: [
    "Open /development/publication-eligibility on a development or preview host only",
    "Confirm robots/noindex: PRIVATE_INDEX_PREFIXES includes /development",
    "Confirm page shows Oregon/Florida STOP, tier counts, blockers, and source dates",
    "Confirm Oregon mapHref null and floridaDirectoryReady false via linked regressions",
  ],
  rollback: [
    "Revert this acceptance PR if needed; framework remains on development from #190",
    "Do not change directoryContract publication values",
    "Keep /development/publication-eligibility internal/noindex",
    "Confirm WA public + OR map-null + CA blocked + owner claims WA-only after any revert",
    "No Supabase migration was applied — no database rollback",
  ],
} as const;

export function buildPublicationAcceptanceReport(
  matrix: readonly AcceptanceRow[] = PUBLICATION_ACCEPTANCE_MATRIX,
) {
  const blocked = matrix.filter((r) => r.verdict === "blocked");
  const failed = matrix.filter((r) => r.verdict === "fail");
  const passed = matrix.filter((r) => r.verdict === "pass");
  return {
    observedOn: PUBLICATION_ACCEPTANCE_OBSERVED_ON,
    baseCommit: PUBLICATION_ACCEPTANCE_BASE_COMMIT,
    passed: passed.length,
    blocked: blocked.length,
    failed: failed.length,
    approvalRequiredRows: matrix.filter((r) => r.approvalRequired).map((r) => r.id),
    launchRecommendation: PUBLICATION_ACCEPTANCE_LAUNCH_RECOMMENDATION,
    previewRollback: PUBLICATION_ACCEPTANCE_PREVIEW_ROLLBACK,
    matrix: [...matrix],
    allowsPublication: false as const,
    supabaseWrites: false as const,
  };
}

export function publicationAcceptanceAllowsPublicLaunch(): false {
  return false;
}
