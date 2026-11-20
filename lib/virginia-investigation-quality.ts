/**
 * Virginia investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type VirginiaInvestigationQualityInput = {
  uniqueLicenseId: number;
  listTotalReported: number;
  sampleRows: number;
  duplicateLicenseIdRows: number;
  washingtonAfhEquivalenceClaimed: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  capacityOnList: boolean;
  coordinateColumnsPresent: boolean;
  statewideCrawl: boolean;
  automaticGeocoding: boolean;
  sampleCapacityExtrapolatedStatewide: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateVirginiaInvestigationQuality(
  input: VirginiaInvestigationQualityInput,
) {
  const checks = {
    uniqueLicenseCount: input.uniqueLicenseId === 575,
    listTotal: input.listTotalReported === 576,
    sampleBounded: input.sampleRows === 32,
    duplicateNoted: input.duplicateLicenseIdRows === 1,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    disclosurePrefix: input.disclosurePrefixVerified === true,
    noExportDate: input.exportDatePresent === false,
    capacityNotOnList: input.capacityOnList === false,
    noOfficialCoords: input.coordinateColumnsPresent === false,
    noStatewideCrawl: input.statewideCrawl === false,
    noAutomaticGeocoding: input.automaticGeocoding === false,
    noSampleExtrapolation: input.sampleCapacityExtrapolatedStatewide === false,
    zeroPublicationEligible: input.publicationEligible === 0,
    ownerClaimsDisabled: input.ownerClaimEligible === false,
    noProductionWrites: input.productionWrites === false,
  };
  const allPass = Object.values(checks).every(Boolean);
  return { checks, allPass, gate: allPass ? ("blocked" as const) : ("failed-closed" as const) };
}
