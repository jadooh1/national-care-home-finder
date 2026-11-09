import { publicPageMetadataFor } from "../../../lib/public-metadata";

export function generateMetadata() {
  return publicPageMetadataFor("/washington/opportunity");
}

export default function WashingtonOpportunityLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
