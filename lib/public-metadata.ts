import type { Metadata } from "next";
import { headers } from "next/headers";
import { absolutePublicUrl, eligibleProfilePath, publicPage, readSiteEnv, responseIndexingAllowed } from "./public-indexing";
import { googleSiteVerificationToken } from "./site-verification";

function indexed(requestHost?: string): boolean {
  return responseIndexingAllowed(readSiteEnv(process.env), requestHost);
}

function sharedPublicMetadata(): Pick<Metadata, "metadataBase" | "icons" | "verification"> {
  const verification = googleSiteVerificationToken();
  return {
    metadataBase: new URL(absolutePublicUrl("/")),
    icons: {
      icon: [{ url: "/home/mark.webp", type: "image/webp" }],
      apple: [{ url: "/home/mark.webp", type: "image/webp" }],
    },
    ...(verification ? { verification: { google: verification } } : {}),
  };
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
  const url = absolutePublicUrl(page.path);
  return {
    ...sharedPublicMetadata(),
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      siteName: "National Care Home Finder",
      locale: "en_US",
      type: "website",
      images: [{ url: absolutePublicUrl("/home/washington.webp") }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [absolutePublicUrl("/home/washington.webp")],
    },
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
  const title = `Washington adult family home ${license?.trim()}`;
  const description =
    "Washington adult family home directory profile. The recorded license details come from a DSHS locator list and are not a vacancy or current-standing check.";
  const url = absolutePublicUrl(path);
  return {
    ...sharedPublicMetadata(),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "National Care Home Finder",
      locale: "en_US",
      type: "website",
      images: [{ url: absolutePublicUrl("/home/washington.webp") }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absolutePublicUrl("/home/washington.webp")],
    },
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
