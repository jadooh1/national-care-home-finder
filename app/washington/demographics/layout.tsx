import { publicPageMetadataFor } from "../../../lib/public-metadata";

export function generateMetadata() {
  return publicPageMetadataFor("/washington/demographics");
}

export default function WashingtonDemographicsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
