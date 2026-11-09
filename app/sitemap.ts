import type { MetadataRoute } from "next";
import { currentIndexingAllowed, listIndexableLicenses, sitemapUrls } from "../lib/public-indexing";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!currentIndexingAllowed()) return [];
  const listed = await listIndexableLicenses({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  });
  return sitemapUrls(true, listed.ok ? listed.licenses : []).map(url => ({ url }));
}
