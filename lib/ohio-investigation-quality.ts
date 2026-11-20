/**
 * Ohio investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type OhioInvestigationQualityInput = {
  l12Rows: number;
  activeRows: number;
  sampleRows: number;
  facidDuplicates: number;
  washingtonAfhEquivalenceClaimed: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  coordinateColumnsPresent: boolean;
  arcgisAcceptedAsAuthoritativeExport: boolean;
  programApproxAcceptedAsRosterCount: boolean;
  statewideCrawl: boolean;
  automaticGeocoding: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateOhioInvestigationQuality(
  input: OhioInvestigationQualityInput,
) {
  const checks = {
    l12Count: input.l12Rows === 1152,
    activeCount: input.activeRows === 801,
    sampleBounded: input.sampleRows === 32,
    noFacidDuplicates: input.facidDuplicates === 0,
    noWashingtonAfhEquivalence: input.washingtonAfhEquivalenceClaimed === false,
    noDisclosurePrefix: input.disclosurePrefixVerified === false,
    noExportDate: input.exportDatePresent === false,
    noOfficialCoords: input.coordinateColumnsPresent === false,
    arcgisRejected: input.arcgisAcceptedAsAuthoritativeExport === false,
    programApproxRejected: input.programApproxAcceptedAsRosterCount === false,
    noStatewideCrawl: input.statewideCrawl === false,
    noAutomaticGeocoding: input.automaticGeocoding === false,
    zeroPublicationEligible: input.publicationEligible === 0,
    ownerClaimsDisabled: input.ownerClaimEligible === false,
    noProductionWrites: input.productionWrites === false,
  };
  const allPass = Object.values(checks).every(Boolean);
  return { checks, allPass, gate: allPass ? ("blocked" as const) : ("failed-closed" as const) };
}
