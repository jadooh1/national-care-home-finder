import type { Metadata } from "next";
import { publicPageMetadata } from "../lib/public-metadata";

export const metadata: Metadata = publicPageMetadata("/");

export default function RootLayout({

  children,

}: Readonly<{

  children: React.ReactNode;

}>) {

  return (

    <html lang="en">

      <body style={{ margin: 0 }}>

        {children}

      </body>

    </html>

  );

}
