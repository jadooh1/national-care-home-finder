import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oregon adult foster homes",
  robots: { index: false, follow: false },
};

export default function OregonPublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
