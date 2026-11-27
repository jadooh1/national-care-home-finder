/**
 * Server-side Washington public roster reads for crawlable HTML and metadata.
 * Uses the same publishable REST path as sitemap license listing — no service role.
 * Values come only from DSHS-derived directory rows; do not invent facility facts.
 */

/** Same view as `DIRECTORY_VIEW` in public-indexing — kept literal for crawl helpers/tests. */
export const WASHINGTON_LISTED_FACILITIES_VIEW = "wa_dshs_listed_facilities";

export const WASHINGTON_DIRECTORY_PAGE_SIZE = 20;
export const WASHINGTON_RESERVED_E2E_FACILITY_ID = "00000000-0000-4000-8000-0000000000e2";

export type WashingtonListedFacility = {
  id: string;
  canonical_name: string;
  address_line1: string | null;
  city: string | null;
  county: string | null;
  state_code: string;
  postal_code: string | null;
  license_number: string | null;
  licensed_capacity: number | null;
  record_status: string;
};

export type WashingtonCityMarketSummary = {
  county_name: string;
  city_name: string;
  total_afhs: number;
  homes_with_capacity: number;
  known_licensed_beds: number;
};

export type WashingtonCountyMarketSummary = {
  county_name: string;
  total_afhs: number;
  cities_represented: number;
  homes_with_capacity: number;
  known_licensed_beds: number;
};

export type WashingtonPublicRestConfig = {
  supabaseUrl: string;
  publishableKey: string;
  fetchImpl?: typeof fetch;
};

const FACILITY_SELECT =
  "id,canonical_name,address_line1,city,county,state_code,postal_code,license_number,licensed_capacity,record_status";

export function washingtonPublicRestConfig(
  source: Record<string, string | undefined> = process.env,
): WashingtonPublicRestConfig {
  return {
    supabaseUrl: source.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publishableKey: source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  };
}

function restEndpoint(path: string, config: WashingtonPublicRestConfig): URL | null {
  try {
    const endpoint = new URL(`/rest/v1/${path}`, config.supabaseUrl);
    if (endpoint.protocol !== "https:" || endpoint.host === "ci.invalid" || !config.publishableKey) {
      return null;
    }
    return endpoint;
  } catch {
    return null;
  }
}

function authHeaders(config: WashingtonPublicRestConfig, extra?: HeadersInit): HeadersInit {
  return {
    apikey: config.publishableKey,
    Authorization: `Bearer ${config.publishableKey}`,
    ...extra,
  };
}

function asFacility(row: Record<string, unknown>): WashingtonListedFacility | null {
  if (typeof row.id !== "string" || typeof row.canonical_name !== "string") return null;
  if (typeof row.state_code !== "string" || typeof row.record_status !== "string") return null;
  return {
    id: row.id,
    canonical_name: row.canonical_name,
    address_line1: typeof row.address_line1 === "string" ? row.address_line1 : null,
    city: typeof row.city === "string" ? row.city : null,
    county: typeof row.county === "string" ? row.county : null,
    state_code: row.state_code,
    postal_code: typeof row.postal_code === "string" ? row.postal_code : null,
    license_number: typeof row.license_number === "string" ? row.license_number : null,
    licensed_capacity: typeof row.licensed_capacity === "number" ? row.licensed_capacity : null,
    record_status: row.record_status,
  };
}

export function displayWashingtonFacilityName(name: string): string {
  return name.replace(/^\s*!+\s*/, "").trim() || name;
}

export function profileMetadataFacts(facility: WashingtonListedFacility): {
  name: string;
  city: string | null;
  county: string | null;
  license: string;
} {
  return {
    name: displayWashingtonFacilityName(facility.canonical_name),
    city: facility.city,
    county: facility.county,
    license: facility.license_number?.trim() || "",
  };
}

export type WashingtonFacilityLookup =
  | { status: "ok"; facility: WashingtonListedFacility }
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "unavailable" };

/** Invalid syntax / confirmed missing → soft-404 candidates; transport failures stay unavailable. */
export async function loadWashingtonListedFacility(
  license: string | undefined,
  config: WashingtonPublicRestConfig = washingtonPublicRestConfig(),
): Promise<WashingtonFacilityLookup> {
  const value = license?.trim() ?? "";
  if (!/^\d{1,20}$/.test(value)) return { status: "invalid" };
  const endpoint = restEndpoint(WASHINGTON_LISTED_FACILITIES_VIEW, config);
  if (!endpoint) return { status: "unavailable" };
  endpoint.searchParams.set("select", FACILITY_SELECT);
  endpoint.searchParams.set("license_number", `eq.${value}`);
  endpoint.searchParams.set("id", `neq.${WASHINGTON_RESERVED_E2E_FACILITY_ID}`);
  endpoint.searchParams.set("limit", "1");
  const fetchImpl = config.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(endpoint, { headers: authHeaders(config) });
  } catch {
    return { status: "unavailable" };
  }
  if (!response.ok) return { status: "unavailable" };
  let rows: unknown;
  try {
    rows = await response.json();
  } catch {
    return { status: "unavailable" };
  }
  if (!Array.isArray(rows)) return { status: "unavailable" };
  if (rows.length === 0) return { status: "missing" };
  const facility = asFacility(rows[0] as Record<string, unknown>);
  if (!facility) return { status: "unavailable" };
  return { status: "ok", facility };
}

export async function loadWashingtonDirectorySlice(args: {
  q?: string;
  city?: string;
  county?: string;
  page?: number;
  pageSize?: number;
  config?: WashingtonPublicRestConfig;
}): Promise<{ ok: true; facilities: WashingtonListedFacility[]; total: number } | { ok: false }> {
  const config = args.config ?? washingtonPublicRestConfig();
  const endpoint = restEndpoint(WASHINGTON_LISTED_FACILITIES_VIEW, config);
  if (!endpoint) return { ok: false };
  const pageSize = args.pageSize && args.pageSize > 0 ? args.pageSize : WASHINGTON_DIRECTORY_PAGE_SIZE;
  const page = Number.isInteger(args.page) && (args.page as number) > 0 ? (args.page as number) : 0;
  const from = page * pageSize;
  const to = from + pageSize - 1;
  endpoint.searchParams.set("select", FACILITY_SELECT);
  endpoint.searchParams.set("order", "canonical_name.asc,id.asc");
  endpoint.searchParams.set("id", `neq.${WASHINGTON_RESERVED_E2E_FACILITY_ID}`);
  const q = args.q?.trim();
  const city = args.city?.trim();
  const county = args.county?.trim();
  if (q) {
    endpoint.searchParams.set(
      "or",
      `(canonical_name.ilike.*${q}*,city.ilike.*${q}*,county.ilike.*${q}*,postal_code.ilike.*${q}*,license_number.ilike.*${q}*)`,
    );
  }
  if (city) endpoint.searchParams.set("city", `ilike.*${city}*`);
  if (county) endpoint.searchParams.set("county", `ilike.*${county}*`);
  const fetchImpl = config.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      headers: authHeaders(config, {
        Range: `${from}-${to}`,
        Prefer: "count=exact",
      }),
    });
  } catch {
    return { ok: false };
  }
  if (!response.ok) return { ok: false };
  let rows: unknown;
  try {
    rows = await response.json();
  } catch {
    return { ok: false };
  }
  if (!Array.isArray(rows)) return { ok: false };
  const facilities = rows
    .map(row => asFacility(row as Record<string, unknown>))
    .filter((row): row is WashingtonListedFacility => row !== null);
  const contentRange = response.headers.get("content-range") ?? "";
  const totalMatch = /\/(\d+|\*)$/.exec(contentRange);
  const total = totalMatch && totalMatch[1] !== "*" ? Number(totalMatch[1]) : facilities.length;
  return { ok: true, facilities, total: Number.isFinite(total) ? total : facilities.length };
}

async function loadMarketSummaryRows<T>(
  view: string,
  mapRow: (row: Record<string, unknown>) => T | null,
  config: WashingtonPublicRestConfig,
): Promise<{ ok: true; rows: T[] } | { ok: false }> {
  const endpoint = restEndpoint(view, config);
  if (!endpoint) return { ok: false };
  endpoint.searchParams.set("select", "*");
  endpoint.searchParams.set("order", view === "wa_city_market_summary" ? "county_name.asc,city_name.asc" : "county_name.asc");
  const fetchImpl = config.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      headers: authHeaders(config, { Range: "0-999" }),
    });
  } catch {
    return { ok: false };
  }
  if (!response.ok) return { ok: false };
  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return { ok: false };
  }
  if (!Array.isArray(raw)) return { ok: false };
  const rows = raw
    .map(row => mapRow(row as Record<string, unknown>))
    .filter((row): row is T => row !== null);
  return { ok: true, rows };
}

export async function loadWashingtonCityMarketSummaries(
  config: WashingtonPublicRestConfig = washingtonPublicRestConfig(),
): Promise<{ ok: true; rows: WashingtonCityMarketSummary[] } | { ok: false }> {
  return loadMarketSummaryRows(
    "wa_city_market_summary",
    row => {
      if (typeof row.county_name !== "string" || typeof row.city_name !== "string") return null;
      return {
        county_name: row.county_name,
        city_name: row.city_name,
        total_afhs: Number(row.total_afhs) || 0,
        homes_with_capacity: Number(row.homes_with_capacity) || 0,
        known_licensed_beds: Number(row.known_licensed_beds) || 0,
      };
    },
    config,
  );
}

export async function loadWashingtonCountyMarketSummaries(
  config: WashingtonPublicRestConfig = washingtonPublicRestConfig(),
): Promise<{ ok: true; rows: WashingtonCountyMarketSummary[] } | { ok: false }> {
  return loadMarketSummaryRows(
    "wa_county_market_summary",
    row => {
      if (typeof row.county_name !== "string") return null;
      return {
        county_name: row.county_name,
        total_afhs: Number(row.total_afhs) || 0,
        cities_represented: Number(row.cities_represented) || 0,
        homes_with_capacity: Number(row.homes_with_capacity) || 0,
        known_licensed_beds: Number(row.known_licensed_beds) || 0,
      };
    },
    config,
  );
}
