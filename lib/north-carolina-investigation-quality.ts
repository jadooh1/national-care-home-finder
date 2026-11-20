/**
 * North Carolina investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type NorthCarolinaInvestigationQualityInput = {
  adultRows: number;
  familyRows: number;
  uniqueLicenses: number;
  blankRows: number;
  licenseOverlap: number;
  sampleRows: number;
  identicalMailing: number;
  distinctMailing: number;
  washingtonAfhEquivalenceClaimed: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  coordinateColumnsPresent: boolean;
  perRowStatusPresent: boolean;
  staleFchTxtAcceptedAsCurrent: boolean;
  statewideCrawl: boolean;
  automaticGeocoding: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateNorthCarolinaInvestigationQuality(
  input: NorthCarolinaInvestigationQualityInput,
) {
  const checks = {
    adultCount: input.adultRows === 566,
    familyCount: input.familyRows === 520,
    uniqueTotal: input.uniqueLicenses === 1086,
    categoryResidual: input.adultRows + input.familyRows === input.uniqueLicenses,
    blankRows: input.blankRows === 2,
    noLicenseOverlap: input.licenseOverlap === 0,
    mailingResidual: input.identicalMailing + input.distinctMailing === input.uniqueLicenses,
    sampleBounded: input.sampleRows === 32,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    noDisclosurePrefix: input.disclosurePrefixVerified === false,
    noExportDate: input.exportDatePresent === false,
    noCoordinates: input.coordinateColumnsPresent === false,
    noPerRowStatus: input.perRowStatusPresent === false,
    staleTxtRejected: input.staleFchTxtAcceptedAsCurrent === false,
    noStatewideCrawl: input.statewideCrawl === false,
    noAutomaticGeocoding: input.automaticGeocoding === false,
    zeroPublicationEligible: input.publicationEligible === 0,
    ownerClaimsDisabled: input.ownerClaimEligible === false,
    noProductionWrites: input.productionWrites === false,
  };
  const allPass = Object.values(checks).every(Boolean);
  return { checks, allPass, gate: allPass ? ("blocked" as const) : ("failed-closed" as const) };
}
