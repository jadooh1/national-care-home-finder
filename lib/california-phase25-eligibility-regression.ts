/**
 * California Phase 25 — eligibility count regression + offline≠public visibility.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE25_ELIGIBILITY_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE25_ELIGIBILITY_TARGETS = {
  rosterDenominator: 15451,
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

export const CALIFORNIA_PHASE25_UNRESOLVED_LICENSING_CONFLICT_IDS = [
  "198320787",
  "455920513",
  "197611076",
  "197611060",
  "134605014",
  "502701867",
] as const;

export function assertCaliforniaPhase25EligibilityTargets(input?: {
  rosterDenominator?: number;
  listingExclusionsInCandidates?: number;
  otherwiseClearOffline?: number;
  unresolvedCoordinates?: number;
  mapOnlySuppressions?: number;
}) {
  const t = CALIFORNIA_PHASE25_ELIGIBILITY_TARGETS;
  const roster = input?.rosterDenominator ?? t.rosterDenominator;
  const listing = input?.listingExclusionsInCandidates ?? t.listingExclusionsInCandidates;
  const otherwise = input?.otherwiseClearOffline ?? t.otherwiseClearOffline;
  const coords = input?.unresolvedCoordinates ?? t.unresolvedCoordinates;
  const mapOnly = input?.mapOnlySuppressions ?? t.mapOnlySuppressions;
  const residualOk = listing + otherwise === roster;
  const coordOk = coords - mapOnly === 1;
  const matches =
    roster === t.rosterDenominator
    && listing === t.listingExclusionsInCandidates
    && otherwise === t.otherwiseClearOffline
    && coords === t.unresolvedCoordinates
    && mapOnly === t.mapOnlySuppressions
    && residualOk
    && coordOk;
  return {
    matches,
    residualOk,
    coordOk,
    observed: { roster, listing, otherwise, coords, mapOnly },
    targets: t,
    offlineDoesNotGrantPublicVisibility: true as const,
    publicationEligibleCount: 0 as const,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function evaluateCaliforniaPhase25EligibilityRegression() {
  return {
    observedOn: CALIFORNIA_PHASE25_ELIGIBILITY_OBSERVED_ON,
    assertion: assertCaliforniaPhase25EligibilityTargets(),
    unresolvedLicensingConflictIds: CALIFORNIA_PHASE25_UNRESOLVED_LICENSING_CONFLICT_IDS,
    note:
      "otherwiseClearOffline candidates remain unpublished while californiaDirectoryReady()=false.",
  };
}
