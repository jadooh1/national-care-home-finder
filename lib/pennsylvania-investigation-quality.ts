/**
 * Pennsylvania onboarding-investigation quality rollup.
 * Intentionally free of sibling runtime imports.
 */

export const PENNSYLVANIA_INVESTIGATION_QUALITY_OBSERVED_ON = "2026-11-20";

export function evaluatePennsylvaniaInvestigationQuality(input?: {
  rows?: number;
  usableStreetRows?: number;
  addressExceptions?: number;
  exceptionLedgerSize?: number;
  facilitySpecificDisclosures?: number;
  publicationEligible?: number;
  ownerClaimEligible?: boolean;
  productionWrites?: boolean;
}) {
  const rows = input?.rows ?? 989;
  const usable = input?.usableStreetRows ?? 976;
  const exceptions = input?.addressExceptions ?? 13;
  const ledger = input?.exceptionLedgerSize ?? 13;
  const facilitySpecific = input?.facilitySpecificDisclosures ?? 0;
  const publicationEligible = input?.publicationEligible ?? 0;
  const ownerClaimEligible = input?.ownerClaimEligible ?? false;
  const productionWrites = input?.productionWrites ?? false;

  const checks = {
    rosterIntact: rows === 989 && usable + exceptions === 989,
    ledgerComplete: ledger === 13 && exceptions === 13,
    noFacilityDisclosure: facilitySpecific === 0,
    unpublished: publicationEligible === 0,
    ownerClaimsDisabled: ownerClaimEligible === false,
    noProductionWrites: productionWrites === false,
  };

  return {
    observedOn: PENNSYLVANIA_INVESTIGATION_QUALITY_OBSERVED_ON,
    checks,
    allPass: Object.values(checks).every(Boolean),
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
  };
}
