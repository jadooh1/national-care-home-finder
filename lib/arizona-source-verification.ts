/**
 * Arizona care-home source discovery (development-only).
 * Intentionally free of sibling runtime imports.
 *
 * Arizona Assisted Living Homes (≤10 residents) and Assisted Living Centers
 * (≥11 residents) under ARS §36-401 are NOT assumed equivalent to Washington
 * adult family homes. Keep home and center categories separate.
 */

export const ARIZONA_SOURCE_VERIFICATION_OBSERVED_ON = "2026-11-20";

export const ARIZONA_AL_HOME_FEATURE_SERVER =
  "https://services1.arcgis.com/mpVYz37anSdrK4d8/ArcGIS/rest/services/Assisted_Living_Home_Feb_2025/FeatureServer/18";
export const ARIZONA_AL_CENTER_FEATURE_SERVER =
  "https://services1.arcgis.com/mpVYz37anSdrK4d8/ArcGIS/rest/services/Assisted_Living_Center_Feb_2025/FeatureServer/18";
export const ARIZONA_AZLICENSED_RESIDENTIAL_LAYER =
  "https://services1.arcgis.com/mpVYz37anSdrK4d8/ArcGIS/rest/services/AZLicensedFacilities/FeatureServer/12";
export const ARIZONA_RESIDENTIAL_LICENSING_PAGE =
  "https://www.azdhs.gov/licensing/residential-facilities/index.php";
export const ARIZONA_AZCARECHECK_URL = "https://azcarecheck.azdhs.gov/s/";
export const ARIZONA_LEGACY_SEARCH_URL =
  "https://hsapps.azdhs.gov/ls/sod/SearchProv.aspx?type=AL";
export const ARIZONA_HUB_HOME_ABOUT =
  "https://geodata-adhsgis.hub.arcgis.com/datasets/ADHSGIS::assisted-living-home-feb-2025/about";
export const ARIZONA_HUB_CENTER_ABOUT =
  "https://geodata-adhsgis.hub.arcgis.com/datasets/ADHSGIS::assisted-living-center-feb-2025/about";

/** Prior next-state note (provider search + mixed map; no licensing file). */
export const ARIZONA_PRIOR_SEARCH_MAP_BASELINE = {
  source: "Arizona provider search and mixed facility map layer",
  licensingFileAdopted: false,
  selected: false,
  recordedExportDate: null,
} as const;

/** ARS §36-401 definitions observed on azleg.gov this run. */
export const ARIZONA_ARS_36_401 = {
  assistedLivingHome:
    "an assisted living facility that provides resident rooms to ten or fewer residents",
  assistedLivingCenter:
    "an assisted living facility that provides resident rooms or residential units to eleven or more residents",
  assistedLivingFacilityIncludesAdultFosterCare: true,
  categoryEquivalenceToWashingtonAfh: false,
} as const;

export const ARIZONA_CURRENT_CAPTURE = {
  observedOn: ARIZONA_SOURCE_VERIFICATION_OBSERVED_ON,
  definitions: ARIZONA_ARS_36_401,
  gis: {
    homeSourceUrl: ARIZONA_AL_HOME_FEATURE_SERVER,
    centerSourceUrl: ARIZONA_AL_CENTER_FEATURE_SERVER,
    residentialLayerUrl: ARIZONA_AZLICENSED_RESIDENTIAL_LAYER,
    serviceNameStamp: "Feb_2025",
    dataLastEditDateIsoUtc: "2025-02-24T23:33:40.148Z",
    dataLastEditRejectedAsExportDate: true,
    runDateIsoUtc: "2025-02-03",
    runDateRejectedAsExportDate: true,
    recordedExportDate: null,
    sourceSystem: "ASPEN",
    reuse:
      "ADHS Hub licenseInfo: as-is / as-available; no warranty of accuracy/completeness; no liability for use.",
    coordinatesGeocoded: true,
    coordinateLocatorObserved: "CENTRUS-TOMTOM (majority)",
    coordinatesAreLicensingCoordinates: false,
  },
  assistedLivingHome: {
    rows: 1719,
    uniqueFacids: 1719,
    uniqueLicenseNumbers: 1719,
    blankFacid: 0,
    blankLicense: 0,
    blankAddress: 0,
    blankCity: 0,
    blankZip: 0,
    addressLetterDigit: 1719,
    blankCapacityInt: 0,
    zeroCapacity: 3,
    capacityMin: 0,
    capacityMax: 10,
    capacityGt10: 0,
    blankNLatLon: 0,
    operationStatus: { ACTIVE: 1719 },
    subtype: {
      "ASSISTED LIVING HOME-DIRECTED": 1702,
      "ASSISTED LIVING HOME-PERSONAL": 16,
      "ASSISTED LIVING HOME-SUPERVISORY": 1,
    },
    facidSha256:
      "d05fec63b90490379de5fd3c4ecea33752c263d8a39dc014ad41e397a1095047",
    licenseEffectiveBlank: true,
    licenseExpirationBlank: true,
  },
  assistedLivingCenter: {
    rows: 328,
    uniqueFacids: 328,
    uniqueLicenseNumbers: 328,
    blankFacid: 0,
    blankLicense: 0,
    blankAddress: 0,
    blankCity: 0,
    blankZip: 0,
    addressLetterDigit: 328,
    blankCapacityInt: 0,
    zeroCapacity: 0,
    capacityMin: 13,
    capacityMax: 259,
    capacityLe10: 0,
    blankNLatLon: 0,
    operationStatus: { ACTIVE: 328 },
    subtype: {
      "ASSISTED LIVING CENTER-DIRECTED": 293,
      "ASSISTED LIVING CENTER-PERSONAL": 34,
      "ASSISTED LIVING CENTER-SUPERVISORY": 1,
    },
    facidSha256:
      "9b25024fcc51a01423385adc6e8e56401459deb0f5ad6f6fd8f8ab46a9729354",
    licenseEffectiveBlank: true,
    licenseExpirationBlank: true,
  },
  combinedHomeCenterRows: 2047,
  facidOverlapHomeCenter: 0,
  relatedResidentialNotedNotAdopted: {
    adultFosterCare: 25,
    adultBehavioralHealthTherapeuticHome: 76,
    behavioralHealthResidentialFacility: 830,
    note:
      "ARS §36-401 places adult foster care under assisted living facility, but TYPE Adult Foster Care was not adopted into the home/center onboarding set this run.",
  },
  categoryEquivalenceToWashingtonAfh: false,
  publicationEligibleRows: 0,
} as const;

export function evaluateArizonaSourceVerification(
  current = ARIZONA_CURRENT_CAPTURE,
) {
  const home = current.assistedLivingHome;
  const center = current.assistedLivingCenter;
  const integrityOk =
    home.rows === 1719
    && home.uniqueFacids === 1719
    && home.capacityMax === 10
    && home.capacityGt10 === 0
    && home.zeroCapacity === 3
    && center.rows === 328
    && center.uniqueFacids === 328
    && center.capacityMin === 13
    && center.capacityLe10 === 0
    && current.combinedHomeCenterRows === 2047
    && current.facidOverlapHomeCenter === 0
    && current.gis.recordedExportDate === null
    && current.gis.runDateRejectedAsExportDate === true
    && current.gis.coordinatesAreLicensingCoordinates === false
    && current.publicationEligibleRows === 0
    && current.categoryEquivalenceToWashingtonAfh === false
    && current.definitions.categoryEquivalenceToWashingtonAfh === false;
  return {
    observedOn: ARIZONA_SOURCE_VERIFICATION_OBSERVED_ON,
    prior: ARIZONA_PRIOR_SEARCH_MAP_BASELINE,
    current,
    integrityOk,
    allowsPublication: false as const,
    gate: "blocked" as const,
  };
}

export function arizonaDirectoryReady(): false {
  return false;
}
