import type { Metadata } from "next";
import { profileMetadata } from "../../../lib/public-metadata";

export async function generateMetadata({ params }: { params: Promise<{ license: string }> }): Promise<Metadata> {
  const { license } = await params;
  return profileMetadata(license);
}

export default function WashingtonProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
