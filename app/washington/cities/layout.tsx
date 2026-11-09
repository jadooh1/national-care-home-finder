import type { Metadata } from "next";
import { publicPageMetadata } from "../../../lib/public-metadata";

export const metadata: Metadata = publicPageMetadata("/washington/cities");

export default function WashingtonCitiesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
