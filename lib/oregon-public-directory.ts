export const OREGON_PUBLIC_VIEW = "or_odhs_listed_afh";
export const OREGON_PUBLIC_DIRECTORY_HOST = "ajjsyloyihcqdomywhik.supabase.co";
export const OREGON_PUBLIC_PAGE_SIZE = 20;
export const OREGON_PUBLIC_FIELDS = [
  "source_id",
  "facility_name",
  "city",
  "county",
  "license_type",
  "status",
  "licensed_beds",
  "official_profile_url",
] as const;
export const OREGON_PUBLIC_COLUMNS = OREGON_PUBLIC_FIELDS.join(",");
const OREGON_ADULT_FOSTER_HOME_LABEL = "Oregon adult foster home";
const OREGON_PROFILE_PREFIX = "https://ltclicensing.oregon.gov/Providers/Details/";

export const OREGON_BEDS_NOTE = "Licensed beds are the licensed size of the home, from 1 to 5. They are not vacancies.";
export const OREGON_ZERO_BED_NOTE = "20 open Oregon adult foster homes recorded with 0 licensed beds are left out of this directory.";
export const OREGON_LOCATION_NOTE = "This directory has no street address or map location. The official ODHS profile is where to confirm the location.";
export const OREGON_FRESHNESS_NOTE = "These listings come from an ODHS provider export. This directory is not a live vacancy or licensing check.";
export const OREGON_PUBLIC_HOMEPAGE_NOTE = "Washington adult family home names, addresses, and license numbers can be opened from the Washington link. Oregon adult foster home names, cities, and counties can be opened from the Oregon link. Oregon listings do not include street addresses or license numbers. Licensed beds are not vacancies. 20 open Oregon adult foster homes recorded with 0 licensed beds are left out. Vacancies, prices, and current license standing are not displayed. Other state names are labels only.";

const SOURCE_ID_PATTERN = /^[A-Za-z0-9]{1,32}$/;

export type OregonPublicQuery = {
  view: typeof OREGON_PUBLIC_VIEW;
  columns: typeof OREGON_PUBLIC_COLUMNS;
  name: string;
  city: string;
  county: string;
  from: number;
  to: number;
};

export type OregonPublicProfileQuery = {
  view: typeof OREGON_PUBLIC_VIEW;
  columns: typeof OREGON_PUBLIC_COLUMNS;
  sourceId: string;
};

export type OregonPublicFacility = {
  source_id: string;
  facility_name: string;
  city: string;
  county: string;
  license_type: typeof OREGON_ADULT_FOSTER_HOME_LABEL;
  status: "Open";
  licensed_beds: number;
  official_profile_url: string;
};

export type OregonPublicDirectoryLoad =
  | { state: "withheld" }
  | { state: "unavailable" }
  | { state: "ready"; rows: OregonPublicFacility[]; total: number; hasMore: boolean };

export type OregonPublicProfileLoad =
  | { state: "withheld" }
  | { state: "unavailable" }
  | { state: "missing" }
  | { state: "ready"; row: OregonPublicFacility };

export function oregonPublicDirectoryAvailable(supabaseUrl: string): boolean {
  try {
    return new URL(supabaseUrl).hostname === OREGON_PUBLIC_DIRECTORY_HOST;
  } catch {
    return false;
  }
}

export function homepageDirectoryNote(oregonAvailable: boolean): string | null {
  return oregonAvailable ? OREGON_PUBLIC_HOMEPAGE_NOTE : null;
}

function cleanDirectoryTerm(input: string): string {
  return input.replace(/[^a-zA-Z0-9\s-]/g, "").trim().slice(0, 80);
}

function acceptPublicRow(input: unknown): OregonPublicFacility | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== OREGON_PUBLIC_FIELDS.length) return null;
  if (keys.some(key => !OREGON_PUBLIC_FIELDS.includes(key as typeof OREGON_PUBLIC_FIELDS[number]))) return null;
  const sourceId = record.source_id;
  const facilityName = record.facility_name;
  const city = record.city;
  const county = record.county;
  const licenseType = record.license_type;
  const status = record.status;
  const beds = record.licensed_beds;
  const profileUrl = record.official_profile_url;
  if (typeof sourceId !== "string" || !SOURCE_ID_PATTERN.test(sourceId)) return null;
  if (!publicText(facilityName) || !publicText(city) || !publicText(county)) return null;
  if (licenseType !== OREGON_ADULT_FOSTER_HOME_LABEL) return null;
  if (status !== "Open") return null;
  if (typeof beds !== "number" || !Number.isInteger(beds) || beds < 1 || beds > 5) return null;
  if (profileUrl !== `${OREGON_PROFILE_PREFIX}${sourceId}`) return null;
  return {
    source_id: sourceId,
    facility_name: facilityName.trim().replace(/\s+/g, " "),
    city: city.trim().replace(/\s+/g, " "),
    county: county.trim().replace(/\s+/g, " "),
    license_type: OREGON_ADULT_FOSTER_HOME_LABEL,
    status: "Open",
    licensed_beds: beds,
    official_profile_url: profileUrl,
  };
}

function acceptPublicRows(input: unknown[]): OregonPublicFacility[] {
  const accepted = input.map(acceptPublicRow).filter((row): row is OregonPublicFacility => row !== null);
  const counts = new Map<string, number>();
  for (const row of accepted) counts.set(row.source_id, (counts.get(row.source_id) ?? 0) + 1);
  return accepted.filter(row => counts.get(row.source_id) === 1);
}

function publicText(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const text = value.trim().replace(/\s+/g, " ");
  return text.length > 0 && text.length <= 200 && !/[\u0000-\u001f\u007f]/.test(text);
}

export function publicDirectoryQuery(filters: { name: string; city: string; county: string; page: number }): OregonPublicQuery {
  const page = Number.isInteger(filters.page) ? Math.min(Math.max(filters.page, 0), 500) : 0;
  return {
    view: OREGON_PUBLIC_VIEW,
    columns: OREGON_PUBLIC_COLUMNS,
    name: cleanDirectoryTerm(filters.name),
    city: cleanDirectoryTerm(filters.city),
    county: cleanDirectoryTerm(filters.county),
    from: page * OREGON_PUBLIC_PAGE_SIZE,
    to: page * OREGON_PUBLIC_PAGE_SIZE + OREGON_PUBLIC_PAGE_SIZE - 1,
  };
}

export function publicProfileQuery(sourceId: string): OregonPublicProfileQuery | null {
  if (!SOURCE_ID_PATTERN.test(sourceId)) return null;
  return { view: OREGON_PUBLIC_VIEW, columns: OREGON_PUBLIC_COLUMNS, sourceId };
}

export async function loadOregonPublicDirectory(input: {
  supabaseUrl: string;
  filters: { name: string; city: string; county: string; page: number };
  query: (args: OregonPublicQuery) => Promise<{ data: unknown; error: string; count: number | null }>;
}): Promise<OregonPublicDirectoryLoad> {
  if (!oregonPublicDirectoryAvailable(input.supabaseUrl)) return { state: "withheld" };
  const args = publicDirectoryQuery(input.filters);
  let result: { data: unknown; error: string; count: number | null };
  try {
    result = await input.query(args);
  } catch {
    return { state: "unavailable" };
  }
  if (result.error || !Array.isArray(result.data) || typeof result.count !== "number") return { state: "unavailable" };
  const rows = acceptPublicRows(result.data);
  if (rows.length !== result.data.length) return { state: "unavailable" };
  const page = Math.floor(args.from / OREGON_PUBLIC_PAGE_SIZE);
  return {
    state: "ready",
    rows,
    total: result.count,
    hasMore: (page + 1) * OREGON_PUBLIC_PAGE_SIZE < result.count,
  };
}

export async function loadOregonPublicProfile(input: {
  supabaseUrl: string;
  sourceId: string;
  query: (args: OregonPublicProfileQuery) => Promise<{ data: unknown; error: string }>;
}): Promise<OregonPublicProfileLoad> {
  if (!oregonPublicDirectoryAvailable(input.supabaseUrl)) return { state: "withheld" };
  const args = publicProfileQuery(input.sourceId);
  if (!args) return { state: "missing" };
  let result: { data: unknown; error: string };
  try {
    result = await input.query(args);
  } catch {
    return { state: "unavailable" };
  }
  if (result.error) return { state: "unavailable" };
  if (result.data == null) return { state: "missing" };
  const rows = acceptPublicRows([result.data]);
  if (rows.length !== 1 || rows[0].source_id !== args.sourceId) return { state: "unavailable" };
  return { state: "ready", row: rows[0] };
}
