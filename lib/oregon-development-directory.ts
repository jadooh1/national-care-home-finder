export const DEVELOPMENT_SUPABASE_PROJECT_REF = "ajjsyloyihcqdomywhik";
export const OREGON_ADULT_FOSTER_HOME_LABEL = "Oregon adult foster home";
export const OREGON_DIRECTORY_RPC = "development_list_oregon_afh";
export const OREGON_PROFILE_PREFIX = "https://ltclicensing.oregon.gov/Providers/Details/";
export const OREGON_DIRECTORY_PAGE_SIZE = 20;

export const OREGON_DIRECTORY_FIELDS = [
  "source_id",
  "facility_name",
  "city",
  "county",
  "license_type",
  "status",
  "licensed_beds",
  "official_profile_url",
] as const;

const SOURCE_ID_PATTERN = /^[A-Za-z0-9]{1,32}$/;

export type OregonDirectoryFacility = {
  source_id: string;
  facility_name: string;
  city: string;
  county: string;
  license_type: typeof OREGON_ADULT_FOSTER_HOME_LABEL;
  status: "Open";
  licensed_beds: number;
  official_profile_url: string;
};

export type OregonDirectoryTarget = "development" | "withheld";

export type OregonDirectoryLoad =
  | { state: "withheld" }
  | { state: "signed_out" }
  | { state: "forbidden" }
  | { state: "unavailable" }
  | { state: "ready"; rows: OregonDirectoryFacility[]; hasMore: boolean };

export function oregonDirectoryTarget(supabaseUrl: string): OregonDirectoryTarget {
  try {
    const host = new URL(supabaseUrl).hostname;
    if (host === `${DEVELOPMENT_SUPABASE_PROJECT_REF}.supabase.co`) return "development";
  } catch {
    return "withheld";
  }
  return "withheld";
}

export function cleanDirectoryTerm(input: string): string {
  return input.replace(/[^a-zA-Z0-9\s-]/g, "").trim().slice(0, 80);
}

export function directoryArguments(filters: { name: string; city: string; county: string; page: number }) {
  const page = Number.isInteger(filters.page) ? Math.min(Math.max(filters.page, 0), 500) : 0;
  return {
    p_name: cleanDirectoryTerm(filters.name),
    p_city: cleanDirectoryTerm(filters.city),
    p_county: cleanDirectoryTerm(filters.county),
    p_limit: OREGON_DIRECTORY_PAGE_SIZE,
    p_offset: page * OREGON_DIRECTORY_PAGE_SIZE,
  };
}

export function acceptDirectoryRow(input: unknown): OregonDirectoryFacility | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== OREGON_DIRECTORY_FIELDS.length) return null;
  if (keys.some(key => !OREGON_DIRECTORY_FIELDS.includes(key as typeof OREGON_DIRECTORY_FIELDS[number]))) return null;
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

export function acceptDirectoryRows(input: unknown): OregonDirectoryFacility[] {
  if (!Array.isArray(input)) return [];
  const accepted = input.map(acceptDirectoryRow).filter((row): row is OregonDirectoryFacility => row !== null);
  const counts = new Map<string, number>();
  for (const row of accepted) counts.set(row.source_id, (counts.get(row.source_id) ?? 0) + 1);
  return accepted.filter(row => counts.get(row.source_id) === 1);
}

export async function loadOregonDevelopmentDirectory(input: {
  supabaseUrl: string;
  signedIn: boolean;
  filters: { name: string; city: string; county: string; page: number };
  query: (rpc: string, args: ReturnType<typeof directoryArguments>) => Promise<{ data: unknown; error: string }>;
}): Promise<OregonDirectoryLoad> {
  if (oregonDirectoryTarget(input.supabaseUrl) !== "development") return { state: "withheld" };
  if (!input.signedIn) return { state: "signed_out" };
  const args = directoryArguments(input.filters);
  let result: { data: unknown; error: string };
  try {
    result = await input.query(OREGON_DIRECTORY_RPC, args);
  } catch {
    return { state: "unavailable" };
  }
  if (result.error) {
    if (result.error.toLowerCase().includes("administrator required")) return { state: "forbidden" };
    return { state: "unavailable" };
  }
  if (!Array.isArray(result.data)) return { state: "unavailable" };
  return {
    state: "ready",
    rows: acceptDirectoryRows(result.data),
    hasMore: result.data.length === OREGON_DIRECTORY_PAGE_SIZE,
  };
}

function publicText(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const text = value.trim().replace(/\s+/g, " ");
  return text.length > 0 && text.length <= 200 && !/[\u0000-\u001f\u007f]/.test(text);
}
