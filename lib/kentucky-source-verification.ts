/**
 * Kentucky assisted living community source discovery verification
 * (development-only). Intentionally free of sibling runtime imports.
 *
 * Assisted Living Communities (ALC / ALC-BH / ALC-DC) under 902 KAR 20:480
 * are NOT assumed equivalent to personal care homes, family care homes,
 * nursing facilities, or Washington adult family homes.
 */

export const KENTUCKY_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const KENTUCKY_HCF_PAGE_URL =
  "https://www.chfs.ky.gov/agencies/os/oig/dhc/Pages/hcf.aspx";
export const KENTUCKY_ALC_XLSX_URL =
  "https://www.chfs.ky.gov/agencies/os/oig/dhc/Documents/Assisted%20Living%20Community%20Directory.xlsx";
export const KENTUCKY_ALC_PDF_URL =
  "https://www.chfs.ky.gov/agencies/os/oig/dhc/Documents/Assisted%20Living%20Community%20Directory.pdf";

/** Prior nationwide note: Class B; PDF opened but observedRows null. */
export const KENTUCKY_PRIOR_BASELINE = {
  compatibilityClass: "B",
  licensingFileOpened: true,
  recordedExportDate: null,
  observedRows: null,
} as const;

export const KENTUCKY_TYPE_DEFINITIONS = {
  authority:
    "Kentucky Cabinet for Health and Family Services / Office of Inspector General",
  regulation: "902 KAR 20:480 Assisted living communities",
  alcSocialModel: "TYPE ALC — social-model Assisted Living Community.",
  alcBasicHealth: "TYPE ALC-BH — basic health / health-related services without secured dementia unit.",
  alcDementiaCare: "TYPE ALC-DC — dementia care in a secured unit.",
  personalCareHome:
    "Separate Personal Care Home Directory; not merged into ALC roster.",
  familyCareHome: "Separate Family Care Home Directory; not merged into ALC roster.",
  nursingFacility: "Separate Long Term Care Directory; not merged into ALC roster.",
  categoryEquivalenceToWashingtonAfh: false,
} as const;

export const KENTUCKY_CURRENT_CAPTURE = {
  observedOn: KENTUCKY_SOURCE_VERIFICATION_OBSERVED_ON,
  alcDirectory: {
    sourceUrl: KENTUCKY_ALC_XLSX_URL,
    pdfUrl: KENTUCKY_ALC_PDF_URL,
    hcfPageUrl: KENTUCKY_HCF_PAGE_URL,
    sheetName: "November 2026",
    updateFrequencyClaim: "beginning of each month",
    captureMethod: "xlsx-openpyxl-sheet-November-2026",
    xlsxSha256:
      "a76ac8fef8c0eab847bf3586503c13550af9cd85f32e3d0fea94fe5f335a2db1",
    pdfSha256:
      "6846c5145ccbb927950f0dfdbdb45f02d7870dbb39ad18b586b00b819121a971",
    httpLastModified: "Fri, 30 Oct 2026 12:11:40 GMT",
    sheetLabelIsIsoExportDate: false,
    recordedExportDate: null,
    directoryTypeRows: 247,
    uniqueLicenseNbr: 244,
    blankLicense: 1,
    dupLicenseGroups: 2,
    dupLicenseExamples: ["101513", "101294"],
    typeCounts: { ALC: 88, "ALC-BH": 74, "ALC-DC": 85 },
    blankStreet: 0,
    blankCity: 0,
    blankZip: 0,
    blankName: 0,
    unitsMin: 0,
    unitsMax: 137,
    unitsNull: 0,
    unitsZero: 1,
    unitsSum: 9889,
    pendingRenewal: 75,
    expirationDateLikeDistinct: 22,
    coordinateColumns: false,
  },
  peerDirectories: {
    personalCareHomeRows: 47,
    familyCareHomeRows: 24,
    longTermCareRows: 313,
    adoptedAsAlcRoster: false,
  },
  disclosure: {
    licenseNbrDetailPrefixVerified: false,
    ltcInspectionsPageIsNursingHomeOriented: true,
  },
  definitions: KENTUCKY_TYPE_DEFINITIONS,
  prior: KENTUCKY_PRIOR_BASELINE,
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateKentuckySourceVerification(
  current = KENTUCKY_CURRENT_CAPTURE,
) {
  const a = current.alcDirectory;
  const integrityOk =
    a.directoryTypeRows === 247
    && a.uniqueLicenseNbr === 244
    && a.blankLicense === 1
    && a.dupLicenseGroups === 2
    && a.typeCounts.ALC === 88
    && a.typeCounts["ALC-BH"] === 74
    && a.typeCounts["ALC-DC"] === 85
    && a.blankStreet === 0
    && a.unitsNull === 0
    && a.unitsZero === 1
    && a.pendingRenewal === 75
    && a.coordinateColumns === false
    && a.recordedExportDate === null
    && current.peerDirectories.adoptedAsAlcRoster === false
    && current.disclosure.licenseNbrDetailPrefixVerified === false
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: KENTUCKY_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: KENTUCKY_PRIOR_BASELINE,
    current,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function kentuckyDirectoryReady(): false {
  return false;
}
