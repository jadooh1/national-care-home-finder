/**
 * California Tier 2 public map activation controls.
 *
 * Baseline RC: PR #221 head 30c508c (validated development 056b35f / #220).
 * User-authorized public map activation against main. Does NOT merge or deploy
 * from this module. No Supabase / auth / billing changes. Owner and enhanced
 * features stay disabled. Oregon unpublished. Washington Design 2 preserved.
 *
 * Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_TIER2_RELEASE_OBSERVED_ON = "2026-11-24";
export const CALIFORNIA_TIER2_RELEASE_BASELINE = "30c508c" as const;
export const CALIFORNIA_TIER2_RELEASE_RC_PR = 221 as const;
export const CALIFORNIA_TIER2_RELEASE_VALIDATED_DEV = "056b35f" as const;
export const CALIFORNIA_TIER2_ROLLBACK_MAIN = "b07a1ac" as const;

export const CALIFORNIA_TIER2_RELEASE_DIRECTORY_COUNT = 15435 as const;
export const CALIFORNIA_TIER2_RELEASE_VERIFIED_MAP_COUNT = 15418 as const;
export const CALIFORNIA_TIER2_RELEASE_UNVERIFIED_EXCLUDED = 17 as const;
export const CALIFORNIA_TIER2_RELEASE_UNMATCHED = 16 as const;
export const CALIFORNIA_TIER2_RELEASE_IDENTITY_REJECTED = 1 as const;
export const CALIFORNIA_TIER2_RELEASE_IDENTITY_REJECTED_ID = "011405838" as const;

export const CALIFORNIA_TIER2_RELEASE_CONTROLS = {
  releaseCandidateReady: true as const,
  /** User explicitly authorized public California map activation. */
  publicMapAuthorized: true as const,
  publicMapEnabled: true as const,
  publicMapPath: "/california/map" as const,
  developmentMapPath: "/development/california/map" as const,
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
  sourceAsOfIso: "2026-11-22" as const,
  rollbackMainSha: CALIFORNIA_TIER2_ROLLBACK_MAIN,
} as const;

export const CALIFORNIA_TIER2_PUBLIC_COVERAGE_DISCLOSURE = {
  title: "Map coverage",
  summary:
    "The interactive California map plots verified official coordinates for 15,418 of 15,435 directory facilities (99.89%). Seventeen facilities remain without verified map locations and are omitted. Coordinates come from exact CDSS license-ID matches to the official CCL ArcGIS layer (plus Phase-9 identity-verified leading-zero GIS representations). CDSS DownloadStateData remains authoritative for facility identity. Approved licensed capacity is not a vacancy.",
  verifiedCount: CALIFORNIA_TIER2_RELEASE_VERIFIED_MAP_COUNT,
  directoryCount: CALIFORNIA_TIER2_RELEASE_DIRECTORY_COUNT,
  unverifiedExcluded: CALIFORNIA_TIER2_RELEASE_UNVERIFIED_EXCLUDED,
  publicMapAuthorized: true as const,
  neverInventCoordinates: true as const,
  mapPath: "/california/map" as const,
} as const;

export type CaliforniaTier2RollbackStep = {
  id: string;
  title: string;
  detail: string;
};

export function californiaTier2RollbackPlan(): {
  trigger: string;
  rollbackToMainSha: typeof CALIFORNIA_TIER2_ROLLBACK_MAIN;
  steps: readonly CaliforniaTier2RollbackStep[];
  preserve: readonly string[];
} {
  return {
    trigger:
      "Use if public California map activation harms Washington, Tier 1 directory integrity, Oregon containment, sitemap, or coordinate authenticity.",
    rollbackToMainSha: CALIFORNIA_TIER2_ROLLBACK_MAIN,
    steps: [
      {
        id: "revert-main-to-b07a1ac",
        title: "Revert production main to b07a1ac",
        detail:
          "Roll back the merged activation commit(s) so main returns to pre-Tier-2-RC state b07a1ac (Oregon containment + Tier 1 directory without Tier 2 map). Prefer revert PR over force-push.",
      },
      {
        id: "disable-public-map-controls",
        title: "Set publicMapAuthorized → false and mapPath → null",
        detail:
          "If a partial revert is required, flip CALIFORNIA_TIER2_RELEASE_CONTROLS and directoryContract California mapPath off and restore /california/map to notFound.",
      },
      {
        id: "remove-sitemap-map-entry",
        title: "Omit /california/map from CALIFORNIA_PUBLIC_PAGES / sitemap",
        detail: "Ensure sitemap and navigation no longer advertise the public map.",
      },
      {
        id: "verify-tier1-wa-or",
        title: "Verify Tier 1 directory 15,435, WA Design 2, Oregon fail-closed",
        detail:
          "Confirm /california listing, residual exclusions, Washington map/directory/owner, and Oregon production 404 remain intact.",
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

export function californiaTier2PublicMapAuthorized(): boolean {
  return CALIFORNIA_TIER2_RELEASE_CONTROLS.publicMapAuthorized;
}

export function californiaTier2ReleaseCandidateReady(): boolean {
  return (
    CALIFORNIA_TIER2_RELEASE_CONTROLS.releaseCandidateReady
    && CALIFORNIA_TIER2_RELEASE_CONTROLS.verifiedMapPointCount === 15418
    && CALIFORNIA_TIER2_RELEASE_CONTROLS.unverifiedExcludedFromMap === 17
    && CALIFORNIA_TIER2_RELEASE_CONTROLS.publicMapAuthorized === true
    && CALIFORNIA_TIER2_RELEASE_CONTROLS.publicMapPath === "/california/map"
    && CALIFORNIA_TIER2_RELEASE_CONTROLS.oregonPublished === false
    && CALIFORNIA_TIER2_RELEASE_CONTROLS.ownerClaimsEnabled === false
    && CALIFORNIA_TIER2_RELEASE_CONTROLS.washingtonDesign2Preserved === true
  );
}

export function californiaTier2PublicationReadiness(): {
  developmentMap: "GO";
  publicMap: "GO";
  tier1Directory: "LIVE";
  oregon: "UNPUBLISHED";
  verifiedMapPoints: number;
  unverifiedExcluded: number;
  rollbackTo: typeof CALIFORNIA_TIER2_ROLLBACK_MAIN;
} {
  return {
    developmentMap: "GO",
    publicMap: "GO",
    tier1Directory: "LIVE",
    oregon: "UNPUBLISHED",
    verifiedMapPoints: CALIFORNIA_TIER2_RELEASE_VERIFIED_MAP_COUNT,
    unverifiedExcluded: CALIFORNIA_TIER2_RELEASE_UNVERIFIED_EXCLUDED,
    rollbackTo: CALIFORNIA_TIER2_ROLLBACK_MAIN,
  };
}
