import type { Metadata } from "next";
import { unindexedMetadata } from "../../../lib/public-metadata";

export const metadata: Metadata = unindexedMetadata("Development Oregon directory");

export default function OregonDevelopmentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
