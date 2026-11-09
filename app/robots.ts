import type { MetadataRoute } from "next";
import { currentIndexingAllowed, robotsPolicy } from "../lib/public-indexing";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const policy = robotsPolicy(currentIndexingAllowed());
  return {
    rules: {
      userAgent: policy.userAgent,
      allow: policy.allow,
      disallow: policy.disallow,
    },
    sitemap: policy.sitemap,
  };
}
