/**
 * California Phase 26 — quality rollup.
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_PHASE26_QUALITY_OBSERVED_ON = "2026-11-20";

export const CALIFORNIA_PHASE26_QUALITY_TARGETS = {
  officialRecords: 24377,
  californiaCandidates: 15451,
  listingExclusions: 88,
  otherwiseClear: 15363,
  unresolvedCoordinates: 28,
  mapOnly: 27,
  restrictionChecksMin: 8,
  securityChecksMin: 5,
  riskBlockersMin: 5,
} as const;

export function evaluateCaliforniaPhase26Quality(input?: {
  officialRecords?: number;
  californiaCandidates?: number;
  listingExclusions?: number;
  otherwiseClear?: number;
  unresolvedCoordinates?: number;
  mapOnly?: number;
  restrictionPass?: boolean;
  leakPossibleCount?: number;
  securityPass?: boolean;
  cdssIsoPresent?: boolean;
  mailSent?: boolean;
  productionWrites?: boolean;
  riskBlockerCount?: number;
}) {
  const t = CALIFORNIA_PHASE26_QUALITY_TARGETS;
  const official = input?.officialRecords ?? t.officialRecords;
  const candidates = input?.californiaCandidates ?? t.californiaCandidates;
  const listing = input?.listingExclusions ?? t.listingExclusions;
  const otherwise = input?.otherwiseClear ?? t.otherwiseClear;
  const coords = input?.unresolvedCoordinates ?? t.unresolvedCoordinates;
  const mapOnly = input?.mapOnly ?? t.mapOnly;
  const restrictionPass = input?.restrictionPass ?? true;
  const leakCount = input?.leakPossibleCount ?? 0;
  const securityPass = input?.securityPass ?? true;
  const cdssIsoPresent = input?.cdssIsoPresent ?? false;
  const mailSent = input?.mailSent ?? false;
  const productionWrites = input?.productionWrites ?? false;
  const riskBlockers = input?.riskBlockerCount ?? t.riskBlockersMin;

  const checks = {
    baselineCounts:
      official === t.officialRecords
      && candidates === t.californiaCandidates
      && listing === t.listingExclusions
      && otherwise === t.otherwiseClear
      && coords === t.unresolvedCoordinates
      && mapOnly === t.mapOnly
      && listing + otherwise === candidates
      && coords - mapOnly === 1,
    restrictionsPass: restrictionPass && leakCount === 0,
    securityPass,
    freshnessStillBlocked: cdssIsoPresent === false,
    noMailSent: mailSent === false,
    noProductionWrites: productionWrites === false,
    riskBlockersPresent: riskBlockers >= t.riskBlockersMin,
  };

  return {
    observedOn: CALIFORNIA_PHASE26_QUALITY_OBSERVED_ON,
    checks,
    allPass: Object.values(checks).every(Boolean),
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
  };
}
