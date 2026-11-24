/**
 * California Tier 1 statewide release candidate controls.
 *
 * Baseline: verified PR #215 @ deafabb (eligibility mapping activated;
 * residual ledger ON; development GO / public STOP). This module arms the
 * production-targeted public directory for a draft PR against main.
 *
 * Does NOT merge, deploy, write Supabase, enable maps/owner/enhanced
 * features, or publish Oregon. Washington Design 2 stays intact.
 *
 * Intentionally free of sibling runtime imports so Next.js bundler resolution
 * and node --experimental-strip-types tests both load cleanly.
 */

export const CALIFORNIA_TIER1_RELEASE_OBSERVED_ON = "2026-11-24";
export const CALIFORNIA_TIER1_RELEASE_BASELINE = "deafabb" as const;
export const CALIFORNIA_TIER1_RELEASE_VERIFIED_PR = 215 as const;

/** Exact eligible / listable facility count for the release candidate. */
export const CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT = 15435 as const;

export const CALIFORNIA_TIER1_RELEASE_SOURCE = {
  pathway: "downloadstatedata-transparency-csv" as const,
  adoptedAsOfIso: "2026-11-22" as const,
  facDetailPagePrefix:
    "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/",
  contentDispositionMarkers: [
    "ResidentialElderCareFacility11222026.csv",
    "AdultResidentialFacilities11222026.csv",
  ] as const,
} as const;

/**
 * 58 listable Pending Increase facilities — remain listable under the
 * approved mapping (LICENSED/ON PROBATION + non-empty License First Date;
 * approved licensed capacity only; PI is not a separate publishable status).
 */
export const CALIFORNIA_TIER1_RELEASE_LISTABLE_PENDING_INCREASE_IDS = [
  "015601083",
  "015601284",
  "045920148",
  "079201384",
  "107200486",
  "107206544",
  "107206560",
  "107209383",
  "107209533",
  "157204130",
  "195850551",
  "306000870",
  "306005986",
  "306006109",
  "331880891",
  "331881036",
  "331881303",
  "331881673",
  "335530021",
  "335530026",
  "336400036",
  "336426289",
  "336426330",
  "342700591",
  "342700984",
  "342701384",
  "342701723",
  "347000846",
  "347001484",
  "347001961",
  "365530102",
  "365530299",
  "366425800",
  "370808095",
  "371881418",
  "371881438",
  "374600429",
  "374601420",
  "374601445",
  "374603495",
  "374604213",
  "374604375",
  "374604454",
  "374604532",
  "374604742",
  "374604751",
  "374604986",
  "392700647",
  "392701057",
  "392701427",
  "392701601",
  "392701658",
  "392701730",
  "410508825",
  "435201626",
  "435294286",
  "486804268",
  "552701748",
] as const;

/** 8 historical PI IDs that stay out of RCFE/ARF listable scope. */
export const CALIFORNIA_TIER1_RELEASE_OUT_OF_SCOPE_PENDING_INCREASE_IDS = [
  "079201349",
  "191603551",
  "197606348",
  "198603784",
  "300605585",
  "306004005",
  "370808447",
  "374604710",
] as const;

export const CALIFORNIA_TIER1_RELEASE_CONTROLS = {
  californiaPublished: true as const,
  exclusionsEnforced: true as const,
  eligibilityMappingPreserved: true as const,
  publicationEligibleCount: CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT,
  mapEnabled: false as const,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  oregonPublished: false as const,
  routes: {
    listing: "/california" as const,
    detailPrefix: "/california/" as const,
  },
} as const;

export const CALIFORNIA_TIER1_RELEASE_CHECKLIST = [
  {
    id: "baseline-deafabb-pr215",
    complete: true,
    detail: "Release candidate branched from verified PR #215 @ deafabb.",
  },
  {
    id: "roster-reconciled-cdss-11222026",
    complete: true,
    detail:
      "Fixture roster as-of 2026-11-22 (Content-Disposition *11222026.csv); 15,435 listable; residual-22 excluded.",
  },
  {
    id: "residual-22-and-aliases-enforced",
    complete: true,
    detail: "All 22 residual IDs and leading-zero truncation aliases fail closed.",
  },
  {
    id: "pending-increase-mapping-preserved",
    complete: true,
    detail: "58 listable PI IDs remain listable; 8 OOS PI IDs stay omitted.",
  },
  {
    id: "public-directory-search-profiles",
    complete: true,
    detail: "Public /california listing + /california/[facilityNumber] profiles.",
  },
  {
    id: "cdss-disclosure-capacity-freshness",
    complete: true,
    detail: "FacDetail links, approved licensed capacity, and source as-of shown.",
  },
  {
    id: "maps-owner-enhanced-disabled",
    complete: true,
    detail: "California map, owner claims, and enhanced features stay off.",
  },
  {
    id: "oregon-unpublished-washington-preserved",
    complete: true,
    detail: "Oregon remains development-only; Washington public + Design 2 intact.",
  },
  {
    id: "draft-pr-against-main-no-auto-merge",
    complete: true,
    detail: "Minimal draft PR against main; no merge/deploy without separate approval.",
  },
  {
    id: "executable-rollback-documented",
    complete: true,
    detail: "Rollback reverts publication controls and removes public CA routes.",
  },
] as const;

export type CaliforniaTier1ReleaseRollback = {
  restoresControls: {
    californiaPublished: false;
    publicationEligibleCount: 0;
  };
  keepsEnforced: {
    exclusionsEnforced: true;
    eligibilityMappingPreserved: true;
  };
  steps: readonly { id: string; title: string; detail: string }[];
  verification: readonly string[];
};

export function californiaTier1ReleaseRollback(): CaliforniaTier1ReleaseRollback {
  return {
    restoresControls: {
      californiaPublished: false,
      publicationEligibleCount: 0,
    },
    keepsEnforced: {
      exclusionsEnforced: true,
      eligibilityMappingPreserved: true,
    },
    steps: [
      {
        id: "revert-publication-controls",
        title: "Set californiaPublished → false and publicationEligibleCount → 0",
        detail:
          "Revert CALIFORNIA_TIER1_RELEASE_CONTROLS and state-directory California publication to unpublished. Keep residual exclusions and PI mapping evidence intact.",
      },
      {
        id: "remove-or-gate-public-routes",
        title: "Remove or fail-close public /california routes",
        detail:
          "Public listing/detail must 404 or redirect; directoryHref('California') returns null on production hosts.",
      },
      {
        id: "drop-california-from-sitemap",
        title: "Remove California paths from the public sitemap",
        detail: "sitemapPaths / sitemap.ts must omit /california and facility profiles.",
      },
      {
        id: "redeploy-without-merge-to-main-if-unmerged",
        title: "If the draft PR is unmerged, close it; if merged, ship a revert PR",
        detail:
          "Do not leave a half-published candidate live. No database writes required for app-level rollback.",
      },
    ],
    verification: [
      "directoryContract('California').publication === 'unpublished'",
      "directoryHref('California', productionUrl) === null",
      "mapHref('California') === null",
      "ENABLED_OWNER_FACILITY_STATES === ['WA']",
      "Oregon publication remains 'development'",
      "Residual-22 and PI mapping fixtures still enforce exclusions",
    ],
  };
}

export function californiaTier1ReleaseEligibleCount(): number {
  return CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT;
}

export function californiaTier1ReleasePublished(): boolean {
  return CALIFORNIA_TIER1_RELEASE_CONTROLS.californiaPublished;
}
