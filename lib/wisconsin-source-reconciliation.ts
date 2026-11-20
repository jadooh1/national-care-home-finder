/**
 * Wisconsin Excel Facility ID ↔ GIS WI_LICENSE_NUM reconciliation (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Match rule (verified): integer(Facility ID) == WI_LICENSE_NUM.
 * Leading zeros on Excel/PDF Facility ID are representation only; originals preserved.
 * Address/name corroboration is observational and never creates an identifier match.
 */

export const WISCONSIN_RECONCILIATION_OBSERVED_ON = "2026-11-20";

export const WISCONSIN_RECONCILIATION_RULE = {
  licensingIdentifier: "Excel Facility ID (zero-padded string; compare as integer)",
  gisIdentifier: "WI_LICENSE_NUM (integer)",
  match: "integer(Facility ID) === WI_LICENSE_NUM",
  inventIdentifiers: false,
  inventAddresses: false,
  inventCoordinates: false,
  inventLicensingStatus: false,
  adoptGisAsDirectory: false,
  adoptAddressAsIdentifierMatch: false,
} as const;

/** Exclusive ledger buckets for GIS features and Excel rows. */
export const WISCONSIN_RECONCILIATION_LEDGER = {
  excelRows: 2479,
  gisFeatures: 2203,
  matchedUnique: 1914,
  matchedAmbiguous: 2,
  matchedAmbiguousGisRows: 4,
  excelOnly: 563,
  gisOnlyWithLicense: 276,
  gisBlankLicense: 9,
  // excel residual: matchedUnique + matchedAmbiguous + excelOnly = 2479
  // gis residual: matchedUnique + matchedAmbiguousGisRows + gisOnlyWithLicense + gisBlankLicense = 2203
  publicationEligible: 0,
} as const;

export const WISCONSIN_AMBIGUOUS_LICENSE_SAMPLES = [
  {
    wiLicenseNum: 8965,
    excelFacilityId: "0008965",
    excelName: "REM WISCONSIN II GERMANTOWN",
    excelStreet: "N116 W16105 MAIN ST",
    gisRows: [
      { name: "REM WISCONSIN  I I GERMANTOWN", address: "N116W16105 Main St", aspen: "AFH630" },
      { name: "REM WISCONSIN II GERMANTOWN", address: "N116W16105 Main St", aspen: "AFH2123" },
    ],
    disposition: "ambiguous-duplicate-gis-license",
  },
  {
    wiLicenseNum: 19142,
    excelFacilityId: "0019142",
    excelName: "J and L Extended Family LLC",
    excelStreet: "4050 N 91st Street",
    gisRows: [
      { name: "J AND L EXTENDED FAMILY LLC", address: "4050 N 91st St", aspen: "19142" },
      { name: "ALL FOR 1 PHASE 1 INC", address: "12700 West Cleveland Ave", aspen: "0019124" },
    ],
    disposition: "ambiguous-duplicate-gis-license",
  },
] as const;

export const WISCONSIN_GIS_BLANK_LICENSE_SAMPLES = [
  { name: "KOMFORT CARE", address: "3201 N 46th St", city: "Milwaukee", aspen: "17356" },
  { name: "ODANA ROAD HOUSE", address: "4222 Odana Rd", city: "Fitchburg", aspen: "17358" },
  { name: "MY PLACE OF IXONIA I", address: "N8616A North Rd", city: "Ixonia", aspen: "17444" },
  { name: "MY PLACE OF IXONIA II", address: "N8616B North Rd", city: "Ixonia", aspen: "17445" },
  { name: "HOME 2 HOME RESIDENTAIL CARE LLC", address: "8231 W Casper St", city: "Milwaukee", aspen: "18524" },
  { name: "HOUSING MATTERS", address: "21450 Lees Ct", city: "Brookfield", aspen: "18595" },
  { name: "WOODED ACRES AFH", address: "104 N 11th Street", city: "Cornell", aspen: "18888" },
  { name: "90TH", address: "2402 90th Street", city: "Eau Claire", aspen: "0019956" },
  { name: "A AND D ADULT FAMILY FACILITY", address: "N68w13246 Ranch Road", city: "Menomonee Falls", aspen: "0020155" },
] as const;

export function summarizeWisconsinReconciliation(ledger = WISCONSIN_RECONCILIATION_LEDGER) {
  const excelResidual =
    ledger.matchedUnique + ledger.matchedAmbiguous + ledger.excelOnly === ledger.excelRows;
  const gisResidual =
    ledger.matchedUnique
      + ledger.matchedAmbiguousGisRows
      + ledger.gisOnlyWithLicense
      + ledger.gisBlankLicense
      === ledger.gisFeatures;
  return {
    observedOn: WISCONSIN_RECONCILIATION_OBSERVED_ON,
    rule: WISCONSIN_RECONCILIATION_RULE,
    ledger,
    excelResidualOk: excelResidual,
    gisResidualOk: gisResidual,
    residualOk: excelResidual && gisResidual,
    gisAcceptedAsDirectory: false as const,
    publicationEligible: 0,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function evaluateWisconsinSourceReconciliation() {
  const summary = summarizeWisconsinReconciliation();
  const integrityOk =
    summary.residualOk
    && summary.ledger.matchedUnique === 1914
    && summary.ledger.matchedAmbiguous === 2
    && summary.ledger.excelOnly === 563
    && summary.ledger.gisOnlyWithLicense === 276
    && summary.ledger.gisBlankLicense === 9
    && WISCONSIN_AMBIGUOUS_LICENSE_SAMPLES.length === 2
    && WISCONSIN_GIS_BLANK_LICENSE_SAMPLES.length === 9;
  return {
    ...summary,
    integrityOk,
    ambiguousSamples: WISCONSIN_AMBIGUOUS_LICENSE_SAMPLES,
    blankLicenseSamples: WISCONSIN_GIS_BLANK_LICENSE_SAMPLES,
  };
}
