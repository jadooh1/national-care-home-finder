export const HOMEPAGE_DIRECTORY_NOTE = "Washington adult family home names, addresses, and license numbers can be opened from the Washington link. Vacancies, prices, and current license standing are not displayed. Other state names are labels only.";

export const DENSITY_BANDS = [
  { label: "20+", min: 20, color: "#dc2626" },
  { label: "10–19", min: 10, color: "#f97316" },
  { label: "5–9", min: 5, color: "#eab308" },
  { label: "1–4", min: 1, color: "#16835b" },
] as const;

export function densityColor(neighbors: number): string {
  return DENSITY_BANDS.find(band => neighbors >= band.min)?.color ?? DENSITY_BANDS[DENSITY_BANDS.length - 1].color;
}

export function facilityProfilePath(license: string | null | undefined): string | null {
  const value = license?.trim() ?? "";
  if (!/^\d{1,20}$/.test(value)) return null;
  return `/washington/${value}`;
}

export function stateFilterStatus(matchCount: number): string {
  return matchCount === 0 ? "No matching states found." : "";
}

export function mapResultSummary(input: { zip: string; loading: boolean; error: string; count: number }): string {
  if (input.loading) return `ZIP ${input.zip} — Loading facilities…`;
  if (input.error) return `ZIP ${input.zip} — Data unavailable`;
  return `ZIP ${input.zip} — ${input.count.toLocaleString()} mapped AFHs`;
}

export function invalidZipMessage(currentZip: string): string {
  return `Enter a five-digit ZIP code. The map is still showing ZIP ${currentZip}.`;
}

const FIVE_DIGIT_ZIP = /^\d{5}$/;
const NINE_DIGIT_ZIP = /^\d{9}$/;

export const WASHINGTON_MAP_DEFAULT_ZIP = "98056";
export const WASHINGTON_DEMOGRAPHICS_DEFAULT_ZIP = "98038";

export function washingtonZipFromSearch(value: string | null | undefined, fallback: string): string {
  const candidate = value?.trim() ?? "";
  return FIVE_DIGIT_ZIP.test(candidate) ? candidate : fallback;
}

export function washingtonSearchText(value: string | null | undefined): string {
  return (value ?? "").replace(/[^a-zA-Z0-9\s-]/g, "").trim().slice(0, 80);
}

export function washingtonDirectorySearchPath(input: { q?: string | null; city?: string | null; county?: string | null }): string {
  const params = new URLSearchParams();
  const q = washingtonSearchText(input.q);
  const city = washingtonSearchText(input.city);
  const county = washingtonSearchText(input.county);
  if (q) params.set("q", q);
  if (city) params.set("city", city);
  if (county) params.set("county", county);
  const query = params.toString();
  return query ? `/washington?${query}` : "/washington";
}

export function washingtonZipSearchPath(page: "/washington/map" | "/washington/demographics", zip: string | null | undefined): string | null {
  const candidate = zip?.trim() ?? "";
  if (!FIVE_DIGIT_ZIP.test(candidate)) return null;
  return `${page}?zip=${candidate}`;
}

export function washingtonLocationMatches(currentPathAndSearch: string, nextPath: string): boolean {
  const base = "https://example.test";
  const current = new URL(currentPathAndSearch, base);
  const next = new URL(nextPath, base);
  return current.pathname === next.pathname && current.searchParams.toString() === next.searchParams.toString();
}

export function washingtonMapZipMatch(storedPostalCode: string | null | undefined, searchZip: string): boolean {
  if (!FIVE_DIGIT_ZIP.test(searchZip)) return false;
  const stored = storedPostalCode?.trim() ?? "";
  if (stored === searchZip) return true;
  return NINE_DIGIT_ZIP.test(stored) && stored.startsWith(searchZip);
}

export function washingtonMapPostalOrFilter(searchZip: string): string {
  if (!FIVE_DIGIT_ZIP.test(searchZip)) return "postal_code.eq.";
  return `postal_code.eq.${searchZip},postal_code.like.${searchZip}____`;
}

export const WASHINGTON_MARKET_PAGE_SIZE = 500;
export const WASHINGTON_MARKET_MAX_PAGES = 4;

export function washingtonDemographicsZipQuery(zip: string | null | undefined): string | null {
  const candidate = zip?.trim() ?? "";
  return FIVE_DIGIT_ZIP.test(candidate) ? candidate : null;
}

export function washingtonMarketPageBounds(page: number, pageSize = WASHINGTON_MARKET_PAGE_SIZE): [number, number] {
  const from = page * pageSize;
  return [from, from + pageSize - 1];
}

export type WashingtonMarketPage<T> = { ok: true; rows: T[] } | { ok: false };

export function collectWashingtonMarketPages<T>(
  pages: WashingtonMarketPage<T>[],
  pageSize = WASHINGTON_MARKET_PAGE_SIZE,
  maxPages = WASHINGTON_MARKET_MAX_PAGES,
): { status: "complete"; rows: T[] } | { status: "unavailable" | "incomplete" } {
  const rows: T[] = [];
  if (pages.length === 0 || pages.length > maxPages) return { status: "unavailable" };
  for (let page = 0; page < pages.length; page++) {
    const current = pages[page];
    if (!current.ok) return { status: "unavailable" };
    if (current.rows.length > pageSize) return { status: "unavailable" };
    rows.push(...current.rows);
    if (current.rows.length < pageSize) return { status: "complete", rows };
    if (page === maxPages - 1) return { status: "incomplete" };
  }
  return { status: "incomplete" };
}
