/**
 * California Tier 1 full-roster directory (release candidate).
 *
 * Loads the reproducible DownloadStateData-derived statewide fixture and
 * provides searchable, paginated, fail-closed listing/detail helpers for the
 * public /california directory. Residual-22 exclusions and Pending Increase
 * mapping remain enforced. Maps, owner claims, and enhanced features stay off.
 *
 * Intentionally free of sibling runtime imports (except Node fs/path).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export const CALIFORNIA_TIER1_FULL_ROSTER_OBSERVED_ON = "2026-11-24";
export const CALIFORNIA_TIER1_FULL_ROSTER_BASELINE = "deafabb" as const;

export const CALIFORNIA_TIER1_FULL_ROSTER_SCOPE = {
  kind: "statewide-public-tier1-directory" as const,
  californiaPublished: true as const,
  exclusionsActivated: true as const,
  eligibilityMappingActivated: true as const,
  publicationEligible: 15435 as const,
  priorOfflineTier1: 15429,
  residualExclusions: 22,
  routes: {
    listing: "/california",
    detailPrefix: "/california/",
  },
  facilityDetailPagePrefix:
    "https://www.ccld.dss.ca.gov/carefacilitysearch/?Rewrite=FacDetail/",
  fixtureDir:
    "supabase/proposals/fixtures/california-tier1-full-roster" as const,
  protectedPreviewRoutes: ["/california", "/california/[facilityNumber]"] as const,
} as const;

/** Residual-22 exclusion IDs — never listable. */
export const CALIFORNIA_TIER1_FULL_ROSTER_RESIDUAL_IDS = [
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
  CALIFORNIA_TIER1_FULL_ROSTER_RESIDUAL_IDS,
);
const FACILITY_NUMBER = /^\d{8,9}$/;
const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MAX = 100;

export type CaliforniaTier1FullRosterCompact = {
  n: string;
  name: string;
  cat: "RCFE" | "ARF";
  type: string;
  status: string;
  first: string;
  cap: string | null;
  city: string | null;
  zip: string | null;
  addr: string | null;
  pi: boolean;
  lz: boolean;
};

export type CaliforniaTier1FullRosterFacility = {
  facilityNumber: string;
  facilityName: string;
  category: "RCFE" | "ARF";
  facilityType: string;
  downloadStatus: string;
  licenseFirstDate: string;
  approvedLicensedCapacity: string | null;
  city: string | null;
  postalCode: string | null;
  addressLine1: string | null;
  pendingIncrease: boolean;
  leadingZero: boolean;
  disclosureUrl: string;
  sourceAsOfIso: string;
};

export type CaliforniaTier1FullRosterManifest = {
  observedOn: string;
  sourceAsOfIso: string;
  pathway: string;
  californiaPublished: boolean;
  publicationEligible: number;
  exclusionsActivated: boolean;
  eligibilityMappingActivated?: boolean;
  statewideRosterForDevelopment: boolean;
  priorOfflineTier1: number;
  residualExclusions: number;
  residualPresentInDownload: number;
  listableCount: number;
  pendingIncreaseIdsHistorical: number;
  pendingIncreasePresentInDownload: number;
  pendingIncreaseFlaggedInRoster: number;
  deltaVsPrior15429: number;
  rcfe: {
    contentDisposition: string | null;
    sha256: string;
    bytes: number;
    rawRows: number;
  };
  arf: {
    contentDisposition: string | null;
    sha256: string;
    bytes: number;
    rawRows: number;
  };
  listableRule: string;
  notes: string[];
};

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

export function californiaTier1FullRosterIsResidual(
  facilityNumber: string,
): boolean {
  return exclusionIdCandidates(facilityNumber).some((c) => RESIDUAL_SET.has(c));
}

export function isCaliforniaTier1FullRosterFacilityNumber(
  facilityNumber: string,
): boolean {
  return FACILITY_NUMBER.test(text(facilityNumber));
}

function fixturePath(name: string): string {
  return join(
    process.cwd(),
    CALIFORNIA_TIER1_FULL_ROSTER_SCOPE.fixtureDir,
    name,
  );
}

let cachedManifest: CaliforniaTier1FullRosterManifest | null = null;
let cachedCompact: CaliforniaTier1FullRosterCompact[] | null = null;
let cachedById: Map<string, CaliforniaTier1FullRosterCompact> | null = null;

export function loadCaliforniaTier1FullRosterManifest(): CaliforniaTier1FullRosterManifest {
  if (cachedManifest) return cachedManifest;
  cachedManifest = JSON.parse(
    readFileSync(fixturePath("manifest.json"), "utf8"),
  ) as CaliforniaTier1FullRosterManifest;
  return cachedManifest;
}

export function loadCaliforniaTier1FullRosterCompact(): readonly CaliforniaTier1FullRosterCompact[] {
  if (cachedCompact) return cachedCompact;
  cachedCompact = JSON.parse(
    readFileSync(fixturePath("roster.json"), "utf8"),
  ) as CaliforniaTier1FullRosterCompact[];
  return cachedCompact;
}

function byIdMap(): Map<string, CaliforniaTier1FullRosterCompact> {
  if (cachedById) return cachedById;
  cachedById = new Map(
    loadCaliforniaTier1FullRosterCompact().map((row) => [row.n, row]),
  );
  return cachedById;
}

function expand(
  row: CaliforniaTier1FullRosterCompact,
  sourceAsOfIso: string,
): CaliforniaTier1FullRosterFacility {
  return {
    facilityNumber: row.n,
    facilityName: row.name,
    category: row.cat,
    facilityType: row.type,
    downloadStatus: row.status,
    licenseFirstDate: row.first,
    approvedLicensedCapacity: row.cap,
    city: row.city,
    postalCode: row.zip,
    addressLine1: row.addr,
    pendingIncrease: row.pi,
    leadingZero: row.lz,
    disclosureUrl:
      `${CALIFORNIA_TIER1_FULL_ROSTER_SCOPE.facilityDetailPagePrefix}${row.n}`,
    sourceAsOfIso,
  };
}

export function californiaTier1FullRosterDisclosureUrl(
  facilityNumber: string,
): string | null {
  const id = text(facilityNumber);
  if (!FACILITY_NUMBER.test(id)) return null;
  if (californiaTier1FullRosterIsResidual(id)) return null;
  return `${CALIFORNIA_TIER1_FULL_ROSTER_SCOPE.facilityDetailPagePrefix}${id}`;
}

export function californiaTier1FullRosterDetailPath(
  facilityNumber: string,
): string | null {
  const id = text(facilityNumber);
  if (!FACILITY_NUMBER.test(id)) return null;
  if (californiaTier1FullRosterIsResidual(id)) return null;
  if (!byIdMap().has(id)) return null;
  return `${CALIFORNIA_TIER1_FULL_ROSTER_SCOPE.routes.detailPrefix}${id}`;
}

export function californiaTier1FullRosterListingPath(input?: {
  q?: string | null;
  category?: string | null;
  city?: string | null;
  page?: number | null;
}): string {
  const params = new URLSearchParams();
  const q = text(input?.q);
  const category = text(input?.category).toUpperCase();
  const city = text(input?.city);
  const page = Number(input?.page ?? 1);
  if (q) params.set("q", q);
  if (category === "RCFE" || category === "ARF") params.set("category", category);
  if (city) params.set("city", city);
  if (Number.isFinite(page) && page > 1) params.set("page", String(Math.floor(page)));
  const qs = params.toString();
  return qs
    ? `${CALIFORNIA_TIER1_FULL_ROSTER_SCOPE.routes.listing}?${qs}`
    : CALIFORNIA_TIER1_FULL_ROSTER_SCOPE.routes.listing;
}

export type CaliforniaTier1FullRosterLookupResult =
  | { ok: true; facility: CaliforniaTier1FullRosterFacility }
  | { ok: false; facility: null; reasons: string[] };

export function californiaTier1FullRosterLookup(
  facilityNumber: string,
): CaliforniaTier1FullRosterLookupResult {
  const id = text(facilityNumber);
  const reasons: string[] = [];
  const manifest = loadCaliforniaTier1FullRosterManifest();

  if (!FACILITY_NUMBER.test(id)) reasons.push("invalid-facility-number");
  if (californiaTier1FullRosterIsResidual(id)) {
    reasons.push("residual-exclusion");
    if (id.length === 8 || (id.length === 9 && !RESIDUAL_SET.has(id))) {
      reasons.push("leading-zero-truncation-alias");
    }
  }

  const row = byIdMap().get(id) ?? null;
  if (!row && reasons.length === 0) reasons.push("not-in-listable-roster");
  if (!row) {
    return { ok: false, facility: null, reasons: [...new Set(reasons)] };
  }
  return { ok: true, facility: expand(row, manifest.sourceAsOfIso) };
}

export type CaliforniaTier1FullRosterSearchInput = {
  q?: string | null;
  category?: string | null;
  city?: string | null;
  page?: number | null;
  pageSize?: number | null;
};

export function californiaTier1FullRosterSearch(
  input: CaliforniaTier1FullRosterSearchInput = {},
) {
  const manifest = loadCaliforniaTier1FullRosterManifest();
  const query = text(input.q).toLowerCase();
  const rawCategory = text(input.category).toUpperCase();
  const category =
    rawCategory === "RCFE" || rawCategory === "ARF" ? rawCategory : "";
  const city = text(input.city).toLowerCase();
  const pageSize = Math.min(
    PAGE_SIZE_MAX,
    Math.max(1, Number(input.pageSize) || PAGE_SIZE_DEFAULT),
  );
  const page = Math.max(1, Math.floor(Number(input.page) || 1));

  const filtered = loadCaliforniaTier1FullRosterCompact().filter((row) => {
    if (californiaTier1FullRosterIsResidual(row.n)) return false;
    if (category && row.cat !== category) return false;
    if (city && !(row.city ?? "").toLowerCase().includes(city)) return false;
    if (!query) return true;
    const haystack = [
      row.name,
      row.n,
      row.cat,
      row.type,
      row.status,
      row.city ?? "",
      row.zip ?? "",
      row.addr ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const results = filtered
    .slice(start, start + pageSize)
    .map((row) => expand(row, manifest.sourceAsOfIso));

  return {
    results,
    total,
    page: safePage,
    pageSize,
    pageCount,
    query: text(input.q),
    category,
    city: text(input.city),
    sourceAsOfIso: manifest.sourceAsOfIso,
    listableCount: manifest.listableCount,
    scopeNote:
      `California Tier 1 directory from CDSS DownloadStateData as-of ${manifest.sourceAsOfIso} (${manifest.listableCount.toLocaleString()} eligible). Maps, owner claims, and enhanced features are not available.`,
  };
}

export function californiaTier1FullRosterListingGate(input: {
  facilityNumber: string;
  surface: "search" | "detail-page" | "api" | "map" | "owner-claim" | "sitemap";
}): { allowed: boolean; reasons: string[] } {
  const id = text(input.facilityNumber);
  const reasons: string[] = [];
  if (!FACILITY_NUMBER.test(id)) reasons.push("invalid-facility-number");
  if (californiaTier1FullRosterIsResidual(id)) reasons.push("residual-exclusion");
  const inRoster = byIdMap().has(id);
  if (!inRoster) reasons.push("not-in-listable-roster");

  if (
    input.surface === "api"
    || input.surface === "map"
    || input.surface === "owner-claim"
  ) {
    reasons.push(`blocked-from-public-${input.surface}`);
    return { allowed: false, reasons: [...new Set(reasons)] };
  }

  const listableOk =
    inRoster
    && FACILITY_NUMBER.test(id)
    && !californiaTier1FullRosterIsResidual(id);

  if (input.surface === "sitemap") {
    if (listableOk && CALIFORNIA_TIER1_FULL_ROSTER_SCOPE.californiaPublished) {
      return {
        allowed: true,
        reasons: ["public-sitemap-listable-allowed"],
      };
    }
    reasons.push("blocked-from-public-sitemap");
    return { allowed: false, reasons: [...new Set(reasons)] };
  }

  if (listableOk && (input.surface === "search" || input.surface === "detail-page")) {
    return {
      allowed: true,
      reasons: CALIFORNIA_TIER1_FULL_ROSTER_SCOPE.californiaPublished
        ? ["public-roster-allowed"]
        : ["protected-preview-roster-allowed"],
    };
  }

  return { allowed: false, reasons: [...new Set(reasons)] };
}

export const CALIFORNIA_TIER1_FULL_ROSTER_PREPUBLICATION_CHECKLIST = [
  {
    id: "authoritative-download-imported",
    completeInThisPr: true,
    detail:
      "RCFE + ARF DownloadStateData imported with sha256 + Content-Disposition provenance.",
  },
  {
    id: "exact-facility-numbers-preserved",
    completeInThisPr: true,
    detail: "Leading-zero Facility Numbers preserved; invalid IDs excluded.",
  },
  {
    id: "reconcile-prior-15429-and-22",
    completeInThisPr: true,
    detail:
      "Reconciled against prior 15,429 / 22 residual accounting; source as-of 2026-11-22.",
  },
  {
    id: "scalable-search-pagination-detail",
    completeInThisPr: true,
    detail: "Public listing supports search, category/city filters, and pagination.",
  },
  {
    id: "facdetail-links-and-fail-closed",
    completeInThisPr: true,
    detail: "Official FacDetail links; residual/invalid/unknown fail closed.",
  },
  {
    id: "exclusion-ledger-activated",
    completeInThisPr: true,
    detail: "Residual-22 exclusions and truncation aliases enforced.",
  },
  {
    id: "eligibility-mapping-preserved",
    completeInThisPr: true,
    detail: "Approved Pending Increase mapping preserved (58 listable + 8 OOS).",
  },
  {
    id: "protected-california-preview-routes",
    completeInThisPr: true,
    detail:
      "/california listing and profiles wired for public Tier 1 directory.",
  },
  {
    id: "maps-owner-enhanced-remain-off",
    completeInThisPr: true,
    detail: "California map, owner claims, and enhanced features stay disabled.",
  },
  {
    id: "public-publication-unauthorized",
    completeInThisPr: true,
    detail:
      "Superseded by authorize-public-publication; historical checklist id retained.",
  },
  {
    id: "authorize-public-publication",
    completeInThisPr: true,
    detail:
      "User approved public production activation; californiaPublished=true with sitemap for listable IDs.",
  },
] as const;

export function buildCaliforniaTier1FullRosterPreview(input?: {
  q?: string | null;
  category?: string | null;
  city?: string | null;
  page?: number | null;
}) {
  const manifest = loadCaliforniaTier1FullRosterManifest();
  const search = californiaTier1FullRosterSearch(input);
  const compact = loadCaliforniaTier1FullRosterCompact();

  const residualBlocked = californiaTier1FullRosterLookup("019201167");
  const truncBlocked = californiaTier1FullRosterLookup("19201167");
  const invalidBlocked = californiaTier1FullRosterLookup("95354");
  const known = californiaTier1FullRosterLookup("092700093");

  const publicMapBlocked = californiaTier1FullRosterListingGate({
    facilityNumber: "092700093",
    surface: "map",
  });
  const publicOwnerBlocked = californiaTier1FullRosterListingGate({
    facilityNumber: "092700093",
    surface: "owner-claim",
  });
  const publicApiBlocked = californiaTier1FullRosterListingGate({
    facilityNumber: "092700093",
    surface: "api",
  });
  const publicSitemapBlocked = californiaTier1FullRosterListingGate({
    facilityNumber: "092700093",
    surface: "sitemap",
  });
  const protectedSearchAllowed = californiaTier1FullRosterListingGate({
    facilityNumber: "092700093",
    surface: "search",
  });

  const uniqueOk =
    new Set(compact.map((r) => r.n)).size === compact.length;
  const noResidualListed = compact.every(
    (r) => !californiaTier1FullRosterIsResidual(r.n),
  );

  const checklistComplete =
    CALIFORNIA_TIER1_FULL_ROSTER_PREPUBLICATION_CHECKLIST.filter(
      (c) => c.completeInThisPr,
    ).length;
  const checklistPending =
    CALIFORNIA_TIER1_FULL_ROSTER_PREPUBLICATION_CHECKLIST.filter(
      (c) => !c.completeInThisPr,
    ).length;

  const arithmeticOk =
    uniqueOk
    && noResidualListed
    && compact.length === manifest.listableCount
    && manifest.listableCount === 15435
    && manifest.residualExclusions === 22
    && manifest.residualPresentInDownload === 22
    && manifest.publicationEligible === 15435
    && manifest.californiaPublished === true
    && manifest.exclusionsActivated === true
    && manifest.eligibilityMappingActivated === true
    && manifest.sourceAsOfIso === "2026-11-22"
    && !residualBlocked.ok
    && !truncBlocked.ok
    && !invalidBlocked.ok
    && known.ok
    && !publicMapBlocked.allowed
    && !publicOwnerBlocked.allowed
    && !publicApiBlocked.allowed
    && publicSitemapBlocked.allowed
    && protectedSearchAllowed.allowed
    && checklistComplete >= 10
    && checklistPending === 0;

  return {
    observedOn: CALIFORNIA_TIER1_FULL_ROSTER_OBSERVED_ON,
    baseline: CALIFORNIA_TIER1_FULL_ROSTER_BASELINE,
    scope: CALIFORNIA_TIER1_FULL_ROSTER_SCOPE,
    manifest,
    search,
    prepublicationChecklist:
      CALIFORNIA_TIER1_FULL_ROSTER_PREPUBLICATION_CHECKLIST,
    checklistComplete,
    checklistPending,
    arithmeticOk,
    stopGoPublic: "GO" as const,
    reconciliation: {
      priorOfflineTier1: manifest.priorOfflineTier1,
      currentListable: manifest.listableCount,
      delta: manifest.deltaVsPrior15429,
      residualStillPresent: manifest.residualPresentInDownload,
      pendingIncreaseFlagged: manifest.pendingIncreaseFlaggedInRoster,
      sourceAsOfIso: manifest.sourceAsOfIso,
      priorSourceAsOfIso: "2026-11-15",
    },
    mostActionableNextStep:
      "California Tier 1 public directory is authorized. Keep map/owner/enhanced off; Oregon unpublished; merge activation PR under granted approval.",
    preservedRestrictions: [
      "washington-design-2-preserved",
      "oregon-unpublished-on-production",
      "california-map-disabled",
      "california-owner-claims-disabled",
      "california-enhanced-features-disabled",
      "residual-22-enforced",
      "pending-increase-mapping-preserved",
      "no-database-writes",
      "no-merge-or-prod-deploy-without-approval",
    ] as const,
  };
}

export function californiaTier1FullRosterAllowsPublication(): true {
  return true;
}

export function californiaTier1FullRosterActivated(): true {
  return true;
}
