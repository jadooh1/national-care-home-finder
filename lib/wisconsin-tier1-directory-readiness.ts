/**
 * Wisconsin Tier 1 — directory publication readiness (development-only).
 *
 * Reuses completed AFH source verification / Excel↔GIS reconciliation
 * (2026-11-20) and the nationwide publication framework. Adds 2026-11-26
 * CBRF and RCAC directory captures. Distinguishes licensed AFH/CBRF from
 * certified/registered RCAC. Does NOT publish Wisconsin, invent ISO export
 * dates or coordinates, enable maps/owner/enhanced, write Supabase, or change
 * Washington / California / Design 2 / Oregon / authentication / billing.
 *
 * Intentionally free of sibling runtime imports.
 */

export const WISCONSIN_TIER1_DIRECTORY_READINESS_OBSERVED_ON = "2026-11-26" as const;
export const WISCONSIN_TIER1_DIRECTORY_READINESS_BASELINE = "2283460" as const;

export const WISCONSIN_TIER1_DIRECTORY_SOURCE = {
  agency: "Wisconsin Department of Health Services (DHS), Division of Quality Assurance (DQA)" as const,
  providerSearchUrl:
    "https://www.forwardhealth.wi.gov/WIPortal/subsystem/public/DQAProviderSearch.aspx" as const,
  gisMapServer: "https://dhsgis.wi.gov/server/rest/services/DHS_GIS/Facilities/MapServer" as const,
  /** Authoritative ISO export/version stamp — still unavailable. */
  recordedExportDateIso: null,
  disclosurePrefixVerified: false as const,
  providerSearchIsSearchOnly: true as const,
  identityField: "Facility ID" as const,
} as const;

/**
 * Category taxonomy — licensing vs certification vs registration.
 * AFH and CBRF are licensed. RCAC is certified or registered (not licensed).
 */
export const WISCONSIN_TIER1_CATEGORIES = [
  {
    id: "afh" as const,
    label: "Adult Family Home" as const,
    regulatoryPathway: "licensed" as const,
    regulation: "Wis. Admin. Code ch. DHS 88 (DQA 3–4 bed); 1–2 bed county-regulated outside state directory" as const,
    guideUrl: "https://www.dhs.wisconsin.gov/guide/afh.htm" as const,
    excelUrl: "https://www.dhs.wisconsin.gov/guide/afhdirexcel.xlsx" as const,
    pdfUrl: "https://www.dhs.wisconsin.gov/guide/afhdir.pdf" as const,
    gisLayerId: 2 as const,
    gisLayerName: "Adult Family Home" as const,
  },
  {
    id: "cbrf" as const,
    label: "Community-Based Residential Facility" as const,
    regulatoryPathway: "licensed" as const,
    regulation: "Wis. Admin. Code ch. DHS 83" as const,
    guideUrl: "https://www.dhs.wisconsin.gov/guide/cbrf.htm" as const,
    excelUrl: "https://www.dhs.wisconsin.gov/guide/cbrfdirexcel.xlsx" as const,
    pdfUrl: "https://www.dhs.wisconsin.gov/guide/cbrfdir.pdf" as const,
    gisLayerId: 7 as const,
    gisLayerName: "Community-Based Residential Facility" as const,
  },
  {
    id: "rcac" as const,
    label: "Residential Care Apartment Complex" as const,
    regulatoryPathway: "certified-or-registered" as const,
    regulation: "Wis. Admin. Code ch. DHS 89 (certified accepts Medicaid; registered private-pay only)" as const,
    guideUrl: "https://www.dhs.wisconsin.gov/guide/rcac.htm" as const,
    excelUrl: "https://www.dhs.wisconsin.gov/guide/rcacdirexcel.xlsx" as const,
    pdfUrl: "https://www.dhs.wisconsin.gov/guide/rcacdir.pdf" as const,
    gisLayerId: 17 as const,
    gisLayerName: "Residential Care Apartment Complex" as const,
  },
] as const;

/** AFH capture reused from 2026-11-20 investigation (Excel SHA unchanged on 2026-11-26 re-fetch). */
export const WISCONSIN_TIER1_AFH_CAPTURE = {
  observedOn: "2026-11-20" as const,
  reconfirmedOn: "2026-11-26" as const,
  excelRows: 2479 as const,
  uniqueFacilityIds: 2479 as const,
  excelSha256: "bbefc34f6233576c745b8aa622a517e91c8448b0def2678e9a7e10ae55ca6962" as const,
  excelLastModified: "Mon, 20 Jul 2026 13:40:37 GMT" as const,
  blankStreet: 0 as const,
  blankCapacity: 0 as const,
  capacityMin: 3 as const,
  capacityMax: 4 as const,
  capacity3: 437 as const,
  capacity4: 2042 as const,
  classCounts: { AMBULATORY: 1205, AFH: 679, NONAMBULATORY: 595 } as const,
  classIsAmbulatorySubclassNotLicenseStatus: true as const,
  perRowLicensingStatusColumn: false as const,
  pdfDirectoryUpdatedStamp: "11/04/2026" as const,
  pdfStampIsExportDate: false as const,
  gisFeatures: 2203 as const,
  gisBlankLicense: 9 as const,
  gisDuplicateLicenseKeys: 2 as const,
  matchedUnique: 1914 as const,
  matchedAmbiguous: 2 as const,
  excelOnly: 563 as const,
  gisOnlyWithLicense: 276 as const,
  countyRegulatedOneTwoBedOutsideStateDirectory: true as const,
  publicationEligible: 0 as const,
} as const;

/** CBRF capture observed 2026-11-26 (new category evidence). */
export const WISCONSIN_TIER1_CBRF_CAPTURE = {
  observedOn: "2026-11-26" as const,
  excelRows: 1534 as const,
  uniqueFacilityIds: 1534 as const,
  excelBytes: 457260 as const,
  excelSha256: "4f8997be9c5d3d26c232e77600b0aab3465399a6c13a738aff3cf130dd7acf6c" as const,
  excelLastModified: "Mon, 20 Jul 2026 13:40:35 GMT" as const,
  blankStreet: 0 as const,
  blankCity: 0 as const,
  blankZip5: 0 as const,
  blankCapacity: 0 as const,
  capacityMin: 5 as const,
  capacityMax: 151 as const,
  classCounts: {
    "CLASS CNA (NONAMBULATORY)": 1186,
    "CLASS AA (AMBULATORY)": 190,
    "CLASS AS (SEMIAMBULATORY)": 48,
    "CLASS CS (SEMIAMBULATORY)": 69,
    "CLASS ANA (NONAMBULATORY)": 22,
    "CLASS CA (AMBULATORY)": 19,
  } as const,
  classIsAmbulatorySubclassNotLicenseStatus: true as const,
  perRowLicensingStatusColumn: false as const,
  pdfDirectoryUpdatedStamp: "11/04/2026" as const,
  pdfStampIsExportDate: false as const,
  pdfLastModified: "Thu, 05 Nov 2026 00:00:43 GMT" as const,
  gisFeatures: 1555 as const,
  gisBlankLicense: 1 as const,
  gisDuplicateLicenseKeys: 2 as const,
  matched: 1340 as const,
  excelOnly: 194 as const,
  gisOnly: 212 as const,
  publicationEligible: 0 as const,
} as const;

/** RCAC capture observed 2026-11-26 — Class is CERTIFIED vs REGISTERED. */
export const WISCONSIN_TIER1_RCAC_CAPTURE = {
  observedOn: "2026-11-26" as const,
  excelRows: 360 as const,
  uniqueFacilityIds: 360 as const,
  excelBytes: 99863 as const,
  excelSha256: "e8671e591d8e38a4bb0c864315edee4fdb317fce93356e41a5b80548cc377060" as const,
  excelLastModified: "Mon, 20 Jul 2026 13:40:34 GMT" as const,
  blankStreet: 0 as const,
  blankCity: 0 as const,
  blankZip5: 0 as const,
  blankCapacity: 0 as const,
  capacityMin: 5 as const,
  capacityMax: 415 as const,
  certified: 265 as const,
  registered: 95 as const,
  classCounts: { CERTIFIED: 265, REGISTERED: 95 } as const,
  classIsCertifiedOrRegisteredPathway: true as const,
  perRowLicensingStatusColumn: false as const,
  pdfDirectoryUpdatedStamp: "11/04/2026" as const,
  pdfUpdatedQuarterlyNotice: true as const,
  pdfStampIsExportDate: false as const,
  quarterlyNoticeIsExportDate: false as const,
  pdfLastModified: "Thu, 05 Nov 2026 00:00:39 GMT" as const,
  gisFeatures: 367 as const,
  gisBlankLicense: 3 as const,
  gisDuplicateLicenseKeys: 0 as const,
  matched: 310 as const,
  excelOnly: 50 as const,
  gisOnly: 54 as const,
  publicationEligible: 0 as const,
} as const;

export const WISCONSIN_TIER1_DIRECTORY_INVENTORY = {
  afhExcelRows: WISCONSIN_TIER1_AFH_CAPTURE.excelRows,
  cbrfExcelRows: WISCONSIN_TIER1_CBRF_CAPTURE.excelRows,
  rcacExcelRows: WISCONSIN_TIER1_RCAC_CAPTURE.excelRows,
  totalExcelRows: 4373 as const, // 2479 + 1534 + 360
  licensedAfhAndCbrf: 4013 as const, // 2479 + 1534
  rcacCertified: 265 as const,
  rcacRegistered: 95 as const,
  publicationEligible: 0 as const,
  gisNotAcceptedAsDirectory: true as const,
} as const;

export const WISCONSIN_TIER1_DIRECTORY_EXCLUSIONS = {
  countyRegulatedOneTwoBedAfhOutsideStateDirectory: true as const,
  mailingStreetNotSubstitutedForFacilityStreet: true as const,
  gisOnlyResidualsIneligibleUntilReconciled: true as const,
  excelOnlyResidualsIneligibleWithoutGisPolicy: true as const,
  gisBlankAndDuplicateLicenseKeysUnresolved: true as const,
  rcacRegisteredDistinctFromCertified: true as const,
  washingtonAfhEquivalence: false as const,
  inventedCoordinates: false as const,
} as const;

export const WISCONSIN_TIER1_SURFACE_SEPARATION = {
  directorySurface: "unpublished-evidence-only" as const,
  directoryPath: null,
  mapPath: null,
  mapEnabled: false as const,
  mapBlocker: "gis-is-not-the-accepted-directory-and-coords-are-not-licensing-provenance" as const,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  washingtonPreserved: true as const,
  californiaPreserved: true as const,
  oregonPreserved: true as const,
  design2Preserved: true as const,
} as const;

export const WISCONSIN_TIER1_DIRECTORY_CONTROLS = {
  investigationComplete: true as const,
  afhResearchReused: true as const,
  cbrfRcacCaptureComplete: true as const,
  tier1DirectoryRequirementsMet: false as const,
  publicPublicationAuthorized: false as const,
  releaseCandidatePrepared: true as const,
  wisconsinPublished: false as const,
  wisconsinDirectoryReady: false as const,
  mapEnabled: false as const,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  supabaseWrites: false as const,
  stopGo: "STOP" as const,
  protectedPreviewPublication: "unpublished" as const,
} as const;

export const WISCONSIN_TIER1_DIRECTORY_CHECKLIST = [
  {
    id: "official-dhs-sources-afh-cbrf-rcac",
    complete: true,
    surface: "directory" as const,
    detail:
      "DHS guide pages publish Excel+PDF directories for AFH, CBRF, and RCAC. Provider Search is search/export only. GIS MapServer layers 2/7/17 exist but are not the accepted directory.",
  },
  {
    id: "licensed-certified-registered-taxonomy",
    complete: true,
    surface: "directory" as const,
    detail:
      "AFH and CBRF are licensed. RCAC Class is CERTIFIED (265) or REGISTERED (95) under DHS 89 — not a license. Product taxonomy must not equate any WI category to Washington AFH.",
  },
  {
    id: "facility-identity-facility-id",
    complete: true,
    surface: "directory" as const,
    detail:
      "Excel Facility ID unique on AFH 2,479 / CBRF 1,534 / RCAC 360. GIS WI_LICENSE_NUM reconciliation still incomplete (residuals + blanks/dups).",
  },
  {
    id: "street-address-and-capacity",
    complete: true,
    surface: "directory" as const,
    detail:
      "Facility Street labeled separately from Mailing Street; 0 blank Street/Capacity on all three Excel directories. Capacity ≠ vacancy. AFH capacity 3–4; CBRF 5–151; RCAC apartments 5–415.",
  },
  {
    id: "freshness-iso-export-date",
    complete: false,
    surface: "directory" as const,
    detail:
      "PDF footer 11/04/2026, RCAC 'updated quarterly' notice, and HTTP Last-Modified are rejected. recordedExportDateIso=null.",
  },
  {
    id: "per-row-operating-status",
    complete: false,
    surface: "directory" as const,
    detail:
      "No Status column. AFH/CBRF Class values are ambulatory subclasses; RCAC Class is certified/registered pathway — none are open/closed operating status.",
  },
  {
    id: "excel-gis-identifier-reconciliation",
    complete: false,
    surface: "directory" as const,
    detail:
      "AFH: 1,914 unique matches / 563 Excel-only / 276 GIS-only / 9 blank / 2 ambiguous (prior). CBRF: 1,340 matched / 194 Excel-only / 212 GIS-only / 1 blank / 2 dups. RCAC: 310 matched / 50 Excel-only / 54 GIS-only / 3 blank. GIS is not accepted as directory.",
  },
  {
    id: "facility-specific-disclosure",
    complete: false,
    surface: "directory" as const,
    detail:
      "Prior AFH disclosure probe: guessed DqaProviderDetails.aspx?fac_num= returned Unexpected Error. Provider Search has no verified Facility-ID→detail URL prefix for AFH/CBRF/RCAC.",
  },
  {
    id: "map-coordinates-separate",
    complete: false,
    surface: "map" as const,
    detail:
      "GIS LAT/LON are georeferenced layer attributes without licensing provenance or editingInfo. Map stays off; do not invent geocodes.",
  },
  {
    id: "wa-ca-or-design2-owner-auth-billing-preserved",
    complete: true,
    surface: "safeguard" as const,
    detail:
      "This package does not change Washington, California, Oregon, Design 2, owner claims, authentication, or billing. Wisconsin stays unpublished.",
  },
] as const;

export const WISCONSIN_TIER1_DIRECTORY_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "excel-gis-identifier-reconciliation-incomplete",
  "gis-layer-is-not-the-accepted-directory",
  "no-per-row-licensing-status-column",
  "no-verified-facility-disclosure-url-prefix",
  "pdf-directory-updated-and-http-last-modified-are-not-export-dates",
  "rcac-certified-vs-registered-taxonomy-requires-product-policy",
  "state-authorization-unpublished",
] as const;

export type WisconsinTier1DirectoryVerdict = {
  stopGo: "STOP";
  tier1DirectoryRequirementsMet: false;
  publicPublicationAuthorized: false;
  wisconsinPublished: false;
  inventoryExcelRows: typeof WISCONSIN_TIER1_DIRECTORY_INVENTORY.totalExcelRows;
  publicationEligible: 0;
  mapEnabled: false;
  blockers: typeof WISCONSIN_TIER1_DIRECTORY_BLOCKERS;
  nextHumanActions: readonly string[];
};

export function wisconsinTier1DirectoryVerdict(): WisconsinTier1DirectoryVerdict {
  return {
    stopGo: "STOP",
    tier1DirectoryRequirementsMet: false,
    publicPublicationAuthorized: false,
    wisconsinPublished: false,
    inventoryExcelRows: WISCONSIN_TIER1_DIRECTORY_INVENTORY.totalExcelRows,
    publicationEligible: 0,
    mapEnabled: false,
    blockers: WISCONSIN_TIER1_DIRECTORY_BLOCKERS,
    nextHumanActions: [
      "Obtain an authoritative DHS ISO export/version stamp for AFH/CBRF/RCAC directories (do not adopt 11/04/2026 or quarterly notices).",
      "Close Excel↔GIS Facility ID residuals or adopt an Excel-only directory policy that explicitly excludes GIS-only rows.",
      "Define per-row operating-status rules independent of Class (ambulatory / CERTIFIED / REGISTERED).",
      "Verify a Facility-ID→Provider Search detail URL prefix, or accept search-only disclosure under explicit policy.",
      "Approve product taxonomy for licensed AFH/CBRF vs certified/registered RCAC without equating to Washington AFH.",
      "Keep map work separate — GIS coordinates are not licensing provenance.",
      "Separate human authorization before any Wisconsin public or development directory flip.",
    ],
  };
}

export function wisconsinTier1DirectoryChecklistComplete(): boolean {
  return WISCONSIN_TIER1_DIRECTORY_CHECKLIST.every((item) => item.complete);
}

export function wisconsinTier1DirectoryReadyForPublic(): false {
  return false;
}

export function wisconsinTier1MapReady(): false {
  return false;
}
