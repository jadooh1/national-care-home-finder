import type { Metadata } from "next";
import { publicPageMetadata } from "../../../lib/public-metadata";

export const metadata: Metadata = publicPageMetadata("/washington/demographics");

export default function WashingtonDemographicsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
