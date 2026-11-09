import type { Metadata } from "next";
import { unindexedMetadata } from "../../lib/public-metadata";

export const metadata: Metadata = unindexedMetadata("Oregon adult foster homes");

export default function OregonPublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
