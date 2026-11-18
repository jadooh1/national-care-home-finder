export const DEVELOPMENT_DIRECTORY_HOST = "ajjsyloyihcqdomywhik.supabase.co";

export const WASHINGTON_LISTED_COUNT = 6278;
export const OREGON_LISTED_COUNT = 1584;
export const OREGON_LICENSED_BEDS = 7346;
export const OREGON_EXCLUDED_ZERO_BED_HOMES = 20;

export const WASHINGTON_DSHS_LOCATOR = "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHAdvLookup.aspx";
const WASHINGTON_DISCLOSURE_PREFIX = "https://fortress.wa.gov/dshs/adsaapps/lookup/AFHServices.aspx?ref=adv&Lic=";
export const WASHINGTON_SOURCE_RETRIEVED_ON = "2026-11-09";
export const WASHINGTON_SOURCE_LABEL = "November 9, 2026";

export const OREGON_ODHS_PROVIDER_SEARCH = "https://ltclicensing.oregon.gov/Providers";
const OREGON_ODHS_PROFILE_PREFIX = "https://ltclicensing.oregon.gov/Providers/Details/";
export const OREGON_SOURCE_RETRIEVED_ON = null;

export const STATE_NAMES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California",
  "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
  "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma",
  "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin",
  "Wyoming",
] as const;

export type StateName = (typeof STATE_NAMES)[number];
export type DirectoryPublication = "public" | "development" | "unpublished";

export type DirectoryContract = {
  name: StateName;
  publication: DirectoryPublication;
  directoryPath: "/washington" | "/oregon" | null;
  mapPath: "/washington/map" | null;
  searchFields: readonly string[];
  locatorUrl: string | null;
  retrievedOn: string | null;
  liveCheck: false;
};

const WASHINGTON_SEARCH = ["name", "city", "zip", "license"] as const;
const OREGON_SEARCH = ["name", "city", "county"] as const;
const LICENSE_PATTERN = /^\d{1,20}$/;
const OREGON_SOURCE_PATTERN = /^[A-Za-z0-9]{1,32}$/;

function directoryHost(supabaseUrl: string): string {
  try {
    return new URL(supabaseUrl).hostname;
  } catch {
    return "";
  }
}

export function directoryContract(name: string): DirectoryContract | null {
  if (!(STATE_NAMES as readonly string[]).includes(name)) return null;
  const state = name as StateName;
  if (state === "Washington") {
    return {
      name: state,
      publication: "public",
      directoryPath: "/washington",
      mapPath: "/washington/map",
      searchFields: WASHINGTON_SEARCH,
      locatorUrl: WASHINGTON_DSHS_LOCATOR,
      retrievedOn: WASHINGTON_SOURCE_RETRIEVED_ON,
      liveCheck: false,
    };
  }
  if (state === "Oregon") {
    return {
      name: state,
      publication: "development",
      directoryPath: "/oregon",
      mapPath: null,
      searchFields: OREGON_SEARCH,
      locatorUrl: OREGON_ODHS_PROVIDER_SEARCH,
      retrievedOn: OREGON_SOURCE_RETRIEVED_ON,
      liveCheck: false,
    };
  }
  return {
    name: state,
    publication: "unpublished",
    directoryPath: null,
    mapPath: null,
    searchFields: [],
    locatorUrl: null,
    retrievedOn: null,
    liveCheck: false,
  };
}

export function directoryHref(name: string, supabaseUrl: string): "/washington" | "/oregon" | null {
  const contract = directoryContract(name);
  if (!contract?.directoryPath) return null;
  if (contract.publication === "public") return contract.directoryPath;
  if (contract.publication === "development" && directoryHost(supabaseUrl) === DEVELOPMENT_DIRECTORY_HOST) {
    return contract.directoryPath;
  }
  return null;
}

export function mapHref(name: string): "/washington/map" | null {
  const contract = directoryContract(name);
  if (contract?.publication !== "public") return null;
  return contract.mapPath;
}

export function washingtonDisclosureUrl(license: string): string | null {
  const value = license.trim();
  if (!LICENSE_PATTERN.test(value)) return null;
  return `${WASHINGTON_DISCLOSURE_PREFIX}${encodeURIComponent(value)}`;
}

export function oregonDisclosureUrl(sourceId: string): string | null {
  if (!OREGON_SOURCE_PATTERN.test(sourceId)) return null;
  return `${OREGON_ODHS_PROFILE_PREFIX}${sourceId}`;
}

export function oregonRefreshReady(): false {
  return false;
}
