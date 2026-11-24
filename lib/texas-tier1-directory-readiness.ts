/**
 * Texas Tier 1 — directory publication readiness (development-only).
 *
 * Reuses completed HHSC ALF source discovery (2026-11-20 capture) and the
 * nationwide / California Tier 1 publication framework. Does NOT invent
 * coordinates or ISO export dates, publish Texas, enable maps/owner/enhanced,
 * or change Washington / California / Oregon / Design 2 / auth / billing.
 *
 * Intentionally free of sibling runtime imports.
 */

export const TEXAS_TIER1_DIRECTORY_READINESS_OBSERVED_ON = "2026-11-24" as const;
export const TEXAS_TIER1_DIRECTORY_READINESS_BASELINE = "7e6177e" as const;

/** Authoritative HHSC active assisted-living workbook. */
export const TEXAS_TIER1_DIRECTORY_SOURCE = {
  agency: "Texas Health and Human Services Commission (HHSC)" as const,
  workbookUrl: "https://apps.hhs.texas.gov/providers/directories/al.xlsx" as const,
  sheet: "ALF_Directory" as const,
  searchUrl: "https://tulip.hhs.texas.gov/TULIP/s/ltc-provider-search" as const,
  closuresUrl:
    "https://apps.hhs.texas.gov/providers/directories/Closures/alf_closures.pdf" as const,
  regulation: "26 TAC §553.5 (Types of Assisted Living Facilities)" as const,
  captureObservedOn: "2026-11-20" as const,
  activeAsOfLabel: "11/19/2026" as const,
  fileLastModified: "Fri, 20 Nov 2026 14:11:45 GMT" as const,
  workbookSha256:
    "7b83f02c3fa33baf90ab428159b6f562ef0180899afd489ba11de891d2dce476" as const,
  /** Authoritative ISO export/version stamp — not available from HHSC workbook. */
  recordedExportDateIso: null,
  disclosurePrefixVerified: false as const,
  identityFields: ["Facility ID", "License No"] as const,
} as const;

/**
 * Inventory counts from the verified active workbook (not publication-eligible).
 */
export const TEXAS_TIER1_DIRECTORY_INVENTORY = {
  activeRows: 2019 as const,
  uniqueFacilityIds: 2019 as const,
  uniqueLicenseNumbers: 2019 as const,
  facilityIdLeadingZerosPreserved: 533 as const,
  typeA: 335 as const,
  typeB: 1676 as const,
  typeC: 8 as const,
  blankPhysicalAddress: 0 as const,
  blankCapacity: 0 as const,
  zeroCapacity: 0 as const,
  capacityMin: 4 as const,
  capacityMax: 335 as const,
  geoPairs: 1937 as const,
  geoCommaOnly: 82 as const,
  closureFacilityIds: 1515 as const,
  closureActiveOverlap: 0 as const,
  /** Framework Tier 1 publication-eligible after blockers clear. */
  publicationEligible: 0 as const,
} as const;

export const TEXAS_TIER1_DIRECTORY_EXCLUSIONS = {
  /**
   * Type C is a legacy four-bed adult foster care license; HHSC no longer
   * issues new Type C licenses. Keep enumerated separately — not WA AFH.
   */
  typeCLegacyRows: 8 as const,
  /**
   * Comma-only Geo Location cells are not coordinates and must never be
   * geocoded for directory or map use.
   */
  geoCommaOnlyNotCoordinates: 82 as const,
  /**
   * Closures PDF IDs are historical; exact overlap with active workbook is 0,
   * so they do not define active operating status for Tier 1 listing.
   */
  closureHistoricalIds: 1515 as const,
  washingtonAfhEquivalence: false as const,
  inventedCoordinates: false as const,
} as const;

/**
 * Directory vs map separation.
 * Texas has no public or development directory route yet; map stays off.
 */
export const TEXAS_TIER1_SURFACE_SEPARATION = {
  directorySurface: "unpublished-evidence-only" as const,
  directoryPath: null,
  mapPath: null,
  mapEnabled: false as const,
  mapBlocker: "geo-location-source-undescribed-and-comma-only-cells" as const,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  washingtonPreserved: true as const,
  californiaPreserved: true as const,
  oregonPreserved: true as const,
} as const;

export const TEXAS_TIER1_DIRECTORY_CONTROLS = {
  investigationComplete: true as const,
  tier1DirectoryRequirementsMet: false as const,
  publicPublicationAuthorized: false as const,
  releaseCandidatePrepared: true as const,
  texasPublished: false as const,
  texasDirectoryReady: false as const,
  mapEnabled: false as const,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  stopGo: "STOP" as const,
  protectedPreviewPublication: "unpublished" as const,
} as const;

export const TEXAS_TIER1_DIRECTORY_CHECKLIST = [
  {
    id: "authoritative-hhsc-alf-workbook",
    complete: true,
    surface: "directory" as const,
    detail:
      "HHSC active ALF workbook al.xlsx (sheet ALF_Directory) is the authoritative roster source; 2,019 rows verified 2026-11-20.",
  },
  {
    id: "freshness-iso-export-date",
    complete: false,
    surface: "directory" as const,
    detail:
      "Title as-of 11/19/2026 and HTTP Last-Modified are rejected. Rewriting to 2026-11-19 invents a timestamp. recordedExportDateIso=null.",
  },
  {
    id: "license-identifiers",
    complete: true,
    surface: "directory" as const,
    detail:
      "2,019 unique Facility ID strings (533 with leading zeros preserved) and 2,019 unique License No values; no duplicates.",
  },
  {
    id: "physical-address-and-capacity",
    complete: true,
    surface: "directory" as const,
    detail:
      "Physical Address labeled separately from Owner Mailing; 0 blank addresses; Total Licensed Capacity on all rows (4–335); capacity is not vacancy.",
  },
  {
    id: "operating-status-semantics",
    complete: false,
    surface: "directory" as const,
    detail:
      "Facility Licensed=YES is workbook membership, not closed/expired operating status. Closures PDF has 0 ID overlap with active rows.",
  },
  {
    id: "facility-specific-disclosure",
    complete: false,
    surface: "directory" as const,
    detail:
      "TULIP detail uses an account id not present in the workbook. No verified Facility ID/License → detail URL prefix. Search-only is not facility-specific disclosure.",
  },
  {
    id: "type-a-b-c-taxonomy",
    complete: false,
    surface: "directory" as const,
    detail:
      "Type A/B/C under 26 TAC §553.5 are evacuation-capability classes, not Washington AFH. Type C (8) is legacy. Explicit product taxonomy approval required.",
  },
  {
    id: "map-coordinates-separate",
    complete: false,
    surface: "map" as const,
    detail:
      "Geo Location has 1,937 pairs + 82 comma-only cells. Source/accuracy undescribed; pairs not accepted as licensing coordinates. Do not invent geocodes. Map stays off.",
  },
  {
    id: "wa-ca-or-design2-owner-auth-billing-preserved",
    complete: true,
    surface: "safeguard" as const,
    detail:
      "This package does not change Washington, California, Oregon, Design 2, owner claims, authentication, or billing. Texas stays unpublished.",
  },
] as const;

export const TEXAS_TIER1_DIRECTORY_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "facility-licensed-yes-not-operating-status",
  "no-verified-tulip-disclosure-url-prefix",
  "type-a-b-c-taxonomy-unapproved",
  "map-geo-source-undescribed",
  "state-authorization-unpublished",
] as const;

export type TexasTier1DirectoryVerdict = {
  stopGo: "STOP";
  tier1DirectoryRequirementsMet: false;
  publicPublicationAuthorized: false;
  texasPublished: false;
  inventoryActiveRows: typeof TEXAS_TIER1_DIRECTORY_INVENTORY.activeRows;
  publicationEligible: 0;
  mapEnabled: false;
  blockers: typeof TEXAS_TIER1_DIRECTORY_BLOCKERS;
  nextHumanActions: readonly string[];
};

export function texasTier1DirectoryVerdict(): TexasTier1DirectoryVerdict {
  return {
    stopGo: "STOP",
    tier1DirectoryRequirementsMet: false,
    publicPublicationAuthorized: false,
    texasPublished: false,
    inventoryActiveRows: TEXAS_TIER1_DIRECTORY_INVENTORY.activeRows,
    publicationEligible: 0,
    mapEnabled: false,
    blockers: TEXAS_TIER1_DIRECTORY_BLOCKERS,
    nextHumanActions: [
      "Obtain an authoritative HHSC ISO export/version stamp for al.xlsx (do not rewrite 11/19/2026).",
      "Confirm whether a stable TULIP detail URL can be formed without workbook account ids, or accept search-only disclosure under explicit policy.",
      "Define operating-status rules that do not treat Facility Licensed=YES alone as open/closed.",
      "Approve Type A/B/C product taxonomy without equating them to Washington AFH.",
      "Keep map work separate — never invent geocodes for comma-only Geo Location cells.",
      "Separate human authorization before any Texas public or development directory flip.",
    ],
  };
}

export function texasTier1DirectoryChecklistComplete(): boolean {
  return TEXAS_TIER1_DIRECTORY_CHECKLIST.every((item) => item.complete);
}

export function texasTier1DirectoryReadyForPublic(): false {
  return false;
}

export function texasTier1MapReady(): false {
  return false;
}
