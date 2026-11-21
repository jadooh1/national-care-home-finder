/**
 * Alabama assisted living facility source discovery verification
 * (development-only). Intentionally free of sibling runtime imports.
 *
 * Assisted Living Facilities (ALF, AAC 420-5-4) and Specialty Care Assisted
 * Living Facilities (SCALF, AAC 420-5-20) are NOT assumed equivalent to each
 * other, nursing facilities, or Washington adult family homes.
 */

export const ALABAMA_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const ALABAMA_DIRECTORY_LANDING_URL =
  "https://www.alabamapublichealth.gov/providerstandards/directory.html";
export const ALABAMA_FACILITIES_DIRECTORY_URL =
  "https://dph1.adph.state.al.us/FacilitiesDirectory/";

/** Prior nationwide note: Class C; search directory; license id not observed. */
export const ALABAMA_PRIOR_BASELINE = {
  compatibilityClass: "C",
  licensingFileOpened: false,
  recordedExportDate: null,
  observedRows: null,
} as const;

export const ALABAMA_TYPE_DEFINITIONS = {
  authority: "Alabama Department of Public Health / Bureau of Health Provider Standards",
  assistedLivingFacility:
    "FacilitiesDirectory type code D / Facility Type “Assisted Living Facility” (AAC Chapter 420-5-4).",
  specialtyCareAssistedLivingFacility:
    "FacilitiesDirectory type code P / Facility Type “Assisted Living Facility (Specialty Care)” (AAC Chapter 420-5-20).",
  nursingHome: "Separate type code N export; not merged into ALF/SCALF.",
  categoryEquivalenceToWashingtonAfh: false,
} as const;

export const ALABAMA_CURRENT_CAPTURE = {
  observedOn: ALABAMA_SOURCE_VERIFICATION_OBSERVED_ON,
  facilitiesDirectory: {
    landingPageUrl: ALABAMA_DIRECTORY_LANDING_URL,
    directoryUrl: ALABAMA_FACILITIES_DIRECTORY_URL,
    captureMethod: "facilities-directory-session-excel-export-type-D-and-P",
    pageLastUpdated: "June 23, 2026",
    pageLastUpdatedRejectedAsIsoExport: true,
    exportFilenameContainsGenerationTimestamp: true,
    exportFilenameExample:
      "ReportDirectoryExcelExport-2026-11-20-1808264151632.xls",
    recordedExportDate: null,
    alf: {
      typeCode: "D",
      rows: 188,
      uniqueFacId: 188,
      facilityType: "Assisted Living Facility",
      licenseStatusCounts: { Regular: 188 },
      licensedBedsMin: 8,
      licensedBedsMax: 160,
      class1Counts: {
        "Congregate Assisted Living Facility": 120,
        "Group Assisted Living Facility": 67,
        "Family Assisted Living Facility": 1,
      },
      sha256:
        "f065fa23ccacee0997b78a011b82c74dd08e801f185f298348239b9fad02f71e",
    },
    scalf: {
      typeCode: "P",
      rows: 106,
      uniqueFacId: 106,
      facilityType: "Assisted Living Facility (Specialty Care)",
      licenseStatusCounts: { Regular: 105, Probational: 1 },
      licensedBedsMin: 12,
      licensedBedsMax: 104,
      sha256:
        "6ab5b85fcb5895c54b6a614a95a0f4996388e4718426cccd6e25564d97842ec3",
    },
    combinedRows: 294,
    uniqueFacIdCombined: 294,
    facIdOverlapAlfScalf: 0,
    dupFacIdGroups: 0,
    blankFacId: 0,
    blankStreet: 0,
    blankCity: 0,
    blankZip: 0,
    blankName: 0,
    bedsNull: 0,
    bedsZero: 0,
    coordinateColumns: false,
    sharedCampusAddressesAlfScalf: 45,
  },
  peerTypes: {
    nursingHomeRows: 232,
    adoptedAsAlfOrScalfRoster: false,
  },
  disclosure: {
    facIdDetailPrefixVerified: false,
  },
  definitions: ALABAMA_TYPE_DEFINITIONS,
  prior: ALABAMA_PRIOR_BASELINE,
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateAlabamaSourceVerification(
  current = ALABAMA_CURRENT_CAPTURE,
) {
  const d = current.facilitiesDirectory;
  const integrityOk =
    d.alf.rows === 188
    && d.scalf.rows === 106
    && d.combinedRows === 294
    && d.uniqueFacIdCombined === 294
    && d.facIdOverlapAlfScalf === 0
    && d.dupFacIdGroups === 0
    && d.blankFacId === 0
    && d.blankStreet === 0
    && d.bedsNull === 0
    && d.bedsZero === 0
    && d.alf.licenseStatusCounts.Regular === 188
    && d.scalf.licenseStatusCounts.Probational === 1
    && d.coordinateColumns === false
    && d.recordedExportDate === null
    && current.peerTypes.adoptedAsAlfOrScalfRoster === false
    && current.disclosure.facIdDetailPrefixVerified === false
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: ALABAMA_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: ALABAMA_PRIOR_BASELINE,
    current,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function alabamaDirectoryReady(): false {
  return false;
}
