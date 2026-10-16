import type { Metadata } from "next";

export const metadata: Metadata = {

  title: "National Care Home Finder",

  description:

    "Explore residential care options and official licensing resources across the United States.",

};

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
