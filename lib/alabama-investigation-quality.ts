/**
 * Alabama investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type AlabamaInvestigationQualityInput = {
  alfRows: number;
  scalfRows: number;
  combinedRows: number;
  sampleRows: number;
  dupFacIdGroups: number;
  washingtonAfhEquivalenceClaimed: boolean;
  nursingMergedIntoAlfScalf: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  coordinateColumnsPresent: boolean;
  statewideCrawl: boolean;
  automaticGeocoding: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateAlabamaInvestigationQuality(
  input: AlabamaInvestigationQualityInput,
) {
  const checks = {
    alfCount: input.alfRows === 188,
    scalfCount: input.scalfRows === 106,
    combinedCount: input.combinedRows === 294,
    sampleBounded: input.sampleRows === 32,
    noFacIdDuplicates: input.dupFacIdGroups === 0,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    nursingNotMerged: input.nursingMergedIntoAlfScalf === false,
    noDisclosurePrefix: input.disclosurePrefixVerified === false,
    noExportDate: input.exportDatePresent === false,
    noOfficialCoords: input.coordinateColumnsPresent === false,
    noStatewideCrawl: input.statewideCrawl === false,
    noAutomaticGeocoding: input.automaticGeocoding === false,
    zeroPublicationEligible: input.publicationEligible === 0,
    ownerClaimsDisabled: input.ownerClaimEligible === false,
    noProductionWrites: input.productionWrites === false,
  };
  const allPass = Object.values(checks).every(Boolean);
  return {
    checks,
    allPass,
    gate: allPass ? ("blocked" as const) : ("failed-closed" as const),
  };
}
