/**
 * South Carolina Community Residential Care Facility source discovery
 * verification (development-only). Intentionally free of sibling runtime imports.
 *
 * CRCFs licensed by the South Carolina Department of Public Health are NOT
 * assumed equivalent to nursing homes, intermediate care facilities, or
 * Washington adult family homes.
 */

export const SOUTH_CAROLINA_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const SOUTH_CAROLINA_FIND_FACILITY_URL =
  "https://dph.sc.gov/professionals/healthcare-quality/find-facility";
export const SOUTH_CAROLINA_CRCF_PROGRAM_URL =
  "https://dph.sc.gov/professionals/healthcare-quality/licensed-facilities-professionals/community-residential-care";
export const SOUTH_CAROLINA_DATAVIZ_URL =
  "https://dataviz.dph.sc.gov/Health_Facility/";
export const SOUTH_CAROLINA_EXPERIENCE_URL =
  "https://experience.arcgis.com/experience/fd09063e5e034b329f97c43ea8e8c4c2";
export const SOUTH_CAROLINA_HEALTH_FACILITIES_FEATURE_SERVER =
  "https://services5.arcgis.com/G4BLIH7rTQoIjCFv/arcgis/rest/services/Health_Facilities/FeatureServer/0";

/** Prior nationwide note: Class D; official fields not verified. */
export const SOUTH_CAROLINA_PRIOR_BASELINE = {
  compatibilityClass: "D",
  licensingFileOpened: false,
  recordedExportDate: null,
  observedRows: null,
} as const;

export const SOUTH_CAROLINA_TYPE_DEFINITIONS = {
  authority: "South Carolina Department of Public Health (Healthcare Quality)",
  communityResidentialCareFacility:
    "PERMIT_TYPE HLRESIDENTIALCARE / PERMIT_TYPE_DETAIL_DESC “HL- Community Residential Care Facility” on the DPH Health Facilities FeatureServer (Find a Facility CRCF tab).",
  nursingHome:
    "Separate PERMIT_TYPE HLNURSINGCARE on the same FeatureServer; not merged into CRCF.",
  intermediateCareFacility:
    "Separate PERMIT_TYPE HLHABITATIONR15 and HLHABITATIONR16; not merged into CRCF.",
  categoryEquivalenceToWashingtonAfh: false,
} as const;

export const SOUTH_CAROLINA_CURRENT_CAPTURE = {
  observedOn: SOUTH_CAROLINA_SOURCE_VERIFICATION_OBSERVED_ON,
  crcfLayer: {
    sourceUrl: SOUTH_CAROLINA_HEALTH_FACILITIES_FEATURE_SERVER,
    findFacilityUrl: SOUTH_CAROLINA_FIND_FACILITY_URL,
    datavizUrl: SOUTH_CAROLINA_DATAVIZ_URL,
    experienceUrl: SOUTH_CAROLINA_EXPERIENCE_URL,
    webMapItemId: "459e8d88d249464b834b15bdc6e56d52",
    definitionExpression: "PERMIT_TYPE = 'HLRESIDENTIALCARE'",
    permitTypeDetailDesc: "HL- Community Residential Care Facility",
    captureMethod: "arcgis-featureserver-query-PERMIT_TYPE-HLRESIDENTIALCARE",
    captureSha256:
      "1d4fab029fd20951ee642fc53f16a471f2f6cdc26de357634bce9e5364a67c75",
    rows: 427,
    uniqueLicenseNbr: 427,
    uniquePermitEid: 427,
    dupLicenseGroups: 0,
    permitOperatingCodeCounts: { ACT: 427 },
    blankStreet: 0,
    blankCity: 0,
    blankZip: 0,
    blankName: 0,
    nbrLicensedMin: 5,
    nbrLicensedMax: 193,
    nbrLicensedNull: 0,
    nbrLicensedZero: 0,
    crcNbrTotalBedsPresent: 155,
    crcNbrTotalBedsNull: 272,
    crcEqualsNbrWhenPresent: 101,
    crcConflictsWithNbr: 54,
    geometryPresent4326: 427,
    xyAttrWgs84Like: 410,
    xyAttrNonWgs84: 17,
    coordinateColumns: true,
    coordinatesAcceptedAsLicensingCoordinates: false,
    alzCareY: 171,
    alzUnitY: 139,
    dataLastEditDate: "2026-11-20T12:04:49.340Z",
    httpLastModified: "Fri, 20 Nov 2026 12:04:58 GMT",
    reportLabelIsIsoExportDate: false,
    recordedExportDate: null,
  },
  peerTypes: {
    nursingHomeCount: 192,
    icf15Count: 56,
    icf16PlusCount: 8,
    adoptedAsCrcfRoster: false,
  },
  disclosure: {
    findFacilitySearchOnly: true,
    experienceAppShellOnly: true,
    licenseNbrDetailPrefixVerified: false,
  },
  definitions: SOUTH_CAROLINA_TYPE_DEFINITIONS,
  prior: SOUTH_CAROLINA_PRIOR_BASELINE,
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateSouthCarolinaSourceVerification(
  current = SOUTH_CAROLINA_CURRENT_CAPTURE,
) {
  const c = current.crcfLayer;
  const integrityOk =
    c.rows === 427
    && c.uniqueLicenseNbr === 427
    && c.uniquePermitEid === 427
    && c.dupLicenseGroups === 0
    && c.blankStreet === 0
    && c.blankCity === 0
    && c.nbrLicensedNull === 0
    && c.nbrLicensedZero === 0
    && c.permitOperatingCodeCounts.ACT === 427
    && c.crcConflictsWithNbr === 54
    && c.geometryPresent4326 === 427
    && c.coordinatesAcceptedAsLicensingCoordinates === false
    && c.recordedExportDate === null
    && current.peerTypes.adoptedAsCrcfRoster === false
    && current.disclosure.licenseNbrDetailPrefixVerified === false
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: SOUTH_CAROLINA_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: SOUTH_CAROLINA_PRIOR_BASELINE,
    current,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function southCarolinaDirectoryReady(): false {
  return false;
}
