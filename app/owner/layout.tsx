import type { Metadata } from "next";
import { unindexedMetadata } from "../../lib/public-metadata";

export const metadata: Metadata = unindexedMetadata("Owner account");

export default function OwnerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
