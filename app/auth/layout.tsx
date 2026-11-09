import type { Metadata } from "next";
import { unindexedMetadata } from "../../lib/public-metadata";

export const metadata: Metadata = unindexedMetadata("Account access");

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
