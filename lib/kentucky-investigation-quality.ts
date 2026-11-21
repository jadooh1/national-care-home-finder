/**
 * Kentucky investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type KentuckyInvestigationQualityInput = {
  directoryTypeRows: number;
  uniqueLicenseNbr: number;
  blankLicense: number;
  dupLicenseGroups: number;
  sampleRows: number;
  washingtonAfhEquivalenceClaimed: boolean;
  peerDirectoriesMergedIntoAlc: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  coordinateColumnsPresent: boolean;
  pendingRenewalTreatedAsOperatingStatus: boolean;
  statewideCrawl: boolean;
  automaticGeocoding: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateKentuckyInvestigationQuality(
  input: KentuckyInvestigationQualityInput,
) {
  const checks = {
    directoryCount: input.directoryTypeRows === 247,
    uniqueLicenseCount: input.uniqueLicenseNbr === 244,
    blankLicenseCount: input.blankLicense === 1,
    dupLicenseCount: input.dupLicenseGroups === 2,
    sampleBounded: input.sampleRows === 32,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    peerTypesNotMerged: input.peerDirectoriesMergedIntoAlc === false,
    noDisclosurePrefix: input.disclosurePrefixVerified === false,
    noExportDate: input.exportDatePresent === false,
    noOfficialCoords: input.coordinateColumnsPresent === false,
    pendingNotOperatingStatus: input.pendingRenewalTreatedAsOperatingStatus === false,
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
