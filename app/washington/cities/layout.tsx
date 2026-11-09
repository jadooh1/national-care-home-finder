import { publicPageMetadataFor } from "../../../lib/public-metadata";

export function generateMetadata() {
  return publicPageMetadataFor("/washington/cities");
}

export default function WashingtonCitiesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
