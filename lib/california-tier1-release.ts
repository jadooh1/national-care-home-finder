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

/**
 * Public activation controls (authorized under user approval).
 *
 * - releaseCandidateReady: directory/roster/code are prepared
 * - publicPublicationAuthorized: true after separate approval
 * - californiaPublished: true — production hosts may link and index CA directory
 * - publicationEligibleCount: exact eligible roster size
 * - map/owner/enhanced/oregon remain disabled
 */
export const CALIFORNIA_TIER1_RELEASE_CONTROLS = {
  releaseCandidateReady: true as const,
  publicPublicationAuthorized: true as const,
  californiaPublished: true as const,
  exclusionsEnforced: true as const,
  eligibilityMappingPreserved: true as const,
  publicationEligibleCount: CALIFORNIA_TIER1_RELEASE_ELIGIBLE_COUNT,
  mapEnabled: false as const,
  ownerClaimsEnabled: false as const,
  enhancedFeaturesEnabled: false as const,
  oregonPublished: false as const,
  protectedPreviewPublication: "public" as const,
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
    id: "protected-preview-not-public",
    complete: true,
    detail:
      "Activation PR flips California to publication=public with production links and sitemap.",
  },
  {
    id: "draft-pr-against-main-no-auto-merge",
    complete: true,
    detail: "Separate activation PR against main; orchestrator merges under granted approval.",
  },
  {
    id: "executable-rollback-documented",
    complete: true,
    detail: "Rollback keeps CA unpublished/development and removes public indexing/links.",
  },
  {
    id: "authorize-public-publication",
    complete: true,
    detail:
      "User approved public production activation; publicPublicationAuthorized=true and directoryContract publication=public.",
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

export function californiaTier1PublicPublicationAuthorized(): boolean {
  return CALIFORNIA_TIER1_RELEASE_CONTROLS.publicPublicationAuthorized;
}

export function californiaTier1ReleaseCandidateReady(): boolean {
  return CALIFORNIA_TIER1_RELEASE_CONTROLS.releaseCandidateReady;
}

/** Production hosts that must fail closed until public publication is authorized. */
export const CALIFORNIA_TIER1_PRODUCTION_HOSTS = [
  "www.nationalcarehomefinder.com",
  "nationalcarehomefinder.com",
  "national-care-home-finder-kkfa.vercel.app",
] as const;

function normalizeAccessHost(value: string | undefined): string {
  const trimmed = (value ?? "").split(",")[0].trim();
  if (!trimmed) return "";
  try {
    const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export type CaliforniaTier1SurfaceAccessInput = {
  vercelEnv?: string | null;
  requestHost?: string | null;
  publicPublicationAuthorized?: boolean;
  californiaPublished?: boolean;
};

/**
 * Request-level surface gate. Protected RC allows isolated preview /
 * development hosts only. Production hosts fail closed (not merely unlinked)
 * until separate public-publication authorization.
 */
export function californiaTier1SurfaceAccess(
  input: CaliforniaTier1SurfaceAccessInput = {},
): { allowed: boolean; reasons: string[] } {
  const authorized =
    input.publicPublicationAuthorized
    ?? CALIFORNIA_TIER1_RELEASE_CONTROLS.publicPublicationAuthorized;
  const published =
    input.californiaPublished
    ?? CALIFORNIA_TIER1_RELEASE_CONTROLS.californiaPublished;
  const host = normalizeAccessHost(input.requestHost ?? undefined);
  const vercelEnv = (input.vercelEnv ?? "").trim().toLowerCase();
  const reasons: string[] = [];

  if (authorized && published) {
    return { allowed: true, reasons: ["public-publication-authorized"] };
  }

  reasons.push("public-publication-unauthorized");

  if (
    host
    && (CALIFORNIA_TIER1_PRODUCTION_HOSTS as readonly string[]).includes(host)
  ) {
    reasons.push("production-host-fail-closed");
    return { allowed: false, reasons: [...new Set(reasons)] };
  }

  if (vercelEnv === "production") {
    reasons.push("vercel-production-env-fail-closed");
    return { allowed: false, reasons: [...new Set(reasons)] };
  }

  if (vercelEnv === "preview" || vercelEnv === "development") {
    reasons.push("protected-preview-or-development-allowed");
    return { allowed: true, reasons: [...new Set(reasons)] };
  }

  if (!host || host === "localhost" || host === "127.0.0.1") {
    reasons.push("local-protected-preview-allowed");
    return { allowed: true, reasons: [...new Set(reasons)] };
  }

  if (host.endsWith(".vercel.app") && host.includes("-git-")) {
    reasons.push("vercel-git-preview-allowed");
    return { allowed: true, reasons: [...new Set(reasons)] };
  }

  reasons.push("unknown-host-fail-closed");
  return { allowed: false, reasons: [...new Set(reasons)] };
}

/**
 * Exact activation sequence after separate public-publication approval.
 * Do not execute without that approval. No database writes required.
 */
export const CALIFORNIA_TIER1_PUBLIC_ACTIVATION_SEQUENCE = [
  {
    step: 1,
    id: "confirm-freshness-and-eligible-count",
    detail:
      "Confirm CDSS as-of still matches fixture (or refresh roster). Eligible count must remain exact before flip.",
  },
  {
    step: 2,
    id: "set-release-authorization-flags",
    file: "lib/california-tier1-release.ts",
    diff: [
      "publicPublicationAuthorized: false → true",
      "californiaPublished: false → true",
      "Keep publicationEligibleCount = 15435 (or refreshed exact count)",
      "Keep mapEnabled/ownerClaimsEnabled/enhancedFeaturesEnabled/oregonPublished = false",
    ],
  },
  {
    step: 3,
    id: "flip-directory-contract-to-public",
    file: "lib/state-directory.ts",
    diff: [
      'California publication: "development" → "public"',
      "directoryPath remains /california",
      "mapPath remains null",
    ],
  },
  {
    step: 4,
    id: "enable-public-sitemap",
    file: "lib/public-indexing.ts",
    diff: [
      "Populate CALIFORNIA_PUBLIC_PAGES with /california",
      "Remove /california from PRIVATE_INDEX_PREFIXES",
      "Allow california facility profiles in sitemap.ts when authorized",
    ],
  },
  {
    step: 5,
    id: "update-manifest-and-gates",
    file: "supabase/proposals/fixtures/california-tier1-full-roster/manifest.json + lib/california-tier1-full-roster.ts",
    diff: [
      "californiaPublished: true",
      "Listing gate: allow sitemap for listable IDs; keep map/owner/api blocked",
    ],
  },
  {
    step: 6,
    id: "ship-activation-pr-and-deploy-only-after-approval",
    detail:
      "Open a separate activation PR against main. Merge/deploy only after explicit production approval. No Supabase schema/data writes for Tier 1 app publication.",
  },
] as const;
