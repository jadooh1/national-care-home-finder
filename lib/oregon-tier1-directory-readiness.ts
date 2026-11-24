/**
 * Oregon Tier 1 — directory publication readiness (development-only).
 *
 * Reuses completed Oregon ODHS audits and the nationwide / California Tier 1
 * publication framework. Does NOT invent coordinates, adopt a fabricated
 * export date, flip directoryContract to public, enable maps/owner/enhanced,
 * or change Washington / California / Design 2 / auth / billing.
 *
 * Intentionally free of sibling runtime imports so Next.js bundling and
 * node --experimental-strip-types tests both load cleanly.
 */

export const OREGON_TIER1_DIRECTORY_READINESS_OBSERVED_ON = "2026-11-24" as const;
export const OREGON_TIER1_DIRECTORY_READINESS_BASELINE = "056b35f" as const;

/** Recorded development directory size (host-gated reduced-field view). */
export const OREGON_TIER1_DIRECTORY_ACCEPTED_COUNT = 1584 as const;
export const OREGON_TIER1_DIRECTORY_ZERO_BED_EXCLUSIONS = 20 as const;

export const OREGON_TIER1_DIRECTORY_SOURCE = {
  agency: "Oregon Department of Human Services (ODHS)" as const,
  locatorUrl: "https://ltclicensing.oregon.gov/Providers" as const,
  exportUrl: "https://ltclicensing.oregon.gov/Providers/Export" as const,
  observedExportFilename: "Provider_Export_11-13-2026.csv" as const,
  observedOn: "2026-11-13" as const,
  /** Authoritative ISO export/version stamp — not available from ODHS export. */
  recordedExportDateIso: null,
  hasExportDateColumn: false as const,
  identityField: "source_id" as const,
  disclosurePrefix: "https://ltclicensing.oregon.gov/Providers/Details/" as const,
  disclosureVerified: true as const,
} as const;

/**
 * Public columns already enforced by the development directory contract.
 * Street address and license number are intentionally withheld.
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
 * - tier1DirectoryRequirementsMet: framework Tier 1 gates (ISO date + street)
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
      "ODHS provider export has no date column; filename, HTTP Last-Modified, and 24-hour update notice are not adopted as ISO export dates. oregonExportDateReady() remains false; retrievedOn stays null.",
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
      "Eligible rows are Open Oregon adult foster homes with licensed beds 1–5. 20 open homes recorded with 0 beds are excluded from the directory.",
  },
  {
    id: "disclosure-links-odhs-profile",
    complete: true,
    surface: "directory" as const,
    detail:
      "official_profile_url must equal https://ltclicensing.oregon.gov/Providers/Details/{source_id}; oregonDisclosureUrl mirrors that prefix.",
  },
  {
    id: "street-address-policy",
    complete: false,
    surface: "directory" as const,
    detail:
      "Street address is not an accepted public field. Framework Tier 1 listing gates require a usable street; reduced-field directory keeps Tier 0 until a list-only policy is explicitly approved.",
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
      "This package does not change Washington, California, Design 2, owner claims, authentication, or billing.",
  },
] as const;

export const OREGON_TIER1_DIRECTORY_BLOCKERS = [
  "no-authoritative-iso-export-date",
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
  zeroBedExclusions: typeof OREGON_TIER1_DIRECTORY_ZERO_BED_EXCLUSIONS;
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
    zeroBedExclusions: OREGON_TIER1_DIRECTORY_ZERO_BED_EXCLUSIONS,
    mapEnabled: false,
    blockers: OREGON_TIER1_DIRECTORY_BLOCKERS,
    nextHumanActions: [
      "Obtain an authoritative ODHS ISO export/version stamp (or approve a documented freshness policy that does not invent dates).",
      "Decide whether reduced-field (no street) Oregon listings may count as Tier 1 list-only under explicit policy; until then keep Tier 0.",
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
