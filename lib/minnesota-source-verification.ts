/**
 * Minnesota care-home source discovery (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Minnesota MDH Assisted Living (ch. 144G) is NOT assumed equivalent to
 * Washington adult family homes. DHS Licensing Lookup is a separate system.
 */

export const MINNESOTA_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const MINNESOTA_MDH_DIRECTORY_INDEX_URL =
  "https://www.health.mn.gov/facilities/regulation/directory/index.html";
export const MINNESOTA_MDH_PROVIDER_SELECT_URL =
  "https://www.health.mn.gov/facilities/regulation/directory/providerselect.html";
export const MINNESOTA_MDH_ANNUAL_PDF_2026_URL =
  "https://www.health.mn.gov/facilities/regulation/directory/2026mdhdirectory.pdf";
export const MINNESOTA_MDH_FIELD_OUTLINE_URL =
  "https://www.health.mn.gov/facilities/regulation/directory/directorydatafile.html";
export const MINNESOTA_MDH_ASSISTED_LIVING_URL =
  "https://www.health.mn.gov/facilities/regulation/assistedliving/index.html";
export const MINNESOTA_DHS_LICENSING_LOOKUP_URL =
  "https://licensinglookup.dhs.state.mn.us/Search.aspx";

/** Prior next-state onboarding note (DHS lookup only; unreconciliation retained). */
export const MINNESOTA_PRIOR_DHS_LOOKUP_BASELINE = {
  source: "DHS Licensing Information Lookup",
  profileLinksObserved: 1148,
  renderedLicenseSummaryTotal: 1149,
  renderedActive: 1025,
  renderedNonActive: 124,
  figuresReconciled: false,
  lastModifiedHeader: null,
  stableCsvFileUrl: false,
  selected: false,
} as const;

/**
 * Official MDH 2026 annual directory aggregates (as of March 13, 2026).
 * Facility-level rows are NOT present in this PDF (definitions + tables only).
 */
export const MINNESOTA_MDH_ANNUAL_PDF_2026 = {
  sourceUrl: MINNESOTA_MDH_ANNUAL_PDF_2026_URL,
  httpStatus: 200,
  contentType: "application/pdf",
  lastModified: "Wed, 17 Jun 2026 17:17:15 GMT",
  bytes: 403444,
  sha256: "c89aff6bcbe65f4c3fc789e3bf408d1dc8bc1a9e5e39baccc48f02d3f2ce5416",
  pages: 9,
  asOfLabel: "March 13, 2026",
  asOfIsoCandidate: "2026-03-13",
  asOfIsAuthoritativeIsoExportDate: false,
  lastModifiedIsExportDate: false,
  containsFacilityLevelRows: false,
  licensingStatuteAssistedLiving: "Minnesota Statutes, chapter 144G",
  classificationsAsOf2026_03_13: {
    assistedLivingFacilities: { facilities: 1083, beds: 17871 },
    assistedLivingFacilityDementiaCare: { facilities: 566, beds: 40042 },
    provisionalAssistedLivingFacility: { facilities: 310, beds: 1678 },
    provisionalAssistedLivingFacilityDementiaCare: { facilities: 6, beds: 91 },
    boardingCareHomes: { facilities: 17, beds: 1166 },
    boardingCareHomeUnitsOfOtherFacilities: { facilities: 5, beds: 266 },
    supervisedLivingFacilities: { facilities: 183, beds: 4088 },
  },
  assistedLivingFacilityTotalIncludingProvisional:
    1083 + 566 + 310 + 6,
  note:
    "Aggregate counts only. Do not treat these as a downloadable facility roster or invent per-facility identifiers.",
} as const;

export const MINNESOTA_CURRENT_CAPTURE = {
  observedOn: MINNESOTA_SOURCE_VERIFICATION_OBSERVED_ON,
  mdhInteractiveDirectory: {
    indexUrl: MINNESOTA_MDH_DIRECTORY_INDEX_URL,
    providerSelectUrl: MINNESOTA_MDH_PROVIDER_SELECT_URL,
    claimedUpdateCadence: "updated daily",
    interactiveAvailableThisRun: false,
    maintenanceNotice:
      "Due to server maintenance, interactive data may not be available from Nov. 20-23.",
    facilityLevelSampleTaken: false,
    recordedExportDate: null,
  },
  mdhFieldOutline: {
    sourceUrl: MINNESOTA_MDH_FIELD_OUTLINE_URL,
    httpStatusThisRun: 403,
    accessDeniedThisRun: true,
    // Documented field meanings from the published outline (not re-downloaded this run).
    documentedUniqueIdField: "HFID",
    documentedAddressFieldMeaning: "MAILING STREET ADDRESS",
    documentedAssistedLivingProviderField: "ALL_PROV",
    documentedAssistedLivingCapacityField: "ALL_CAPACITY",
    physicalAddressFieldVerifiedThisRun: false,
    coordinateFieldsVerifiedThisRun: false,
  },
  mdhAnnualPdf2026: MINNESOTA_MDH_ANNUAL_PDF_2026,
  dhsLicensingLookup: {
    sourceUrl: MINNESOTA_DHS_LICENSING_LOOKUP_URL,
    reachableWithoutBotChallengeThisRun: false,
    botChallengeObserved: true,
    priorBaseline: MINNESOTA_PRIOR_DHS_LOOKUP_BASELINE,
    figuresReconciled: false,
    recordedExportDate: null,
  },
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateMinnesotaSourceVerification(
  current = MINNESOTA_CURRENT_CAPTURE,
) {
  const pdf = current.mdhAnnualPdf2026;
  const integrityOk =
    pdf.pages === 9
    && pdf.classificationsAsOf2026_03_13.assistedLivingFacilities.facilities === 1083
    && pdf.classificationsAsOf2026_03_13.assistedLivingFacilityDementiaCare.facilities === 566
    && pdf.containsFacilityLevelRows === false
    && current.mdhInteractiveDirectory.interactiveAvailableThisRun === false
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: MINNESOTA_SOURCE_VERIFICATION_OBSERVED_ON,
    priorDhs: MINNESOTA_PRIOR_DHS_LOOKUP_BASELINE,
    current,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function minnesotaDirectoryReady(): false {
  return false;
}
