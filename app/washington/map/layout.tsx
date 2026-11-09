import type { Metadata } from "next";
import { publicPageMetadata } from "../../../lib/public-metadata";

export const metadata: Metadata = publicPageMetadata("/washington/map");

export default function WashingtonMapLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
