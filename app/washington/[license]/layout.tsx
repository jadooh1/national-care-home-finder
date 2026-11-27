import type { Metadata } from "next";
import { profileMetadata, requestHost } from "../../../lib/public-metadata";
import {
  loadWashingtonListedFacility,
  profileMetadataFacts,
  washingtonPublicRestConfig,
} from "../../../lib/washington-public-roster";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ license: string }>;
}): Promise<Metadata> {
  const { license } = await params;
  const host = await requestHost();
  const lookup = await loadWashingtonListedFacility(license, washingtonPublicRestConfig());
  if (lookup.status === "invalid" || lookup.status === "missing") {
    return profileMetadata(license, host, null);
  }
  if (lookup.status === "unavailable") {
    // Keep crawlable license URL during transient upstream failures.
    return profileMetadata(license, host);
  }
  return profileMetadata(license, host, profileMetadataFacts(lookup.facility));
}

export default function WashingtonProfileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
