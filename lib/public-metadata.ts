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

export type ProfileMetadataFacts = {
  name?: string | null;
  city?: string | null;
  county?: string | null;
};

export function profileMetadata(
  license: string | undefined,
  requestHost?: string,
  facts?: ProfileMetadataFacts | null,
): Metadata {
  const path = eligibleProfilePath(license);
  if (!path) return { robots: { index: false, follow: false } };
  // Missing roster row: keep canonical path out of the index (soft-404 prevention).
  if (facts === null) {
    return {
      ...sharedPublicMetadata(),
      title: "Washington adult family home not found",
      robots: { index: false, follow: false },
    };
  }
  const licenseValue = license?.trim() ?? "";
  const name = facts?.name?.trim();
  const city = facts?.city?.trim();
  const county = facts?.county?.trim();
  const place = [city, county ? `${county} County` : ""].filter(Boolean).join(", ");
  const title = name
    ? place
      ? `${name} · Washington adult family home · ${place}`
      : `${name} · Washington adult family home ${licenseValue}`
    : `Washington adult family home ${licenseValue}`;
  const description = name
    ? [
        `${name} is listed as a Washington adult family home`,
        place ? `in ${place}` : null,
        `(license ${licenseValue}).`,
        "Recorded details come from a DSHS locator list and are not a vacancy or current-standing check.",
      ]
        .filter(Boolean)
        .join(" ")
    : "Washington adult family home directory profile. The recorded license details come from a DSHS locator list and are not a vacancy or current-standing check.";
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
