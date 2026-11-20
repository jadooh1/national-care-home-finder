/**
 * South Carolina investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type SouthCarolinaInvestigationQualityInput = {
  crcfRows: number;
  actRows: number;
  sampleRows: number;
  dupLicenseGroups: number;
  washingtonAfhEquivalenceClaimed: boolean;
  nursingOrIcfMergedIntoCrcf: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  coordinatesAcceptedAsLicensing: boolean;
  crcBedsConflictIgnored: boolean;
  statewideCrawl: boolean;
  automaticGeocoding: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateSouthCarolinaInvestigationQuality(
  input: SouthCarolinaInvestigationQualityInput,
) {
  const checks = {
    crcfCount: input.crcfRows === 427,
    actCount: input.actRows === 427,
    sampleBounded: input.sampleRows === 32,
    noLicenseDuplicates: input.dupLicenseGroups === 0,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    peerTypesNotMerged: input.nursingOrIcfMergedIntoCrcf === false,
    noDisclosurePrefix: input.disclosurePrefixVerified === false,
    noExportDate: input.exportDatePresent === false,
    coordsNotAcceptedAsLicensing: input.coordinatesAcceptedAsLicensing === false,
    capacityConflictNotIgnored: input.crcBedsConflictIgnored === false,
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
