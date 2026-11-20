/**
 * Tennessee investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type TennesseeInvestigationQualityInput = {
  aclfRows: number;
  licensedRows: number;
  sampleRows: number;
  dupLicGroups: number;
  washingtonAfhEquivalenceClaimed: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  coordinateColumnsPresent: boolean;
  rhaAdoptedAsAclfRoster: boolean;
  rhaUndatedPdfAcceptedAsCurrent: boolean;
  statewideCrawl: boolean;
  automaticGeocoding: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateTennesseeInvestigationQuality(
  input: TennesseeInvestigationQualityInput,
) {
  const checks = {
    aclfCount: input.aclfRows === 333,
    licensedCount: input.licensedRows === 331,
    sampleBounded: input.sampleRows === 32,
    noLicDuplicates: input.dupLicGroups === 0,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    noDisclosurePrefix: input.disclosurePrefixVerified === false,
    noExportDate: input.exportDatePresent === false,
    noOfficialCoords: input.coordinateColumnsPresent === false,
    rhaNotMerged: input.rhaAdoptedAsAclfRoster === false,
    rhaStaleNotAccepted: input.rhaUndatedPdfAcceptedAsCurrent === false,
    noStatewideCrawl: input.statewideCrawl === false,
    noAutomaticGeocoding: input.automaticGeocoding === false,
    zeroPublicationEligible: input.publicationEligible === 0,
    ownerClaimsDisabled: input.ownerClaimEligible === false,
    noProductionWrites: input.productionWrites === false,
  };
  const allPass = Object.values(checks).every(Boolean);
  return { checks, allPass, gate: allPass ? ("blocked" as const) : ("failed-closed" as const) };
}
