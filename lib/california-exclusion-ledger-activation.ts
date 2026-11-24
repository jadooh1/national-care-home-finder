/**
 * California residual exclusion ledger activation (post-#213).
 *
 * APPROVED development-only application-level activation of the residual-22
 * exclusion ledger. Does NOT activate eligibility mapping, publish California,
 * write Supabase, or change production. Intentionally free of sibling runtime
 * imports (ledger IDs duplicated from the cutover control package).
 */

export const CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_OBSERVED_ON = "2026-11-24";
export const CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_BASELINE =
  "22e522c" as const;

/** Cache generation bumped on activation so consumers can invalidate. */
export const CALIFORNIA_EXCLUSION_LEDGER_CACHE_GENERATION =
  "exclusion-ledger-activated-v1" as const;

export const CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_SOURCE = {
  pathway: "downloadstatedata-transparency-csv" as const,
  adoptedAsOfIso: "2026-11-22" as const,
  facilityDetailApi:
    "https://www.ccld.dss.ca.gov/transparencyapi/api/FacilityDetail/",
  liveReconciledOn: "2026-11-24" as const,
  liveExactMatches: 22 as const,
  truncationAliasVerified: "19201167→019201167" as const,
} as const;

export const CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_AUTHORIZATION = {
  decisionId: "activate-california-exclusion-ledger-in-app-db",
  approved: true as const,
  scope: "development-only" as const,
  applicationLevel: true as const,
  databaseWrites: false as const,
  eligibilityMappingActivated: false as const,
  californiaPublished: false as const,
  publicationEligibleCount: 0 as const,
  productionChanges: false as const,
  authenticationChanges: false as const,
  billingChanges: false as const,
} as const;

export const CALIFORNIA_EXCLUSION_LEDGER_BEFORE = {
  exclusionsActivated: false as const,
  eligibilityMappingActivated: false as const,
  californiaPublished: false as const,
  publicationEligibleCount: 0 as const,
  residualEnforcedInSelection: true as const,
  publicationSelectionBlockedForMissingLedger: true as const,
} as const;

export const CALIFORNIA_EXCLUSION_LEDGER_AFTER = {
  exclusionsActivated: true as const,
  eligibilityMappingActivated: false as const,
  californiaPublished: false as const,
  publicationEligibleCount: 0 as const,
  residualEnforcedInSelection: true as const,
  publicationSelectionBlockedForMissingLedger: false as const,
  environment: "development-only" as const,
  cacheGeneration: CALIFORNIA_EXCLUSION_LEDGER_CACHE_GENERATION,
} as const;

/** Residual-22 ledger (exact IDs; leading zeros preserved). */
export const CALIFORNIA_ACTIVATED_RESIDUAL_MISSING_FIRST_DATE_IDS = [
  "079201725",
  "502701889",
  "374605020",
  "342701856",
  "197610992",
  "342701894",
  "502701880",
  "198604006",
  "195850781",
  "107209715",
  "195850785",
  "197611051",
  "360951409",
  "198320716",
] as const;

export const CALIFORNIA_ACTIVATED_RESIDUAL_PROVISIONAL_IDS = [
  "198320787",
  "455920513",
  "197611076",
  "197611060",
  "134605014",
] as const;

export const CALIFORNIA_ACTIVATED_RESIDUAL_STATUS_CONFLICT_IDS = [
  "502701867",
  "019201167",
  "019201133",
] as const;

export const CALIFORNIA_ACTIVATED_RESIDUAL_IDS = [
  ...CALIFORNIA_ACTIVATED_RESIDUAL_MISSING_FIRST_DATE_IDS,
  ...CALIFORNIA_ACTIVATED_RESIDUAL_PROVISIONAL_IDS,
  ...CALIFORNIA_ACTIVATED_RESIDUAL_STATUS_CONFLICT_IDS,
] as const;

/** Live FacilityDetail reconciliation snapshot (2026-11-24). */
export const CALIFORNIA_ACTIVATED_RESIDUAL_LIVE_RECONCILIATION = [
  { facilityNumber: "079201725", status: "Licensed", licenseFirstDate: "", bucket: "missing-first-license-date" },
  { facilityNumber: "502701889", status: "Licensed", licenseFirstDate: "", bucket: "missing-first-license-date" },
  { facilityNumber: "374605020", status: "Licensed", licenseFirstDate: "", bucket: "missing-first-license-date" },
  { facilityNumber: "342701856", status: "Licensed", licenseFirstDate: "", bucket: "missing-first-license-date" },
  { facilityNumber: "197610992", status: "Licensed", licenseFirstDate: "", bucket: "missing-first-license-date" },
  { facilityNumber: "342701894", status: "Licensed", licenseFirstDate: "", bucket: "missing-first-license-date" },
  { facilityNumber: "502701880", status: "Licensed", licenseFirstDate: "", bucket: "missing-first-license-date" },
  { facilityNumber: "198604006", status: "Licensed", licenseFirstDate: "", bucket: "missing-first-license-date" },
  { facilityNumber: "195850781", status: "Licensed", licenseFirstDate: "", bucket: "missing-first-license-date" },
  { facilityNumber: "107209715", status: "Licensed", licenseFirstDate: "", bucket: "missing-first-license-date" },
  { facilityNumber: "195850785", status: "Licensed", licenseFirstDate: "", bucket: "missing-first-license-date" },
  { facilityNumber: "197611051", status: "Licensed", licenseFirstDate: "", bucket: "missing-first-license-date" },
  { facilityNumber: "360951409", status: "Licensed", licenseFirstDate: "", bucket: "missing-first-license-date" },
  { facilityNumber: "198320716", status: "Licensed", licenseFirstDate: "", bucket: "missing-first-license-date" },
  { facilityNumber: "198320787", status: "Provisional License", licenseFirstDate: "8/12/2026", bucket: "provisional-license" },
  { facilityNumber: "455920513", status: "Provisional License", licenseFirstDate: "8/1/2026", bucket: "provisional-license" },
  { facilityNumber: "197611076", status: "Provisional License", licenseFirstDate: "8/3/2026", bucket: "provisional-license" },
  { facilityNumber: "197611060", status: "Provisional License", licenseFirstDate: "8/3/2026", bucket: "provisional-license" },
  { facilityNumber: "134605014", status: "Provisional License", licenseFirstDate: "8/6/2026", bucket: "provisional-license" },
  { facilityNumber: "502701867", status: "Pending Incomplete Application", licenseFirstDate: "", bucket: "status-conflict" },
  { facilityNumber: "019201167", status: "Licensed/Pending Increase", licenseFirstDate: "8/1/2022", bucket: "status-conflict" },
  { facilityNumber: "019201133", status: "Licensed/Pending Increase", licenseFirstDate: "3/11/2022", bucket: "status-conflict" },
] as const;

const RESIDUAL_SET: ReadonlySet<string> = new Set(
  CALIFORNIA_ACTIVATED_RESIDUAL_IDS,
);
const FACILITY_NUMBER = /^\d{8,9}$/;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

export function californiaExclusionLedgerIdCandidates(
  facilityNumber: string,
): string[] {
  const id = text(facilityNumber);
  const out = new Set<string>();
  if (!id) return [];
  out.add(id);
  if (/^\d{8}$/.test(id)) out.add(`0${id}`);
  if (/^\d{9}$/.test(id) && id.startsWith("0")) out.add(id.slice(1));
  return [...out];
}

export function californiaExclusionLedgerIsResidual(
  facilityNumber: string,
): boolean {
  return californiaExclusionLedgerIdCandidates(facilityNumber).some((c) =>
    RESIDUAL_SET.has(c),
  );
}

/**
 * Active development controls after approved ledger activation.
 * Eligibility mapping may be activated by a separate decision; live defaults
 * are owned by the cutover / mapping-activation packages.
 */
export function californiaExclusionLedgerActiveControls() {
  return {
    exclusionsActivated: true as const,
    eligibilityMappingActivated: true as const,
    californiaPublished: false as const,
    publicationEligibleCount: 0 as const,
    environment: "development-only" as const,
    cacheGeneration: CALIFORNIA_EXCLUSION_LEDGER_CACHE_GENERATION,
  };
}

export function californiaExclusionLedgerActivated(): true {
  return true;
}

export function californiaExclusionLedgerAllowsPublication(): false {
  return false;
}

/** Separate mapping activation is approved; exclusion activation alone did not enable it. */
export function californiaExclusionLedgerAllowsEligibilityMapping(): true {
  return true;
}

/**
 * Development listing gate under activated ledger. Residuals blocked.
 * Valid non-residual IDs may pass development surfaces only; public still STOP.
 */
export function californiaExclusionLedgerDevelopmentGate(input: {
  facilityNumber: string;
  surface: "development-search" | "development-detail" | "public-search" | "public-detail" | "api" | "map" | "owner-claim" | "sitemap";
}): { allowed: boolean; reasons: string[] } {
  const id = text(input.facilityNumber);
  const reasons: string[] = [];
  const residual = californiaExclusionLedgerIsResidual(id);
  const candidates = californiaExclusionLedgerIdCandidates(id);
  const canonical = candidates.find((c) => RESIDUAL_SET.has(c)) ?? null;
  const trunc = residual && canonical != null && canonical !== id;

  if (!FACILITY_NUMBER.test(id)) reasons.push("invalid-facility-number");
  if (residual) reasons.push("residual-exclusion");
  if (trunc) reasons.push("leading-zero-truncation-alias");
  reasons.push("exclusion-ledger-activated");
  reasons.push(`cache:${CALIFORNIA_EXCLUSION_LEDGER_CACHE_GENERATION}`);

  if (
    input.surface === "public-search"
    || input.surface === "public-detail"
    || input.surface === "api"
    || input.surface === "map"
    || input.surface === "owner-claim"
    || input.surface === "sitemap"
  ) {
    reasons.push("california-unpublished");
    reasons.push("publication-eligible-zero");
    reasons.push(`blocked-from-${input.surface}`);
    return { allowed: false, reasons: [...new Set(reasons)] };
  }

  if (!FACILITY_NUMBER.test(id) || residual) {
    reasons.push(`blocked-from-${input.surface}`);
    return { allowed: false, reasons: [...new Set(reasons)] };
  }

  reasons.push("development-roster-allowed");
  return { allowed: true, reasons: [...new Set(reasons)] };
}

export type CaliforniaExclusionLedgerRollbackStep = {
  id: string;
  title: string;
  detail: string;
  status: "ready";
};

/**
 * Executable rollback procedure (application-level; no DB writes).
 * Reverses development exclusion activation without touching mapping/publication.
 */
export function californiaExclusionLedgerRollbackProcedure(): {
  reversible: true;
  databaseWrites: false;
  restoresControls: {
    exclusionsActivated: false;
    eligibilityMappingActivated: false;
    californiaPublished: false;
    publicationEligibleCount: 0;
  };
  steps: CaliforniaExclusionLedgerRollbackStep[];
  postRollbackVerification: string[];
} {
  return {
    reversible: true,
    databaseWrites: false,
    restoresControls: {
      exclusionsActivated: false,
      eligibilityMappingActivated: false,
      californiaPublished: false,
      publicationEligibleCount: 0,
    },
    steps: [
      {
        id: "record-rollback-approval",
        title: "Record human rollback approval",
        detail:
          "Append rollback actor/timestamp against decision activate-california-exclusion-ledger-in-app-db.",
        status: "ready",
      },
      {
        id: "flip-application-flag",
        title: "Set exclusionsActivated → false in application controls",
        detail:
          "Revert CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS.exclusionsActivated and activation AFTER state. No Supabase writes.",
        status: "ready",
      },
      {
        id: "bump-cache-generation",
        title: "Bump exclusion ledger cache generation",
        detail:
          "Advance CALIFORNIA_EXCLUSION_LEDGER_CACHE_GENERATION so development hosts drop activated ledger cache entries.",
        status: "ready",
      },
      {
        id: "verify-fail-closed",
        title: "Verify fail-closed surfaces",
        detail:
          "Confirm residuals remain blocked via residual membership; publicationEligible=0; californiaPublished=false; mapping still inactive.",
        status: "ready",
      },
      {
        id: "verify-cross-state",
        title: "Verify Washington / Oregon unchanged",
        detail: "WA public and OR development contracts remain intact.",
        status: "ready",
      },
    ],
    postRollbackVerification: [
      "exclusionsActivated=false",
      "eligibilityMappingActivated=false",
      "californiaPublished=false",
      "publicationEligibleCount=0",
      "residual-22-still-membership-blocked",
      "washington-oregon-unaffected",
    ],
  };
}

export function buildCaliforniaExclusionLedgerActivationPreview() {
  const controls = californiaExclusionLedgerActiveControls();
  const residualCount = CALIFORNIA_ACTIVATED_RESIDUAL_IDS.length;
  const live = CALIFORNIA_ACTIVATED_RESIDUAL_LIVE_RECONCILIATION;
  const missing = live.filter((r) => r.bucket === "missing-first-license-date");
  const provisional = live.filter((r) => r.bucket === "provisional-license");
  const conflict = live.filter((r) => r.bucket === "status-conflict");

  const residualBlocked = CALIFORNIA_ACTIVATED_RESIDUAL_IDS.every((id) => {
    const gate = californiaExclusionLedgerDevelopmentGate({
      facilityNumber: id,
      surface: "development-detail",
    });
    return !gate.allowed && gate.reasons.includes("residual-exclusion");
  });
  const truncBlocked = !californiaExclusionLedgerDevelopmentGate({
    facilityNumber: "19201167",
    surface: "development-detail",
  }).allowed;
  const validAllowed = californiaExclusionLedgerDevelopmentGate({
    facilityNumber: "092700093",
    surface: "development-detail",
  }).allowed;
  const publicBlocked = !californiaExclusionLedgerDevelopmentGate({
    facilityNumber: "092700093",
    surface: "public-search",
  }).allowed;

  const rollback = californiaExclusionLedgerRollbackProcedure();

  const arithmeticOk =
    residualCount === 22
    && live.length === 22
    && missing.length === 14
    && provisional.length === 5
    && conflict.length === 3
    && CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_AUTHORIZATION.approved
    && CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_AUTHORIZATION.scope
      === "development-only"
    && !CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_AUTHORIZATION.databaseWrites
    && !CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_AUTHORIZATION
      .eligibilityMappingActivated
    && !CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_AUTHORIZATION.californiaPublished
    && CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_AUTHORIZATION
      .publicationEligibleCount === 0
    && !CALIFORNIA_EXCLUSION_LEDGER_BEFORE.exclusionsActivated
    && CALIFORNIA_EXCLUSION_LEDGER_AFTER.exclusionsActivated
    && !CALIFORNIA_EXCLUSION_LEDGER_AFTER.eligibilityMappingActivated
    && !CALIFORNIA_EXCLUSION_LEDGER_AFTER.californiaPublished
    && controls.exclusionsActivated
    && controls.eligibilityMappingActivated
    && !controls.californiaPublished
    && californiaExclusionLedgerActivated()
    && !californiaExclusionLedgerAllowsPublication()
    && californiaExclusionLedgerAllowsEligibilityMapping()
    && residualBlocked
    && truncBlocked
    && validAllowed
    && publicBlocked
    && rollback.reversible
    && !rollback.databaseWrites
    && rollback.steps.length >= 5;

  return {
    observedOn: CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_OBSERVED_ON,
    baseline: CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_BASELINE,
    source: CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_SOURCE,
    authorization: CALIFORNIA_EXCLUSION_LEDGER_ACTIVATION_AUTHORIZATION,
    before: CALIFORNIA_EXCLUSION_LEDGER_BEFORE,
    after: CALIFORNIA_EXCLUSION_LEDGER_AFTER,
    controls,
    residualCount,
    buckets: {
      missingFirstLicenseDate: missing.length,
      provisionalLicense: provisional.length,
      statusConflict: conflict.length,
    },
    liveReconciliation: live,
    residualBlocked,
    truncBlocked,
    validDevelopmentAllowed: validAllowed,
    publicSurfacesBlocked: publicBlocked,
    rollback,
    arithmeticOk,
    stopGoPublic: "STOP" as const,
    mostActionableNextStep:
      "Exclusion ledger remains ON. Eligibility mapping is activated separately for development only; California stays unpublished.",
    preservedRestrictions: [
      "development-only-activation",
      "california-unpublished",
      "publication-eligible-zero",
      "no-database-writes",
      "no-production-changes",
      "washington-oregon-unaffected",
    ] as const,
  };
}
