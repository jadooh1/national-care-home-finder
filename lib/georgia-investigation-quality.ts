/**
 * Georgia investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type GeorgiaInvestigationQualityInput = {
  pchRows: number;
  alcRows: number;
  sampleRows: number;
  facidOverlap: number;
  washingtonAfhEquivalenceClaimed: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  coordinatesClaimedAsLicensing: boolean;
  regulatedPdfAcceptedAsCurrent: boolean;
  statewideCrawl: boolean;
  automaticGeocoding: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateGeorgiaInvestigationQuality(
  input: GeorgiaInvestigationQualityInput,
) {
  const checks = {
    pchCount: input.pchRows === 1573,
    alcCount: input.alcRows === 326,
    categoryResidual: input.pchRows + input.alcRows === 1899,
    sampleBounded: input.sampleRows === 32,
    noFacidOverlap: input.facidOverlap === 0,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    noDisclosurePrefix: input.disclosurePrefixVerified === false,
    noExportDate: input.exportDatePresent === false,
    coordsNotLicensing: input.coordinatesClaimedAsLicensing === false,
    pdfRejected: input.regulatedPdfAcceptedAsCurrent === false,
    noStatewideCrawl: input.statewideCrawl === false,
    noAutomaticGeocoding: input.automaticGeocoding === false,
    zeroPublicationEligible: input.publicationEligible === 0,
    ownerClaimsDisabled: input.ownerClaimEligible === false,
    noProductionWrites: input.productionWrites === false,
  };
  const allPass = Object.values(checks).every(Boolean);
  return { checks, allPass, gate: allPass ? ("blocked" as const) : ("failed-closed" as const) };
}
