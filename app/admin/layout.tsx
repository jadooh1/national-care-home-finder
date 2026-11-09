import type { Metadata } from "next";
import { unindexedMetadata } from "../../lib/public-metadata";

export const metadata: Metadata = unindexedMetadata("Administrator review");

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
