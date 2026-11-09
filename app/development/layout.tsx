import type { Metadata } from "next";
import { unindexedMetadata } from "../../lib/public-metadata";

export const metadata: Metadata = unindexedMetadata("Development directory");

export default function DevelopmentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
