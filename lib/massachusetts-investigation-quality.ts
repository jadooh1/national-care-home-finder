/**
 * Massachusetts investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type MassachusettsInvestigationQualityInput = {
  certifiedUsableRows: number;
  statusAnomalyRows: number;
  sampleRows: number;
  washingtonAfhEquivalenceClaimed: boolean;
  dphLicenseEquivalenceClaimed: boolean;
  massHealthAfcEquivalenceClaimed: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  certificationIdentifierColumn: boolean;
  coordinateColumnsPresent: boolean;
  massGisAcceptedAsAuthoritativeRoster: boolean;
  massGisCoordinatesAreLicensingCoordinates: boolean;
  statewideCrawl: boolean;
  automaticGeocoding: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateMassachusettsInvestigationQuality(
  input: MassachusettsInvestigationQualityInput,
) {
  const checks = {
    certifiedCount: input.certifiedUsableRows === 271,
    anomalyNoted: input.statusAnomalyRows === 1,
    sampleBounded: input.sampleRows === 32,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    noDphLicenseEquivalence: input.dphLicenseEquivalenceClaimed === false,
    noMassHealthAfcEquivalence: input.massHealthAfcEquivalenceClaimed === false,
    disclosurePrefix: input.disclosurePrefixVerified === true,
    noExportDate: input.exportDatePresent === false,
    noCertIdColumn: input.certificationIdentifierColumn === false,
    noOfficialCoords: input.coordinateColumnsPresent === false,
    massGisRosterRejected: input.massGisAcceptedAsAuthoritativeRoster === false,
    massGisCoordsRejected: input.massGisCoordinatesAreLicensingCoordinates === false,
    noStatewideCrawl: input.statewideCrawl === false,
    noAutomaticGeocoding: input.automaticGeocoding === false,
    zeroPublicationEligible: input.publicationEligible === 0,
    ownerClaimsDisabled: input.ownerClaimEligible === false,
    noProductionWrites: input.productionWrites === false,
  };
  const allPass = Object.values(checks).every(Boolean);
  return { checks, allPass, gate: allPass ? ("blocked" as const) : ("failed-closed" as const) };
}
