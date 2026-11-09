import type { Metadata } from "next";
import { absolutePublicUrl, currentIndexingAllowed, eligibleProfilePath, publicPage } from "./public-indexing";

export function publicPageMetadata(path: string): Metadata {
  const page = publicPage(path);
  if (!page) {
    return { robots: { index: false, follow: false } };
  }
  return {
    metadataBase: new URL(absolutePublicUrl("/")),
    title: page.title,
    description: page.description,
    alternates: { canonical: absolutePublicUrl(page.path) },
    robots: currentIndexingAllowed()
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export function profileMetadata(license: string | undefined): Metadata {
  const path = eligibleProfilePath(license);
  if (!path) return { robots: { index: false, follow: false } };
  return {
    metadataBase: new URL(absolutePublicUrl("/")),
    title: `Washington adult family home ${license?.trim()}`,
    description: "Washington adult family home directory profile. The recorded license details come from a DSHS locator list and are not a vacancy or current-standing check.",
    alternates: { canonical: absolutePublicUrl(path) },
    robots: currentIndexingAllowed()
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
