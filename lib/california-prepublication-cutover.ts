/**
 * California prepublication integration and cutover controls (post-#212).
 *
 * Functional publication-selection pipeline with independent inactive
 * controls for (1) residual exclusion ledger, (2) Pending Increase
 * eligibility mapping, and (3) statewide public publication.
 *
 * Runtime defaults keep every control OFF. Activation/rollback are dry-run
 * rehearsals that accept hypothetical overrides and never mutate defaults,
 * write Supabase, or publish California. Intentionally free of sibling
 * runtime imports.
 */

export const CALIFORNIA_PREPUBLICATION_CUTOVER_OBSERVED_ON = "2026-11-24";
export const CALIFORNIA_PREPUBLICATION_CUTOVER_BASELINE = "d94276a" as const;

export const CALIFORNIA_PREPUBLICATION_CUTOVER_SOURCE = {
  pathway: "downloadstatedata-transparency-csv" as const,
  adoptedAsOfIso: "2026-11-22" as const,
  facDetailPagePrefix:
    "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/",
  newerDownloadAvailable: false as const,
} as const;

/** Independent cutover controls. Defaults never publish California. */
export type CaliforniaPrepublicationCutoverControls = {
  exclusionsActivated: boolean;
  eligibilityMappingActivated: boolean;
  californiaPublished: boolean;
  publicationEligibleCount: number;
};

export const CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS: CaliforniaPrepublicationCutoverControls =
  {
    exclusionsActivated: false,
    eligibilityMappingActivated: false,
    californiaPublished: false,
    publicationEligibleCount: 0,
  };

export const CALIFORNIA_PREPUBLICATION_CUTOVER_DECISIONS = {
  exclusionActivation: {
    id: "activate-california-exclusion-ledger-in-app-db",
    activated: false as const,
    publishesCalifornia: false as const,
  },
  eligibilityMappingActivation: {
    id: "activate-pending-increase-mapping-in-app-db",
    activated: false as const,
    publishesCalifornia: false as const,
    policyApprovedForFutureEligibilityOnly: true as const,
  },
  californiaPublicPublication: {
    id: "approve-california-statewide-public-publication",
    activated: false as const,
    publishesCalifornia: true as const,
  },
} as const;

/** Residual-22 exclusion ledger (exact IDs; leading zeros preserved). */
export const CALIFORNIA_CUTOVER_RESIDUAL_MISSING_FIRST_DATE_IDS = [
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

export const CALIFORNIA_CUTOVER_RESIDUAL_PROVISIONAL_IDS = [
  "198320787",
  "455920513",
  "197611076",
  "197611060",
  "134605014",
] as const;

export const CALIFORNIA_CUTOVER_RESIDUAL_STATUS_CONFLICT_IDS = [
  "502701867",
  "019201167",
  "019201133",
] as const;

export const CALIFORNIA_CUTOVER_RESIDUAL_IDS = [
  ...CALIFORNIA_CUTOVER_RESIDUAL_MISSING_FIRST_DATE_IDS,
  ...CALIFORNIA_CUTOVER_RESIDUAL_PROVISIONAL_IDS,
  ...CALIFORNIA_CUTOVER_RESIDUAL_STATUS_CONFLICT_IDS,
] as const;

const RESIDUAL_SET: ReadonlySet<string> = new Set(CALIFORNIA_CUTOVER_RESIDUAL_IDS);
const FACILITY_NUMBER = /^\d{8,9}$/;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function resolveControls(
  override?: Partial<CaliforniaPrepublicationCutoverControls> | null,
): CaliforniaPrepublicationCutoverControls {
  return {
    ...CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS,
    ...(override ?? {}),
  };
}

/** Truncation aliases that CDSS FacilityDetail still resolves. */
export function californiaCutoverExclusionIdCandidates(
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

export function californiaCutoverIsResidualExclusion(
  facilityNumber: string,
): boolean {
  return californiaCutoverExclusionIdCandidates(facilityNumber).some((c) =>
    RESIDUAL_SET.has(c),
  );
}

export function californiaCutoverResidualCanonicalId(
  facilityNumber: string,
): string | null {
  for (const c of californiaCutoverExclusionIdCandidates(facilityNumber)) {
    if (RESIDUAL_SET.has(c)) return c;
  }
  return null;
}

export type CaliforniaCutoverListingSurface =
  | "search"
  | "detail-page"
  | "api"
  | "map"
  | "owner-claim"
  | "sitemap"
  | "publication-selection";

/**
 * Fail-closed listing / publication gate. Residuals are always blocked.
 * Default controls keep California unpublished.
 */
export function californiaCutoverListingGate(input: {
  facilityNumber: string;
  surface: CaliforniaCutoverListingSurface;
  controls?: Partial<CaliforniaPrepublicationCutoverControls> | null;
  sourceAmbiguousOrUnverified?: boolean;
  disclosureVerified?: boolean;
  staleSource?: boolean;
  statusConflict?: boolean;
}): { allowed: boolean; reasons: string[] } {
  const controls = resolveControls(input.controls);
  const id = text(input.facilityNumber);
  const reasons: string[] = [];
  const residual = californiaCutoverIsResidualExclusion(id);
  const canonical = californiaCutoverResidualCanonicalId(id);
  const truncAlias = residual && canonical != null && canonical !== id;

  if (!FACILITY_NUMBER.test(id)) reasons.push("invalid-facility-number");
  if (residual) reasons.push("residual-exclusion");
  if (truncAlias) reasons.push("leading-zero-truncation-alias");
  if (input.sourceAmbiguousOrUnverified) {
    reasons.push("source-ambiguous-or-unverified");
  }
  if (input.disclosureVerified === false) {
    reasons.push("disclosure-link-unverified");
  }
  if (input.staleSource) reasons.push("stale-source-data");
  if (input.statusConflict) reasons.push("status-conflict");
  if (!controls.exclusionsActivated) {
    reasons.push("exclusion-ledger-inactive");
  }
  if (!controls.californiaPublished) reasons.push("california-unpublished");
  if (controls.publicationEligibleCount === 0) {
    reasons.push("publication-eligible-zero");
  }

  reasons.push(`blocked-from-${input.surface}`);

  // Residuals, invalids, and unpublished California never pass.
  const allowed =
    FACILITY_NUMBER.test(id)
    && !residual
    && !input.sourceAmbiguousOrUnverified
    && input.disclosureVerified !== false
    && !input.staleSource
    && !input.statusConflict
    && controls.exclusionsActivated
    && controls.californiaPublished
    && controls.publicationEligibleCount > 0
    && input.surface !== "publication-selection";

  // publication-selection uses the dedicated selector below; this gate stays fail-closed.
  if (input.surface === "publication-selection") {
    return { allowed: false, reasons: [...new Set(reasons)] };
  }

  if (!allowed) {
    return { allowed: false, reasons: [...new Set(reasons)] };
  }
  return { allowed: true, reasons: ["cutover-gate-allowed"] };
}

export type CaliforniaCutoverCandidate = {
  facilityNumber: string;
  downloadStatus?: string | null;
  facilityDetailStatus?: string | null;
  licenseFirstDate?: string | null;
  downloadCapacity?: string | null;
  facilityDetailCapacity?: string | null;
  pendingIncrease?: boolean;
  sourceAsOfIso?: string | null;
  disclosureVerified?: boolean;
  statusConflict?: boolean;
  sourceAmbiguousOrUnverified?: boolean;
};

export type CaliforniaCutoverSelectionResult = {
  selected: boolean;
  facilityNumber: string;
  reasons: string[];
  controls: CaliforniaPrepublicationCutoverControls;
  eligibilityMappingApplied: boolean;
  residualExclusion: boolean;
};

function isStaleSource(sourceAsOfIso: string | null | undefined): boolean {
  const adopted = CALIFORNIA_PREPUBLICATION_CUTOVER_SOURCE.adoptedAsOfIso;
  const value = text(sourceAsOfIso);
  if (!value) return true;
  if (CALIFORNIA_PREPUBLICATION_CUTOVER_SOURCE.newerDownloadAvailable) {
    return true;
  }
  return value < adopted;
}

function pendingIncreaseMappingPasses(candidate: CaliforniaCutoverCandidate): {
  ok: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const download = text(candidate.downloadStatus).toUpperCase();
  const detail = text(candidate.facilityDetailStatus);
  const first = text(candidate.licenseFirstDate);
  const capDown = text(candidate.downloadCapacity);
  const capDetail = text(candidate.facilityDetailCapacity);

  if (download !== "LICENSED") reasons.push("download-status-not-licensed");
  const detailOk =
    /^licensed$/i.test(detail)
    || /^licensed\s*\/\s*pending\s+increase$/i.test(detail);
  if (!detailOk) reasons.push("facility-detail-status-not-allowed");
  if (!first) reasons.push("license-first-date-missing");
  if (!capDown || !capDetail) reasons.push("capacity-missing");
  else if (capDown !== capDetail) reasons.push("capacity-disagreement");

  return { ok: reasons.length === 0, reasons };
}

/**
 * Future publication-selection pipeline. Always fail-closed under default
 * controls. Residuals are never selected. Eligibility mapping applies only
 * when independently activated.
 */
export function californiaPrepublicationSelectFacility(
  candidate: CaliforniaCutoverCandidate,
  controlOverride?: Partial<CaliforniaPrepublicationCutoverControls> | null,
): CaliforniaCutoverSelectionResult {
  const controls = resolveControls(controlOverride);
  const id = text(candidate.facilityNumber);
  const reasons: string[] = [];
  const residual = californiaCutoverIsResidualExclusion(id);
  const canonical = californiaCutoverResidualCanonicalId(id);
  let eligibilityMappingApplied = false;

  if (!FACILITY_NUMBER.test(id)) reasons.push("invalid-facility-number");
  if (residual) {
    reasons.push("residual-exclusion");
    if (canonical && canonical !== id) {
      reasons.push("leading-zero-truncation-alias");
    }
  }
  if (candidate.sourceAmbiguousOrUnverified) {
    reasons.push("source-ambiguous-or-unverified");
  }
  if (candidate.disclosureVerified === false) {
    reasons.push("disclosure-link-unverified");
  }
  if (candidate.statusConflict) reasons.push("status-conflict");
  if (isStaleSource(candidate.sourceAsOfIso)) {
    reasons.push("stale-source-data");
  }
  if (!text(candidate.licenseFirstDate) && !residual) {
    // Non-residual missing first date still fails closed for publication.
    if (candidate.licenseFirstDate !== undefined) {
      reasons.push("license-first-date-missing");
    }
  }

  // Hard precondition: exclusion ledger must be activated before selection.
  if (!controls.exclusionsActivated) {
    reasons.push("exclusion-ledger-not-activated");
    reasons.push("publication-selection-blocked");
  }

  // Pending Increase mapping is independent.
  if (candidate.pendingIncrease) {
    if (!controls.eligibilityMappingActivated) {
      reasons.push("eligibility-mapping-inactive");
    } else {
      eligibilityMappingApplied = true;
      const mapped = pendingIncreaseMappingPasses(candidate);
      if (!mapped.ok) {
        reasons.push(...mapped.reasons.map((r) => `mapping:${r}`));
      }
    }
  }

  if (!controls.californiaPublished) reasons.push("california-unpublished");
  if (controls.publicationEligibleCount === 0) {
    reasons.push("publication-eligible-zero");
  }

  const selected =
    FACILITY_NUMBER.test(id)
    && !residual
    && !candidate.sourceAmbiguousOrUnverified
    && candidate.disclosureVerified !== false
    && !candidate.statusConflict
    && !isStaleSource(candidate.sourceAsOfIso)
    && !(candidate.licenseFirstDate !== undefined && !text(candidate.licenseFirstDate) && !residual)
    && controls.exclusionsActivated
    && controls.californiaPublished
    && controls.publicationEligibleCount > 0
    && !(
      candidate.pendingIncrease
      && (!controls.eligibilityMappingActivated
        || !pendingIncreaseMappingPasses(candidate).ok)
    )
    && reasons.every(
      (r) =>
        r !== "invalid-facility-number"
        && r !== "residual-exclusion"
        && r !== "leading-zero-truncation-alias"
        && r !== "source-ambiguous-or-unverified"
        && r !== "disclosure-link-unverified"
        && r !== "status-conflict"
        && r !== "stale-source-data"
        && r !== "license-first-date-missing"
        && r !== "exclusion-ledger-not-activated"
        && r !== "publication-selection-blocked"
        && r !== "eligibility-mapping-inactive"
        && r !== "california-unpublished"
        && r !== "publication-eligible-zero"
        && !r.startsWith("mapping:"),
    );

  if (selected) {
    return {
      selected: true,
      facilityNumber: id,
      reasons: ["publication-selection-allowed"],
      controls,
      eligibilityMappingApplied,
      residualExclusion: false,
    };
  }

  return {
    selected: false,
    facilityNumber: id,
    reasons: [...new Set(reasons.length ? reasons : ["fail-closed"])],
    controls,
    eligibilityMappingApplied,
    residualExclusion: residual,
  };
}

export type CaliforniaCutoverSequenceStep = {
  id: string;
  title: string;
  status: "ready" | "blocked" | "rehearsed" | "skipped";
  detail: string;
};

/**
 * Executable activation sequence (dry-run). Does not mutate defaults or write DB.
 */
export function californiaCutoverActivationSequence(input?: {
  approveExclusionActivation?: boolean;
  approveEligibilityMappingActivation?: boolean;
  approveCaliforniaPublication?: boolean;
}): {
  rehearsed: true;
  activatedRuntime: false;
  controls: CaliforniaPrepublicationCutoverControls;
  steps: CaliforniaCutoverSequenceStep[];
  residualEnforced: { total: number; blocked: number; allBlocked: boolean };
  selectedUnderRehearsal: number;
  independencePreserved: boolean;
} {
  const approveExclusion = Boolean(input?.approveExclusionActivation);
  const approveMapping = Boolean(input?.approveEligibilityMappingActivation);
  const approvePublication = Boolean(input?.approveCaliforniaPublication);

  // Dry-run only: publicationEligible stays 0, so californiaPublished never
  // becomes true in rehearsal even if a human "approves publication" flag is
  // explored. Exclusion and mapping flags may be rehearsed independently.
  const controls: CaliforniaPrepublicationCutoverControls = {
    exclusionsActivated: approveExclusion,
    eligibilityMappingActivated: approveMapping,
    californiaPublished: false,
    publicationEligibleCount: 0,
  };

  const steps: CaliforniaCutoverSequenceStep[] = [
    {
      id: "record-exclusion-approval",
      title: "Record exclusion-ledger activation approval",
      status: approveExclusion ? "rehearsed" : "blocked",
      detail: approveExclusion
        ? "Hypothetical approval recorded for activate-california-exclusion-ledger-in-app-db."
        : "Waiting on activate-california-exclusion-ledger-in-app-db.",
    },
    {
      id: "load-residual-ledger",
      title: "Load residual-22 exclusion ledger into selection pipeline",
      status: approveExclusion ? "rehearsed" : "blocked",
      detail:
        "Exact Facility Numbers with leading zeros; truncation aliases matched.",
    },
    {
      id: "wire-publication-selection-gates",
      title: "Wire fail-closed gates into publication-selection pipeline",
      status: approveExclusion ? "rehearsed" : "blocked",
      detail:
        "Residuals, invalid IDs, stale sources, status conflicts, and unverified disclosure links blocked.",
    },
    {
      id: "eligibility-mapping-control",
      title: "Eligibility mapping independent activation",
      status: approveMapping ? "rehearsed" : "skipped",
      detail: approveMapping
        ? "Pending Increase mapping applied for future eligibility only; does not publish California."
        : "Mapping remains inactive (separate decision).",
    },
    {
      id: "publication-authorization",
      title: "Statewide publication authorization",
      status: "blocked",
      detail: approvePublication
        ? "Publication approval explored in rehearsal, but publicationEligible remains 0 and californiaPublished stays false until a separate eligible-count authorization."
        : "publicationEligible remains 0; californiaPublished stays false.",
    },
    {
      id: "verify-residual-enforcement",
      title: "Verify all 22 residual exclusions blocked before publication",
      status: "rehearsed",
      detail: "Selection pipeline rejects every residual ID and truncation alias.",
    },
  ];

  const residualResults = CALIFORNIA_CUTOVER_RESIDUAL_IDS.map((id) =>
    californiaPrepublicationSelectFacility(
      {
        facilityNumber: id,
        downloadStatus: "LICENSED",
        licenseFirstDate: "1/1/2020",
        sourceAsOfIso: CALIFORNIA_PREPUBLICATION_CUTOVER_SOURCE.adoptedAsOfIso,
        disclosureVerified: true,
      },
      controls,
    ),
  );
  const blocked = residualResults.filter((r) => !r.selected).length;

  // Sample clear candidate under rehearsal controls.
  const clear = californiaPrepublicationSelectFacility(
    {
      facilityNumber: "092700093",
      downloadStatus: "LICENSED",
      facilityDetailStatus: "Licensed",
      licenseFirstDate: "12/14/2017",
      downloadCapacity: "14",
      facilityDetailCapacity: "14",
      sourceAsOfIso: CALIFORNIA_PREPUBLICATION_CUTOVER_SOURCE.adoptedAsOfIso,
      disclosureVerified: true,
      pendingIncrease: false,
    },
    controls,
  );

  const independencePreserved =
    controls.eligibilityMappingActivated === approveMapping
    && !controls.californiaPublished
    && controls.publicationEligibleCount === 0
    && !CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS.exclusionsActivated
    && !CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS
      .eligibilityMappingActivated
    && !CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS.californiaPublished;

  return {
    rehearsed: true,
    activatedRuntime: false,
    controls,
    steps,
    residualEnforced: {
      total: CALIFORNIA_CUTOVER_RESIDUAL_IDS.length,
      blocked,
      allBlocked: blocked === CALIFORNIA_CUTOVER_RESIDUAL_IDS.length,
    },
    selectedUnderRehearsal: clear.selected ? 1 : 0,
    independencePreserved,
  };
}

/**
 * Executable rollback sequence (dry-run). Returns controls to inactive defaults.
 */
export function californiaCutoverRollbackSequence(input?: {
  from?: Partial<CaliforniaPrepublicationCutoverControls> | null;
}): {
  rehearsed: true;
  activatedRuntime: false;
  before: CaliforniaPrepublicationCutoverControls;
  after: CaliforniaPrepublicationCutoverControls;
  steps: CaliforniaCutoverSequenceStep[];
  surfacesFailClosed: boolean;
  defaultsUnchanged: boolean;
} {
  const before = resolveControls(input?.from ?? {
    exclusionsActivated: true,
    eligibilityMappingActivated: true,
    californiaPublished: false,
    publicationEligibleCount: 0,
  });
  const after = { ...CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS };

  const steps: CaliforniaCutoverSequenceStep[] = [
    {
      id: "disable-exclusion-flag",
      title: "Flip exclusionsActivated → false",
      status: "rehearsed",
      detail: "Immediate fail-closed; selection pipeline blocks without ledger.",
    },
    {
      id: "disable-mapping-flag",
      title: "Flip eligibilityMappingActivated → false",
      status: "rehearsed",
      detail: "Pending Increase mapping no longer applied.",
    },
    {
      id: "confirm-publication-stop",
      title: "Confirm californiaPublished=false and publicationEligible=0",
      status: "rehearsed",
      detail: "Public California remains STOP after rollback.",
    },
    {
      id: "verify-surfaces",
      title: "Verify listing / selection surfaces fail closed",
      status: "rehearsed",
      detail: "Search, detail, API, map, owner-claim, sitemap stay blocked for CA public.",
    },
  ];

  const surfaces: CaliforniaCutoverListingSurface[] = [
    "search",
    "detail-page",
    "api",
    "map",
    "owner-claim",
    "sitemap",
  ];
  const surfacesFailClosed = surfaces.every(
    (surface) =>
      !californiaCutoverListingGate({
        facilityNumber: "092700093",
        surface,
        controls: after,
        disclosureVerified: true,
      }).allowed,
  );

  const defaultsUnchanged =
    !CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS.exclusionsActivated
    && !CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS
      .eligibilityMappingActivated
    && !CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS.californiaPublished
    && CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS
      .publicationEligibleCount === 0;

  return {
    rehearsed: true,
    activatedRuntime: false,
    before,
    after,
    steps,
    surfacesFailClosed,
    defaultsUnchanged,
  };
}

export function californiaCutoverEnforceAllResiduals(
  controlOverride?: Partial<CaliforniaPrepublicationCutoverControls> | null,
) {
  const controls = resolveControls(controlOverride);
  const rows = CALIFORNIA_CUTOVER_RESIDUAL_IDS.map((id) => {
    const selection = californiaPrepublicationSelectFacility(
      {
        facilityNumber: id,
        downloadStatus: "LICENSED",
        licenseFirstDate: "1/1/2020",
        sourceAsOfIso: CALIFORNIA_PREPUBLICATION_CUTOVER_SOURCE.adoptedAsOfIso,
        disclosureVerified: true,
      },
      controls,
    );
    const trunc = id.startsWith("0") ? id.slice(1) : null;
    const truncSelection = trunc
      ? californiaPrepublicationSelectFacility(
        {
          facilityNumber: trunc,
          downloadStatus: "LICENSED",
          licenseFirstDate: "1/1/2020",
          sourceAsOfIso: CALIFORNIA_PREPUBLICATION_CUTOVER_SOURCE.adoptedAsOfIso,
          disclosureVerified: true,
        },
        controls,
      )
      : null;
    return {
      id,
      selected: selection.selected,
      truncId: trunc,
      truncSelected: truncSelection ? truncSelection.selected : null,
    };
  });

  return {
    total: rows.length,
    allBlocked: rows.every(
      (r) => !r.selected && (r.truncSelected === null || r.truncSelected === false),
    ),
    rows,
    controls,
  };
}

export function californiaCutoverActivated(): false {
  return false;
}

export function californiaCutoverAllowsPublication(): false {
  return false;
}

export function buildCaliforniaPrepublicationCutoverPreview() {
  const defaults = CALIFORNIA_PREPUBLICATION_CUTOVER_DEFAULT_CONTROLS;
  const activationExclusionOnly = californiaCutoverActivationSequence({
    approveExclusionActivation: true,
    approveEligibilityMappingActivation: false,
    approveCaliforniaPublication: false,
  });
  const activationMappingAlone = californiaCutoverActivationSequence({
    approveExclusionActivation: false,
    approveEligibilityMappingActivation: true,
    approveCaliforniaPublication: false,
  });
  const activationAll = californiaCutoverActivationSequence({
    approveExclusionActivation: true,
    approveEligibilityMappingActivation: true,
    approveCaliforniaPublication: true,
  });
  const rollback = californiaCutoverRollbackSequence({
    from: {
      exclusionsActivated: true,
      eligibilityMappingActivated: true,
      californiaPublished: false,
      publicationEligibleCount: 0,
    },
  });
  const residualsDefault = californiaCutoverEnforceAllResiduals();
  const residualsActivated = californiaCutoverEnforceAllResiduals({
    exclusionsActivated: true,
    eligibilityMappingActivated: false,
    californiaPublished: false,
    publicationEligibleCount: 0,
  });

  const clearDefault = californiaPrepublicationSelectFacility({
    facilityNumber: "092700093",
    downloadStatus: "LICENSED",
    facilityDetailStatus: "Licensed",
    licenseFirstDate: "12/14/2017",
    downloadCapacity: "14",
    facilityDetailCapacity: "14",
    sourceAsOfIso: CALIFORNIA_PREPUBLICATION_CUTOVER_SOURCE.adoptedAsOfIso,
    disclosureVerified: true,
  });
  const clearFullyArmed = californiaPrepublicationSelectFacility(
    {
      facilityNumber: "092700093",
      downloadStatus: "LICENSED",
      facilityDetailStatus: "Licensed",
      licenseFirstDate: "12/14/2017",
      downloadCapacity: "14",
      facilityDetailCapacity: "14",
      sourceAsOfIso: CALIFORNIA_PREPUBLICATION_CUTOVER_SOURCE.adoptedAsOfIso,
      disclosureVerified: true,
    },
    {
      exclusionsActivated: true,
      eligibilityMappingActivated: true,
      californiaPublished: true,
      publicationEligibleCount: 0,
    },
  );
  const staleBlocked = californiaPrepublicationSelectFacility(
    {
      facilityNumber: "092700093",
      downloadStatus: "LICENSED",
      licenseFirstDate: "12/14/2017",
      sourceAsOfIso: "2026-11-01",
      disclosureVerified: true,
    },
    {
      exclusionsActivated: true,
      eligibilityMappingActivated: true,
      californiaPublished: true,
      publicationEligibleCount: 1,
    },
  );
  const unverifiedBlocked = californiaPrepublicationSelectFacility(
    {
      facilityNumber: "092700093",
      downloadStatus: "LICENSED",
      licenseFirstDate: "12/14/2017",
      sourceAsOfIso: CALIFORNIA_PREPUBLICATION_CUTOVER_SOURCE.adoptedAsOfIso,
      disclosureVerified: false,
    },
    {
      exclusionsActivated: true,
      eligibilityMappingActivated: true,
      californiaPublished: true,
      publicationEligibleCount: 1,
    },
  );
  const invalidBlocked = californiaPrepublicationSelectFacility({
    facilityNumber: "95354",
    disclosureVerified: true,
    sourceAsOfIso: CALIFORNIA_PREPUBLICATION_CUTOVER_SOURCE.adoptedAsOfIso,
  });
  const pendingWithoutMapping = californiaPrepublicationSelectFacility(
    {
      facilityNumber: "392701427",
      downloadStatus: "LICENSED",
      facilityDetailStatus: "Licensed/Pending Increase",
      licenseFirstDate: "8/20/2024",
      downloadCapacity: "6",
      facilityDetailCapacity: "6",
      pendingIncrease: true,
      sourceAsOfIso: CALIFORNIA_PREPUBLICATION_CUTOVER_SOURCE.adoptedAsOfIso,
      disclosureVerified: true,
    },
    {
      exclusionsActivated: true,
      eligibilityMappingActivated: false,
      californiaPublished: true,
      publicationEligibleCount: 1,
    },
  );
  const pendingWithMappingStillUnpublished =
    californiaPrepublicationSelectFacility(
      {
        facilityNumber: "392701427",
        downloadStatus: "LICENSED",
        facilityDetailStatus: "Licensed/Pending Increase",
        licenseFirstDate: "8/20/2024",
        downloadCapacity: "6",
        facilityDetailCapacity: "6",
        pendingIncrease: true,
        sourceAsOfIso: CALIFORNIA_PREPUBLICATION_CUTOVER_SOURCE.adoptedAsOfIso,
        disclosureVerified: true,
      },
      {
        exclusionsActivated: true,
        eligibilityMappingActivated: true,
        californiaPublished: false,
        publicationEligibleCount: 0,
      },
    );

  const residualCount =
    CALIFORNIA_CUTOVER_RESIDUAL_MISSING_FIRST_DATE_IDS.length
    + CALIFORNIA_CUTOVER_RESIDUAL_PROVISIONAL_IDS.length
    + CALIFORNIA_CUTOVER_RESIDUAL_STATUS_CONFLICT_IDS.length;

  const arithmeticOk =
    residualCount === 22
    && CALIFORNIA_CUTOVER_RESIDUAL_IDS.length === 22
    && !defaults.exclusionsActivated
    && !defaults.eligibilityMappingActivated
    && !defaults.californiaPublished
    && defaults.publicationEligibleCount === 0
    && !californiaCutoverActivated()
    && !californiaCutoverAllowsPublication()
    && residualsDefault.allBlocked
    && residualsActivated.allBlocked
    && !clearDefault.selected
    && !clearFullyArmed.selected
    && clearFullyArmed.reasons.includes("publication-eligible-zero")
    && !staleBlocked.selected
    && staleBlocked.reasons.includes("stale-source-data")
    && !unverifiedBlocked.selected
    && unverifiedBlocked.reasons.includes("disclosure-link-unverified")
    && !invalidBlocked.selected
    && !pendingWithoutMapping.selected
    && pendingWithoutMapping.reasons.includes("eligibility-mapping-inactive")
    && !pendingWithMappingStillUnpublished.selected
    && pendingWithMappingStillUnpublished.eligibilityMappingApplied
    && activationExclusionOnly.activatedRuntime === false
    && activationExclusionOnly.residualEnforced.allBlocked
    && activationExclusionOnly.controls.exclusionsActivated
    && !activationExclusionOnly.controls.eligibilityMappingActivated
    && !activationExclusionOnly.controls.californiaPublished
    && activationExclusionOnly.independencePreserved
    && !activationMappingAlone.controls.exclusionsActivated
    && activationMappingAlone.controls.eligibilityMappingActivated
    && activationAll.controls.exclusionsActivated
    && activationAll.controls.eligibilityMappingActivated
    && !activationAll.controls.californiaPublished
    && activationAll.controls.publicationEligibleCount === 0
    && activationAll.selectedUnderRehearsal === 0
    && activationAll.independencePreserved
    && rollback.surfacesFailClosed
    && rollback.defaultsUnchanged
    && rollback.activatedRuntime === false;

  return {
    observedOn: CALIFORNIA_PREPUBLICATION_CUTOVER_OBSERVED_ON,
    baseline: CALIFORNIA_PREPUBLICATION_CUTOVER_BASELINE,
    source: CALIFORNIA_PREPUBLICATION_CUTOVER_SOURCE,
    defaults,
    decisions: CALIFORNIA_PREPUBLICATION_CUTOVER_DECISIONS,
    residualCount,
    residualBuckets: {
      missingFirstDate: CALIFORNIA_CUTOVER_RESIDUAL_MISSING_FIRST_DATE_IDS.length,
      provisional: CALIFORNIA_CUTOVER_RESIDUAL_PROVISIONAL_IDS.length,
      statusConflict: CALIFORNIA_CUTOVER_RESIDUAL_STATUS_CONFLICT_IDS.length,
    },
    activationExclusionOnly,
    activationMappingAlone,
    activationAll,
    rollback,
    residualsDefault,
    samples: {
      clearDefault,
      clearFullyArmed,
      staleBlocked,
      unverifiedBlocked,
      invalidBlocked,
      pendingWithoutMapping,
      pendingWithMappingStillUnpublished,
    },
    arithmeticOk,
    stopGoPublic: "STOP" as const,
    mostActionableNextStep:
      "Keep runtime controls inactive. Use dry-run activation/rollback rehearsals until humans approve exclusion ledger activation, then mapping, then publication — as separate decisions.",
    preservedRestrictions: [
      "runtime-controls-inactive",
      "california-unpublished",
      "publication-eligible-zero",
      "exclusions-not-activated",
      "eligibility-mapping-not-activated",
      "no-database-writes",
      "no-production-changes",
      "washington-oregon-unaffected",
    ] as const,
  };
}
