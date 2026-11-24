import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import {
  listIndexableLicenses,
  readSiteEnv,
  responseIndexingAllowed,
  sitemapUrls,
} from "../lib/public-indexing";

export const dynamic = "force-dynamic";

/**
 * Public sitemap lists Washington pages/profiles plus the California Tier 1
 * directory listing when authorized. Do not expand all California facility
 * profiles here — loading ~15k fixture rows on every sitemap request caused
 * production HTTP 500. Facility profiles remain linked from /california.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const requestHost = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  if (!responseIndexingAllowed(readSiteEnv(process.env), requestHost)) return [];
  const listed = await listIndexableLicenses({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  });
  return sitemapUrls(true, listed.ok ? listed.licenses : []).map((url) => ({ url }));
}
