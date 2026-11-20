/**
 * Michigan onboarding-investigation quality rollup.
 * Intentionally free of sibling runtime imports.
 */

export const MICHIGAN_INVESTIGATION_QUALITY_OBSERVED_ON = "2026-11-20";

export function evaluateMichiganInvestigationQuality(input?: {
  rows?: number;
  blankStreet?: number;
  usableStreet?: number;
  xhRows?: number;
  exemptRows?: number;
  supplementalAdoptedAsPhysical?: boolean;
  xhInclusionAuthorized?: boolean;
  publicationEligible?: number;
  ownerClaimEligible?: boolean;
  exportDatePresent?: boolean;
  productionWrites?: boolean;
}) {
  const rows = input?.rows ?? 4476;
  const blank = input?.blankStreet ?? 4419;
  const usable = input?.usableStreet ?? 57;
  const xh = input?.xhRows ?? 234;
  const exempt = input?.exemptRows ?? 234;
  const supplementalAdopted = input?.supplementalAdoptedAsPhysical ?? false;
  const xhIncluded = input?.xhInclusionAuthorized ?? false;
  const publicationEligible = input?.publicationEligible ?? 0;
  const ownerClaimEligible = input?.ownerClaimEligible ?? false;
  const exportDatePresent = input?.exportDatePresent ?? false;
  const productionWrites = input?.productionWrites ?? false;

  const checks = {
    rosterAddressSplit: blank + usable === rows,
    xhExemptAligned: xh === 234 && exempt === 234 && xh === exempt,
    noSupplementalSubstitution: supplementalAdopted === false,
    xhKeptIneligible: xhIncluded === false,
    unpublished: publicationEligible === 0,
    ownerClaimsDisabled: ownerClaimEligible === false,
    freshnessBlocked: exportDatePresent === false,
    noProductionWrites: productionWrites === false,
  };

  return {
    observedOn: MICHIGAN_INVESTIGATION_QUALITY_OBSERVED_ON,
    checks,
    allPass: Object.values(checks).every(Boolean),
    allowsPublication: false as const,
    gate: "blocked" as const,
    stopGo: "STOP" as const,
  };
}
