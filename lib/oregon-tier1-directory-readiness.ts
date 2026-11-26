/**
 * Oregon Tier 1 — directory publication readiness (development-only).
 *
 * Updates the #223 STOP package with the 2026-11-26 dual-format ODHS export
 * capture and ODHS confirmations (daily website updates; addresses in CSV and
 * Excel). Does NOT invent ISO export dates, flip Oregon to public, enable
 * maps/owner/enhanced, or change Washington / California / Design 2 / auth /
 * billing.
 *
 * Intentionally free of sibling runtime imports.
 */

export const OREGON_TIER1_DIRECTORY_READINESS_OBSERVED_ON = "2026-11-26" as const;
export const OREGON_TIER1_DIRECTORY_READINESS_BASELINE = "cc042ef" as const;

/** Recorded development directory size (host-gated reduced-field view). */
export const OREGON_TIER1_DIRECTORY_ACCEPTED_COUNT = 1584 as const;
export const OREGON_TIER1_DIRECTORY_ZERO_BED_EXCLUSIONS = 20 as const;

/** Latest dual-format capture (does not replace stored directory rows). */
export const OREGON_TIER1_CAPTURE = {
  observedOn: "2026-11-26" as const,
  csvFilename: "Provider_Export_11-26-2026.csv" as const,
  excelFilename: "Provider_Export_11-26-2026.xlsx" as const,
  csvBytes: 686792 as const,
  csvSha256: "df843f7195242517723f8354bfd53095ec0a8f1baa7f76a19b7eb1010a0d63b2" as const,
  xlsxBytes: 431323 as const,
  xlsxSha256: "036885f39e197ac02518dec257744c25664af039d92f85beb6191e0b20389bcd" as const,
  csvHttpDate: "Thu, 26 Nov 2026 20:59:54 GMT" as const,
  xlsxHttpDate: "Thu, 26 Nov 2026 20:59:57 GMT" as const,
  totalRows: 4756 as const,
  openAfhRows: 1603 as const,
  qualifyingAcceptedBeds: 1579 as const,
  openAfhZeroBeds: 24 as const,
  qualifyingStreetPresent: 1579 as const,
  qualifyingStreetBlank: 0 as const,
  csvExcelAcceptedParity: true as const,
} as const;

export const OREGON_TIER1_DIRECTORY_SOURCE = {
  agency: "Oregon Department of Human Services (ODHS)" as const,
  locatorUrl: "https://ltclicensing.oregon.gov/Providers" as const,
  exportUrl: "https://ltclicensing.oregon.gov/Providers/Export" as const,
  observedExportFilename: "Provider_Export_11-26-2026.csv" as const,
  observedExcelFilename: "Provider_Export_11-26-2026.xlsx" as const,
  observedOn: "2026-11-26" as const,
  /** Authoritative ISO export/version stamp — still not available. */
  recordedExportDateIso: null,
  hasExportDateColumn: false as const,
  /** ODHS confirmed daily website updates (policy signal, not an as-of date). */
  odhsDailyUpdateConfirmed: true as const,
  odhsAddressAvailabilityConfirmed: true as const,
  identityField: "source_id" as const,
  disclosurePrefix: "https://ltclicensing.oregon.gov/Providers/Details/" as const,
  disclosureVerified: true as const,
} as const;

/**
 * Public columns already enforced by the development directory contract.
 * Street is present on the authoritative export but still withheld from public columns.
 */
export const OREGON_TIER1_DIRECTORY_PUBLIC_FIELDS = [
  "source_id",
  "facility_name",
  "city",
  "county",
  "license_type",
  "status",
  "licensed_beds",
  "official_profile_url",
] as const;

export const OREGON_TIER1_DIRECTORY_ELIGIBILITY = {
  category: "Oregon adult foster home" as const,
  status: "Open" as const,
  licensedBedsMin: 1 as const,
  licensedBedsMax: 5 as const,
  zeroBedOpenHomesExcluded: true as const,
  streetPresentOnAuthoritativeExport: true as const,
  streetCoverageCompleteOnQualifyingCapture: true as const,
  streetAddressInPublicColumns: false as const,
  licenseNumberInPublicColumns: false as const,
  coordinatesInvented: false as const,
} as const;

/**
 * Directory vs map separation.
 * Directory readiness is evaluated independently from map/coordinate Tier 2+.
 */
export const OREGON_TIER1_SURFACE_SEPARATION = {
  directorySurface: "development-host-gated" as const,
  directoryPath: "/oregon" as const,
  developmentAdminPath: "/development/oregon" as const,
  mapPath: null,
  mapEnabled: false as const,
  mapBlocker: "accepted-provider-export-has-no-coordinate-columns" as const,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  washingtonPreserved: true as const,
  californiaPreserved: true as const,
} as const;

/**
 * Controls for this readiness package.
 * - developmentDirectoryOperational: existing host-gated /oregon works
 * - tier1DirectoryRequirementsMet: framework Tier 1 gates still open
 * - publicPublicationAuthorized: always false here — no Oregon public flip
 * - releaseCandidatePrepared: formal STOP evidence package only
 */
export const OREGON_TIER1_DIRECTORY_CONTROLS = {
  developmentDirectoryOperational: true as const,
  tier1DirectoryRequirementsMet: false as const,
  publicPublicationAuthorized: false as const,
  releaseCandidatePrepared: true as const,
  oregonPublished: false as const,
  mapEnabled: false as const,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  stopGo: "STOP" as const,
  protectedPreviewPublication: "development" as const,
} as const;

export const OREGON_TIER1_DIRECTORY_CHECKLIST = [
  {
    id: "freshness-iso-export-date",
    complete: false,
    surface: "directory" as const,
    detail:
      "ODHS confirmed daily website updates (2026-11-26). Export still has no date column. Filename Provider_Export_11-26-2026.*, HTTP Date, and the 24-hour notice are not adopted as ISO export dates. recordedExportDateIso=null; oregonExportDateReady() false.",
  },
  {
    id: "dual-format-export-capture",
    complete: true,
    surface: "directory" as const,
    detail:
      "CSV and Excel downloaded from POST /Providers/Export on 2026-11-26. CSV SHA-256 df843f71…; Excel SHA-256 036885f3…. After fixing self-closing empty-cell parsing, both formats accept 1,579 Open AFH beds 1–5.",
  },
  {
    id: "facility-identity-source-id",
    complete: true,
    surface: "directory" as const,
    detail:
      "Public identity is ODHS source_id (1–32 alphanumeric). Duplicate source_ids are rejected by the public row acceptor.",
  },
  {
    id: "licensing-eligibility-open-afh-beds",
    complete: true,
    surface: "directory" as const,
    detail:
      "Eligible rows are Open Oregon adult foster homes with licensed beds 1–5. Stored directory keeps 1,584 accepted / 20 zero-bed exclusions; latest capture has 1,579 accepted / 24 zero-bed (not loaded).",
  },
  {
    id: "disclosure-links-odhs-profile",
    complete: true,
    surface: "directory" as const,
    detail:
      "official_profile_url must equal https://ltclicensing.oregon.gov/Providers/Details/{source_id}; oregonDisclosureUrl mirrors that prefix.",
  },
  {
    id: "street-address-source-coverage",
    complete: true,
    surface: "directory" as const,
    detail:
      "ODHS confirmed addresses in CSV and Excel. Capture: 1,579/1,579 qualifying Open AFH beds 1–5 have non-blank Address (0 blank). Street remains withheld from public columns until a separate surfacing authorization.",
  },
  {
    id: "street-address-in-public-columns",
    complete: false,
    surface: "directory" as const,
    detail:
      "Development/public field contract still omits street. Framework Tier 1 listing wants usable street on the published surface; Oregon stays reduced-field and unpublished/development-only.",
  },
  {
    id: "map-coordinates-separate",
    complete: false,
    surface: "map" as const,
    detail:
      "mapPath is null; mapHref(Oregon) is null. Provider export has no coordinates. GIS layers are not the accepted export and stay out of directory Tier 1. No fabricated/geocoded points.",
  },
  {
    id: "production-fail-closed",
    complete: true,
    surface: "directory" as const,
    detail:
      "app/oregon/layout.tsx returns notFound on Vercel production env or PUBLIC_PRODUCTION_HOSTS. Homepage link + data query stay on the development Supabase host only.",
  },
  {
    id: "wa-ca-design2-owner-auth-billing-preserved",
    complete: true,
    surface: "safeguard" as const,
    detail:
      "This package does not change Washington, California, Design 2, owner claims, authentication, or billing. Oregon stays unpublished to production hosts.",
  },
] as const;

export const OREGON_TIER1_DIRECTORY_BLOCKERS = [
  "no-authoritative-iso-export-date",
  "daily-refresh-confirmation-is-not-an-iso-stamp",
  "street-withheld-from-public-columns",
  "map-disabled-separate-from-directory",
  "state-authorization-development-only",
] as const;

export type OregonTier1DirectoryVerdict = {
  stopGo: "STOP";
  tier1DirectoryRequirementsMet: false;
  developmentDirectoryOperational: true;
  publicPublicationAuthorized: false;
  directoryAcceptedCount: typeof OREGON_TIER1_DIRECTORY_ACCEPTED_COUNT;
  captureQualifyingAccepted: typeof OREGON_TIER1_CAPTURE.qualifyingAcceptedBeds;
  zeroBedExclusions: typeof OREGON_TIER1_DIRECTORY_ZERO_BED_EXCLUSIONS;
  streetSourceCoverageComplete: true;
  mapEnabled: false;
  blockers: typeof OREGON_TIER1_DIRECTORY_BLOCKERS;
  nextHumanActions: readonly string[];
};

export function oregonTier1DirectoryVerdict(): OregonTier1DirectoryVerdict {
  return {
    stopGo: "STOP",
    tier1DirectoryRequirementsMet: false,
    developmentDirectoryOperational: true,
    publicPublicationAuthorized: false,
    directoryAcceptedCount: OREGON_TIER1_DIRECTORY_ACCEPTED_COUNT,
    captureQualifyingAccepted: OREGON_TIER1_CAPTURE.qualifyingAcceptedBeds,
    zeroBedExclusions: OREGON_TIER1_DIRECTORY_ZERO_BED_EXCLUSIONS,
    streetSourceCoverageComplete: true,
    mapEnabled: false,
    blockers: OREGON_TIER1_DIRECTORY_BLOCKERS,
    nextHumanActions: [
      "Approve whether ODHS-confirmed daily refresh + retrieval audit may satisfy Tier 1 freshness without an ISO stamp (do not invent dates from filenames).",
      "Authorize whether street from the ODHS Address column may enter the Oregon listing surface (source coverage is complete; public columns still withhold it).",
      "Keep map work separate — do not invent or geocode coordinates for directory readiness.",
      "Do not publish Oregon to production hosts until blockers clear and a separate authorization is granted.",
    ],
  };
}

export function oregonTier1DirectoryChecklistComplete(): boolean {
  return OREGON_TIER1_DIRECTORY_CHECKLIST.every(item => item.complete);
}

export function oregonTier1DirectoryReadyForPublic(): false {
  return false;
}

export function oregonTier1MapReady(): false {
  return false;
}
