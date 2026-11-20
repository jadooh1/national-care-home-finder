/**
 * California Phase 25 — quality / readiness rollup.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE25_QUALITY_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE25_QUALITY_TARGETS = {
  securityFindingsMin: 10,
  unpublishedLeakPossibleCount: 0,
  rosterDenominator: 15451,
  listingExclusions: 88,
  otherwiseClear: 15363,
  unresolvedCoordinates: 28,
  mapOnly: 27,
  sourceSecurityChecksMin: 6,
} as const;

export function evaluateCaliforniaPhase25Quality(input?: {
  securityFindings?: number;
  unpublishedLeakPossibleCount?: number;
  rosterDenominator?: number;
  listingExclusions?: number;
  otherwiseClear?: number;
  unresolvedCoordinates?: number;
  mapOnly?: number;
  sourceSecurityPassCount?: number;
  productionDeployed?: boolean;
}) {
  const t = CALIFORNIA_PHASE25_QUALITY_TARGETS;
  const securityFindings = input?.securityFindings ?? 11;
  const leakCount = input?.unpublishedLeakPossibleCount ?? 0;
  const roster = input?.rosterDenominator ?? t.rosterDenominator;
  const listing = input?.listingExclusions ?? t.listingExclusions;
  const otherwise = input?.otherwiseClear ?? t.otherwiseClear;
  const coords = input?.unresolvedCoordinates ?? t.unresolvedCoordinates;
  const mapOnly = input?.mapOnly ?? t.mapOnly;
  const sourcePass = input?.sourceSecurityPassCount ?? t.sourceSecurityChecksMin;
  const productionDeployed = input?.productionDeployed ?? false;

  const checks = {
    securityFindingsPresent: securityFindings >= t.securityFindingsMin,
    noUnpublishedLeak: leakCount === t.unpublishedLeakPossibleCount,
    eligibilityResidual: listing + otherwise === roster,
    eligibilityCoords: coords - mapOnly === 1,
    eligibilityTargets:
      roster === t.rosterDenominator
      && listing === t.listingExclusions
      && otherwise === t.otherwiseClear
      && coords === t.unresolvedCoordinates
      && mapOnly === t.mapOnly,
    sourceSecurity: sourcePass >= t.sourceSecurityChecksMin,
    noProductionDeploy: productionDeployed === false,
  };

  return {
    observedOn: CALIFORNIA_PHASE25_QUALITY_OBSERVED_ON,
    checks,
    allPass: Object.values(checks).every(Boolean),
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
  };
}
