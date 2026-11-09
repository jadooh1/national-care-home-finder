import { publicPageMetadataFor } from "../../../lib/public-metadata";

export function generateMetadata() {
  return publicPageMetadataFor("/washington/map");
}

export default function WashingtonMapLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
