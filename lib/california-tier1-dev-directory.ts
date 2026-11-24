/**
 * California Tier 1 development-only directory (post-#209).
 *
 * Fixture-backed listing, search, and detail helpers for unpublished
 * California development review. Clearly not a statewide directory and not
 * public. Does NOT publish California, activate exclusions/mapping, write
 * Supabase, or change production. Intentionally free of sibling runtime imports.
 */

export const CALIFORNIA_TIER1_DEV_DIRECTORY_OBSERVED_ON = "2026-11-21";
export const CALIFORNIA_TIER1_DEV_DIRECTORY_BASELINE = "c5d6ca4" as const;

export const CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE = {
  kind: "development-fixtures" as const,
  statewideComplete: false as const,
  californiaPublished: false as const,
  exclusionsActivated: false as const,
  eligibilityMappingActivated: false as const,
  publicationEligible: 0 as const,
  offlineTier1Candidates: 15429,
  residualExclusions: 22,
  fixtureCount: 7,
  sourceAsOfIso: "2026-11-15" as const,
  facilityDetailPagePrefix:
    "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/",
  routes: {
    listing: "/development/california",
    detailPrefix: "/development/california/",
  },
  publicRoutesForbidden: [
    "/california",
    "/california/[facilityNumber]",
  ] as const,
} as const;

const FACILITY_NUMBER = /^\d{8,9}$/;

/** Residual-22 exclusion IDs (exact). Never listable in this directory. */
export const CALIFORNIA_TIER1_DEV_RESIDUAL_EXCLUSION_IDS = [
  "079201725",
  "502701889",
  "374605020",
  "342701856",
  "197610992",
  "342701894",
  "502701880",
  "198604006",
  "195850781",
  "107209715",
  "195850785",
  "197611051",
  "360951409",
  "198320716",
  "198320787",
  "455920513",
  "197611076",
  "197611060",
  "134605014",
  "502701867",
  "019201167",
  "019201133",
] as const;

const RESIDUAL_SET: ReadonlySet<string> = new Set(
  CALIFORNIA_TIER1_DEV_RESIDUAL_EXCLUSION_IDS,
);

export type CaliforniaTier1DevFacility = {
  facilityNumber: string;
  facilityName: string;
  category: "RCFE" | "ARF";
  facilityType: string;
  apiStatus: string;
  licenseFirstDate: string | null;
  /** Approved licensed capacity from official source — never a proposed increase. */
  approvedLicensedCapacity: string | null;
  pendingIncrease: boolean;
  leadingZero: boolean;
  disclosureUrl: string;
  sourceAsOfIso: "2026-11-15";
  fixtureNote: string;
};

/**
 * Verified development fixtures (live-checked FacDetail samples). Not the
 * full offline Tier 1 set of 15,429.
 */
export const CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES: readonly CaliforniaTier1DevFacility[] =
  [
    {
      facilityNumber: "079201384",
      facilityName: "ECOLUX ASSISTED LIVING",
      category: "RCFE",
      facilityType: "RESIDENTIAL CARE ELDERLY",
      apiStatus: "Licensed/Pending Increase",
      licenseFirstDate: "7/31/2024",
      approvedLicensedCapacity: "6",
      pendingIncrease: true,
      leadingZero: true,
      disclosureUrl:
        "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/079201384",
      sourceAsOfIso: "2026-11-15",
      fixtureNote:
        "Pending Increase status; capacity shown is approved licensed capacity only — proposed increase is not displayed as capacity.",
    },
    {
      facilityNumber: "335530021",
      facilityName: "SYCAMORE HOUSE",
      category: "ARF",
      facilityType: "ADULT RESIDENTIAL",
      apiStatus: "Licensed/Pending Increase",
      licenseFirstDate: "10/17/2022",
      approvedLicensedCapacity: "3",
      pendingIncrease: true,
      leadingZero: false,
      disclosureUrl:
        "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/335530021",
      sourceAsOfIso: "2026-11-15",
      fixtureNote:
        "Pending Increase status; capacity shown is approved licensed capacity only.",
    },
    {
      facilityNumber: "092700093",
      facilityName: "SUNSHINE MANOR",
      category: "RCFE",
      facilityType: "RESIDENTIAL CARE ELDERLY",
      apiStatus: "Licensed",
      licenseFirstDate: "12/14/2017",
      approvedLicensedCapacity: "14",
      pendingIncrease: false,
      leadingZero: true,
      disclosureUrl:
        "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/092700093",
      sourceAsOfIso: "2026-11-15",
      fixtureNote: "Licensed RCFE fixture with leading-zero Facility Number.",
    },
    {
      facilityNumber: "079201524",
      facilityName: "BUENAVISTA HOME AT PEPPERWOOD III",
      category: "ARF",
      facilityType: "ADULT RESIDENTIAL",
      apiStatus: "Licensed",
      licenseFirstDate: "8/5/2025",
      approvedLicensedCapacity: "6",
      pendingIncrease: false,
      leadingZero: true,
      disclosureUrl:
        "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/079201524",
      sourceAsOfIso: "2026-11-15",
      fixtureNote: "Licensed ARF fixture with leading-zero Facility Number.",
    },
    {
      facilityNumber: "045002766",
      facilityName: "CASA DE AMOR",
      category: "ARF",
      facilityType: "ADULT RESIDENTIAL",
      apiStatus: "Licensed",
      licenseFirstDate: "12/31/2020",
      approvedLicensedCapacity: "4",
      pendingIncrease: false,
      leadingZero: true,
      disclosureUrl:
        "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/045002766",
      sourceAsOfIso: "2026-11-15",
      fixtureNote: "Licensed ARF fixture.",
    },
    {
      facilityNumber: "547209219",
      facilityName: "KAWEAH HEALTH RUTH WOOD OPEN ARMS HOUSE",
      category: "RCFE",
      facilityType: "RESIDENTIAL CARE ELDERLY",
      apiStatus: "Licensed",
      licenseFirstDate: "7/20/2022",
      approvedLicensedCapacity: "6",
      pendingIncrease: false,
      leadingZero: false,
      disclosureUrl:
        "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/547209219",
      sourceAsOfIso: "2026-11-15",
      fixtureNote: "Licensed RCFE fixture.",
    },
    {
      facilityNumber: "507206765",
      facilityName: "GOLDEN AGE VII",
      category: "RCFE",
      facilityType: "RESIDENTIAL CARE ELDERLY",
      apiStatus: "Licensed",
      licenseFirstDate: "6/30/2016",
      approvedLicensedCapacity: "6",
      pendingIncrease: false,
      leadingZero: false,
      disclosureUrl:
        "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/507206765",
      sourceAsOfIso: "2026-11-15",
      fixtureNote: "Licensed RCFE fixture.",
    },
  ];

export const CALIFORNIA_TIER1_DEV_FAIL_CLOSED_CASES = [
  {
    id: "invalid-short-id",
    facilityNumber: "95354",
    reason: "invalid-facility-number",
  },
  {
    id: "non-numeric",
    facilityNumber: "not-a-facility",
    reason: "invalid-facility-number",
  },
  {
    id: "residual-exclusion",
    facilityNumber: "019201167",
    reason: "residual-exclusion",
  },
  {
    id: "residual-truncation-alias",
    facilityNumber: "19201167",
    reason: "residual-exclusion-truncation-alias",
  },
  {
    id: "unknown-not-in-fixtures",
    facilityNumber: "015601083",
    reason: "not-in-development-fixtures",
  },
] as const;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function exclusionIdCandidates(facilityNumber: string): string[] {
  const id = text(facilityNumber);
  const out = new Set<string>();
  if (!id) return [];
  out.add(id);
  if (/^\d{8}$/.test(id)) out.add(`0${id}`);
  if (/^\d{9}$/.test(id) && id.startsWith("0")) out.add(id.slice(1));
  return [...out];
}

export function isCaliforniaTier1DevFacilityNumber(facilityNumber: string): boolean {
  return FACILITY_NUMBER.test(text(facilityNumber));
}

export function californiaTier1DevIsResidualExclusion(
  facilityNumber: string,
): boolean {
  return exclusionIdCandidates(facilityNumber).some((c) => RESIDUAL_SET.has(c));
}

export function californiaTier1DevDisclosureUrl(
  facilityNumber: string,
): string | null {
  const id = text(facilityNumber);
  if (!FACILITY_NUMBER.test(id)) return null;
  if (californiaTier1DevIsResidualExclusion(id)) return null;
  return `${CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE.facilityDetailPagePrefix}${id}`;
}

export function californiaTier1DevDetailPath(
  facilityNumber: string,
): string | null {
  const id = text(facilityNumber);
  if (!FACILITY_NUMBER.test(id)) return null;
  if (californiaTier1DevIsResidualExclusion(id)) return null;
  return `${CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE.routes.detailPrefix}${id}`;
}

export function californiaTier1DevListingPath(input?: {
  q?: string | null;
  category?: string | null;
}): string {
  const params = new URLSearchParams();
  const q = text(input?.q);
  const category = text(input?.category).toUpperCase();
  if (q) params.set("q", q);
  if (category === "RCFE" || category === "ARF") params.set("category", category);
  const qs = params.toString();
  return qs
    ? `${CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE.routes.listing}?${qs}`
    : CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE.routes.listing;
}

export type CaliforniaTier1DevLookupResult =
  | {
      ok: true;
      facility: CaliforniaTier1DevFacility;
    }
  | {
      ok: false;
      facility: null;
      reasons: string[];
    };

/**
 * Fail-closed detail lookup. Residual exclusions, invalid IDs, and unknown
 * fixture IDs never resolve to a facility record.
 */
export function californiaTier1DevLookupFacility(
  facilityNumber: string,
): CaliforniaTier1DevLookupResult {
  const id = text(facilityNumber);
  const reasons: string[] = [];

  if (!FACILITY_NUMBER.test(id)) {
    reasons.push("invalid-facility-number");
  }
  if (californiaTier1DevIsResidualExclusion(id)) {
    reasons.push("residual-exclusion");
    if (id.length === 8 || (id.length === 9 && !RESIDUAL_SET.has(id))) {
      reasons.push("leading-zero-truncation-alias");
    }
  }

  const facility =
    CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES.find((f) => f.facilityNumber === id)
    ?? null;

  if (!facility && reasons.length === 0) {
    reasons.push("not-in-development-fixtures");
  }
  if (!facility) {
    reasons.push("california-unpublished");
    reasons.push("development-fixtures-only");
    return { ok: false, facility: null, reasons: [...new Set(reasons)] };
  }

  return { ok: true, facility };
}

export type CaliforniaTier1DevSearchInput = {
  q?: string | null;
  category?: string | null;
};

export function californiaTier1DevSearch(
  input: CaliforniaTier1DevSearchInput = {},
): {
  results: CaliforniaTier1DevFacility[];
  total: number;
  query: string;
  category: "" | "RCFE" | "ARF";
  scopeNote: string;
} {
  const query = text(input.q).toLowerCase();
  const rawCategory = text(input.category).toUpperCase();
  const category =
    rawCategory === "RCFE" || rawCategory === "ARF" ? rawCategory : "";

  const results = CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES.filter((facility) => {
    if (californiaTier1DevIsResidualExclusion(facility.facilityNumber)) {
      return false;
    }
    if (category && facility.category !== category) return false;
    if (!query) return true;
    const haystack = [
      facility.facilityName,
      facility.facilityNumber,
      facility.category,
      facility.facilityType,
      facility.apiStatus,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  return {
    results,
    total: results.length,
    query: text(input.q),
    category,
    scopeNote:
      "Development fixtures only — not a complete statewide California directory (15,429 offline Tier 1 candidates remain unpublished).",
  };
}

/**
 * Listing gate used before any fixture can enter results.
 */
export function californiaTier1DevListingGate(input: {
  facilityNumber: string;
  surface: "search" | "detail-page" | "api" | "map" | "owner-claim" | "sitemap";
}): { allowed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const id = text(input.facilityNumber);

  if (!FACILITY_NUMBER.test(id)) reasons.push("invalid-facility-number");
  if (californiaTier1DevIsResidualExclusion(id)) {
    reasons.push("residual-exclusion");
  }
  const inFixtures = CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES.some(
    (f) => f.facilityNumber === id,
  );
  if (!inFixtures) reasons.push("not-in-development-fixtures");

  // Public surfaces always blocked for California.
  if (
    input.surface === "api"
    || input.surface === "map"
    || input.surface === "owner-claim"
    || input.surface === "sitemap"
  ) {
    reasons.push(`blocked-from-public-${input.surface}`);
  }
  reasons.push("california-unpublished");
  reasons.push("development-host-only");

  // Development search/detail may show fixtures when no residual/invalid reasons.
  const developmentSurfaceOk =
    (input.surface === "search" || input.surface === "detail-page")
    && inFixtures
    && FACILITY_NUMBER.test(id)
    && !californiaTier1DevIsResidualExclusion(id);

  if (developmentSurfaceOk) {
    return {
      allowed: true,
      reasons: ["development-fixture-allowed", "california-unpublished"],
    };
  }

  return { allowed: false, reasons: [...new Set(reasons)] };
}

export const CALIFORNIA_TIER1_DEV_PREPUBLICATION_CHECKLIST = [
  {
    id: "fixtures-not-statewide",
    required: true,
    completeInThisPr: true,
    detail:
      "Directory clearly labels fixtures as development samples, not the 15,429 statewide set.",
  },
  {
    id: "exact-facility-numbers",
    required: true,
    completeInThisPr: true,
    detail: "Listing and detail use exact CDSS Facility Numbers; leading zeros preserved.",
  },
  {
    id: "official-disclosure-links",
    required: true,
    completeInThisPr: true,
    detail: "FacDetail rewrite URLs only; no invented profile pages or REPORTPAGE fakeouts.",
  },
  {
    id: "capacity-vs-pending-increase",
    required: true,
    completeInThisPr: true,
    detail:
      "Approved licensed capacity displayed separately from Pending Increase status; proposed increases never shown as capacity.",
  },
  {
    id: "residual-exclusions-blocked",
    required: true,
    completeInThisPr: true,
    detail:
      "Residual-22 IDs and truncation aliases cannot enter search or detail results.",
  },
  {
    id: "public-routes-still-absent",
    required: true,
    completeInThisPr: true,
    detail:
      "No /california public route; sitemap/map/owner remain WA-only; directoryContract unpublished.",
  },
  {
    id: "exclusion-ledger-still-deferred",
    required: true,
    completeInThisPr: true,
    detail: "exclusionsActivated remains false per #209 deferral until prepublication wire-up.",
  },
  {
    id: "eligibility-mapping-inactive",
    required: true,
    completeInThisPr: true,
    detail: "Pending Increase mapping remains inactive; status is informational only.",
  },
  {
    id: "source-freshness-reconfirm",
    required: true,
    completeInThisPr: false,
    detail:
      "Before publication wire-up, reconfirm DownloadStateData as-of (fixtures use 2026-11-15).",
  },
  {
    id: "activate-exclusion-ledger-before-public-listing",
    required: true,
    completeInThisPr: false,
    detail:
      "Hard precondition from #209: activate residual ledger and wire gates before any public CA listing.",
  },
  {
    id: "statewide-roster-load",
    required: true,
    completeInThisPr: false,
    detail:
      "Replace fixtures with approved statewide Tier 1 roster only under separate publication approval.",
  },
] as const;

export function buildCaliforniaTier1DevDirectoryPreview(input?: {
  q?: string | null;
  category?: string | null;
}) {
  const search = californiaTier1DevSearch(input);
  const fixtureIds = CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES.map(
    (f) => f.facilityNumber,
  );
  const uniqueOk = new Set(fixtureIds).size === fixtureIds.length;
  const noResidualInFixtures = fixtureIds.every(
    (id) => !californiaTier1DevIsResidualExclusion(id),
  );
  const pendingOk = CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES.some(
    (f) => f.pendingIncrease,
  );
  const licensedOk = CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES.some(
    (f) => !f.pendingIncrease,
  );
  const categoriesOk =
    CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES.some((f) => f.category === "RCFE")
    && CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES.some((f) => f.category === "ARF");

  const residualBlocked = californiaTier1DevLookupFacility("019201167");
  const truncBlocked = californiaTier1DevLookupFacility("19201167");
  const invalidBlocked = californiaTier1DevLookupFacility("95354");
  const known = californiaTier1DevLookupFacility("092700093");

  const publicMapBlocked = californiaTier1DevListingGate({
    facilityNumber: "092700093",
    surface: "map",
  });
  const publicOwnerBlocked = californiaTier1DevListingGate({
    facilityNumber: "092700093",
    surface: "owner-claim",
  });
  const publicSitemapBlocked = californiaTier1DevListingGate({
    facilityNumber: "092700093",
    surface: "sitemap",
  });
  const devSearchAllowed = californiaTier1DevListingGate({
    facilityNumber: "092700093",
    surface: "search",
  });

  const checklistComplete = CALIFORNIA_TIER1_DEV_PREPUBLICATION_CHECKLIST.filter(
    (c) => c.completeInThisPr,
  ).length;
  const checklistPending = CALIFORNIA_TIER1_DEV_PREPUBLICATION_CHECKLIST.filter(
    (c) => !c.completeInThisPr,
  ).length;

  const arithmeticOk =
    uniqueOk
    && noResidualInFixtures
    && pendingOk
    && licensedOk
    && categoriesOk
    && CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES.length === 7
    && CALIFORNIA_TIER1_DEV_RESIDUAL_EXCLUSION_IDS.length === 22
    && !residualBlocked.ok
    && !truncBlocked.ok
    && !invalidBlocked.ok
    && known.ok
    && !publicMapBlocked.allowed
    && !publicOwnerBlocked.allowed
    && !publicSitemapBlocked.allowed
    && devSearchAllowed.allowed
    && !CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE.californiaPublished
    && !CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE.statewideComplete
    && CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE.publicationEligible === 0
    && checklistComplete >= 6
    && checklistPending >= 2;

  return {
    observedOn: CALIFORNIA_TIER1_DEV_DIRECTORY_OBSERVED_ON,
    baseline: CALIFORNIA_TIER1_DEV_DIRECTORY_BASELINE,
    scope: CALIFORNIA_TIER1_DEV_DIRECTORY_SCOPE,
    fixtures: CALIFORNIA_TIER1_DEV_DIRECTORY_FIXTURES,
    search,
    failClosedCases: CALIFORNIA_TIER1_DEV_FAIL_CLOSED_CASES,
    prepublicationChecklist: CALIFORNIA_TIER1_DEV_PREPUBLICATION_CHECKLIST,
    checklistComplete,
    checklistPending,
    arithmeticOk,
    stopGoPublic: "STOP" as const,
    mostActionableNextStep:
      "Use /development/california for fixture listing/search and /development/california/[facilityNumber] for detail. Keep California unpublished. Before any public listing, complete remaining prepublication checklist items (source freshness, exclusion activation, statewide roster).",
    preservedRestrictions: [
      "washington-oregon-florida-ohio-unchanged",
      "exclusions-remain-inactive",
      "eligibility-mapping-remain-inactive",
      "california-unpublished",
      "fixtures-not-statewide",
      "no-public-california-routes",
      "no-database-writes",
      "no-production-changes",
    ] as const,
  };
}

export function californiaTier1DevDirectoryAllowsPublication(): false {
  return false;
}

export function californiaTier1DevDirectoryActivated(): false {
  return false;
}
