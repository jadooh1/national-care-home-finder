import { publicPageMetadataFor } from "../lib/public-metadata";

export function generateMetadata() {
  return publicPageMetadataFor("/");
}

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
