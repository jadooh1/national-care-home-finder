import type { Metadata } from "next";
import { publicPageMetadata } from "../../lib/public-metadata";

export const metadata: Metadata = publicPageMetadata("/washington");

export default function WashingtonLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
