import type { Metadata } from "next";
import { publicPageMetadata } from "../../../lib/public-metadata";

export const metadata: Metadata = publicPageMetadata("/washington/counties");

export default function WashingtonCountiesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
