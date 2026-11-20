/**
 * California Phase 24 — Phase 23 offline matrix count reconciliation.
 * Explains listing vs map-only overlaps. Preserves licensing/ID/capacity safeguards.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE24_RECONCILIATION_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE24_EXPECTED_COUNTS = {
  rosterDenominator: 15451,
  listingExclusionsInCandidates: 88,
  otherwiseClearOffline: 15363,
  mapOnlySuppressions: 27,
  underlyingUnresolvedCoordinates: 28,
  listingExcludedTotalIncludingOutsideResidual: 94,
  withdrawnOutsideResidual: 5,
  invalidIdOutsideResidual: 1,
} as const;

export const CALIFORNIA_PHASE24_LISTING_EXCLUSION_COMPOSITION = {
  provisionalLicenseConflicts: 5,
  licensedPendingIncreaseOverlays: 66,
  priorStatusControls: 3,
  missingLicenseEvidence: 14,
  /** 5 + 66 + 3 + 14 = 88 unique IDs inside the 15,451 candidate set */
  uniqueInCandidateSet: 88,
  notes: [
    "019201167 and 019201133 are prior controls (Licensed/Pending Increase) and are not double-counted inside the 66 Phase 21 overlays.",
    "Withdrawn regression controls (5) and invalid ID 95354 sit outside the 15,451 residual denominator.",
  ],
} as const;

export const CALIFORNIA_PHASE24_COORDINATE_OVERLAP = {
  underlyingUnresolvedCoordinates: 28,
  mapOnlyAfterListingOverlap: 27,
  listingAndCoordinateOverlapIds: ["502701867"] as const,
  overlapExplanation:
    "Exactly one unresolved-coordinate ID (502701867) is also a prior-status listing exclusion (Download LICENSED vs FacilityDetail Pending Incomplete Application). Listing exclusion wins for that ID; the remaining 27 unresolved-coordinate IDs are map-only suppressions with listingEligibleOffline=true.",
  mapDoesNotChangeLicensingEligibility: true as const,
} as const;

export const CALIFORNIA_PHASE24_PRESERVED_SAFEGUARDS = {
  licensingConflictsUnknownIneligible: true as const,
  leadingZerosPreserved: true as const,
  invalidId95354RefuseClosed: true as const,
  capacityBlanksNotInvented: true as const,
  fabricatedCoordinates: 0 as const,
  inventedCapacities: 0 as const,
  exclusionActivatedInAppOrDb: false as const,
  altersAuthoritativeGovernmentRecords: false as const,
} as const;

export type CaliforniaPhase24CountReconciliation = {
  observedOn: string;
  expected: typeof CALIFORNIA_PHASE24_EXPECTED_COUNTS;
  observed: {
    rosterDenominator: number;
    listingExclusionsInCandidates: number;
    otherwiseClearOffline: number;
    mapOnlySuppressions: number;
    underlyingUnresolvedCoordinates: number;
    residualPlusListingEqualsDenominator: boolean;
  };
  composition: typeof CALIFORNIA_PHASE24_LISTING_EXCLUSION_COMPOSITION;
  coordinateOverlap: typeof CALIFORNIA_PHASE24_COORDINATE_OVERLAP;
  safeguards: typeof CALIFORNIA_PHASE24_PRESERVED_SAFEGUARDS;
  matchesPhase23: boolean;
  allowsPublication: false;
  gate: "blocked";
};

/**
 * Reconcile observed Phase 23 matrix accounting against expected Phase 24 targets.
 */
export function reconcileCaliforniaPhase24EligibilityCounts(input?: {
  observedOn?: string;
  listingExclusionsInCandidates?: number;
  otherwiseClearOffline?: number;
  mapOnlySuppressions?: number;
  underlyingUnresolvedCoordinates?: number;
}): CaliforniaPhase24CountReconciliation {
  const listing =
    input?.listingExclusionsInCandidates
    ?? CALIFORNIA_PHASE24_EXPECTED_COUNTS.listingExclusionsInCandidates;
  const otherwise =
    input?.otherwiseClearOffline
    ?? CALIFORNIA_PHASE24_EXPECTED_COUNTS.otherwiseClearOffline;
  const mapOnly =
    input?.mapOnlySuppressions
    ?? CALIFORNIA_PHASE24_EXPECTED_COUNTS.mapOnlySuppressions;
  const coords =
    input?.underlyingUnresolvedCoordinates
    ?? CALIFORNIA_PHASE24_EXPECTED_COUNTS.underlyingUnresolvedCoordinates;

  const residualOk =
    listing + otherwise === CALIFORNIA_PHASE24_EXPECTED_COUNTS.rosterDenominator;
  const matches =
    listing === CALIFORNIA_PHASE24_EXPECTED_COUNTS.listingExclusionsInCandidates
    && otherwise === CALIFORNIA_PHASE24_EXPECTED_COUNTS.otherwiseClearOffline
    && mapOnly === CALIFORNIA_PHASE24_EXPECTED_COUNTS.mapOnlySuppressions
    && coords === CALIFORNIA_PHASE24_EXPECTED_COUNTS.underlyingUnresolvedCoordinates
    && residualOk
    && coords - mapOnly
      === CALIFORNIA_PHASE24_COORDINATE_OVERLAP.listingAndCoordinateOverlapIds.length;

  return {
    observedOn: input?.observedOn ?? CALIFORNIA_PHASE24_RECONCILIATION_OBSERVED_ON,
    expected: CALIFORNIA_PHASE24_EXPECTED_COUNTS,
    observed: {
      rosterDenominator: CALIFORNIA_PHASE24_EXPECTED_COUNTS.rosterDenominator,
      listingExclusionsInCandidates: listing,
      otherwiseClearOffline: otherwise,
      mapOnlySuppressions: mapOnly,
      underlyingUnresolvedCoordinates: coords,
      residualPlusListingEqualsDenominator: residualOk,
    },
    composition: CALIFORNIA_PHASE24_LISTING_EXCLUSION_COMPOSITION,
    coordinateOverlap: CALIFORNIA_PHASE24_COORDINATE_OVERLAP,
    safeguards: CALIFORNIA_PHASE24_PRESERVED_SAFEGUARDS,
    matchesPhase23: matches,
    allowsPublication: false,
    gate: "blocked",
  };
}
