/**
 * Texas investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type TexasInvestigationQualityInput = {
  rows: number;
  typeA: number;
  typeB: number;
  typeC: number;
  sampleRows: number;
  geoPairs: number;
  geoCommaOnly: number;
  closureOverlap: number;
  washingtonAfhEquivalenceClaimed: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  coordinatesClaimedAsLicensing: boolean;
  statewideCrawl: boolean;
  automaticGeocoding: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateTexasInvestigationQuality(
  input: TexasInvestigationQualityInput,
) {
  const checks = {
    rowCount: input.rows === 2019,
    typeResidual: input.typeA + input.typeB + input.typeC === input.rows,
    geoResidual: input.geoPairs + input.geoCommaOnly === input.rows,
    sampleBounded: input.sampleRows === 32,
    noClosureOverlap: input.closureOverlap === 0,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    noDisclosurePrefix: input.disclosurePrefixVerified === false,
    noExportDate: input.exportDatePresent === false,
    coordsNotLicensing: input.coordinatesClaimedAsLicensing === false,
    noStatewideCrawl: input.statewideCrawl === false,
    noAutomaticGeocoding: input.automaticGeocoding === false,
    zeroPublicationEligible: input.publicationEligible === 0,
    ownerClaimsDisabled: input.ownerClaimEligible === false,
    noProductionWrites: input.productionWrites === false,
  };
  const allPass = Object.values(checks).every(Boolean);
  return { checks, allPass, gate: allPass ? ("blocked" as const) : ("failed-closed" as const) };
}
