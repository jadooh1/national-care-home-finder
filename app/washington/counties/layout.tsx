import { publicPageMetadataFor } from "../../../lib/public-metadata";

export function generateMetadata() {
  return publicPageMetadataFor("/washington/counties");
}

export default function WashingtonCountiesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
