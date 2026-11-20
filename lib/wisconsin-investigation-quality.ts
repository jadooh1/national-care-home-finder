/**
 * Wisconsin investigation quality checks (development-only).
 * Intentionally free of sibling runtime imports.
 */

export type WisconsinInvestigationQualityInput = {
  excelRows: number;
  gisFeatures: number;
  matchedUnique: number;
  matchedAmbiguous: number;
  excelOnly: number;
  gisOnlyWithLicense: number;
  gisBlankLicense: number;
  mailingSubstituted: boolean;
  gisAcceptedAsDirectory: boolean;
  disclosurePrefixVerified: boolean;
  exportDatePresent: boolean;
  publicationEligible: number;
  ownerClaimEligible: boolean;
  productionWrites: boolean;
};

export function evaluateWisconsinInvestigationQuality(input: WisconsinInvestigationQualityInput) {
  const checks = {
    excelResidual:
      input.matchedUnique + input.matchedAmbiguous + input.excelOnly === input.excelRows,
    gisResidual:
      input.matchedUnique + 4 + input.gisOnlyWithLicense + input.gisBlankLicense === input.gisFeatures,
    noMailingSubstitution: input.mailingSubstituted === false,
    gisNotAccepted: input.gisAcceptedAsDirectory === false,
    noDisclosurePrefix: input.disclosurePrefixVerified === false,
    noExportDate: input.exportDatePresent === false,
    zeroPublicationEligible: input.publicationEligible === 0,
    ownerClaimsDisabled: input.ownerClaimEligible === false,
    noProductionWrites: input.productionWrites === false,
  };
  const allPass = Object.values(checks).every(Boolean);
  return { checks, allPass, gate: allPass ? ("blocked" as const) : ("failed-closed" as const) };
}
