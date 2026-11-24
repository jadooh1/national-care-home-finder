/**
 * California Tier 2 production release candidate controls.
 *
 * Baseline: validated development commit 056b35f (#220) — Phase 9 identity
 * filter applied; 15,418 verified map points; 17 unverified excluded.
 *
 * Ports the approved development map under /development/california/map for a
 * protected draft PR against main. Public California map authorization stays
 * OFF until a separate explicit approval. Does NOT merge, deploy, write
 * Supabase, enable owner/enhanced features, or publish Oregon.
 *
 * Preserves Washington Design 2, live California Tier 1 directory (15,435),
 * and Oregon unpublished / production fail-closed.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_TIER2_RELEASE_OBSERVED_ON = "2026-11-24";
export const CALIFORNIA_TIER2_RELEASE_BASELINE = "056b35f" as const;
export const CALIFORNIA_TIER2_RELEASE_VERIFIED_PR = 220 as const;

export const CALIFORNIA_TIER2_RELEASE_DIRECTORY_COUNT = 15435 as const;
export const CALIFORNIA_TIER2_RELEASE_VERIFIED_MAP_COUNT = 15418 as const;
export const CALIFORNIA_TIER2_RELEASE_UNVERIFIED_EXCLUDED = 17 as const;
/** 16 unmatched + 1 Phase-9 identity-rejected leading-zero collapse. */
export const CALIFORNIA_TIER2_RELEASE_UNMATCHED = 16 as const;
export const CALIFORNIA_TIER2_RELEASE_IDENTITY_REJECTED = 1 as const;
export const CALIFORNIA_TIER2_RELEASE_IDENTITY_REJECTED_ID = "011405838" as const;

export const CALIFORNIA_TIER2_RELEASE_CONTROLS = {
  releaseCandidateReady: true as const,
  /** Public interactive map — requires separate explicit approval. */
  publicMapAuthorized: false as const,
  publicMapEnabled: false as const,
  publicMapPath: null,
  developmentMapPath: "/development/california/map" as const,
  /** Tier 1 directory remains live (authorized separately). */
  tier1DirectoryPublished: true as const,
  directoryEligibleCount: CALIFORNIA_TIER2_RELEASE_DIRECTORY_COUNT,
  verifiedMapPointCount: CALIFORNIA_TIER2_RELEASE_VERIFIED_MAP_COUNT,
  unverifiedExcludedFromMap: CALIFORNIA_TIER2_RELEASE_UNVERIFIED_EXCLUDED,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  oregonPublished: false as const,
  washingtonDesign2Preserved: true as const,
  fabricatedCoordinates: 0 as const,
  geocoded: false as const,
  cdssAuthoritative: true as const,
} as const;

export const CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE = {
  title: "Map coverage (not yet public)",
  summary:
    "An interactive California map is prepared with verified official coordinates for 15,418 of 15,435 directory facilities (99.89%). Seventeen facilities remain without verified map locations and are omitted from the map. Coordinates come from exact CDSS license-ID matches to the official CCL ArcGIS layer (plus Phase-9 identity-verified leading-zero GIS representations). CDSS DownloadStateData remains authoritative for facility identity. The public map is not authorized yet.",
  verifiedCount: CALIFORNIA_TIER2_RELEASE_VERIFIED_MAP_COUNT,
  directoryCount: CALIFORNIA_TIER2_RELEASE_DIRECTORY_COUNT,
  unverifiedExcluded: CALIFORNIA_TIER2_RELEASE_UNVERIFIED_EXCLUDED,
  publicMapAuthorized: false as const,
  neverInventCoordinates: true as const,
} as const;

export type CaliforniaTier2RollbackStep = {
  id: string;
  title: string;
  detail: string;
};

export function californiaTier2RollbackPlan(): {
  trigger: string;
  steps: readonly CaliforniaTier2RollbackStep[];
  preserve: readonly string[];
} {
  return {
    trigger:
      "Use if a Tier 2 map preview/regression harms Washington, live California Tier 1, Oregon containment, or coordinate integrity.",
    steps: [
      {
        id: "disable-development-map-route",
        title: "Remove or gate /development/california/map",
        detail:
          "Delete or fail-close the development map page and client component so no interactive CA map is served from this RC.",
      },
      {
        id: "revert-tier2-fixtures",
        title: "Revert Tier 2 map fixtures and release controls",
        detail:
          "Restore pre-RC state of california-tier2-map fixtures, california-tier2-release controls, and related tests without touching Tier 1 roster or publication flags.",
      },
      {
        id: "keep-mapPath-null",
        title: "Confirm directoryContract('California').mapPath stays null",
        detail:
          "Public map authorization remains OFF. Do not set mapPath or add /california/map.",
      },
      {
        id: "verify-tier1-intact",
        title: "Verify California Tier 1 directory still lists 15,435",
        detail:
          "Confirm /california listing, residual exclusions, and CDSS disclosure links are unchanged.",
      },
      {
        id: "verify-wa-or",
        title: "Verify Washington Design 2 and Oregon fail-closed",
        detail:
          "Washington map/directory remain public. Oregon production hosts continue to 404.",
      },
    ],
    preserve: [
      "Washington public directory and Design 2 homepage",
      "California Tier 1 public directory (15,435)",
      "Oregon unpublished + production fail-closed layout",
      "Owner claims WA-only",
      "No invented or geocoded coordinates",
    ],
  };
}

export function californiaTier2PublicMapAuthorized(): false {
  return false;
}

export function californiaTier2ReleaseCandidateReady(): boolean {
  return (
    CALIFORNIA_TIER2_RELEASE_CONTROLS.releaseCandidateReady
    && CALIFORNIA_TIER2_RELEASE_CONTROLS.verifiedMapPointCount === 15418
    && CALIFORNIA_TIER2_RELEASE_CONTROLS.unverifiedExcludedFromMap === 17
    && CALIFORNIA_TIER2_RELEASE_CONTROLS.publicMapAuthorized === false
    && CALIFORNIA_TIER2_RELEASE_CONTROLS.publicMapPath === null
    && CALIFORNIA_TIER2_RELEASE_CONTROLS.oregonPublished === false
    && CALIFORNIA_TIER2_RELEASE_CONTROLS.ownerClaimsEnabled === false
    && CALIFORNIA_TIER2_RELEASE_CONTROLS.washingtonDesign2Preserved === true
  );
}

export function californiaTier2PublicationReadiness(): {
  developmentMap: "GO";
  publicMap: "STOP";
  tier1Directory: "LIVE";
  oregon: "UNPUBLISHED";
  verifiedMapPoints: number;
  unverifiedExcluded: number;
} {
  return {
    developmentMap: "GO",
    publicMap: "STOP",
    tier1Directory: "LIVE",
    oregon: "UNPUBLISHED",
    verifiedMapPoints: CALIFORNIA_TIER2_RELEASE_VERIFIED_MAP_COUNT,
    unverifiedExcluded: CALIFORNIA_TIER2_RELEASE_UNVERIFIED_EXCLUDED,
  };
}
