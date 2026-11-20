/**
 * Florida investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type FloridaInvestigationQualityInput = {
  rows: number;
  licensed: number;
  inReview: number;
  provisional: number;
  inLitigation: number;
  provLitigation: number;
  inactive: number;
  pendingDeniedRenewal: number;
  suspended: number;
  sampleRows: number;
  coordinatePairs: number;
  afchRows: number;
  washingtonAfhEquivalenceClaimed: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  coordinatesClaimedAsLicensing: boolean;
  dohGisAcceptedAsCurrent: boolean;
  statewideCrawl: boolean;
  automaticGeocoding: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateFloridaInvestigationQuality(
  input: FloridaInvestigationQualityInput,
) {
  const statusSum =
    input.licensed
    + input.inReview
    + input.provisional
    + input.inLitigation
    + input.provLitigation
    + input.inactive
    + input.pendingDeniedRenewal
    + input.suspended;
  const checks = {
    rowCount: input.rows === 3025,
    statusResidual: statusSum === input.rows,
    coordinatesComplete: input.coordinatePairs === input.rows,
    sampleBounded: input.sampleRows === 32,
    afchBounded: input.afchRows === 230,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    disclosurePrefixPresent: input.disclosurePrefixVerified === true,
    noExportDate: input.exportDatePresent === false,
    coordsNotLicensing: input.coordinatesClaimedAsLicensing === false,
    dohGisRejected: input.dohGisAcceptedAsCurrent === false,
    noStatewideCrawl: input.statewideCrawl === false,
    noAutomaticGeocoding: input.automaticGeocoding === false,
    zeroPublicationEligible: input.publicationEligible === 0,
    ownerClaimsDisabled: input.ownerClaimEligible === false,
    noProductionWrites: input.productionWrites === false,
  };
  const allPass = Object.values(checks).every(Boolean);
  return { checks, allPass, gate: allPass ? ("blocked" as const) : ("failed-closed" as const) };
}
