/**
 * Maryland investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type MarylandInvestigationQualityInput = {
  excelRows: number;
  uniqueLicenseNumber: number;
  sampleRows: number;
  duplicateLicenseGroups: number;
  washingtonAfhEquivalenceClaimed: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  perRowStatusColumn: boolean;
  coordinateColumnsPresent: boolean;
  openDataAcceptedAsAuthoritativeLicensingRoster: boolean;
  openDataCoordinatesAreLicensingCoordinates: boolean;
  statewideCrawl: boolean;
  automaticGeocoding: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateMarylandInvestigationQuality(
  input: MarylandInvestigationQualityInput,
) {
  const checks = {
    excelRowCount: input.excelRows === 1676,
    uniqueLicenseCount: input.uniqueLicenseNumber === 1675,
    sampleBounded: input.sampleRows === 32,
    duplicateNoted: input.duplicateLicenseGroups === 1,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    noDisclosurePrefix: input.disclosurePrefixVerified === false,
    noExportDate: input.exportDatePresent === false,
    noStatusColumn: input.perRowStatusColumn === false,
    noOfficialCoords: input.coordinateColumnsPresent === false,
    openDataRosterRejected: input.openDataAcceptedAsAuthoritativeLicensingRoster === false,
    openDataCoordsRejected: input.openDataCoordinatesAreLicensingCoordinates === false,
    noStatewideCrawl: input.statewideCrawl === false,
    noAutomaticGeocoding: input.automaticGeocoding === false,
    zeroPublicationEligible: input.publicationEligible === 0,
    ownerClaimsDisabled: input.ownerClaimEligible === false,
    noProductionWrites: input.productionWrites === false,
  };
  const allPass = Object.values(checks).every(Boolean);
  return { checks, allPass, gate: allPass ? ("blocked" as const) : ("failed-closed" as const) };
}
