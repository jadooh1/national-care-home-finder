import type { Metadata } from "next";
import { headers } from "next/headers";
import { absolutePublicUrl, eligibleProfilePath, publicPage, readSiteEnv, responseIndexingAllowed } from "./public-indexing";

function indexed(requestHost?: string): boolean {
  return responseIndexingAllowed(readSiteEnv(process.env), requestHost);
}

export async function requestHost(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-host") ?? h.get("host") ?? "";
}

export function publicPageMetadata(path: string, requestHost?: string): Metadata {
  const page = publicPage(path);
  if (!page) {
    return { robots: { index: false, follow: false } };
  }
  return {
    metadataBase: new URL(absolutePublicUrl("/")),
    title: page.title,
    description: page.description,
    alternates: { canonical: absolutePublicUrl(page.path) },
    robots: indexed(requestHost)
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export function publicPageMetadataFor(path: string): Promise<Metadata> {
  return requestHost().then(host => publicPageMetadata(path, host));
}

export function profileMetadata(license: string | undefined, requestHost?: string): Metadata {
  const path = eligibleProfilePath(license);
  if (!path) return { robots: { index: false, follow: false } };
  return {
    metadataBase: new URL(absolutePublicUrl("/")),
    title: `Washington adult family home ${license?.trim()}`,
    description: "Washington adult family home directory profile. The recorded license details come from a DSHS locator list and are not a vacancy or current-standing check.",
    alternates: { canonical: absolutePublicUrl(path) },
    robots: indexed(requestHost)
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export function unindexedMetadata(title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: false },
  };
}
