/**
 * Colorado investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type ColoradoInvestigationQualityInput = {
  alrRows: number;
  uniqueFacilityIds: number;
  sampleRows: number;
  blankAddress: number;
  zeroBeds: number;
  washingtonAfhEquivalenceClaimed: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  coordinatesClaimedAsLicensing: boolean;
  statewideCrawl: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateColoradoInvestigationQuality(
  input: ColoradoInvestigationQualityInput,
) {
  const checks = {
    alrFilterCount: input.alrRows === 685 && input.uniqueFacilityIds === 685,
    sampleBounded: input.sampleRows === 34,
    addressesPresent: input.blankAddress === 0,
    zeroBedsRecorded: input.zeroBeds === 27,
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
