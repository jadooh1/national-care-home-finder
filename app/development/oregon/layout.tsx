import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Development Oregon directory",
  robots: { index: false, follow: false },
};

export default function OregonDevelopmentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
