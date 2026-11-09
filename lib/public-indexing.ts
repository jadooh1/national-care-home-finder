export const PUBLIC_CANONICAL_HOST = "www.nationalcarehomefinder.com";
export const PUBLIC_CANONICAL_ORIGIN = `https://${PUBLIC_CANONICAL_HOST}`;

export const PUBLIC_PRODUCTION_HOSTS = [
  PUBLIC_CANONICAL_HOST,
  "nationalcarehomefinder.com",
  "national-care-home-finder-kkfa.vercel.app",
] as const;

export const PRIVATE_INDEX_PREFIXES = ["/oregon", "/development", "/owner", "/admin", "/auth"] as const;

export const DIRECTORY_VIEW = "wa_dshs_listed_facilities";
const LICENSE_PAGE_SIZE = 1000;
const LICENSE_PAGE_LIMIT = 20;

export type PublicPage = {
  path: string;
  title: string;
  description: string;
};

export const WASHINGTON_PUBLIC_PAGES: readonly PublicPage[] = [
  {
    path: "/",
    title: "National Care Home Finder",
    description: "Explore residential care options and official licensing resources across the United States.",
  },
  {
    path: "/washington",
    title: "Washington adult family homes",
    description: "Search Washington adult family homes from a DSHS locator list. Recorded licensed capacity is not a vacancy.",
  },
  {
    path: "/washington/map",
    title: "Washington adult family home map",
    description: "Map Washington adult family homes by ZIP code. Recorded licensed capacity is not a vacancy.",
  },
  {
    path: "/washington/cities",
    title: "Washington adult family homes by city",
    description: "Compare Washington adult family home counts and recorded licensed beds by city.",
  },
  {
    path: "/washington/counties",
    title: "Washington adult family homes by county",
    description: "Compare Washington adult family home counts and recorded licensed beds by county.",
  },
  {
    path: "/washington/demographics",
    title: "Washington aging population and adult family homes",
    description: "Compare older-adult population estimates with Washington adult family home counts and recorded licensed beds.",
  },
  {
    path: "/washington/opportunity",
    title: "Washington adult family home market indicators",
    description: "Compare ZIP-code indicators for Washington adult family home supply and recorded licensed beds.",
  },
];

export type SiteEnv = {
  vercelEnv?: string;
  productionHost?: string;
};

export function normalizeHost(value: string | undefined): string {
  const trimmed = (value ?? "").split(",")[0].trim();
  if (!trimmed) return "";
  try {
    const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function publicIndexingAllowed(env: SiteEnv): boolean {
  const host = normalizeHost(env.productionHost);
  return env.vercelEnv === "production" && (PUBLIC_PRODUCTION_HOSTS as readonly string[]).includes(host);
}

export function responseIndexingAllowed(env: SiteEnv, requestHost?: string): boolean {
  if (!publicIndexingAllowed(env)) return false;
  const host = normalizeHost(requestHost);
  return host.length === 0 || host === PUBLIC_CANONICAL_HOST;
}

export function readSiteEnv(source: Record<string, string | undefined>): SiteEnv {
  return {
    vercelEnv: source.VERCEL_ENV,
    productionHost: source.VERCEL_PROJECT_PRODUCTION_URL,
  };
}

export function currentIndexingAllowed(): boolean {
  return publicIndexingAllowed(readSiteEnv(process.env));
}

export function absolutePublicUrl(path: string): string {
  if (path === "/") return `${PUBLIC_CANONICAL_ORIGIN}/`;
  return `${PUBLIC_CANONICAL_ORIGIN}${path}`;
}

export function eligibleProfilePath(license: string | null | undefined): string | null {
  const value = license?.trim() ?? "";
  if (!/^\d{1,20}$/.test(value)) return null;
  return `/washington/${value}`;
}

export function publicPage(path: string): PublicPage | undefined {
  return WASHINGTON_PUBLIC_PAGES.find(page => page.path === path);
}

export type RobotsPolicy = {
  userAgent: "*";
  allow?: "/";
  disallow: "/" | string[];
  sitemap?: string;
};

export function robotsPolicy(allowed: boolean): RobotsPolicy {
  if (!allowed) return { userAgent: "*", disallow: "/" };
  return {
    userAgent: "*",
    allow: "/",
    disallow: [...PRIVATE_INDEX_PREFIXES],
    sitemap: `${PUBLIC_CANONICAL_ORIGIN}/sitemap.xml`,
  };
}

export function profileSitemapPaths(licenses: readonly string[]): string[] {
  const paths = new Set<string>();
  for (const license of licenses) {
    const path = eligibleProfilePath(license);
    if (path) paths.add(path);
  }
  return [...paths].sort();
}

export function sitemapPaths(allowed: boolean, licenses: readonly string[]): string[] {
  if (!allowed) return [];
  return [...WASHINGTON_PUBLIC_PAGES.map(page => page.path), ...profileSitemapPaths(licenses)];
}

export function sitemapUrls(allowed: boolean, licenses: readonly string[]): string[] {
  return sitemapPaths(allowed, licenses).map(absolutePublicUrl);
}

type LicenseRow = { license_number?: unknown };

export async function listIndexableLicenses(args: {
  supabaseUrl: string;
  publishableKey: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true; licenses: string[] } | { ok: false }> {
  let endpoint: URL;
  try {
    endpoint = new URL("/rest/v1/" + DIRECTORY_VIEW, args.supabaseUrl);
  } catch {
    return { ok: false };
  }
  if (endpoint.protocol !== "https:" || endpoint.host === "ci.invalid" || !args.publishableKey) return { ok: false };
  endpoint.searchParams.set("select", "license_number");
  endpoint.searchParams.set("order", "license_number.asc");
  const fetchImpl = args.fetchImpl ?? fetch;
  const licenses: string[] = [];
  for (let page = 0; page < LICENSE_PAGE_LIMIT; page += 1) {
    const from = page * LICENSE_PAGE_SIZE;
    const to = from + LICENSE_PAGE_SIZE - 1;
    let response: Response;
    try {
      response = await fetchImpl(endpoint, {
        headers: {
          apikey: args.publishableKey,
          Authorization: `Bearer ${args.publishableKey}`,
          Range: `${from}-${to}`,
        },
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
    for (const row of rows as LicenseRow[]) {
      if (typeof row?.license_number === "string") licenses.push(row.license_number);
    }
    if (rows.length < LICENSE_PAGE_SIZE) return { ok: true, licenses };
  }
  return { ok: false };
}
