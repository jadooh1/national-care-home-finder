/**
 * New Jersey investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type NewJerseyInvestigationQualityInput = {
  alrRows: number;
  cpchRows: number;
  alpRows: number;
  combinedRows: number;
  sampleRows: number;
  facIdOverlapAcrossTypes: number;
  washingtonAfhEquivalenceClaimed: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  alpBedsAllZero: boolean;
  coordinatesAreLicensingCoordinates: boolean;
  statewideCrawl: boolean;
  automaticGeocoding: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateNewJerseyInvestigationQuality(
  input: NewJerseyInvestigationQualityInput,
) {
  const checks = {
    alrCount: input.alrRows === 256,
    cpchCount: input.cpchRows === 32,
    alpCount: input.alpRows === 17,
    combinedCount: input.combinedRows === 305,
    sampleBounded: input.sampleRows === 32,
    noCrossTypeFacIdOverlap: input.facIdOverlapAcrossTypes === 0,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    disclosurePrefix: input.disclosurePrefixVerified === true,
    noExportDate: input.exportDatePresent === false,
    alpBedsZeroNoted: input.alpBedsAllZero === true,
    coordsNotLicensing: input.coordinatesAreLicensingCoordinates === false,
    noStatewideCrawl: input.statewideCrawl === false,
    noAutomaticGeocoding: input.automaticGeocoding === false,
    zeroPublicationEligible: input.publicationEligible === 0,
    ownerClaimsDisabled: input.ownerClaimEligible === false,
    noProductionWrites: input.productionWrites === false,
  };
  const allPass = Object.values(checks).every(Boolean);
  return { checks, allPass, gate: allPass ? ("blocked" as const) : ("failed-closed" as const) };
}
