/**
 * Arizona investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type ArizonaInvestigationQualityInput = {
  homeRows: number;
  centerRows: number;
  facidOverlap: number;
  sampleRows: number;
  homeCapacityMax: number;
  centerCapacityMin: number;
  washingtonAfhEquivalenceClaimed: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  coordinatesClaimedAsLicensing: boolean;
  statewideCrawl: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateArizonaInvestigationQuality(
  input: ArizonaInvestigationQualityInput,
) {
  const checks = {
    homeCount: input.homeRows === 1719,
    centerCount: input.centerRows === 328,
    noFacidOverlap: input.facidOverlap === 0,
    sampleBounded: input.sampleRows === 27,
    capacityBoundary:
      input.homeCapacityMax === 10 && input.centerCapacityMin === 13,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    noDisclosurePrefix: input.disclosurePrefixVerified === false,
    noExportDate: input.exportDatePresent === false,
    coordsNotLicensing: input.coordinatesClaimedAsLicensing === false,
    noStatewideCrawl: input.statewideCrawl === false,
    zeroPublicationEligible: input.publicationEligible === 0,
    ownerClaimsDisabled: input.ownerClaimEligible === false,
    noProductionWrites: input.productionWrites === false,
  };
  const allPass = Object.values(checks).every(Boolean);
  return { checks, allPass, gate: allPass ? ("blocked" as const) : ("failed-closed" as const) };
}
