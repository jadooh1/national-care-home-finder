import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { readSiteEnv, responseIndexingAllowed, robotsPolicy } from "../lib/public-indexing";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const requestHost = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const policy = robotsPolicy(responseIndexingAllowed(readSiteEnv(process.env), requestHost));
  return {
    rules: {
      userAgent: policy.userAgent,
      allow: policy.allow,
      disallow: policy.disallow,
    },
    sitemap: policy.sitemap,
  };
}
