/**
 * Minnesota investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type MinnesotaInvestigationQualityInput = {
  interactiveAvailable: boolean;
  facilityLevelRows: number;
  sampleRows: number;
  annualPdfHasFacilityRows: boolean;
  washingtonAfhEquivalenceClaimed: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
  statewideCrawl: boolean;
};

export function evaluateMinnesotaInvestigationQuality(
  input: MinnesotaInvestigationQualityInput,
) {
  const checks = {
    noInventedFacilityRows: input.facilityLevelRows === 0 && input.sampleRows === 0,
    annualPdfNotTreatedAsFacilityRoster: input.annualPdfHasFacilityRows === false,
    interactiveUnavailabilityAcknowledged: input.interactiveAvailable === false,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    noDisclosurePrefix: input.disclosurePrefixVerified === false,
    noExportDate: input.exportDatePresent === false,
    zeroPublicationEligible: input.publicationEligible === 0,
    ownerClaimsDisabled: input.ownerClaimEligible === false,
    noProductionWrites: input.productionWrites === false,
    noStatewideCrawl: input.statewideCrawl === false,
  };
  const allPass = Object.values(checks).every(Boolean);
  return { checks, allPass, gate: allPass ? ("blocked" as const) : ("failed-closed" as const) };
}
