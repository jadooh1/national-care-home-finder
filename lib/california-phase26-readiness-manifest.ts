/**
 * California Phase 26 — versioned launch-readiness manifest (Phases 20–25).
 * Gate BLOCKED. Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE26_MANIFEST_VERSION = "26.0.0";
export const CALIFORNIA_PHASE26_OBSERVED_ON = "2026-11-20";

/** Verified exclusive bucket accounting (Phases 22–25). */
export const CALIFORNIA_PHASE26_BASELINE_COUNTS = {
  officialRecords: 24377,
  activeCandidates: 15413,
  restrictedCandidates: 38,
  excluded: 8921,
  exceptionDocumentedExclude: 5,
  californiaCandidates: 15451,
  listingExclusionsInCandidates: 88,
  otherwiseClearOffline: 15363,
  unresolvedCoordinates: 28,
  mapOnlySuppressions: 27,
  provisionalConflicts: 5,
  pendingIncreaseOverlays: 66,
  priorControls: 3,
  missingLicenseEvidence: 14,
  coordinateListingOverlapId: "502701867",
} as const;

export const CALIFORNIA_PHASE26_UNRESOLVED_LICENSING_CONFLICT_IDS = [
  "198320787",
  "455920513",
  "197611076",
  "197611060",
  "134605014",
  "502701867",
] as const;

export type CaliforniaPhase26PriorPhaseRef = {
  phase: number;
  title: string;
  pr: string;
  outcome: string;
  gate: "blocked";
};

export const CALIFORNIA_PHASE26_PRIOR_PHASES: readonly CaliforniaPhase26PriorPhaseRef[] =
  [
    {
      phase: 20,
      title: "Staged FacilityDetail verification",
      pr: "#163",
      outcome: "Statewide verification stages; conflicts/inconclusives documented.",
      gate: "blocked",
    },
    {
      phase: 21,
      title: "Exception reconciliation",
      pr: "#164",
      outcome: "Exception ledger + conflict classification offline.",
      gate: "blocked",
    },
    {
      phase: 22,
      title: "Launch-blocker evidence",
      pr: "#165",
      outcome: "Freshness evidence + capacity/ID policy + provisional conflicts.",
      gate: "blocked",
    },
    {
      phase: 23,
      title: "Eligibility matrix + launch controls",
      pr: "#166",
      outcome: "15,451 candidates; 88 listing exclusions; 15,363 otherwise-clear offline.",
      gate: "blocked",
    },
    {
      phase: 24,
      title: "Freshness + launch-dependency decisions",
      pr: "#167",
      outcome: "ISO absent; CDSS follow-up draft-do-not-send; counts reconciled.",
      gate: "blocked",
    },
    {
      phase: 25,
      title: "Launch QA / security",
      pr: "#168",
      outcome: "Unpublished access audit leak-count 0; source-data safeguards pass.",
      gate: "blocked",
    },
  ] as const;

export const CALIFORNIA_PHASE26_SOURCE_DATA_LIMITATIONS = [
  {
    id: "no-authoritative-iso-export-date",
    severity: "blocker" as const,
    summary: "No source-issued ISO as-of / version stamp for DownloadStateData.",
  },
  {
    id: "downloadstatedata-no-coordinates",
    severity: "known-limitation" as const,
    summary: "DownloadStateData has no lat/lng; map coords from separate GIS evidence.",
  },
  {
    id: "leading-zero-identity",
    severity: "control" as const,
    summary: "Official 8–9 digit strings preserve leading zeros; truncated IDs are not equivalent.",
  },
  {
    id: "capacity-blanks",
    severity: "control" as const,
    summary: "Official capacity blanks preserved; blanks are not invented.",
  },
  {
    id: "status-mapping-unresolved",
    severity: "blocker" as const,
    summary: "Provisional / Pending Increase mapping decisions require future approval.",
  },
  {
    id: "exclusions-offline-only",
    severity: "blocker" as const,
    summary: "Eligibility exclusions remain offline; not activated in app/DB.",
  },
] as const;

export function assertCaliforniaPhase26Baseline(input?: {
  officialRecords?: number;
  californiaCandidates?: number;
  listingExclusionsInCandidates?: number;
  otherwiseClearOffline?: number;
  unresolvedCoordinates?: number;
  mapOnlySuppressions?: number;
}) {
  const t = CALIFORNIA_PHASE26_BASELINE_COUNTS;
  const official = input?.officialRecords ?? t.officialRecords;
  const candidates = input?.californiaCandidates ?? t.californiaCandidates;
  const listing = input?.listingExclusionsInCandidates ?? t.listingExclusionsInCandidates;
  const otherwise = input?.otherwiseClearOffline ?? t.otherwiseClearOffline;
  const coords = input?.unresolvedCoordinates ?? t.unresolvedCoordinates;
  const mapOnly = input?.mapOnlySuppressions ?? t.mapOnlySuppressions;

  const exclusiveSum =
    t.activeCandidates + t.restrictedCandidates + t.excluded + t.exceptionDocumentedExclude;
  const residualOk = listing + otherwise === candidates;
  const coordOk = coords - mapOnly === 1;
  const exclusiveOk = exclusiveSum === official;
  const matches =
    official === t.officialRecords
    && candidates === t.californiaCandidates
    && listing === t.listingExclusionsInCandidates
    && otherwise === t.otherwiseClearOffline
    && coords === t.unresolvedCoordinates
    && mapOnly === t.mapOnlySuppressions
    && residualOk
    && coordOk
    && exclusiveOk;

  return {
    matches,
    residualOk,
    coordOk,
    exclusiveOk,
    exclusiveSum,
    observed: { official, candidates, listing, otherwise, coords, mapOnly },
    targets: t,
    publicationEligibleCount: 0 as const,
    offlineDoesNotGrantPublicVisibility: true as const,
  };
}

export function buildCaliforniaPhase26ReadinessManifest() {
  const baseline = assertCaliforniaPhase26Baseline();
  return {
    version: CALIFORNIA_PHASE26_MANIFEST_VERSION,
    observedOn: CALIFORNIA_PHASE26_OBSERVED_ON,
    priorPhases: CALIFORNIA_PHASE26_PRIOR_PHASES,
    baseline,
    unresolvedLicensingConflictIds: CALIFORNIA_PHASE26_UNRESOLVED_LICENSING_CONFLICT_IDS,
    sourceDataLimitations: CALIFORNIA_PHASE26_SOURCE_DATA_LIMITATIONS,
    californiaDirectoryReady: false as const,
    publication: "unpublished" as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
  };
}
