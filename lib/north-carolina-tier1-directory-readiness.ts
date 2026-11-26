/**
 * North Carolina Tier 1 — directory publication readiness (development-only).
 *
 * Reuses DHSR Adult Care Home (HAL) / Family Care Home (FCL) source discovery
 * (2026-11-20) and the nationwide publication framework. 2026-11-26 re-fetch
 * confirmed identical workbook SHA-256 values. Does NOT publish North Carolina,
 * invent ISO export dates or coordinates, enable maps/owner/enhanced, write
 * Supabase, equate HAL/FCL to Washington AFH, or change Washington /
 * California / Design 2 / Oregon / authentication / billing.
 *
 * Intentionally free of sibling runtime imports.
 */

export const NORTH_CAROLINA_TIER1_DIRECTORY_READINESS_OBSERVED_ON = "2026-11-26" as const;
export const NORTH_CAROLINA_TIER1_DIRECTORY_READINESS_BASELINE = "252e838" as const;

export const NORTH_CAROLINA_TIER1_DIRECTORY_SOURCE = {
  agency: "NCDHHS Division of Health Service Regulation (DHSR), Adult Care Licensure Section" as const,
  listingsUrl: "https://info.ncdhhs.gov/dhsr/reports.htm" as const,
  facilityListingsUrl: "https://info.ncdhhs.gov/DHSR/acls/faclistings.html" as const,
  adultCareHomeWorkbookUrl: "https://info.ncdhhs.gov/dhsr/data/Ahlist.xlsx" as const,
  familyCareHomeWorkbookUrl: "https://info.ncdhhs.gov/dhsr/data/Fchlist.xlsx" as const,
  starSearchUrl: "https://info.ncdhhs.gov/dhsr/acls/star/search.asp" as const,
  staleFchTxtUrl: "https://info.ncdhhs.gov/dhsr/data/fch.txt" as const,
  listingsPageUpdatedLabel: "10/28/2026" as const,
  workbookAsOfLabel: "10/2026" as const,
  listingsPageUpdatedIsExportDate: false as const,
  workbookAsOfIsExportDate: false as const,
  recordedExportDateIso: null,
  disclosurePrefixVerified: false as const,
  identityField: "License #" as const,
} as const;

/** Workbook capture — SHA unchanged between 2026-11-20 investigation and 2026-11-26 re-fetch. */
export const NORTH_CAROLINA_TIER1_CAPTURE = {
  observedOn: "2026-11-20" as const,
  reconfirmedOn: "2026-11-26" as const,
  adult: {
    filename: "Ahlist.xlsx" as const,
    bytes: 125709 as const,
    sha256: "5671a352bea147a1b7b1607e7d73cb41b953f1af2aa459e83d25ab39dcca3d92" as const,
    lastModified: "Wed, 28 Oct 2026 17:10:30 GMT" as const,
    lastModifiedIsExportDate: false as const,
    licensedRows: 566 as const,
    blankTrailingRows: 1 as const,
    uniqueLicenseNumbers: 566 as const,
    licensePrefix: "HAL" as const,
    blankSiteAddress: 0 as const,
    siteStateNc: 566 as const,
    fiveDigitSiteZips: 566 as const,
    bedMin: 9 as const,
    bedMax: 201 as const,
    blankBeds: 0 as const,
    counties: 96 as const,
    perRowStatusColumn: false as const,
    coordinateColumns: false as const,
  },
  family: {
    filename: "Fchlist.xlsx" as const,
    bytes: 112487 as const,
    sha256: "c6d66684bf04ae0f98c00c644a9c2a1af7935e9a6e91e6eb494220bf6b8afc80" as const,
    lastModified: "Wed, 28 Oct 2026 17:10:29 GMT" as const,
    lastModifiedIsExportDate: false as const,
    licensedRows: 520 as const,
    blankTrailingRows: 1 as const,
    uniqueLicenseNumbers: 520 as const,
    licensePrefix: "FCL" as const,
    blankSiteAddress: 0 as const,
    siteStateNc: 520 as const,
    fiveDigitSiteZips: 520 as const,
    bedMin: 2 as const,
    bedMax: 6 as const,
    bedsOutside2to6: 0 as const,
    blankBeds: 0 as const,
    counties: 64 as const,
    perRowStatusColumn: false as const,
    coordinateColumns: false as const,
  },
  combined: {
    uniqueLicenses: 1086 as const,
    licenseOverlap: 0 as const,
    blankTrailingRows: 2 as const,
    siteAddresses: 1086 as const,
    fiveDigitSiteZips: 1086 as const,
    identicalMailing: 189 as const,
    distinctMailing: 897 as const,
    starNotAvailable: 27 as const,
    expiryBeforeObservation: 5 as const,
  },
  staleFchTxtRejected: true as const,
  publicationEligible: 0 as const,
} as const;

export const NORTH_CAROLINA_TIER1_CATEGORIES = [
  {
    id: "hal" as const,
    label: "Adult Care Home / Home for the Aged" as const,
    licensePrefix: "HAL" as const,
    workbook: "Ahlist.xlsx" as const,
    licensedRows: 566 as const,
    bedRange: "9–201" as const,
    washingtonAfhEquivalent: false as const,
  },
  {
    id: "fcl" as const,
    label: "Family Care Home" as const,
    licensePrefix: "FCL" as const,
    workbook: "Fchlist.xlsx" as const,
    licensedRows: 520 as const,
    bedRange: "2–6" as const,
    washingtonAfhEquivalent: false as const,
  },
] as const;

export const NORTH_CAROLINA_TIER1_DIRECTORY_INVENTORY = {
  adultCareHomesHal: 566 as const,
  familyCareHomesFcl: 520 as const,
  uniqueLicenses: 1086 as const,
  blankTrailingRows: 2 as const,
  siteAddressesComplete: 1086 as const,
  publicationEligible: 0 as const,
} as const;

export const NORTH_CAROLINA_TIER1_DIRECTORY_EXCLUSIONS = {
  blankTrailingWorkbookRows: 2 as const,
  staleFchTxtRejected: true as const,
  facilityMailingNotSubstitutedForSite: true as const,
  starRatingNotLicensingStatus: true as const,
  expiryDateNotLicensingStatus: true as const,
  specialCareUnitsWorkbookNotPrimaryRoster: true as const,
  washingtonAfhEquivalence: false as const,
  inventedCoordinates: false as const,
} as const;

export const NORTH_CAROLINA_TIER1_SURFACE_SEPARATION = {
  directorySurface: "unpublished-evidence-only" as const,
  directoryPath: null,
  mapPath: null,
  mapEnabled: false as const,
  mapBlocker: "no-coordinate-columns-in-hal-fcl-workbooks" as const,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  washingtonPreserved: true as const,
  californiaPreserved: true as const,
  oregonPreserved: true as const,
  design2Preserved: true as const,
} as const;

export const NORTH_CAROLINA_TIER1_DIRECTORY_CONTROLS = {
  investigationComplete: true as const,
  sourceDiscoveryReused: true as const,
  workbookShaReconfirmed: true as const,
  tier1DirectoryRequirementsMet: false as const,
  publicPublicationAuthorized: false as const,
  releaseCandidatePrepared: true as const,
  northCarolinaPublished: false as const,
  northCarolinaDirectoryReady: false as const,
  mapEnabled: false as const,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  supabaseWrites: false as const,
  stopGo: "STOP" as const,
  protectedPreviewPublication: "unpublished" as const,
} as const;

export const NORTH_CAROLINA_TIER1_DIRECTORY_CHECKLIST = [
  {
    id: "authoritative-dhsr-hal-fcl-workbooks",
    complete: true,
    surface: "directory" as const,
    detail:
      "DHSR Ahlist.xlsx (HAL Adult Care Homes, 566) and Fchlist.xlsx (FCL Family Care Homes, 520) are the authoritative open inventories. Stale fch.txt (2021) rejected. SHA unchanged on 2026-11-26 re-fetch.",
  },
  {
    id: "facility-identity-license-number",
    complete: true,
    surface: "directory" as const,
    detail:
      "1,086 unique License # values (HAL 566 + FCL 520); overlap 0; blank trailing rows 2 only.",
  },
  {
    id: "physical-site-address-and-capacity",
    complete: true,
    surface: "directory" as const,
    detail:
      "Site Address/City/State/Zip on all 1,086 licensed rows (NC, ZIP5). Facility Address is mailing/correspondence (may be out-of-state) and is not substituted. HAL beds 9–201; FCL beds 2–6. Capacity ≠ vacancy.",
  },
  {
    id: "freshness-iso-export-date",
    complete: false,
    surface: "directory" as const,
    detail:
      "Listings page Updated 10/28/2026, workbook As of 10/2026, and HTTP Last-Modified rejected. recordedExportDateIso=null.",
  },
  {
    id: "per-row-operating-status",
    complete: false,
    surface: "directory" as const,
    detail:
      "No per-row status column. Star Rating and Expiry Date are not Active/Closed licensing status (27 Star N/A; 5 expiry dates before observation).",
  },
  {
    id: "facility-specific-disclosure",
    complete: false,
    surface: "directory" as const,
    detail:
      "Star search has type/county/city/name only — no license field. Guessed License # detail URLs failed. No verified disclosure prefix.",
  },
  {
    id: "hal-fcl-category-taxonomy",
    complete: false,
    surface: "directory" as const,
    detail:
      "HAL and FCL must stay separate product categories and must not equal Washington AFH. Special Care Units remain a separate workbook.",
  },
  {
    id: "map-coordinates-separate",
    complete: false,
    surface: "map" as const,
    detail: "Neither workbook has coordinate columns. Do not invent geocodes. Map stays off.",
  },
  {
    id: "wa-ca-or-design2-owner-auth-billing-preserved",
    complete: true,
    surface: "safeguard" as const,
    detail:
      "This package does not change Washington, California, Oregon, Design 2, owner claims, authentication, or billing. North Carolina stays unpublished.",
  },
] as const;

export const NORTH_CAROLINA_TIER1_DIRECTORY_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "listings-page-date-and-workbook-as-of-rejected",
  "no-per-row-licensing-status",
  "star-rating-and-expiry-are-not-licensing-status",
  "no-verified-license-disclosure-prefix",
  "hal-fcl-category-mapping-unapproved",
  "no-coordinate-columns",
  "state-authorization-unpublished",
] as const;

export type NorthCarolinaTier1DirectoryVerdict = {
  stopGo: "STOP";
  tier1DirectoryRequirementsMet: false;
  publicPublicationAuthorized: false;
  northCarolinaPublished: false;
  inventoryUniqueLicenses: typeof NORTH_CAROLINA_TIER1_DIRECTORY_INVENTORY.uniqueLicenses;
  publicationEligible: 0;
  mapEnabled: false;
  blockers: typeof NORTH_CAROLINA_TIER1_DIRECTORY_BLOCKERS;
  nextHumanActions: readonly string[];
};

export function northCarolinaTier1DirectoryVerdict(): NorthCarolinaTier1DirectoryVerdict {
  return {
    stopGo: "STOP",
    tier1DirectoryRequirementsMet: false,
    publicPublicationAuthorized: false,
    northCarolinaPublished: false,
    inventoryUniqueLicenses: NORTH_CAROLINA_TIER1_DIRECTORY_INVENTORY.uniqueLicenses,
    publicationEligible: 0,
    mapEnabled: false,
    blockers: NORTH_CAROLINA_TIER1_DIRECTORY_BLOCKERS,
    nextHumanActions: [
      "Obtain an authoritative NCDHHS DHSR ISO export/version stamp for Ahlist.xlsx and Fchlist.xlsx (do not adopt 10/28/2026 or As of 10/2026).",
      "Confirm whether a stable License # → facility disclosure URL exists outside star-rating search, or accept search-only under explicit policy.",
      "Define per-row operating-status rules that do not treat Star Rating or Expiry Date as Active/Closed.",
      "Approve HAL vs FCL product taxonomy without equating either to Washington AFH.",
      "Keep map work separate — never invent geocodes.",
      "Separate human authorization before any North Carolina public or development directory flip.",
    ],
  };
}

export function northCarolinaTier1DirectoryChecklistComplete(): boolean {
  return NORTH_CAROLINA_TIER1_DIRECTORY_CHECKLIST.every((item) => item.complete);
}

export function northCarolinaTier1DirectoryReadyForPublic(): false {
  return false;
}

export function northCarolinaTier1MapReady(): false {
  return false;
}
