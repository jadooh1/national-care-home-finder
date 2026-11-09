import type { Metadata } from "next";
import { profileMetadata, requestHost } from "../../../lib/public-metadata";

export async function generateMetadata({ params }: { params: Promise<{ license: string }> }): Promise<Metadata> {
  const { license } = await params;
  return profileMetadata(license, await requestHost());
}

export default function WashingtonProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
