/**
 * Pennsylvania Tier 1 — directory publication readiness (development-only).
 *
 * Reuses the 989-row personal-care-home open-data audit (PR #65 / #170 lineage;
 * note: GitHub #63 was Michigan address work) and the nationwide / California
 * publication framework. Re-verified 2026-11-26: CSV sha256 unchanged;
 * 13 letter-only streets deterministically excluded. Does NOT invent ISO
 * export dates or licensing coordinates, publish Pennsylvania, or change
 * Washington / California / Oregon / Design 2 / auth / billing.
 *
 * Intentionally free of sibling runtime imports.
 */

export const PENNSYLVANIA_TIER1_DIRECTORY_READINESS_OBSERVED_ON = "2026-11-26" as const;
export const PENNSYLVANIA_TIER1_DIRECTORY_READINESS_BASELINE = "cc042ef" as const;

export const PENNSYLVANIA_TIER1_DIRECTORY_SOURCE = {
  agency: "Pennsylvania Department of Human Services (open data)" as const,
  sourceUrl: "https://data.pa.gov/api/views/pqf4-d4xn/rows.csv?accessType=DOWNLOAD" as const,
  datasetUrl:
    "https://data.pa.gov/Services-Near-You/Licensed-Personal-Care-Homes-Current-Statewide-Hum/pqf4-d4xn" as const,
  providerDirectory:
    "https://www.humanservices.dhs.pa.gov/human_service_provider_directory/" as const,
  captureObservedOn: "2026-11-26" as const,
  priorAuditObservedOn: "2026-11-20" as const,
  sha256: "c91722696b1accbe778f25189fc727e5bd55f5028bac3d529c54d3e8e8192973" as const,
  bytes: 227204 as const,
  contentUnchangedSincePriorAudit: true as const,
  catalogRowsUpdatedAt: "2026-11-22T06:04:51Z" as const,
  priorCatalogRowsUpdatedAt: "2026-11-08T06:09:03Z" as const,
  recordedExportDateIso: null,
  hasExportDateColumn: false as const,
  licenseNumberColumn: false as const,
  statusColumn: false as const,
  disclosurePrefixVerified: false as const,
  identityField: "Object ID" as const,
  identityIsLicenseNumber: false as const,
} as const;

export const PENNSYLVANIA_TIER1_DIRECTORY_INVENTORY = {
  rosterRows: 989 as const,
  uniqueObjectIds: 989 as const,
  typePersonalCareHomes: 989 as const,
  usableStreetRows: 976 as const,
  letterOnlyStreetExclusions: 13 as const,
  capacityMin: 4 as const,
  capacityMax: 250 as const,
  capacityUnderFour: 0 as const,
  fiveDigitZips: 989 as const,
  georeferencedRows: 989 as const,
  licensingCoordinateRows: 0 as const,
  /** Framework Tier 1 publication-eligible after blockers clear. */
  publicationEligible: 0 as const,
} as const;

export const PENNSYLVANIA_TIER1_DIRECTORY_EXCLUSIONS = {
  letterOnlyStreetRows: 13 as const,
  letterOnlyWithAdditional: 6 as const,
  letterOnlyNamedWithoutNumber: 7 as const,
  deterministicExclusionComplete: true as const,
  originalFieldsRewritten: false as const,
  streetAdditionalCopiedIntoStreet: false as const,
  inventedHouseNumbers: false as const,
  inventedCoordinates: false as const,
} as const;

export const PENNSYLVANIA_TIER1_SURFACE_SEPARATION = {
  directorySurface: "unpublished-evidence-only" as const,
  directoryPath: null,
  mapPath: null,
  mapEnabled: false as const,
  mapBlocker: "georeferenced-coordinates-are-not-licensing-coordinates" as const,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  washingtonPreserved: true as const,
  californiaPreserved: true as const,
  oregonPreserved: true as const,
} as const;

export const PENNSYLVANIA_TIER1_DIRECTORY_CONTROLS = {
  investigationComplete: true as const,
  addressExceptionsDeterministicallyExcluded: true as const,
  tier1DirectoryRequirementsMet: false as const,
  publicPublicationAuthorized: false as const,
  releaseCandidatePrepared: true as const,
  pennsylvaniaPublished: false as const,
  pennsylvaniaDirectoryReady: false as const,
  mapEnabled: false as const,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  stopGo: "STOP" as const,
  protectedPreviewPublication: "unpublished" as const,
} as const;

export const PENNSYLVANIA_TIER1_DIRECTORY_CHECKLIST = [
  {
    id: "authoritative-pch-open-data-roster",
    complete: true,
    surface: "directory" as const,
    detail:
      "data.pa.gov Licensed Personal Care Homes CSV re-downloaded 2026-11-26; 989 rows; sha256 matches prior audit (content unchanged).",
  },
  {
    id: "freshness-iso-export-date",
    complete: false,
    surface: "directory" as const,
    detail:
      "Catalog rowsUpdatedAt moved to 2026-11-22T06:04:51Z while CSV bytes/sha256 stayed identical — catalog clock is not an ISO export stamp. recordedExportDateIso=null.",
  },
  {
    id: "license-identifiers",
    complete: false,
    surface: "directory" as const,
    detail:
      "Object ID is unique (989) but is not a license number. No Facilities ID / license column on the open-data file.",
  },
  {
    id: "licensing-eligibility-status",
    complete: false,
    surface: "directory" as const,
    detail: "No per-row licensing/operating status column. Type is PERSONAL CARE HOMES on all rows.",
  },
  {
    id: "physical-address-and-capacity",
    complete: true,
    surface: "directory" as const,
    detail:
      "976 usable streets (letter+digit); 13 letter-only deterministically excluded; capacity 4–250 on all rows; 989 five-digit ZIPs.",
  },
  {
    id: "address-exceptions-deterministic-exclusion",
    complete: true,
    surface: "directory" as const,
    detail:
      "All 13 prior letter-only exceptions re-verified present and marked deterministicExclusion=true. No invented house numbers; Street Additional not copied into Street.",
  },
  {
    id: "facility-specific-disclosure",
    complete: false,
    surface: "directory" as const,
    detail:
      "DHS provider directory / spatial search are generic. Object ID is not a license number for inspection permalinks. disclosurePrefix unverified.",
  },
  {
    id: "map-coordinates-separate",
    complete: false,
    surface: "map" as const,
    detail:
      "989 georeferenced portal points rejected as licensing coordinates. Map stays off; no invented geocodes.",
  },
  {
    id: "wa-ca-or-design2-owner-auth-billing-preserved",
    complete: true,
    surface: "safeguard" as const,
    detail:
      "This package does not change Washington, California, Oregon, Design 2, owner claims, authentication, or billing. Pennsylvania stays unpublished.",
  },
] as const;

export const PENNSYLVANIA_TIER1_DIRECTORY_BLOCKERS = [
  "open-data-object-id-is-not-a-license-number",
  "no-per-row-licensing-status",
  "no-authoritative-iso-export-date",
  "catalog-timestamp-is-not-an-export-date",
  "no-per-facility-disclosure-link-is-recorded",
  "thirteen-letter-only-streets-deterministically-excluded",
  "georeferenced-coordinates-are-not-licensing-coordinates",
  "state-authorization-unpublished",
] as const;

export type PennsylvaniaTier1DirectoryVerdict = {
  stopGo: "STOP";
  tier1DirectoryRequirementsMet: false;
  publicPublicationAuthorized: false;
  pennsylvaniaPublished: false;
  rosterRows: typeof PENNSYLVANIA_TIER1_DIRECTORY_INVENTORY.rosterRows;
  usableStreetRows: typeof PENNSYLVANIA_TIER1_DIRECTORY_INVENTORY.usableStreetRows;
  letterOnlyExclusions: typeof PENNSYLVANIA_TIER1_DIRECTORY_INVENTORY.letterOnlyStreetExclusions;
  publicationEligible: 0;
  addressExceptionsDeterministicallyExcluded: true;
  mapEnabled: false;
  blockers: typeof PENNSYLVANIA_TIER1_DIRECTORY_BLOCKERS;
  nextHumanActions: readonly string[];
};

export function pennsylvaniaTier1DirectoryVerdict(): PennsylvaniaTier1DirectoryVerdict {
  return {
    stopGo: "STOP",
    tier1DirectoryRequirementsMet: false,
    publicPublicationAuthorized: false,
    pennsylvaniaPublished: false,
    rosterRows: PENNSYLVANIA_TIER1_DIRECTORY_INVENTORY.rosterRows,
    usableStreetRows: PENNSYLVANIA_TIER1_DIRECTORY_INVENTORY.usableStreetRows,
    letterOnlyExclusions: PENNSYLVANIA_TIER1_DIRECTORY_INVENTORY.letterOnlyStreetExclusions,
    publicationEligible: 0,
    addressExceptionsDeterministicallyExcluded: true,
    mapEnabled: false,
    blockers: PENNSYLVANIA_TIER1_DIRECTORY_BLOCKERS,
    nextHumanActions: [
      "Obtain a license-number / status channel for personal-care-home rows (Object ID is insufficient).",
      "Adopt an authoritative ISO export/version stamp (catalog clock ≠ export date; content sha may stay flat).",
      "Verify facility-specific disclosure permalinks keyed by license number, not Object ID.",
      "Keep the 13 letter-only streets excluded unless official digit streets appear in source.",
      "Separate human authorization before any Pennsylvania public or development directory flip.",
    ],
  };
}

export function pennsylvaniaTier1DirectoryChecklistComplete(): boolean {
  return PENNSYLVANIA_TIER1_DIRECTORY_CHECKLIST.every((item) => item.complete);
}

export function pennsylvaniaTier1DirectoryReadyForPublic(): false {
  return false;
}

export function pennsylvaniaTier1MapReady(): false {
  return false;
}
